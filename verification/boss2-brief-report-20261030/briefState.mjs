import { STOPWATCH_KEY, formatStopwatch } from '../boss2-stopwatch-20261029/stopwatchState.mjs';

export const BRIEF_KEY = 'cryptoid_private_brief_v1';
export const MAX_EVENTS = 32;
export const MAX_BYTES = 16384;
const modes = new Set(['running', 'paused', 'hidden', 'stalled', 'ended']);
const kinds = new Set(['state', 'pointerdown', 'pointerup', 'pointercancel', 'lostpointercapture',
  'touchstart', 'touchend', 'touchcancel', 'gesturestart', 'gestureend', 'contextmenu',
  'blur', 'pagehide', 'hidden', 'visible', 'popstate', 'hashchange', 'error', 'unhandledrejection']);
const targets = new Set(['field', 'weapons', 'pause', 'home', 'overlay', 'other', 'document']);
const finite = value => Number.isFinite(value) && value >= 0;
const clone = value => value ? JSON.parse(JSON.stringify(value)) : null;
export function cleanClock(value) {
  if (!value || !/^[a-f0-9]{40}$/.test(value.source) || typeof value.id !== 'string'
    || !/^[a-zA-Z0-9-]{1,100}$/.test(value.id) || !finite(value.startedAt) || !value.startedAt
    || !finite(value.updatedAt) || !finite(value.elapsedMs) || value.elapsedMs >= 7 * 86400000
    || !Number.isInteger(value.unobservedGaps) || value.unobservedGaps < 0 || !modes.has(value.mode)) return null;
  return Object.fromEntries(['id', 'source', 'startedAt', 'updatedAt', 'elapsedMs', 'unobservedGaps', 'mode'].map(k => [k, value[k]]));
}
const cleanOptions = value => ({ scene: value?.scene === 'turrets' ? 'turrets' : 'reactor',
  fullRecording: value?.diagnostics === true || value?.fullRecording === true, protection: value?.protection === true });
