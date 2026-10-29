import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory, IDBObjectStore, forceCloseDatabase } from 'fake-indexeddb';
import axios from 'axios';
import { readFileSync } from 'node:fs';
import { assertObservationOnly } from '../../scripts/fullSessionScope.mjs';
import { createFullSessionRecorder } from './fullSessionRecorder.ts';
import { appendFullSessionChunk, exportFullSession, readFullSessionSummaries, settleFullSessionWrites } from './fullSessionStore.ts';
import { cleanFullData, cleanFullRecord, FULL_SESSION_DB, FULL_SESSION_LIMITS, FULL_SESSION_STATUS_KEY } from './fullSessionFormat.ts';
import { readOwnerStabilityReport, exportOwnerFullSession } from './stabilityReport.mjs';
import { createOwnerFlightRecorder } from './ownerFlightRecorder.ts';
import { observeSessionDiagnostics, sessionDiagnostic, sessionDiagnosticsActive } from '../lib/sessionDiagnosticEvents.ts';
import { installSessionRequestDiagnostics } from '../lib/sessionRequestDiagnostics.ts';

const build = { sourceCommit: 'a'.repeat(40), sourceTree: 'b'.repeat(40), workingTreeDirty: true };
test('scope guard accepts only reviewed observations and rejects gameplay or hidden argument mutations', () => {
  assertObservationOnly();
  const source = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
  const changed = source.replace('state.section = next.section;', 'state.section = next.section + 1;');
  assert.notEqual(changed, source);
  assert.throws(() => assertObservationOnly({ 'src/pages/GamePage.tsx': changed }), /only exact observation/);
  const hidden = source.replace("operation: 'transition-before', sector: state.sector,", "operation: 'transition-before', sector: ++state.sector,");
  assert.notEqual(hidden, source);
  assert.throws(() => assertObservationOnly({ 'src/pages/GamePage.tsx': hidden }), /one exact diagnostic addition/);
  const save = readFileSync(new URL('../lib/accountSave.ts', import.meta.url), 'utf8');
  const unbounded = save.replace('if (attempt >= 2 ||', 'if (attempt >= 200 ||');
  assert.notEqual(unbounded, save);
  assert.throws(() => assertObservationOnly({ 'src/lib/accountSave.ts': unbounded }), /only exact observation/);
});
function fixture(platform = 'android') {
  let clock = 0, wall = 1_790_000_000_000;
  const values = new Map(), host = { indexedDB: new IDBFactory(),
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
    navigator: { userAgent: platform === 'android' ? 'Android PiBrowser secret-device' : 'iPhone Safari secret-device' },
    innerWidth: 430, innerHeight: 825, devicePixelRatio: 3 };
  host.sessionStorage = { ...host.localStorage, removeItem: key => values.delete(key) };
  const options = { build, now: () => clock, wallNow: () => wall,
    fullContext: () => ({ sector: 33, weaponLevel: 3, weaponSource: 'paid', paidWeaponMs: 10000,
      username: 'private-owner', token: 'private-token' }) };
  const recorder = () => createFullSessionRecorder(true, () => host, options);
  return { host, options, values, recorder, advance(ms) { clock += ms; wall += ms; }, clock: () => clock };
}
const sample = (sector, atMs = 0) => ({ sector, phase: 'FORMATION', encounter: 'normal', status: 'playing',
  atMs, frames: 120, frameMaxMs: 20, simulationP95Ms: 1, username: 'private-owner', payload: 'private-payload' });
const phase = sector => ({ kind: 'phase-start', sector, phase: 'SECTOR_INTRO', encounter: sector % 10 ? 'normal' : 'boss-intro', status: 'playing' });
async function captures(f) { await settleFullSessionWrites(); return (await readFullSessionSummaries(f.host)).sessions; }
async function contents(f, id) { return JSON.parse(await (await exportFullSession(f.host, id)).text()); }

test('verified navigation evidence round-trips through IndexedDB and listeners retire on finish', async () => {
  const f = fixture(), events = new EventTarget();
  f.host.addEventListener = events.addEventListener.bind(events);
  f.host.removeEventListener = events.removeEventListener.bind(events);
  const recorder = f.recorder(); recorder.start();
  const event = new Event('popstate');
  Object.defineProperty(event, 'state', { get() { throw Error('private state must not be read'); } });
  events.dispatchEvent(event);
  recorder.sample(sample(20)); recorder.finish();
  const [summary] = await captures(f), data = await contents(f, summary.id);
  assert.deepEqual(data.records.filter(r => r.kind === 'input').map(r => r.data), [{ operation: 'navigation', navigation: 'popstate' }]);
  const sequence = recorder.stats().sequence;
  events.dispatchEvent(new Event('hashchange'));
  assert.equal(recorder.stats().sequence, sequence); assert.equal(sessionDiagnosticsActive(), false);
});

