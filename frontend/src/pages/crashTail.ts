import { cleanFullData, type FullRecordKind } from './fullSessionFormat.ts';
import { technicalContext } from './technicalReportContext.mjs';
import { cleanCrashProgress, type CrashProgress } from './crashProgress.ts';

export const CRASH_TAIL_PREFIX = 'cryptoid_owner_crash_tail_v1_';
export const CRASH_TAIL_LIMITS = { events: 128, frames: 128, eventChars: 4096, headIntervalMs: 250, frameIntervalMs: 250 } as const;
type StorageHost = Pick<Storage, 'getItem' | 'setItem'>;
type Host = { localStorage?: StorageHost; sessionStorage?: StorageHost; performance?: { timeOrigin?: number } };
type Meta = { version: 1; id: string; startedAt: number; documentStartedAt?: number; frameSlots?: 128; frameIntervalMs?: 250; build: Record<string, unknown>; state: 'recording' | 'closed' };
type Row = { version: 1; id: string; seq: number; at: number; clockMs: number; kind: FullRecordKind; data: Record<string, unknown>; progress?: CrashProgress; truncated?: boolean };
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id);
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1e15;
const key = (slot: number, name: string) => `${CRASH_TAIL_PREFIX}${slot}_${name}`;
function read(host: Host, storage: 'sessionStorage' | 'localStorage', name: string, maximum = 8192) {
  try {
    const raw = host[storage]?.getItem(name);
    if (raw == null) return { state: 'absent', value: null };
    if (typeof raw !== 'string' || raw.length > maximum) return { state: 'invalid', value: null };
    return { state: 'read', value: JSON.parse(raw) };
  } catch { return { state: 'unavailable', value: null }; }
}
function metadata(input: unknown): Meta | null {
  if (!input || typeof input !== 'object') return null;
  const m = input as Meta;
  if (m.version !== 1 || !validId(m.id) || !finite(m.startedAt) || !['recording', 'closed'].includes(m.state)) return null;
  return { version: 1, id: m.id, startedAt: m.startedAt, state: m.state,
    ...(m.frameSlots === 128 && m.frameIntervalMs === 250 ? { frameSlots: 128, frameIntervalMs: 250 } : {}),
    ...(finite(m.documentStartedAt) ? { documentStartedAt: m.documentStartedAt } : {}), build: technicalContext(m.build) || {} };
}
function row(input: unknown, id: string): Row | null {
  if (!input || typeof input !== 'object') return null;
  const r = input as Row;
  if (r.version !== 1 || r.id !== id || !Number.isSafeInteger(r.seq) || r.seq < 1 || !finite(r.at) || !finite(r.clockMs)) return null;
  if (!['event', 'sample', 'resource', 'boundary', 'request', 'weapon', 'queue', 'lifecycle', 'input', 'start', 'end'].includes(r.kind)) return null;
  const data = cleanFullData(r.kind, r.data);
  return data ? { version: 1, id, seq: r.seq, at: r.at, clockMs: r.clockMs, kind: r.kind, data, ...(cleanCrashProgress(r.progress) ? { progress: cleanCrashProgress(r.progress) } : {}),
    ...(r.truncated === true ? { truncated: true } : {}) } : null;
}
export function readCrashTails(host: Host) {
  const sessions: Array<Record<string, unknown> & { id: string; startedAt: number }> = [];
  const storage: Record<string, string> = {};
  for (const slot of [0, 1]) {
    const tab = read(host, 'sessionStorage', key(slot, 'meta'));
    const local = read(host, 'localStorage', key(slot, 'meta'));
    const meta = metadata(tab.value) || metadata(local.value);
    const source = metadata(tab.value) ? 'sessionStorage' : 'localStorage';
    storage[`${slot}Tab`] = tab.state; storage[`${slot}Origin`] = local.state;
    if (!meta) continue;
    const readRow = (name: string) => row(read(host, source, key(slot, name)).value, meta.id);
    const events = Array.from({ length: CRASH_TAIL_LIMITS.events }, (_, n) => readRow(`event_${n}`)).filter((r): r is Row => r !== null).sort((a, b) => a.seq - b.seq);
    const frameSlots = meta.frameSlots ?? 32, frameIntervalMs = meta.frameIntervalMs ?? 1000;
    const frames = Array.from({ length: frameSlots }, (_, n) => readRow(`frame_${n}`)).filter((r): r is Row => r !== null).sort((a, b) => a.at - b.at);
    const head = readRow('head');
    const errors = events.filter(r => /error|stall|rejection|context-lost/.test(String(r.data.signal ?? r.data.kind ?? '')) || r.data.operation === 'failure');
    sessions.push({ ...meta, evidenceSource: source === 'sessionStorage' ? 'current-tab' : 'origin-fallback-may-be-another-tab',
      head, frames, events, errors, lastObservedAt: Math.max(meta.startedAt, head?.at ?? 0, ...events.map(r => r.at), ...frames.map(r => r.at)),
      limits: { ...CRASH_TAIL_LIMITS, frames: frameSlots, frameIntervalMs, synchronousObservationsOnly: true, nativeOrGpuCauseMeasured: false,
        finalUnwrittenIntervalCanBeLost: true, frameHistoryIndependentOfEventBursts: true } });
  }
  return { version: 1, format: 'cryptoid-crash-tail', storage, sessions: sessions.sort((a, b) => b.startedAt - a.startedAt) };
}

