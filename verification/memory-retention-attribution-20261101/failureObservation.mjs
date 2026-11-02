// This is an external collector read, called once AFTER a protocol failure.
// It installs no page listener, sampler, profiler, timer or recovery action.
export function readFailureState(key, host = window) {
  const finite = (value, max = 1e12) => Number.isFinite(value) && value >= 0 && value <= max ? value : null;
  const text = value => typeof value === 'string' && value.length <= 100 ? value : null;
  const scene = host.__crossDeviceTest?.inspect() ?? null;
  let clock = null;
  try {
    const raw = host.localStorage.getItem(key);
    if (raw && raw.length <= 2048) clock = JSON.parse(raw)?.latest ?? null;
  } catch { /* A blank/replaced document may have unavailable storage. */ }
  const now = finite(host.performance.now());
  const frame = finite(scene?.frameAt);
  return {
    timeOrigin: finite(host.performance.timeOrigin), observedAt: now,
    hidden: host.document.hidden, focused: host.document.hasFocus(),
    mounted: !!host.document.querySelector('.game-shell'),
    scene: scene ? {
      status: text(scene.status), phase: text(scene.phase), encounter: text(scene.encounter),
      sector: finite(scene.sector, 500), technicalPause: typeof scene.technicalPause === 'boolean' ? scene.technicalPause : null,
      coreVolley: finite(scene.coreVolley, 1e9), frameAt: frame,
      observedFrameAgeMs: frame !== null && now !== null && now >= frame ? now - frame : null,
    } : null,
    clock: clock ? {
      id: text(clock.id), source: typeof clock.source === 'string' && /^[a-f0-9]{40}$/.test(clock.source) ? clock.source : null,
      mode: ['running', 'paused', 'hidden', 'stalled', 'ended'].includes(clock.mode) ? clock.mode : null,
      elapsedMs: finite(clock.elapsedMs, 7 * 86400000), unobservedGaps: finite(clock.unobservedGaps, 1e9),
    } : null,
  };
}

export function classifyFailureState(snapshot, first) {
  const sameDocument = first && snapshot.timeOrigin !== null ? snapshot.timeOrigin === first.timeOrigin : null;
  const sameClockRun = first?.clock?.latest?.id && snapshot.clock?.id
    ? snapshot.clock.id === first.clock.latest.id : null;
  const classification = sameDocument === false ? 'observed-document-change'
    : !snapshot.mounted ? 'observed-scene-unmounted'
    : snapshot.hidden ? 'observed-hidden-document'
    : snapshot.scene?.status === 'paused' ? (snapshot.scene.technicalPause ? 'observed-technical-pause' : 'observed-pause')
    : snapshot.clock?.unobservedGaps > 0 ? 'observed-clock-gap'
    : snapshot.clock?.mode === 'stalled' ? 'observed-stalled-clock'
    : snapshot.scene?.status === 'playing' ? 'observed-playing-after-failure' : 'unclassified-observation';
  return { classification, sameDocument, sameClockRun,
    pauseCauseEstablished: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false };
}

export async function captureFailureState({ page, key, first, timeoutMs = 3000 }) {
  if (!page || page.isClosed()) return { available: false, attempts: 0, reason: 'page-unavailable' };
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3000) throw Error('Bounded external failure read');
  let timer;
  try {
    const snapshot = await Promise.race([
      page.evaluate(readFailureState, key),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Error('failure-read-timeout')), timeoutMs); }),
    ]);
    if (JSON.stringify(snapshot).length > 4096) throw Error('failure-read-byte-budget');
    return { available: true, attempts: 1, snapshot, ...classifyFailureState(snapshot, first) };
  } catch (error) {
    return { available: false, attempts: 1,
      reason: error.message === 'failure-read-timeout' ? 'failure-read-timeout' : 'failure-read-unavailable' };
  } finally { clearTimeout(timer); }
}