test('non-owner creation, reading and download never obtain a storage host', async () => {
  let touched = 0; const forbidden = () => { touched++; throw Error('private host'); };
  assert.equal(createFullSessionRecorder(false, forbidden, { build }), null);
  await assert.rejects(readOwnerStabilityReport(async () => ({ canAdmin: false }), forbidden), /owner_access_required/);
  await assert.rejects(exportOwnerFullSession(async () => ({ canAdmin: false }), forbidden, 'run-1'), /owner_access_required/);
  assert.equal(await exportOwnerFullSession(async () => ({ canAdmin: true }), forbidden, 'run-1', () => false), null);
  assert.equal(touched, 0); assert.equal(sessionDiagnosticsActive(), false);
});
test('secondary-contact evidence round-trips through the full local report without raw inputs', async () => {
  const f = fixture(), recorder = f.recorder(); recorder.start();
  sessionDiagnostic('input', { operation: 'contact-state', event: 'touchstart', target: 'field',
    trackedPointers: 2, reportedTouches: 2, inputSource: 'touch', playing: true, steeringActive: false,
    truncated: false, suppressed: 0, pointerId: 907, clientX: 444, pressure: .6, token: 'private-token' });
  recorder.finish();
  const [summary] = await captures(f), data = await contents(f, summary.id);
  assert.equal(data.integrity.contiguous, true);
  assert.deepEqual(data.records.filter(r => r.kind === 'input').map(r => r.data), [{
    operation: 'contact-state', event: 'touchstart', target: 'field', inputSource: 'touch',
    trackedPointers: 2, reportedTouches: 2, suppressed: 0, steeringActive: false, playing: true, truncated: false }]);
  assert.ok(!JSON.stringify(data).includes('private-token')); assert.ok(!JSON.stringify(data).includes('pointerId'));
});
test('a whole 500-stage timeline retains its start and all intermediate phases beyond the old rolling window', async () => {
  const f = fixture(), recorder = f.recorder(); recorder.start();
  for (let sector = 1; sector <= 500; sector++) {
    recorder.event(phase(sector));
    sessionDiagnostic('boundary', { operation: 'transition-reset-done', sector, username: 'private-owner' });
    recorder.sample(sample(sector, f.clock())); f.advance(10_000);
    if (sector % 4 === 0) await settleFullSessionWrites();
  }
  recorder.finish();
  const [summary] = await captures(f), data = await contents(f, summary.id);
  assert.equal(summary.state, 'closed'); assert.equal(data.integrity.contiguous, true);
  assert.equal(data.records[0].kind, 'start'); assert.equal(data.records.at(-1).kind, 'end');
  const stages = data.records.filter(r => r.kind === 'event' && r.data.kind === 'phase-start').map(r => r.data.sector);
  assert.deepEqual(stages, Array.from({ length: 500 }, (_, i) => i + 1));
  assert.ok(summary.lastAt - summary.startedAt > 60 * 60_000);
  assert.ok(recorder.stats().queuePeak <= FULL_SESSION_LIMITS.queueRecords);
  assert.ok(!JSON.stringify(data).includes('private-')); assert.ok(!JSON.stringify(data).includes('secret-device'));
  assert.equal(summary.device.platform, 'android'); assert.equal(summary.device.browser, 'pi-browser');
  assert.equal(sessionDiagnosticsActive(), false);
});
test('a replacement document recovers the committed run without unload or recorder finish', async () => {
  const f = fixture('ios'), recorder = f.recorder(); recorder.start(); recorder.sample(sample(33));
  sessionDiagnostic('boundary', { operation: 'first-spawn-before', sector: 34 });
  await settleFullSessionWrites();
  // Only the browser database/marker are available to a newly created reader.
  const host = { indexedDB: f.host.indexedDB, localStorage: f.host.localStorage };
  const report = await readOwnerStabilityReport(async () => ({ canAdmin: true }), () => host);
  const summary = report.fullSessionRecording.sessions[0];
  assert.equal(report.version, 7); assert.equal(summary.state, 'recording');
  const data = JSON.parse(await (await exportOwnerFullSession(async () => ({ canAdmin: true }), () => host, summary.id)).text());
  assert.equal(data.integrity.contiguous, true);
  assert.ok(data.records.some(r => r.data.operation === 'first-spawn-before' && r.data.sector === 34));
  assert.equal(summary.device.platform, 'ios'); recorder.finish(); await settleFullSessionWrites();
});
test('two runs survive and StrictMode/empty loading does not overwrite them; only a third real run retires the oldest', async () => {
  const f = fixture(), ids = [];
  for (let run = 0; run < 2; run++) {
    const recorder = f.recorder(); recorder.start(); recorder.sample(sample(run + 1)); recorder.finish();
    ids.unshift((await captures(f))[0].id); f.advance(1000);
  }
  const empty = f.recorder(); empty.finish();
  assert.deepEqual((await captures(f)).map(s => s.id), ids);
  const third = f.recorder(); third.start(); third.sample(sample(34)); third.finish();
  const retained = await captures(f);
  assert.equal(retained.length, 2); assert.ok(retained.some(s => s.id === ids[0]));
  assert.ok(!retained.some(s => s.id === ids[1]));
  await assert.rejects(exportFullSession(f.host, ids[1]), /not_found/);
});
test('chunk and summary are atomic; an aborted write cannot erase or invent committed evidence', async () => {
  const f = fixture(), recorder = f.recorder(); recorder.start(); recorder.sample(sample(33));
  const [before] = await captures(f), original = IDBObjectStore.prototype.put;
  try {
    IDBObjectStore.prototype.put = function (...args) { const request = original.apply(this, args);
      if (this.name === 'sessions') this.transaction.abort(); return request; };
    recorder.sample(sample(34)); await settleFullSessionWrites();
  } finally { IDBObjectStore.prototype.put = original; }
  const [after] = await captures(f);
  assert.equal(after.lastSeq, before.lastSeq); assert.equal(after.chunks, before.chunks);
  assert.equal(recorder.stats().failed, true);
  assert.equal(JSON.parse(f.values.get(FULL_SESSION_STATUS_KEY)).state, 'storage-error');
  assert.equal((await contents(f, before.id)).integrity.contiguous, true);
  assert.equal(sessionDiagnosticsActive(), false);
});
test('sequence conflicts abort without partially adding a chunk', async () => {
  const f = fixture(), recorder = f.recorder(); recorder.start(); const [summary] = await captures(f);
  const bad = { seq: summary.lastSeq + 2, at: summary.lastAt, clockMs: 0, kind: 'end', data: {} };
  await assert.rejects(appendFullSessionChunk(f.host, { ...summary, count: bad.seq, lastSeq: bad.seq,
    chunks: summary.chunks + 1 }, summary.chunks, [bad]));
  assert.equal((await captures(f))[0].lastSeq, summary.lastSeq);
  recorder.finish(); await settleFullSessionWrites();
});
test('denied storage cannot throw into gameplay; report declares the failure', async () => {
  const f = fixture(); Object.defineProperty(f.host, 'indexedDB', { get() { throw new Error('SecurityError secret'); } });
  const recorder = f.recorder();
  assert.doesNotThrow(() => { recorder.start(); recorder.sample(sample(2)); });
  await settleFullSessionWrites();
  assert.equal(recorder.stats().failed, true);
  const report = await readFullSessionSummaries(f.host);
  assert.equal(report.storage, 'unavailable-or-failed'); assert.equal(report.status.state, 'storage-error');
  assert.ok(!JSON.stringify(report).includes('secret')); assert.equal(sessionDiagnosticsActive(), false);
});
test('a blocked writer has bounded RAM and stops explicitly instead of silently dropping the start', async () => {
  const f = fixture(), recorder = f.recorder(); recorder.start();
  for (let i = 0; i < 1000; i++) sessionDiagnostic('request', { operation: 'start', request: i });
  assert.ok(recorder.stats().queued <= FULL_SESSION_LIMITS.queueRecords);
  assert.ok(recorder.stats().queueBytes <= FULL_SESSION_LIMITS.queueBytes);
  assert.equal(recorder.stats().stopped, true);
  const [summary] = await captures(f);
  assert.equal(summary.state, 'limited'); assert.equal(summary.stopReason, 'queue-limit');
  const data = await contents(f, summary.id);
  assert.equal(data.records[0].kind, 'start'); assert.equal(data.integrity.contiguous, true);
});
test('duration limit closes capture explicitly without truncating prior committed data', async () => {
  const f = fixture(), recorder = f.recorder(); recorder.start(); recorder.sample(sample(1)); await settleFullSessionWrites();
  f.advance(FULL_SESSION_LIMITS.durationMs + 1); recorder.sample(sample(500));
  const [summary] = await captures(f);
  assert.equal(summary.stopReason, 'duration-limit'); assert.equal(summary.state, 'limited');
  assert.equal((await contents(f, summary.id)).records[0].kind, 'start');
});
test('byte and record limits retain a contiguous beginning and declare their stopping reason', async () => {
  const original = { bytes: FULL_SESSION_LIMITS.bytes, records: FULL_SESSION_LIMITS.records };
  try {
    for (const [limit, value, reason] of [['bytes', 12_000, 'byte-limit'], ['records', 15, 'record-limit']]) {
      Object.assign(FULL_SESSION_LIMITS, original, { [limit]: value });
      const f = fixture(), recorder = f.recorder(); recorder.start();
      for (let i = 1; i < 100 && !recorder.stats().stopped; i++) {
        recorder.sample(sample(i, f.clock())); f.advance(2100); await settleFullSessionWrites();
      }
      const [summary] = await captures(f), data = await contents(f, summary.id);
      assert.equal(summary.state, 'limited'); assert.equal(summary.stopReason, reason);
      assert.ok(summary.bytes <= FULL_SESSION_LIMITS.bytes); assert.ok(summary.count <= FULL_SESSION_LIMITS.records);
      assert.equal(data.integrity.contiguous, true); assert.equal(data.records[0].kind, 'start');
      assert.equal(data.records.at(-1).kind, 'end');
    }
  } finally { Object.assign(FULL_SESSION_LIMITS, original); }
});
test('legacy/Mainnet report path never opens the full-session database or marker', async () => {
  let extraReads = 0;
  const host = { localStorage: { getItem(key) { if (key === FULL_SESSION_STATUS_KEY) extraReads++; return null; } } };
  Object.defineProperty(host, 'indexedDB', { get() { extraReads++; throw Error('unexpected database read'); } });
  const report = await readOwnerStabilityReport(async () => ({ canAdmin: true }), () => host, () => true, Date.now(), false);
  assert.equal(report.version, 5); assert.equal(report.fullSessionRecording, undefined); assert.equal(extraReads, 0);
});
test('request observer preserves actual Axios success/error identity and excludes private request/response data', async () => {
  const signals = [], stop = observeSessionDiagnostics((kind, details) => signals.push({ kind, details }));
  const throwing = observeSessionDiagnostics(() => { throw Error('observer'); });
  const secret = { token: 'private-token', uid: 'private-owner' }, failure = new Error('private-message');
  const client = axios.create({ adapter: async config => {
    if (config.url === '/hangar/weapon/activate') { failure.config = config; failure.response = { status: 503 }; throw failure; }
    return { data: secret, status: 200, statusText: 'OK', headers: { authorization: 'private-header' }, config };
  } });
  installSessionRequestDiagnostics(client);
  try {
    const response = await client.post('/progress/checkpoint', secret);
    assert.equal(response.data, secret);
    await assert.rejects(client.post('/hangar/weapon/activate', secret), error => error === failure);
    assert.equal(signals.filter(s => s.details.operation === 'start').length, 2);
    assert.ok(signals.some(s => s.details.endpoint === 'weapon' && s.details.httpStatus === 503));
    assert.ok(!JSON.stringify(signals).includes('private-'));
  } finally { throwing(); stop(); }
});
test('schema strips private content, raw URLs/stacks, unknown kinds and poisoned records', () => {
  const dirty = { operation: 'first-spawn-before', sector: 34, uid: 'private-owner', wallet: 'private-wallet',
    url: 'https://private.example/?token=secret', headers: { authorization: 'secret' }, stack: 'secret', message: 'secret' };
  assert.deepEqual(cleanFullData('boundary', dirty), { sector: 34, operation: 'first-spawn-before' });
  assert.equal(cleanFullRecord({ seq: Infinity, at: 1, clockMs: 1, kind: 'sample', data: {} }), null);
  assert.equal(cleanFullRecord({ seq: 1, at: 1, clockMs: 1, kind: 'raw-http-body', data: dirty }), null);
});
test('real rolling-probe integration streams samples/phase/work data throughout play', async () => {
  const f = fixture(), probe = createOwnerFlightRecorder(true, () => f.host, { ...f.options, runtime: () => ({ domNodes: 480 }) });
  const context = { sector: 1, flight: 0, phase: 'FORMATION', encounter: 'normal', status: 'playing',
    enemies: 6, attackers: 0, returning: 0, playerShots: 2, enemyShots: 0, effects: 0, rocks: 0, rockEffects: 0, pickups: 0 };
  f.advance(1);
  for (let i = 0; i < 100; i++) {
    probe.begin(f.clock(), { ...context, sector: i + 1 }); f.advance(1); probe.mark('transitions'); probe.end(f.clock());
    f.advance(2100); await settleFullSessionWrites();
  }
  probe.finish(); const [summary] = await captures(f), data = await contents(f, summary.id);
  assert.ok(data.records.filter(r => r.kind === 'sample').length > 30);
  assert.ok(data.records.some(r => r.kind === 'sample' && r.data.sector === 1));
  assert.ok(data.records.some(r => r.kind === 'sample' && r.data.work.transitions?.count > 0));
  assert.ok(data.records.some(r => r.data.weaponLevel === 3)); assert.equal(data.integrity.contiguous, true);
});

