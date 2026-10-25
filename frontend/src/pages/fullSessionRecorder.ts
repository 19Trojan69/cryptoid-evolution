import { observeSessionDiagnostics } from '../lib/sessionDiagnosticEvents.ts';
import { cleanFullData, FULL_SESSION_LIMITS as limits, FULL_SESSION_STATUS_KEY,
  type FullRecord, type FullRecordKind, type FullSessionSummary } from './fullSessionFormat.ts';
import { appendFullSessionChunk, trackFullSessionWrite, fullSessionStorageFailureCode, type FullSessionHost } from './fullSessionStore.ts';

type Host = FullSessionHost & { navigator?: { userAgent?: string; maxTouchPoints?: number };
  innerWidth?: number; innerHeight?: number; devicePixelRatio?: number };
type Options = { build: { sourceCommit: string; sourceTree: string; workingTreeDirty: boolean };
  now?: () => number; wallNow?: () => number; fullContext?: () => Record<string, unknown> };
let serial = 0;
function device(host: Host) {
  try {
    const ua = host.navigator?.userAgent ?? '';
    return { platform: /Android/i.test(ua) ? 'android' : /iP(hone|ad|od)/i.test(ua)
      || /Macintosh/i.test(ua) && (host.navigator?.maxTouchPoints ?? 0) > 1 ? 'ios' : 'other',
    browser: /PiBrowser|Pi Browser/i.test(ua) ? 'pi-browser' : /Chrome|Chromium|CriOS/i.test(ua) ? 'chromium' : /Safari/i.test(ua) ? 'safari' : 'other',
    width: host.innerWidth, height: host.innerHeight, dpr: host.devicePixelRatio };
  } catch { return {}; }
}
// Receives the existing probe's aggregate windows. It does not own a timer/RAF,
// sample DOM, record inputs, contact a server or keep the whole run in memory.
export function createFullSessionRecorder(verifiedOwner: boolean, getHost: () => Host, options: Options) {
  if (!verifiedOwner) return null;
  let host: Host;
  try { host = getHost(); } catch { return null; }
  const now = options.now ?? (() => performance.now()), wall = options.wallNow ?? Date.now;
  const origin = now(), createdAt = wall();
  const id = `run-${createdAt}-${++serial}-${Math.random().toString(36).slice(2, 10)}`;
  let summary: FullSessionSummary = { id, startedAt: createdAt, lastAt: createdAt, state: 'recording',
    count: 0, bytes: 0, chunks: 0, lastSeq: 0, build: { ...options.build }, device: device(host) };
  let started = false, stopped = false, failed = false, writing = false, wanted = false;
  let sequence = 0, acceptedBytes = 0, queueBytes = 0, queuePeak = 0, serializeMaxMs = 0, commitWaitMaxMs = 0;
  const queue: { record: FullRecord; bytes: number }[] = [];
  let observed: FullRecord | undefined;
  let lastGraphics: FullRecord | undefined;
  let markerWrites = 0, markerWriteMaxMs = 0, markerWriteTotalMs = 0;
  let storageFailureCode: ReturnType<typeof fullSessionStorageFailureCode> | undefined;
  let observedKey = '', observedAt = -Infinity;
  const marker = () => {
    const markerStartedAt = now();
    try { host.localStorage?.setItem(FULL_SESSION_STATUS_KEY, JSON.stringify({ id,
      state: failed ? 'storage-error' : !started ? 'starting' : summary.state,
      at: wall(), lastCommittedSeq: summary.lastSeq, lastObservedSeq: observed?.seq ?? 0,
      lastObserved: observed, lastGraphics, stopReason: summary.stopReason, storageFailureCode, queuePeak, serializeMaxMs, commitWaitMaxMs,
      markerWrites, markerWriteMaxMs, markerWriteTotalMs })); }
    catch { /* IndexedDB may still work; never fail gameplay because a marker is denied. */ }
    finally { const elapsed = now() - markerStartedAt; markerWrites++; markerWriteTotalMs += elapsed;
      markerWriteMaxMs = Math.max(markerWriteMaxMs, elapsed); }
  };
  const storageFailure = (error: unknown) => {
    storageFailureCode = fullSessionStorageFailureCode(error);
    failed = stopped = true; summary.stopReason = 'storage-error'; release();
    queue.length = 0; queueBytes = 0; marker();
  };
  const drain = async () => {
    try {
      while (wanted && queue.length && !failed) {
        wanted = false;
        const batch = queue.splice(0, limits.chunkRecords);
        const bytes = batch.reduce((sum, entry) => sum + entry.bytes, 0);
        queueBytes -= bytes;
        const last = batch.at(-1)!.record;
        const next: FullSessionSummary = { ...summary, count: last.seq, lastSeq: last.seq,
          chunks: summary.chunks + 1, bytes: summary.bytes + bytes, lastAt: last.at,
          state: stopped && queue.length === 0 ? summary.stopReason ? 'limited' : 'closed' : 'recording' };
        const at = now();
        await appendFullSessionChunk(host, next, summary.chunks, batch.map(entry => entry.record));
        commitWaitMaxMs = Math.max(commitWaitMaxMs, now() - at);
        summary = { ...next, ...(summary.stopReason ? { stopReason: summary.stopReason } : {}) };
        marker();
        if (queue.length && (stopped || wanted || queue.length >= limits.chunkRecords)) wanted = true;
      }
    } catch (error) { storageFailure(error); }
    finally { writing = false; }
  };
  const flush = () => {
    if (!started || failed) return;
    wanted = true;
    if (!writing && queue.length) {
      writing = true;
      void trackFullSessionWrite(drain());
    }
  };
  const stop = (reason?: string) => {
    if (stopped) return;
    if (!started) { stopped = true; release(); queue.length = 0; queueBytes = 0; return; }
    if (reason) summary.stopReason = reason;
    // Reserve an end marker whenever the queue has space. No eviction of earlier evidence.
    stopped = true; release();
    if (queue.length < limits.queueRecords && queueBytes + 512 < limits.queueBytes && sequence < limits.records && acceptedBytes + 512 < limits.bytes)
      add('end', { operation: 'finish' }, true, true);
    flush(); marker();
  };
  const add = (kind: FullRecordKind, input: unknown, critical = false, ending = false) => {
    if (stopped && !ending || failed) return;
    if (!ending && wall() - createdAt >= limits.durationMs) { stop('duration-limit'); return; }
    const at = now(), data = cleanFullData(kind, input);
    if (!data) return;
    const record: FullRecord = { seq: sequence + 1, at: wall(), clockMs: Math.max(0, at - origin), kind, data };
    const bytes = JSON.stringify(record).length * 2 + 4;
    serializeMaxMs = Math.max(serializeMaxMs, now() - at);
    if (!ending && sequence >= limits.records - 1) { stop('record-limit'); return; }
    if (!ending && acceptedBytes + bytes + 2048 > limits.bytes) { stop('byte-limit'); return; }
    if (queue.length >= limits.queueRecords || queueBytes + bytes > limits.queueBytes) { if (!ending) stop('queue-limit'); return; }
    sequence++; acceptedBytes += bytes; queueBytes += bytes; queue.push({ record, bytes });
    queuePeak = Math.max(queuePeak, queue.length);
    // Keep the latest graphics observation separate from a later phase event.
    // Update only the bounded synchronous marker; use existing aggregate/critical
    // flushes for these records rather than one IDB transaction per image step.
    if (kind === 'boundary' && data.operation === 'hull-plan-progress' && data.step) {
      lastGraphics = record; marker();
    }
    const criticalKey = `${kind}:${data.operation ?? data.signal ?? data.kind}:${data.sector}:${data.phase}:${data.status}`;
    if (critical && (criticalKey !== observedKey || at - observedAt >= 2000)) {
      observedKey = criticalKey; observedAt = at;
      const context: Record<string, unknown> = {};
      for (const key of ['operation','signal','sector','phase','encounter','status','kind']) if (data[key] !== undefined) context[key] = data[key];
      observed = { ...record, data: context }; marker(); flush();
    }
  };
  const release = observeSessionDiagnostics((kind, details) => {
    if (!started && !stopped && kind === 'boundary' && details.operation === 'boss-summary-open') {
      started = true; add('start', options.build, true); flush();
    }
    add(kind, details, kind === 'boundary' && details.operation !== 'hull-plan-progress' || kind === 'lifecycle');
    // Requests/queues are batched with the next aggregate window, not written per shot.
  });
  return {
    id,
    start() { if (started || stopped) return; started = true; add('start', options.build, true); flush(); },
    sample(value: unknown) {
      add('sample', value);
      try { if (options.fullContext) add('resource', options.fullContext()); } catch { /* Optional cheap state snapshot. */ }
      flush();
    },
    event(value: Record<string, unknown>) {
      add('event', value, ['phase-start','phase-complete','frame-error','loop-stall','render-error','javascript-error',
        'unhandled-rejection','home-intent','saved-exit-intent'].includes(String(value.kind)));
    },
    finish() { stop(); },
    stats() { return { started, stopped, failed, sequence, queued: queue.length, queueBytes, queuePeak, committed: summary.lastSeq,
      markerWrites, markerWriteMaxMs, markerWriteTotalMs }; },
  };
}

