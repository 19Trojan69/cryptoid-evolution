import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanHeapUsage, startChromiumHeapSampler } from './chromiumHeap.mjs';
test('heap evidence includes numeric counters only, excluding values, object IDs and URLs', () => {
  assert.deepEqual(cleanHeapUsage({ usedSize: 12, totalSize: 20, backingStorageSize: 4, embedderHeapUsedSize: NaN,
    objectId: 'private', url: 'private', values: ['private'] }), { usedSize: 12, totalSize: 20, backingStorageSize: 4 });
  assert.equal(cleanHeapUsage({ usedSize: Infinity, totalSize: 20 }), null);
});
test('slow renderer queries cannot accumulate, and stop removes the Node timer/session', async () => {
  let tick, clear = 0, detach = 0, calls = 0, answer;
  const timers = { setInterval(callback) { tick = callback; return { unref() {} }; }, clearInterval() { clear++; } };
  const rows = [];
  const stop = startChromiumHeapSampler({ send: async () => { calls++; return new Promise(resolve => { answer = resolve; }); },
    detach: async () => { detach++; answer({ usedSize: 1, totalSize: 2 }); } }, row => rows.push(row), timers);
  await Promise.resolve(); tick(); tick();
  assert.equal(calls, 1);
  const stats = await stop(); tick();
  assert.equal(clear, 1); assert.equal(detach, 1); assert.equal(stats.skipped, 2); assert.equal(rows.length, 0);
});