test('an abnormally closed cached database reopens for the next read and write after a long pause', async () => {
  const f = fixture(), opened = [], factory = f.host.indexedDB, original = factory.open.bind(factory);
  factory.open = (...args) => { const request = original(...args);
    request.addEventListener('success', () => opened.push(request.result)); return request; };
  const recorder = f.recorder(); recorder.start(); recorder.sample(sample(50));
  try {
    const [before] = await captures(f);
    f.advance(15 * 60_000);
    const closed = new Promise(resolve => opened[0].addEventListener('close', resolve, { once: true }));
    forceCloseDatabase(opened[0]); await closed;
    const report = await readFullSessionSummaries(f.host);
    assert.equal(report.storage, 'available'); assert.equal(report.sessions[0].id, before.id);
    recorder.sample(sample(51)); await settleFullSessionWrites();
    assert.equal(recorder.stats().failed, false);
    const data = await contents(f, before.id);
    assert.equal(data.integrity.contiguous, true);
    assert.ok(data.records.some(r => r.kind === 'sample' && r.data.sector === 51));
    assert.equal(opened.length, 2, 'only one fresh connection is opened');
  } finally { recorder.finish(); await settleFullSessionWrites(); }
});

test('storage loss during a run stops the capture without inventing its missing committed beginning', async () => {
  const f = fixture(), recorder = f.recorder(); recorder.start(); recorder.sample(sample(50));
  const [before] = await captures(f);
  const db = await new Promise((resolve, reject) => {
    const request = f.host.indexedDB.open(FULL_SESSION_DB, 1);
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  try {
    const tx = db.transaction(['sessions', 'chunks'], 'readwrite');
    const cleared = new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onabort = () => reject(tx.error); });
    tx.objectStore('sessions').clear(); tx.objectStore('chunks').clear(); await cleared;
    recorder.event(phase(51)); await settleFullSessionWrites();
    const report = await readFullSessionSummaries(f.host);
    assert.equal(report.storage, 'available'); assert.deepEqual(report.sessions, []);
    assert.equal(report.status.state, 'storage-error');
    assert.equal(report.status.storageFailureCode, 'history-missing');
    assert.equal(report.status.lastCommittedSeq, before.lastSeq);
    assert.equal(recorder.stats().failed, true); assert.equal(recorder.stats().queued, 0);
    assert.equal(sessionDiagnosticsActive(), false);
  } finally { db.close(); recorder.finish(); await settleFullSessionWrites(); }
});

test('quota and denied storage have bounded failure categories without persisting raw exceptions', async () => {
  for (const [name, expected] of [['QuotaExceededError', 'quota-exceeded'], ['SecurityError', 'storage-denied'], ['InvalidStateError', 'connection-closed'], ['OtherError', 'unknown']]) {
    const f = fixture(); f.host.indexedDB = { open() { throw new DOMException('private-token-and-url', name); } };
    const recorder = f.recorder(); recorder.start(); await settleFullSessionWrites();
    const status = JSON.parse(f.values.get(FULL_SESSION_STATUS_KEY));
    assert.equal(status.storageFailureCode, expected); assert.equal(status.state, 'storage-error');
    assert.ok(!JSON.stringify(status).includes('private-')); assert.equal(sessionDiagnosticsActive(), false);
  }
});

