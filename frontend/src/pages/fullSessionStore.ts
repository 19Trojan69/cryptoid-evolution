import { FULL_SESSION_DB, FULL_SESSION_LIMITS as limits, FULL_SESSION_STATUS_KEY, FULL_SESSION_STORAGE_FAILURE_CODES,
  cleanFullRecord, cleanFullSummary, fullSessionLimitsText, type FullRecord, type FullSessionSummary } from './fullSessionFormat.ts';

export type FullSessionHost = { indexedDB?: IDBFactory; localStorage?: Pick<Storage, 'getItem' | 'setItem'> };
const connections = new WeakMap<IDBFactory, Promise<IDBDatabase>>();
const pending = new Set<Promise<unknown>>();
export function fullSessionStorageFailureCode(error: unknown): typeof FULL_SESSION_STORAGE_FAILURE_CODES[number] {
  // Fixed categories only. Never persist a browser exception's message, URL,
  // stack or arbitrary name, even when storage itself is no longer available.
  const value = error as { name?: unknown; message?: unknown } | null;
  if (value?.name === 'QuotaExceededError') return 'quota-exceeded';
  if (value?.name === 'SecurityError' || value?.name === 'NotAllowedError') return 'storage-denied';
  if (value?.name === 'InvalidStateError') return 'connection-closed';
  if (value?.message === 'diagnostic_storage_timeout') return 'timeout';
  if (value?.message === 'diagnostic_storage_blocked') return 'blocked';
  if (value?.message === 'diagnostic_history_missing') return 'history-missing';
  if (value?.message === 'diagnostic_sequence_conflict') return 'sequence-conflict';
  if (value?.message === 'diagnostic_storage_unavailable') return 'storage-unavailable';
  if (value?.message === 'diagnostic_storage_write_failed' || value?.name === 'AbortError' || value?.name === 'TransactionInactiveError') return 'write-failed';
  return 'unknown';
}
export function trackFullSessionWrite<T>(promise: Promise<T>) {
  pending.add(promise);
  void promise.then(() => pending.delete(promise), () => pending.delete(promise));
  return promise;
}
export async function settleFullSessionWrites() { while (pending.size) await Promise.allSettled([...pending]); }
function database(host: FullSessionHost) {
  const factory = host.indexedDB;
  if (!factory) return Promise.reject(new Error('diagnostic_storage_unavailable'));
  const prior = connections.get(factory);
  if (prior) return prior;
  const opened = new Promise<IDBDatabase>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => fail(new Error('diagnostic_storage_timeout')), limits.timeoutMs);
    const fail = (error: unknown) => { if (settled) return; settled = true; clearTimeout(timer); reject(error); };
    let request: IDBOpenDBRequest;
    try { request = factory.open(FULL_SESSION_DB, 1); } catch (error) { fail(error); return; }
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('sessions', { keyPath: 'id' });
      db.createObjectStore('chunks', { keyPath: ['session', 'index'] }).createIndex('session', 'session');
    };
    request.onerror = () => fail(request.error ?? new Error('diagnostic_storage_unavailable'));
    request.onblocked = () => fail(new Error('diagnostic_storage_blocked'));
    request.onsuccess = () => {
      const db = request.result;
      if (settled) { db.close(); return; }
      settled = true; clearTimeout(timer);
      const invalidate = () => { if (connections.get(factory) === opened) connections.delete(factory); };
      db.onclose = invalidate;
      db.onversionchange = () => { db.close(); invalidate(); };
      resolve(db);
    };
  });
  connections.set(factory, opened);
  void opened.catch(() => { if (connections.get(factory) === opened) connections.delete(factory); });
  return opened;
}
function transaction(db: IDBDatabase, write: boolean) {
  if (!write) return db.transaction(['sessions', 'chunks'], 'readonly');
  try { return db.transaction(['sessions', 'chunks'], 'readwrite', { durability: 'strict' }); }
  catch { return db.transaction(['sessions', 'chunks'], 'readwrite'); }
}
function done(tx: IDBTransaction) {
  let fail!: (error: unknown) => void;
  const completion = new Promise<void>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => fail(new Error('diagnostic_storage_timeout')), limits.timeoutMs);
    fail = error => {
      if (settled) return;
      settled = true; clearTimeout(timer); reject(error);
      try { tx.abort(); } catch { /* Inactive/finished transactions cannot abort again. */ }
    };
    tx.oncomplete = () => { if (settled) return; settled = true; clearTimeout(timer); resolve(); };
    tx.onabort = tx.onerror = () => fail(tx.error ?? new Error('diagnostic_storage_write_failed'));
  });
  // IDB event callbacks execute after their creating async function returns.
  // A throw here must reject this operation, never escape into gameplay.
  const guard = (work: () => void) => () => { try { work(); } catch (error) { fail(error); } };
  return { completion, guard };
}
export async function appendFullSessionChunk(host: FullSessionHost, summary: FullSessionSummary, index: number, records: FullRecord[]) {
  const clean = cleanFullSummary(summary);
  if (!clean || records.length < 1 || records.length > limits.chunkRecords || records.some(r => !cleanFullRecord(r))) throw new Error('invalid_diagnostic_chunk');
  const db = await database(host), tx = transaction(db, true), operation = done(tx);
  let integrityFailure: Error | undefined;
  operation.guard(() => {
    const sessions = tx.objectStore('sessions'), chunks = tx.objectStore('chunks');
    const get = sessions.get(clean.id);
    get.onsuccess = operation.guard(() => {
      const previous = cleanFullSummary(get.result);
      if (!previous && index > 0) { integrityFailure = new Error('diagnostic_history_missing'); tx.abort(); return; }
      const expected = previous?.chunks ?? 0;
      const lastSeq = previous?.lastSeq ?? 0;
      if (expected !== index || records[0].seq !== lastSeq + 1 || records.some((r, i) => r.seq !== lastSeq + i + 1)
        || clean.lastSeq !== records.at(-1)!.seq || clean.count !== clean.lastSeq || clean.chunks !== index + 1) {
        integrityFailure = new Error('diagnostic_sequence_conflict'); tx.abort(); return;
      }
      chunks.add({ session: clean.id, index, records: records.map(cleanFullRecord) });
      sessions.put(clean);
      if (index === 0) {
        const all = sessions.getAll();
        all.onsuccess = operation.guard(() => {
          const stale = all.result.map(cleanFullSummary).filter((s): s is FullSessionSummary => !!s)
            .sort((a, b) => b.startedAt - a.startedAt || b.id.localeCompare(a.id)).slice(limits.sessions);
          for (const old of stale) {
            sessions.delete(old.id);
            const cursor = chunks.index('session').openKeyCursor(old.id);
            cursor.onsuccess = operation.guard(() => { const row = cursor.result; if (row) { chunks.delete(row.primaryKey); row.continue(); } });
          }
        });
      }
    });
  })();
  try { await operation.completion; } catch (error) { throw integrityFailure ?? error; }
  return { ...clean, durability: tx.durability ?? 'default' };
}
export function readFullSessionStatus(host: FullSessionHost) {
  try {
    const raw = host.localStorage?.getItem(FULL_SESSION_STATUS_KEY);
    if (!raw || raw.length > 2048) return null;
    const value = JSON.parse(raw);
    const result: Record<string, unknown> = {};
    if (['starting','recording','closed','limited','storage-error'].includes(value.state)) result.state = value.state;
    if (typeof value.id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value.id)) result.id = value.id;
    for (const key of ['lastCommittedSeq','lastObservedSeq','at','queuePeak','serializeMaxMs','commitWaitMaxMs',
      'markerWrites','markerWriteMaxMs','markerWriteTotalMs'])
      if (typeof value[key] === 'number' && Number.isFinite(value[key]) && value[key] >= 0) result[key] = value[key];
    if (['duration-limit','record-limit','byte-limit','queue-limit','storage-error'].includes(value.stopReason)) result.stopReason = value.stopReason;
    if (FULL_SESSION_STORAGE_FAILURE_CODES.includes(value.storageFailureCode)) result.storageFailureCode = value.storageFailureCode;
    // The synchronous breadcrumb is an observation, never proof of an IDB commit.
    const observed = cleanFullRecord(value.lastObserved);
    if (observed) result.lastObserved = observed;
    const graphics = cleanFullRecord(value.lastGraphics);
    if (graphics?.kind === 'boundary' && graphics.data.operation === 'hull-plan-progress' && graphics.data.step)
      result.lastGraphics = graphics;
    return result;
  } catch { return null; }
}
export async function readFullSessionSummaries(host: FullSessionHost) {
  const status = readFullSessionStatus(host);
  try {
    const db = await database(host), tx = transaction(db, false), operation = done(tx);
    let sessions: FullSessionSummary[] = [];
    operation.guard(() => {
      const request = tx.objectStore('sessions').getAll();
      request.onsuccess = operation.guard(() => { sessions = request.result.map(cleanFullSummary).filter((s): s is FullSessionSummary => !!s)
        .sort((a, b) => b.startedAt - a.startedAt || b.id.localeCompare(a.id)).slice(0, limits.sessions); });
    })();
    await operation.completion;
    return { storage: 'available', sessions, status, limits: fullSessionLimitsText };
  } catch { return { storage: 'unavailable-or-failed', sessions: [], status, limits: fullSessionLimitsText }; }
}
// Owner verification belongs to the calling Admin action, before obtaining host.
// Read/export runs outside combat; chunks are streamed into Blob parts, not a giant UI textarea.
export async function exportFullSession(host: FullSessionHost, id: string) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error('invalid_diagnostic_id');
  await settleFullSessionWrites();
  const db = await database(host), tx = transaction(db, false), operation = done(tx);
  const parts: BlobPart[] = [], errors: string[] = [];
  let summary: FullSessionSummary | null = null, sequence = 0, chunkIndex = 0, bytes = 0;
  operation.guard(() => {
    const get = tx.objectStore('sessions').get(id);
    get.onsuccess = operation.guard(() => {
      summary = cleanFullSummary(get.result);
      if (!summary) { errors.push('missing-summary'); return; }
      parts.push(JSON.stringify({ version: 1, format: 'cryptoid-full-session-report', summary,
        storageStatus: readFullSessionStatus(host), limits: fullSessionLimitsText }).slice(0, -1) + ',"records":[');
      const cursor = tx.objectStore('chunks').index('session').openCursor(id);
      cursor.onsuccess = operation.guard(() => {
        const row = cursor.result;
        if (row) {
          const value = row.value;
          if (chunkIndex >= limits.records || !Number.isSafeInteger(value.index) || !Array.isArray(value.records) || value.records.length > limits.chunkRecords) { tx.abort(); return; }
          const records = value.records.map(cleanFullRecord);
          if (records.some((r: FullRecord | null) => !r)) { tx.abort(); return; }
          const raw = JSON.stringify(records); bytes += raw.length * 2;
          if (bytes > limits.bytes) { tx.abort(); return; }
          if (value.index !== chunkIndex++) errors.push('chunk-gap');
          for (const record of records as FullRecord[]) {
            if (record.seq !== ++sequence) errors.push('sequence-gap');
            parts.push((sequence > 1 ? ',' : '') + JSON.stringify(record));
          }
          row.continue(); return;
        }
        if (sequence !== summary!.lastSeq || chunkIndex !== summary!.chunks) errors.push('summary-mismatch');
        parts.push('],"integrity":' + JSON.stringify({ contiguous: errors.length === 0, records: sequence, chunks: chunkIndex,
          errors: [...new Set(errors)] }) + '}');
      });
    });
  })();
  await operation.completion;
  if (!summary || !parts.length) throw new Error('diagnostic_capture_not_found');
  return new Blob(parts, { type: 'application/json' });
}
