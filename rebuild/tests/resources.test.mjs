import test from 'node:test';
import assert from 'node:assert/strict';
import { ResourcePool, ResourceBudgetExceeded, ResourceCancelled } from '../core/resources.ts';

function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
const turn = () => new Promise(resolve => setImmediate(resolve));
const pool = (limits = {}) => new ResourcePool({ maxBytes: 100, maxEntries: 3, parallel: 1, ...limits });

test('scenes share one pending decode; closing one cannot free another scene’s texture', async () => {
  const resources = pool(), one = resources.createScope(), two = resources.createScope(), pending = deferred();
  let decodes = 0, disposed = 0;
  const produce = () => { decodes++; return pending.promise; };
  const a = one.acquire('original-ship', 60, produce), b = two.acquire('original-ship', 60, produce);
  await turn();
  assert.equal(decodes, 1);
  pending.resolve({ value: 'texture', bytes: 40, dispose: () => disposed++ });
  const [la, lb] = await Promise.all([a, b]);
  one.close(); la.release();
  assert.equal(disposed, 0);
  assert.equal(lb.value, 'texture');
  two.close(); lb.release();
  assert.equal(disposed, 1);
  assert.equal(resources.stats().bytes, 0);
});

test('a late completion after scene close is disposed, never delivered', async () => {
  const resources = pool(), scope = resources.createScope(), pending = deferred();
  let disposed = 0, signal;
  const result = scope.acquire('boss', 90, token => { signal = token; return pending.promise; });
  const rejected = assert.rejects(result, ResourceCancelled);
  await turn(); scope.close();
  assert.equal(signal.aborted, true);
  assert.equal(resources.stats().bytes, 90);
  assert.equal(resources.stats().active, 1);
  pending.resolve({ value: 'late-boss', bytes: 90, dispose: () => disposed++ });
  await rejected; await turn();
  assert.equal(disposed, 1);
  assert.equal(resources.stats().bytes, 0);
  assert.equal(resources.stats().active, 0);
});

test('rapid scene changes cannot replace an in-flight reservation with unlimited decodes', async () => {
  const resources = pool(), scope = resources.createScope(), pending = deferred();
  const result = scope.acquire('old', 90, () => pending.promise);
  const rejected = assert.rejects(result, ResourceCancelled);
  await turn(); scope.close();
  let started = 0;
  for (let i = 0; i < 50; i++) {
    const next = resources.createScope();
    await assert.rejects(next.acquire(`new-${i}`, 90, async () => { started++; return {}; }), ResourceBudgetExceeded);
    next.close();
  }
  assert.equal(started, 0);
  pending.resolve({ value: 1, bytes: 90, dispose() {} });
  await rejected; await turn();
  assert.equal(resources.stats().entries, 0);
});

test('queued and same-turn canceled decodes never start', async () => {
  const resources = pool(), first = resources.createScope(), second = resources.createScope(), pending = deferred();
  let started = 0;
  const a = first.acquire('a', 40, () => pending.promise);
  const b = second.acquire('b', 40, async () => { started++; return { value: 2, bytes: 40, dispose() {} }; });
  const rejected = assert.rejects(b, ResourceCancelled);
  second.close(); await rejected;
  pending.resolve({ value: 1, bytes: 40, dispose() {} }); await a; first.close(); await turn();
  assert.equal(started, 0);
  const third = resources.createScope();
  const c = third.acquire('c', 40, async () => { started++; return {}; });
  const canceled = assert.rejects(c, ResourceCancelled); third.close(); await canceled;
  assert.equal(started, 0);
});

test('entry and byte limits reject before calling a producer; keys have stable reservations', async () => {
  const resources = pool({ maxEntries: 1 }), scope = resources.createScope();
  const lease = await scope.acquire('one', 70, async () => ({ value: 1, bytes: 30, dispose() {} }));
  let called = false;
  await assert.rejects(scope.acquire('two', 1, async () => { called = true; return {}; }), ResourceBudgetExceeded);
  await assert.rejects(scope.acquire('one', 50, async () => { called = true; return {}; }), TypeError);
  assert.equal(called, false);
  lease.release(); scope.close();
});

test('producer failure releases its reservation and a deliberate retry can succeed', async () => {
  const resources = pool(), scope = resources.createScope();
  await assert.rejects(scope.acquire('broken', 80, async () => { throw new Error('decode failed'); }), /decode failed/);
  assert.equal(resources.stats().bytes, 0);
  const lease = await scope.acquire('broken', 80, async () => ({ value: 'retry', bytes: 80, dispose() {} }));
  assert.equal(lease.value, 'retry'); scope.close();
});

test('a producer exceeding its reservation is retired before admission', async () => {
  const resources = pool(), scope = resources.createScope(); let disposed = 0;
  await assert.rejects(scope.acquire('oversized', 20, async () => ({ value: 1, bytes: 80, dispose: () => disposed++ })), ResourceBudgetExceeded);
  assert.equal(disposed, 1); assert.equal(resources.stats().bytes, 0); scope.close();
});

test('failed cleanup remains charged and is never repeatedly invoked', async () => {
  const resources = pool(), scope = resources.createScope(); let attempts = 0;
  const lease = await scope.acquire('owned', 90, async () => ({ value: 1, bytes: 90, dispose() { attempts++; throw new Error('cleanup failed'); } }));
  lease.release(); lease.release(); scope.close(); resources.close();
  assert.equal(attempts, 1);
  assert.equal(resources.stats().disposalFailures, 1);
  assert.equal(resources.stats().bytes, 90);
});

test('malformed producer results settle instead of hanging or creating an unhandled rejection', async () => {
  const resources = pool(), scope = resources.createScope();
  await assert.rejects(scope.acquire('malformed', 90, async () => null), /owned resource/);
  assert.equal(resources.stats().bytes, 90);
  assert.equal(resources.stats().disposalFailures, 1); scope.close();
});

test('app close invalidates every scope and retires a late in-flight result once', async () => {
  const resources = pool(), a = resources.createScope(), b = resources.createScope(), pending = deferred(); let disposed = 0;
  const result = a.acquire('a', 40, () => pending.promise);
  const rejected = assert.rejects(result, ResourceCancelled);
  const queued = b.acquire('b', 40, async () => { throw new Error('must not start'); });
  const rejectedQueued = assert.rejects(queued, ResourceCancelled);
  await turn(); resources.close();
  pending.resolve({ value: 1, bytes: 40, dispose: () => disposed++ });
  await Promise.all([rejected, rejectedQueued]); await turn();
  assert.equal(disposed, 1);
  assert.equal(resources.stats().scopes, 0);
  assert.equal(resources.stats().bytes, 0);
  assert.throws(() => resources.createScope(), ResourceCancelled);
});