// Fixed individual slots avoid serializing/writing an entire history per frame.
// Uses existing game/probe callbacks only: no timer, RAF, DOM read or request.
export function createCrashTail(verifiedOwner: boolean, getHost: () => Host, options: {
  id: string; build: Record<string, unknown>; now: () => number; wallNow: () => number;
  fullContext?: () => Record<string, unknown>;
  progress?: () => CrashProgress;
}) {
  if (!verifiedOwner || !validId(options.id)) return null;
  let host: Host;
  try { host = getHost(); } catch { return null; }
  let slot = -1, seq = 0, eventIndex = 0, frameIndex = 0, finished = false;
  let lastHead = -Infinity, lastFrame = -Infinity, startedAt = 0, origin = 0;
  let meta: Meta | null = null;
  let context: Record<string, unknown> = {}, writes = 0, failures = 0, maxWriteMs = 0;
  const write = (name: string, value: unknown) => {
    const begin = options.now();
    let success = false;
    try {
      const raw = JSON.stringify(value);
      if (raw.length > CRASH_TAIL_LIMITS.eventChars) { failures++; return; }
      for (const storage of ['sessionStorage', 'localStorage'] as const) {
        try { if (host[storage]) { host[storage]!.setItem(key(slot, name), raw); success = true; } } catch { failures++; }
      }
      if (success) writes++;
    } catch { failures++; }
    finally { maxWriteMs = Math.max(maxWriteMs, options.now() - begin); }
  };
  const start = () => {
    if (slot >= 0 || finished) return;
    const metas = [0, 1].map(s => metadata(read(host, 'sessionStorage', key(s, 'meta')).value) || metadata(read(host, 'localStorage', key(s, 'meta')).value));
    slot = !metas[0] ? 0 : !metas[1] ? 1 : metas[0].startedAt <= metas[1].startedAt ? 0 : 1;
    startedAt = options.wallNow(); origin = options.now();
    meta = { version: 1, id: options.id, startedAt, state: 'recording', build: technicalContext(options.build) || {},
      frameSlots: CRASH_TAIL_LIMITS.frames, frameIntervalMs: CRASH_TAIL_LIMITS.frameIntervalMs,
      ...(finite(host.performance?.timeOrigin) ? { documentStartedAt: host.performance!.timeOrigin } : {}) };
    write('meta', meta);
  };
  const ownsSlot = () => {
    if (slot < 0 || finished) return false;
    const tab = metadata(read(host, 'sessionStorage', key(slot, 'meta')).value);
    const local = metadata(read(host, 'localStorage', key(slot, 'meta')).value);
    // A newer recorder may retire this generation. Never overwrite its slots.
    if (tab && tab.id !== options.id || !tab && local && local.id !== options.id) { finished = true; return false; }
    return true;
  };
  const make = (kind: FullRecordKind, input: unknown): Row | null => {
    const data = cleanFullData(kind, input);
    if (!data) return null;
    const value: Row = { version: 1, id: options.id, seq: ++seq, at: options.wallNow(), clockMs: Math.max(0, options.now() - origin), kind, data };
    if (JSON.stringify(value).length > CRASH_TAIL_LIMITS.eventChars) {
      value.kind = 'resource'; value.data = cleanFullData('resource', data) || {}; value.truncated = true;
    }
    return value;
  };
  const head = (force = false) => {
    if (!ownsSlot() || !force && options.now() - lastHead < CRASH_TAIL_LIMITS.headIntervalMs) return;
    lastHead = options.now();
    try { if (options.fullContext) context = technicalContext(options.fullContext()) || context; } catch { /* Optional state only. */ }
    const value = make('resource', context);
    if (!value) return;
    try { const progress = cleanCrashProgress(options.progress?.()); if (progress) value.progress = progress; } catch { /* Optional callback progress only. */ }
    write('head', value);
    if (options.now() - lastFrame >= CRASH_TAIL_LIMITS.frameIntervalMs) {
      lastFrame = options.now(); write(`frame_${frameIndex++ % CRASH_TAIL_LIMITS.frames}`, value);
    }
  };
  return {
    frame(value: Record<string, unknown>) {
      if (finished) return;
      if (slot < 0 && value.status !== 'playing') return;
      start(); context = technicalContext(value) || {}; head();
    },
    record(kind: FullRecordKind, value: unknown) {
      if (slot < 0 && kind === 'boundary' && value && typeof value === 'object'
        && (value as Record<string, unknown>).operation === 'boss-summary-open') start();
      if (!ownsSlot()) return;
      const event = make(kind, value);
      if (!event) return;
      write(`event_${eventIndex++ % CRASH_TAIL_LIMITS.events}`, event);
      // Preserve a synchronous state before/after critical operations, without
      // waiting for an IndexedDB callback or an unload event.
      if (kind === 'boundary' || kind === 'lifecycle' || kind === 'request' && event.data.operation === 'failure') head(true);
    },
    finish() {
      if (slot < 0 || finished) return;
      head(true);
      if (ownsSlot() && meta) write('meta', { ...meta, state: 'closed' });
      finished = true;
    },
    stats() { return { started: slot >= 0, finished, writes, failures, maxWriteMs }; },
  };
}
