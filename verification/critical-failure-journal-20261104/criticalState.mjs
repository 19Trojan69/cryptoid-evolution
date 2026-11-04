import { cleanClock } from '../boss2-brief-report-20261030/briefState.mjs';

export const CRITICAL_KEY = 'cryptoid_private_critical_v1';
export const MAX_CHARACTERS = 12288;
export const CRITICAL_KINDS = new Set(['error', 'unhandledrejection', 'pagehide', 'hidden', 'popstate', 'hashchange', 'blur']);
const errorNames = new Set(['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'SecurityError',
  'QuotaExceededError', 'AbortError', 'NetworkError', 'InvalidStateError', 'NotSupportedError', 'AggregateError', 'UnknownError', 'NonErrorRejection']);
const routes = new Set(['home', 'game', 'admin', 'other']);
const finite = n => Number.isFinite(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER;
const count = n => Number.isSafeInteger(n) && n >= 0;
const copy = value => value ? JSON.parse(JSON.stringify(value)) : null;

export function safeErrorName(error) {
  try {
    if (!error || typeof error !== 'object') return 'NonErrorRejection';
    return errorNames.has(error.name) ? error.name : 'UnknownError';
  } catch { return 'UnknownError'; }
}
export function safeErrorSite(event, host) {
  const result = {};
  try {
    for (const [out, key] of [['line', 'lineno'], ['column', 'colno']])
      if (Number.isSafeInteger(event[key]) && event[key] >= 0 && event[key] < 1e9) result[out] = event[key];
    const url = new host.URL(event.filename, host.location.href);
    if (url.origin !== host.location.origin) return result;
    if (url.pathname === host.location.pathname) result.script = 'inline';
    else if (/^\/assets\/[A-Za-z0-9_.-]{1,120}\.js$/.test(url.pathname)
      || url.pathname === '/device-preview-sdk.js') result.script = url.pathname.split('/').at(-1);
  } catch { /* Never store arbitrary filenames, URLs, credentials or messages. */ }
  return result;
}
function cleanEvent(input) {
  if (!input || !CRITICAL_KINDS.has(input.kind) || !finite(input.at) || !finite(input.elapsedMs)) return null;
  const event = { kind: input.kind, at: input.at, elapsedMs: input.elapsedMs,
    target: 'document', trusted: input.trusted === true, route: routes.has(input.route) ? input.route : 'other' };
  if (errorNames.has(input.errorName)) event.errorName = input.errorName;
  if (input.script === 'inline' || /^[A-Za-z0-9_.-]{1,123}\.js$/.test(input.script ?? '')) event.script = input.script;
  for (const key of ['line', 'column']) if (count(input[key]) && input[key] < 1e9) event[key] = input[key];
  if (typeof input.persisted === 'boolean') event.persisted = input.persisted;
  return event;
}
function cleanRun(input) {
  const clock = cleanClock(input?.clock);
  if (!clock || !finite(input.documentStartedAt)) return null;
  const run = { clock, documentStartedAt: input.documentStartedAt, events: {} };
  for (const kind of CRITICAL_KINDS) {
    const slot = input.events?.[kind];
    const first = cleanEvent(slot?.first), last = cleanEvent(slot?.last);
    if (first?.kind === kind && last?.kind === kind && count(slot.count) && slot.count > 0
      && first.elapsedMs <= last.elapsedMs && last.elapsedMs <= clock.elapsedMs)
      run.events[kind] = { first, last, count: slot.count };
  }
  return run;
}
export function readCriticalJournal(storage) {
  let status = 'absent', value;
  try {
    const raw = storage.getItem(CRITICAL_KEY);
    if (raw !== null) {
      status = 'invalid';
      if (typeof raw === 'string' && raw.length <= MAX_CHARACTERS) {
        const parsed = JSON.parse(raw);
        if (parsed?.version === 1) { value = parsed; status = 'read'; }
      }
    }
  } catch { status = 'unavailable'; }
  return { version: 1, storage: status, latest: cleanRun(value?.latest), previous: cleanRun(value?.previous),
    limits: { maxRuns: 2, maxEventKindsPerRun: CRITICAL_KINDS.size, maxCharacters: MAX_CHARACTERS,
      firstEventPerKindSavedImmediately: true, repeatedEventWriteIntervalMs: 1000,
      ordinaryContactEventsStored: false, elapsedAtEventUsesLastClockCheckpoint: true,
      journalClockIsNotPeriodic: true,
      terminalEventGuaranteed: false, nativeTerminationCauseMeasured: false, absenceProvesNoError: false,
      messagesUrlsAccountsAndStackStringsStored: false } };
}
export function createCriticalJournal({ storage, source, now, documentStartedAt }) {
  if (!/^[a-f0-9]{40}$/.test(source) || !finite(documentStartedAt)) throw Error('Pinned source/document required');
  const restored = readCriticalJournal(storage);
  let latest = restored.latest, previous = restored.previous, currentId = null;
  let dirty = false, lastWrite = -Infinity, storageAvailable = restored.storage !== 'unavailable';
  function flush(force = false) {
    if (!currentId || !latest || !dirty || !force && now()-lastWrite < 1000) return;
    try {
      const raw = JSON.stringify({ version: 1, latest, previous });
      if (raw.length > MAX_CHARACTERS) throw Error('Critical journal bound exceeded');
      storage.setItem(CRITICAL_KEY, raw); lastWrite = now(); dirty = false; storageAvailable = true;
    } catch { storageAvailable = false; }
  }
  function checkpoint(value) {
    const clock = cleanClock(value);
    if (!clock || clock.source !== source) return;
    if (currentId !== clock.id) {
      if (clock.id === latest?.clock.id) return; // A new document must not resume a restored run.
      previous = latest;
      latest = { clock, documentStartedAt, events: {} };
      currentId = clock.id; dirty = true; flush(true); return;
    }
    const ended = latest.clock.mode !== 'ended' && clock.mode === 'ended';
    latest.clock = clock;
    if (ended) { dirty = true; flush(true); } else flush();
  }
  function record(fields) {
    if (!currentId || latest?.clock.id !== currentId || latest.clock.mode === 'ended') return;
    const event = cleanEvent({ ...fields, at: now(), elapsedMs: latest.clock.elapsedMs });
    if (!event) return;
    const slot = latest.events[event.kind];
    if (slot) { slot.last = event; slot.count = Math.min(Number.MAX_SAFE_INTEGER, slot.count+1); }
    else latest.events[event.kind] = { first: event, last: event, count: 1 };
    dirty = true;
    // First evidence of each kind bypasses rate limits shared with gestures.
    // A final pagehide/hidden also flushes a repeated-error aggregate.
    flush(!slot || event.kind === 'pagehide' || event.kind === 'hidden');
  }
  return { checkpoint, record, flush,
    snapshot: () => ({ latest: copy(latest), previous: copy(previous), storageAvailable, pendingChanges: dirty }) };
}
