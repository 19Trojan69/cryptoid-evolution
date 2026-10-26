import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCrashTail, readCrashTails, CRASH_TAIL_PREFIX, CRASH_TAIL_LIMITS } from './crashTail.ts';
import { requestErrorCode, providerRequestId } from '../lib/requestDiagnosticCodes.ts';

const build = { sourceCommit: 'a'.repeat(40), sourceTree: 'b'.repeat(40), workingTreeDirty: false };
const playing = { sector: 90, phase: 'ATTACK_CYCLE', encounter: 'boss-fight', status: 'playing', enemies: 2, projectiles: 8 };
function fixture() {
  let clock = 0, wall = 1000000, count = 0;
  const local = new Map(), tab = new Map();
  const storage = values => ({ getItem: k => values.get(k) ?? null, setItem: (k, v) => { values.set(k, v); } });
  const host = { localStorage: storage(local), sessionStorage: storage(tab), performance: { timeOrigin: 999000 } };
  return { host, local, tab, advance(ms) { clock += ms; wall += ms; },
    create(id = `run-test-${++count}`) { return createCrashTail(true, () => host, { id, build, now: () => clock, wallNow: () => wall }); } };
}
test('non-owner creation never obtains a storage host and loading does not overwrite previous evidence', () => {
  assert.equal(createCrashTail(false, () => { throw Error('accessed'); }, {}), null);
  const f = fixture(), tail = f.create();
  tail.frame({ ...playing, status: 'loading' }); tail.finish();
  assert.equal(f.local.size, 0); assert.equal(f.tab.size, 0);
});
test('the last response and frame survive a fresh reader without an unload, finish or database callback', () => {
  const f = fixture(), tail = f.create(); tail.frame(playing);
  f.advance(250); tail.frame({ ...playing, liveTurrets: 2 });
  f.advance(17); tail.record('request', { operation: 'failure', endpoint: 'weapon', httpStatus: 409,
    errorCode: 'save_before_activation', providerRequestId: 'cdg1::sample-123' });
  const fresh = readCrashTails({ ...f.host });
  assert.equal(fresh.sessions[0].state, 'recording');
  assert.equal(fresh.sessions[0].head.at, 1000267);
  assert.equal(fresh.sessions[0].head.data.liveTurrets, 2);
  assert.equal(fresh.sessions[0].errors[0].data.errorCode, 'save_before_activation');
  assert.equal(fresh.sessions[0].errors[0].data.providerRequestId, 'cdg1::sample-123');
  assert.equal(fresh.sessions[0].limits.finalUnwrittenIntervalCanBeLost, true);
});
test('head and independent frame history retain quarter-second snapshots', () => {
  const f = fixture(), tail = f.create();
  for (let i = 0; i < 400; i++) { tail.frame(playing); f.advance(16); }
  const capture = readCrashTails(f.host).sessions[0];
  assert.ok(capture.frames.length >= 24 && capture.frames.length <= 26);
  assert.ok(capture.head.at >= 1006000);
  assert.ok(tail.stats().writes < 55);
});
test('graphics or request bursts cannot evict the independently retained last 128 frame snapshots', () => {
  const f = fixture(), tail = f.create();
  for (let i = 0; i < 180; i++) { tail.frame(playing); f.advance(250); }
  for (let i = 0; i < 10000; i++) tail.record('request', { operation: 'response', endpoint: 'checkpoint', request: i, httpStatus: 200 });
  const capture = readCrashTails(f.host).sessions[0];
  assert.equal(capture.frames.length, CRASH_TAIL_LIMITS.frames);
  assert.equal(capture.events.length, CRASH_TAIL_LIMITS.events);
  assert.equal(capture.frames[0].at, 1013000);
  assert.ok(f.local.size <= CRASH_TAIL_LIMITS.events + CRASH_TAIL_LIMITS.frames + 2);
  assert.ok([...f.local.values()].every(v => v.length <= CRASH_TAIL_LIMITS.eventChars));
});
test('two runs survive; a third retires only the oldest generation and an older writer cannot overwrite it', () => {
  const f = fixture(), a = f.create('run-a'); a.frame(playing); f.advance(100);
  const b = f.create('run-b'); b.frame(playing); f.advance(100);
  assert.deepEqual(readCrashTails(f.host).sessions.map(s => s.id), ['run-b', 'run-a']);
  const c = f.create('run-c'); c.frame(playing);
  const before = JSON.stringify([...f.local]);
  a.record('request', { operation: 'failure', endpoint: 'weapon', httpStatus: 500 }); a.finish();
  assert.equal(JSON.stringify([...f.local]), before);
  assert.deepEqual(readCrashTails(f.host).sessions.map(s => s.id), ['run-c', 'run-b']);
});
test('storage refusal is isolated, and the independent tab copy survives origin-storage failure', () => {
  const f = fixture(); f.host.localStorage = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } };
  const tail = f.create(); assert.doesNotThrow(() => tail.frame(playing));
  f.advance(100); tail.record('lifecycle', { signal: 'render-error', errorName: 'TypeError', ...playing });
  assert.ok(tail.stats().failures > 0);
  assert.equal(readCrashTails(f.host).sessions[0].errors[0].data.errorName, 'TypeError');
  f.host.sessionStorage.setItem = () => { throw Error('quota'); };
  assert.doesNotThrow(() => { tail.frame(playing); tail.finish(); });
});
test('read-only recovery never writes, rejects poisoned rows and labels a different-tab fallback', () => {
  const f = fixture(), tail = f.create('run-clean'); tail.frame(playing);
  tail.record('request', { operation: 'failure', httpStatus: 500, errorCode: 'PRIVATE', token: 'PRIVATE',
    message: 'PRIVATE', headers: { secret: 'PRIVATE' }, providerRequestId: 'https://PRIVATE' });
  const before = JSON.stringify([...f.local]);
  f.host.sessionStorage = { getItem() { return null; }, setItem() { throw Error('reader wrote'); } };
  const recovered = readCrashTails(f.host);
  assert.equal(recovered.sessions[0].evidenceSource, 'origin-fallback-may-be-another-tab');
  assert.doesNotMatch(JSON.stringify(recovered), /PRIVATE|token|secret/);
  assert.equal(JSON.stringify([...f.local]), before);
});
test('newer normal frames clear old boss-only fields instead of reporting stale reactor state', () => {
  const f = fixture(), tail = f.create();
  tail.frame({ ...playing, bossId: 9, bossHealth: 200 }); f.advance(1000);
  tail.frame({ sector: 91, phase: 'ENTRY', encounter: 'normal', status: 'playing', enemies: 1 });
  const head = readCrashTails(f.host).sessions[0].head;
  assert.equal(head.data.sector, 91); assert.equal(head.data.bossId, undefined);
});
test('normal finish is explicit and later callbacks cannot resurrect the closed tail', () => {
  const f = fixture(), tail = f.create(); tail.frame(playing); tail.finish();
  const before = JSON.stringify([...f.local]); f.advance(1000);
  tail.record('request', { operation: 'start' }); tail.frame(playing); tail.finish();
  assert.equal(readCrashTails(f.host).sessions[0].state, 'closed');
  assert.equal(JSON.stringify([...f.local]), before);
});
test('legacy frame metadata keeps its original cadence rather than inventing quarter-second history', () => {
  const f = fixture(), tail = f.create('run-legacy'); tail.frame(playing);
  for (const values of [f.local, f.tab]) {
    const key = `${CRASH_TAIL_PREFIX}0_meta`, meta = JSON.parse(values.get(key));
    delete meta.frameSlots; delete meta.frameIntervalMs; values.set(key, JSON.stringify(meta));
  }
  const capture = readCrashTails(f.host).sessions[0];
  assert.equal(capture.limits.frames, 32); assert.equal(capture.limits.frameIntervalMs, 1000);
});
test('only fixed public error codes and a bounded platform request ID can leave the response observer', () => {
  assert.equal(requestErrorCode({ error: 'save_before_activation', token: 'PRIVATE' }, 409), 'save_before_activation');
  assert.equal(requestErrorCode({ error: 'PRIVATE' }, 500), 'unknown-http-error');
  assert.equal(requestErrorCode('PRIVATE FUNCTION_INVOCATION_FAILED PRIVATE', 500), 'FUNCTION_INVOCATION_FAILED');
  assert.equal(requestErrorCode({ error: 'Invalid reward event' }, 400), 'invalid_reward_event');
  assert.equal(providerRequestId('cdg1:sfo1::abc-123'), 'cdg1:sfo1::abc-123');
  assert.equal(providerRequestId('https://PRIVATE?token=PRIVATE'), undefined);
  const source = readFileSync(new URL('./crashTail.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /setTimeout\s*\(|setInterval\s*\(|requestAnimationFrame\s*\(|fetch\s*\(/);
});
