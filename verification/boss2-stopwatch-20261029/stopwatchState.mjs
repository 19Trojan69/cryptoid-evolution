export const STOPWATCH_KEY = 'cryptoid_private_stopwatch_v1';
export const CHECKPOINT_MS = 1000;
export const MAX_OBSERVATION_GAP_MS = 2500;
const MAX_RECORD_BYTES = 2048;
const modes = new Set(['running', 'paused', 'hidden', 'stalled', 'ended']);
const copy = value => value ? { ...value } : null;

export function formatStopwatch(milliseconds) {
  const seconds = Math.floor(Math.max(0, Number.isFinite(milliseconds) ? milliseconds : 0) / 1000);
  const hh = Math.floor(seconds / 3600), mm = Math.floor(seconds / 60) % 60, ss = seconds % 60;
  const pair = value => String(value).padStart(2, '0');
  return hh ? `${pair(hh)}:${pair(mm)}:${pair(ss)}` : `${pair(mm)}:${pair(ss)}`;
}

function validRecord(value) {
  return value && typeof value === 'object' && typeof value.id === 'string' && value.id.length <= 100
    && typeof value.source === 'string' && /^[a-f0-9]{40}$/.test(value.source)
    && Number.isFinite(value.startedAt) && value.startedAt > 0
    && Number.isFinite(value.updatedAt) && value.updatedAt > 0
    && Number.isFinite(value.elapsedMs) && value.elapsedMs >= 0 && value.elapsedMs < 7 * 86400000
    && Number.isInteger(value.unobservedGaps) && value.unobservedGaps >= 0
    && modes.has(value.mode);
}

// A monotonic, externally observed active-time clock. It never writes game
// state, advances simulation, synthesizes input or resumes a paused game.
export function createStopwatch({ source, storage, now, wallNow }) {
  if (!/^[a-f0-9]{40}$/.test(source)) throw Error('Exact preview source required');
  let latest = null, previous = null, storageAvailable = true, saved = '', serial = 0;
  let token = null, live = null, observation = null;
  try {
    const raw = storage.getItem(STOPWATCH_KEY);
    if (raw && raw.length <= MAX_RECORD_BYTES) {
      const data = JSON.parse(raw);
      if (data?.version === 1 && validRecord(data.latest)) {
        latest = copy(data.latest);
        previous = validRecord(data.previous) ? copy(data.previous) : null;
      }
    }
  } catch { storageAvailable = false; }
  const persist = () => {
    if (!live?.startedAt) return;
    latest = copy(live);
    const raw = JSON.stringify({ version: 1, latest, previous });
    if (raw === saved) return;
    try {
      if (raw.length > MAX_RECORD_BYTES) throw Error('Bounded stopwatch record exceeded');
      storage.setItem(STOPWATCH_KEY, raw);
      saved = raw;
      storageAvailable = true;
    } catch { storageAvailable = false; }
  };
  const view = () => ({ live: token ? copy(live) : null, latest: copy(latest), previous: copy(previous), storageAvailable });
  const observe = snapshot => {
    const time = now(), wall = wallNow();
    if (!Number.isFinite(time) || !Number.isFinite(wall) || wall <= 0) return view();
    if (!snapshot) {
      if (live?.startedAt && live.mode !== 'ended') {
        live.mode = 'ended'; live.updatedAt = wall; persist();
      }
      token = null; observation = null;
      return view();
    }
    if (token !== snapshot.token) {
      // Keep the previous saved run until this new scene actually starts.
      token = snapshot.token;
      live = { id: `${source.slice(0, 8)}-${wall}-${++serial}`, source,
        startedAt: null, updatedAt: wall, elapsedMs: 0, unobservedGaps: 0, mode: 'paused' };
      observation = null;
    }
    const visible = snapshot.visible !== false;
    const frame = snapshot.frameAt;
    const fresh = Number.isFinite(frame) && frame > 0 && frame <= time + 1 && time - frame <= MAX_OBSERVATION_GAP_MS;
    const advancing = !observation || frame > observation.frame;
    const gap = observation ? time - observation.time : 0;
    const continuous = gap >= 0 && gap <= MAX_OBSERVATION_GAP_MS;
    // A route/attribute commit can notify twice before the next actual frame.
    // Do not call that a stall or reset the last useful observation anchor.
    if (live.mode === 'running' && snapshot.status === 'playing' && visible && fresh
      && observation && frame === observation.frame && gap >= 0 && gap < CHECKPOINT_MS / 2) return view();
    const starting = !live.startedAt || ['paused', 'hidden'].includes(live.mode);
    let mode = ['game-over', 'victory', 'destroying'].includes(snapshot.status) ? 'ended'
      : !visible ? 'hidden' : snapshot.status !== 'playing' ? 'paused'
      : !starting && (!fresh || !advancing || !continuous) ? 'stalled' : 'running';
    if (live.mode === 'ended') mode = 'ended';
    if (!live.startedAt && mode === 'running') {
      previous = copy(latest);
      live.startedAt = wall;
    } else if (live.startedAt && live.mode === 'running') {
      // Include a fresh playing -> pause/hide boundary. Never extrapolate a
      // long blocked-main-thread interval or an unchanged/stale frame heartbeat.
      if (continuous && fresh && (advancing || mode !== 'running' && snapshot.status !== 'playing'))
        live.elapsedMs += gap;
    }
    if (live.startedAt && ['running', 'stalled'].includes(live.mode) && snapshot.status === 'playing' && (!continuous || !fresh))
      live.unobservedGaps++;
    live.mode = mode; live.updatedAt = wall;
    observation = { time, frame };
    persist();
    return view();
  };
  return { observe, view };
}