function cleanEvent(value) {
  if (!value || !kinds.has(value.kind) || !finite(value.at) || !finite(value.elapsedMs) || !modes.has(value.mode)) return null;
  const event = { kind: value.kind, at: value.at, elapsedMs: value.elapsedMs, mode: value.mode,
    target: targets.has(value.target) ? value.target : 'other', trusted: value.trusted === true };
  if (Number.isInteger(value.contacts)) event.contacts = Math.min(10, Math.max(0, value.contacts));
  if (typeof value.primary === 'boolean') event.primary = value.primary;
  if (['mouse', 'touch', 'pen'].includes(value.pointerType)) event.pointerType = value.pointerType;
  if (['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'SecurityError', 'QuotaExceededError'].includes(value.errorName)) event.errorName = value.errorName;
  return event;
}
function cleanRun(value) {
  const clock = cleanClock(value?.clock);
  if (!clock || !finite(value.documentStartedAt)) return null;
  return { clock, documentStartedAt: value.documentStartedAt, options: cleanOptions(value.options),
    events: (Array.isArray(value.events) ? value.events : []).slice(-MAX_EVENTS).map(cleanEvent).filter(Boolean),
    dropped: Number.isInteger(value.dropped) && value.dropped >= 0 ? value.dropped : 0 };
}
function readValue(storage, key, limit) {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return { storage: 'absent', value: null };
    if (typeof raw !== 'string' || raw.length > limit) return { storage: 'invalid', value: null };
    return { storage: 'read', value: JSON.parse(raw) };
  } catch { return { storage: 'unavailable', value: null }; }
}
export function readSavedStopwatch(storage) {
  const { storage: status, value } = readValue(storage, STOPWATCH_KEY, 2048);
  const latest = value?.version === 1 ? cleanClock(value.latest) : null;
  return { storage: status, latest, previous: value?.version === 1 ? cleanClock(value.previous) : null,
    displayedTime: latest ? formatStopwatch(latest.elapsedMs) : null, exactCrashTime: false };
}
export function readBrief(storage) {
  const { storage: status, value } = readValue(storage, BRIEF_KEY, MAX_BYTES);
  return { version: 1, storage: status,
    latest: value?.version === 1 ? cleanRun(value.latest) : null,
    previous: value?.version === 1 ? cleanRun(value.previous) : null,
    limits: { maxEventsPerRun: MAX_EVENTS, maxSavedRuns: 2, maxCharacters: MAX_BYTES,
      checkpointMs: 1000, ordinaryEventsSavedImmediately: false, terminalEventGuaranteed: false,
      nativeTerminationCauseMeasured: false, rawContactFieldsStored: false } };
}
export function createBrief({ storage, source, now, documentStartedAt }) {
  if (!/^[a-f0-9]{40}$/.test(source)) throw Error('Exact preview source required');
  const restored = readBrief(storage);
  let latest = restored.latest, previous = restored.previous, currentId = null;
  let lastWrite = -Infinity, storageAvailable = restored.storage !== 'unavailable';
  let ordinaryWindow = -1, ordinaryCount = 0, criticalWindow = -1, criticalCount = 0;
  const snapshot = () => ({ version: 1, latest: clone(latest), previous: clone(previous), storageAvailable });
  const flush = (force = false) => {
    const at = now();
    if (!currentId || !latest || !force && at - lastWrite < 1000) return;
    try {
      const raw = JSON.stringify({ version: 1, latest, previous });
      if (raw.length > MAX_BYTES) throw Error('Brief record bound exceeded');
      storage.setItem(BRIEF_KEY, raw); lastWrite = at; storageAvailable = true;
    } catch { storageAvailable = false; }
  };
  const record = (fields, critical = false) => {
    if (!currentId || latest?.clock.id !== currentId) return;
    const at = now(), bucket = Math.floor(at / 1000);
    if (critical) {
      if (bucket !== criticalWindow) { criticalWindow = bucket; criticalCount = 0; }
      if (++criticalCount > 8) { latest.dropped++; return; }
    } else {
      if (bucket !== ordinaryWindow) { ordinaryWindow = bucket; ordinaryCount = 0; }
      if (++ordinaryCount > 16) { latest.dropped++; return; }
    }
    const event = cleanEvent({ ...fields, at, elapsedMs: latest.clock.elapsedMs, mode: latest.clock.mode });
    if (!event) return;
    latest.events.push(event);
    if (latest.events.length > MAX_EVENTS) { latest.events.shift(); latest.dropped++; }
    if (critical && (fields.kind === 'pagehide' || at - lastWrite >= 250)) flush(true);
  };
  const checkpoint = (value, options) => {
    const clock = cleanClock(value);
    if (!clock || clock.source !== source) return;
    if (currentId !== clock.id) {
      if (clock.id === latest?.clock.id) return; // Restored runs are never resumed by a new document.
      previous = latest;
      latest = { clock, documentStartedAt, options: cleanOptions(options), events: [], dropped: 0 };
      currentId = clock.id;
      record({ kind: 'state', target: 'document' }); flush(true); return;
    }
    const changed = latest.clock.mode !== clock.mode;
    latest.clock = clock;
    if (changed) record({ kind: 'state', target: 'document' });
    flush(changed);
  };
  return { checkpoint, record, flush, snapshot };
}
let reportSerial = 0;
export function reportIdentity(host) {
  const preparedAt = new Date().toISOString();
  const unique = host.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 8) || String(++reportSerial);
  const reportId = preparedAt.replace(/[:.]/g, '-') + '-' + unique;
  return { reportId, preparedAt, filename: `cryptoid-diagnose-${reportId}.json` };
}
export function shareReportFile(blob, filename, host) {
  try {
    if (typeof host.navigator.share !== 'function' || typeof host.navigator.canShare !== 'function') return null;
    for (const type of ['application/json', 'text/plain']) {
      const file = new host.File([blob], filename, { type });
      try { if (host.navigator.canShare({ files: [file] })) return file; } catch { /* Try the next MIME type. */ }
    }
  } catch { /* The text and download paths remain available. */ }
  return null;
}
