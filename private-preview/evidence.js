// Read-only, bounded technical evidence. No app imports, account/save keys or network.
(() => {
  'use strict';
  const key = 'cryptoid_private_preview_lifecycle_v1';
  const limit = 48;
  const kinds = new Set(['document-start', 'pageshow', 'pagehide', 'visibility', 'scene-mounted',
    'scene-removed', 'pause-state', 'field-size', 'frame-gap', 'javascript-error', 'unhandled-rejection', 'resource-error']);
  const reasons = new Set(['frame-error', 'loop-stall', 'input-error', 'javascript-error',
    'unhandled-rejection', 'render-error', 'performance', 'unexpected-restart']);
  const phases = new Set(['SECTOR_INTRO', 'ENTRY', 'FORMATION', 'ATTACK_CYCLE', 'REFORM', 'SECTOR_CLEAR']);
  const statuses = new Set(['loading', 'playing', 'paused', 'destroying', 'game-over', 'victory']);
  const errors = new Set(['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'SecurityError',
    'QuotaExceededError', 'AbortError', 'InvalidStateError', 'NotFoundError', 'UnknownError']);
  const finite = (value, maximum = 1e15) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= maximum;
  const pair = (value, count, maximum = 100000) => Array.isArray(value) && value.length === count && value.every(v => finite(v, maximum)) ? [...value] : undefined;
  function context(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const result = {};
    for (const field of ['sector', 'block', 'width', 'height', 'enemies', 'projectiles', 'effects', 'frameMs', 'lastSavedAt'])
      if (finite(input[field])) result[field] = input[field];
    if (phases.has(input.phase)) result.phase = input.phase;
    if (statuses.has(input.status)) result.status = input.status;
    if (['normal', 'boss-intro', 'boss-fight', 'boss-clear', 'bonus'].includes(input.encounter)) result.encounter = input.encounter;
    if (reasons.has(input.reason)) result.reason = input.reason;
    if (errors.has(input.errorName)) result.errorName = input.errorName;
    if (['foreground-interrupted', 'background-interrupted', 'page-reload'].includes(input.restartHint)) result.restartHint = input.restartHint;
    if (typeof input.at === 'string' && input.at.length <= 30 && Number.isFinite(Date.parse(input.at))) result.at = input.at;
    for (const field of ['sourceCommit', 'sourceTree']) if (/^[a-f0-9]{40}$/.test(input[field] || '')) result[field] = input[field];
    return Object.keys(result).length ? result : null;
  }
  function event(input) {
    if (!input || !kinds.has(input.kind) || !finite(input.at)) return null;
    const result = { kind: input.kind, at: input.at };
    for (const field of ['sequence', 'documentStartedAt', 'previousDocumentStartedAt', 'frameGapMs', 'previousCallbackMs', 'callbackMs', 'contextAt', 'enemyCount'])
      if (finite(input[field])) result[field] = input[field];
    for (const field of ['active', 'hidden', 'persisted', 'rafObserved', 'resizeObserved']) if (typeof input[field] === 'boolean') result[field] = input[field];
    if (['home', 'game', 'other'].includes(input.route)) result.route = input.route;
    if (['navigate', 'reload', 'back_forward', 'prerender'].includes(input.navigationType)) result.navigationType = input.navigationType;
    for (const field of ['viewport', 'fieldSize']) { const value = pair(input[field], 2); if (value) result[field] = value; }
    if (Array.isArray(input.enemies)) result.enemies = input.enemies.slice(0, 6).map(v => pair(v, 2)).filter(Boolean);
    if (errors.has(input.errorName)) result.errorName = input.errorName;
    if (/^[a-f0-9]{40}$/.test(input.sourceCommit || '')) result.sourceCommit = input.sourceCommit;
    const savedContext = context(input.context); if (savedContext) result.context = savedContext;
    return result;
  }
  function read(host, name, storageKey) {
    try {
      const raw = host[name]?.getItem(storageKey);
      if (raw === null || raw === undefined) return { state: 'absent', value: null };
      if (typeof raw !== 'string' || raw.length > 131072) return { state: 'oversized', value: null };
      return { state: 'read', value: JSON.parse(raw) };
    } catch { return { state: 'unavailable-or-invalid', value: null }; }
  }
  function eventsFrom(value) {
    return value?.version === 1 && Array.isArray(value.events) ? value.events.slice(-limit).map(event).filter(Boolean) : [];
  }
  function report(host = window) {
    const tab = read(host, 'sessionStorage', key), origin = read(host, 'localStorage', key);
    const tabEvents = eventsFrom(tab.value), originEvents = eventsFrom(origin.value);
    const events = tabEvents.length ? tabEvents : originEvents;
    const diagnostics = read(host, 'localStorage', 'cryptoid_game_diagnostics_v1');
    const marker = read(host, 'sessionStorage', 'cryptoid_game_session_v1');
    const lastSession = context(marker.value?.context);
    return { version: 1, format: 'cryptoid-private-preview-lifecycle-report', generatedAt: new Date().toISOString(),
      evidenceSource: tabEvents.length ? 'current-tab' : originEvents.length ? 'latest-origin-copy-may-be-another-tab' : 'absent',
      storage: { previewTab: tab.state, previewOrigin: origin.state, diagnostics: diagnostics.state, session: marker.state },
      events, recordedInterruptions: Array.isArray(diagnostics.value) ? diagnostics.value.slice(-20).map(context).filter(Boolean) : [],
      lastSession: lastSession ? { context: lastSession, active: marker.value.active === true,
        hidden: marker.value.hidden === true, pageHidden: marker.value.pageHidden === true,
        ...(finite(marker.value.at) ? { at: marker.value.at } : {}) } : null,
      limits: ['Local technical events only; no account, payment or saved-progress payloads.',
        'A new document does not establish an OS or memory cause.',
        'White pixels and native compositor/GPU failure are not directly observed.',
        'Active means visible, unpaused game DOM; saved context has its own timestamp and can be stale.',
        'RAF observation adds overhead; no new RAF/timer or automatic Resume.',
        'Origin fallback may describe a different tab. Previous deployment origins are inaccessible.'] };
  }
  window.CryptoidPrivatePreviewEvidence = Object.freeze({ key, limit, event, context, read, eventsFrom, report });
})();
