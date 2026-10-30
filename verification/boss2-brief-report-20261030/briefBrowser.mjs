import { createBrief } from './briefState.mjs';

// Passive, bounded observation in the isolated diagnostic app only. No input,
// history, RAF, simulation, audio, error handling or pause behavior is changed.
export function installBriefDiagnostics(host, source) {
  const doc = host.document, pointers = new Set();
  const storage = { getItem: key => host.localStorage.getItem(key), setItem: (key, value) => host.localStorage.setItem(key, value) };
  const brief = createBrief({ storage, source, now: () => Date.now(), documentStartedAt: host.performance.timeOrigin });
  let live = false, currentRunId = null;
  const clock = event => {
    const run = event.detail?.live;
    if (run?.startedAt) {
      brief.checkpoint(run, host.__deviceBossOptions); currentRunId = run.id; live = run.mode !== 'ended';
    } else {
      if (currentRunId && event.detail?.latest?.id === currentRunId) brief.checkpoint(event.detail.latest, host.__deviceBossOptions);
      live = false; pointers.clear();
    }
  };
  const targetGroup = target => {
    if (!target || typeof target.closest !== 'function') return 'document';
    if (target.closest('.weapon-controls, .weapon-menu, .special-weapon-control')) return 'weapons';
    if (target.closest('.home-control')) return 'home';
    if (target.closest('.pause-control')) return 'pause';
    if (target.closest('.game-overlay')) return 'overlay';
    return target.closest('.game-field') ? 'field' : 'other';
  };
  const critical = new Set(['pointercancel', 'lostpointercapture', 'touchcancel', 'gesturestart', 'gestureend',
    'contextmenu', 'blur', 'pagehide', 'popstate', 'hashchange', 'error', 'unhandledrejection']);
  const events = ['pointerdown', 'pointerup', 'pointercancel', 'lostpointercapture', 'touchstart', 'touchend',
    'touchcancel', 'gesturestart', 'gestureend', 'contextmenu', 'blur', 'pagehide', 'popstate', 'hashchange', 'error', 'unhandledrejection'];
  const observe = event => {
    if (!live || !doc.querySelector('.game-shell')) return;
    if (event.type === 'blur' && event.target !== host || event.type === 'error' && event.target !== host) return;
    if (event.type === 'pointerdown' && pointers.size < 10) pointers.add(event.pointerId);
    if (['pointerup', 'pointercancel', 'lostpointercapture'].includes(event.type)) pointers.delete(event.pointerId);
    const fields = { kind: event.type, target: targetGroup(event.target), trusted: event.isTrusted === true };
    if (event.type.startsWith('pointer') || event.type === 'lostpointercapture') {
      fields.contacts = pointers.size; fields.primary = event.isPrimary === true; fields.pointerType = event.pointerType;
    } else if (event.type.startsWith('touch')) fields.contacts = Math.min(10, event.touches?.length || 0);
    if (event.type === 'error') fields.errorName = event.error?.name || 'Error';
    brief.record(fields, critical.has(event.type));
    if (event.type === 'pagehide' || event.type === 'blur') pointers.clear();
  };
  const visibility = event => {
    if (!live) return;
    brief.record({ kind: doc.visibilityState === 'hidden' ? 'hidden' : 'visible', target: 'document', trusted: event.isTrusted === true }, true);
    if (doc.visibilityState === 'hidden') pointers.clear();
  };
  host.addEventListener('cryptoid:diagnostic-clock', clock);
  for (const name of events) host.addEventListener(name, observe, { capture: true, passive: true });
  doc.addEventListener('visibilitychange', visibility, { capture: true, passive: true });
  return () => {
    brief.flush(true); pointers.clear(); host.removeEventListener('cryptoid:diagnostic-clock', clock);
    for (const name of events) host.removeEventListener(name, observe, true);
    doc.removeEventListener('visibilitychange', visibility, true);
  };
}
