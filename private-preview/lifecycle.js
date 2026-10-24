// Protected Preview only. Forward existing native frames; never schedule a frame/timer.
(() => {
  'use strict';
  const evidence = window.CryptoidPrivatePreviewEvidence;
  if (!evidence || window.__cryptoidPrivateLifecycleInstalled) return;
  window.__cryptoidPrivateLifecycleInstalled = true;
  const previous = evidence.read(window, 'sessionStorage', evidence.key);
  const events = evidence.eventsFrom(previous.value);
  const previousDocument = events.at(-1)?.documentStartedAt;
  const startedAt = performance.timeOrigin;
  let sequence = 0, lastPersisted = -Infinity, shell = null, fieldSize;
  let identity;
  try { identity = JSON.parse(document.getElementById('cryptoid-private-preview-identity')?.textContent || 'null'); } catch { /* Optional identity. */ }
  const route = () => location.pathname === '/game' ? 'game' : location.pathname === '/' ? 'home' : 'other';
  const active = () => shell?.getAttribute('data-effects-paused') === 'false' && !document.hidden;
  function persist(force = false) {
    const now = performance.now();
    if (!force && now - lastPersisted < 1000) return;
    lastPersisted = now;
    const raw = JSON.stringify({ version: 1, events: events.slice(-evidence.limit) });
    for (const name of ['sessionStorage', 'localStorage']) {
      try { window[name].setItem(evidence.key, raw); } catch { /* Optional and isolated from gameplay. */ }
    }
  }
  function record(kind, details = {}, force = false) {
    try {
      const poses = ['frame-gap', 'pause-state', 'scene-mounted'].includes(kind);
      const enemies = poses ? [...(shell?.querySelectorAll('.asteroid') || [])] : [];
      const saved = evidence.read(window, 'sessionStorage', 'cryptoid_game_session_v1');
      const row = evidence.event({ kind, at: Date.now(), sequence: ++sequence, documentStartedAt: startedAt,
        sourceCommit: identity?.sourceCommit, route: route(), active: active(), hidden: document.hidden,
        viewport: [window.innerWidth, window.innerHeight], fieldSize,
        ...(poses ? { enemyCount: enemies.length, enemies: enemies.slice(0, 6).map(e => [parseFloat(e.style.left), parseFloat(e.style.top)]) } : {}),
        context: saved.value?.context, contextAt: saved.value?.at, ...details });
      if (!row) return;
      events.push(row); if (events.length > evidence.limit) events.splice(0, events.length - evidence.limit);
      persist(force);
    } catch { /* Observation cannot interrupt the application. */ }
  }
  let pauseObserver, sizeObserver;
  function scene() {
    const next = document.querySelector('.game-shell');
    if (next === shell) return;
    pauseObserver?.disconnect(); sizeObserver?.disconnect();
    const hadShell = !!shell; shell = next; fieldSize = undefined;
    resetObservation();
    if (!shell) { if (hadShell) record('scene-removed', {}, true); return; }
    record('scene-mounted', {}, true);
    if (typeof MutationObserver === 'function') {
      pauseObserver = new MutationObserver(() => { resetObservation(); record('pause-state', {}, true); });
      pauseObserver.observe(shell, { attributes: true, attributeFilter: ['data-effects-paused'] });
    }
    if (typeof ResizeObserver === 'function') {
      sizeObserver = new ResizeObserver(entries => {
        const bounds = entries.at(-1)?.contentRect;
        if (!bounds) return;
        fieldSize = [bounds.width, bounds.height]; record('field-size');
      });
      sizeObserver.observe(shell);
    }
  }
  let lastFrame = null, wasActive = false, lastCallbackMs;
  const nativeRequest = window.requestAnimationFrame;
  if (typeof nativeRequest === 'function') window.requestAnimationFrame = function(callback) {
    if (typeof callback !== 'function') return nativeRequest.call(this, callback);
    return nativeRequest.call(this, function(time) {
      let deliveredAt, gap, measured = false;
      try {
        deliveredAt = performance.now(); const playing = active();
        gap = lastFrame === null ? 0 : Math.max(0, deliveredAt - lastFrame);
        measured = playing && wasActive && gap > 250;
        lastFrame = deliveredAt; wasActive = playing;
      } catch { /* The original callback must still execute. */ }
      try { return callback.call(this, time); }
      finally {
        try {
          const callbackMs = Math.max(0, performance.now() - deliveredAt);
          if (measured) record('frame-gap', { frameGapMs: gap, previousCallbackMs: lastCallbackMs, callbackMs });
          lastCallbackMs = callbackMs;
        }
        catch { /* Preserve original callback return/throw semantics. */ }
      }
    });
  };
  const resetObservation = () => { lastFrame = null; wasActive = false; lastCallbackMs = undefined; };
  window.addEventListener('pagehide', event => { record('pagehide', { persisted: event.persisted }, true); resetObservation(); });
  window.addEventListener('pageshow', event => { record('pageshow', { persisted: event.persisted }, true); resetObservation(); });
  document.addEventListener('visibilitychange', () => { record('visibility', {}, true); resetObservation(); });
  window.addEventListener('error', event => record(event.error ? 'javascript-error' : 'resource-error', { errorName: event.error?.name }, true));
  window.addEventListener('unhandledrejection', event => record('unhandled-rejection', { errorName: event.reason?.name }, true));
  const root = document.getElementById('root');
  if (root && typeof MutationObserver === 'function') new MutationObserver(scene).observe(root, { childList: true });
  record('document-start', { previousDocumentStartedAt: previousDocument,
    navigationType: performance.getEntriesByType?.('navigation')?.[0]?.type,
    rafObserved: typeof nativeRequest === 'function', resizeObserved: typeof ResizeObserver === 'function' }, true);
  scene();
})();
