import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { gunzipSync } from 'node:zlib';
import { startInactiveNativeCollector, boundaries } from './collector.mjs';
class Session extends EventEmitter {
  calls = []; detached = false; count = 0; loss = false; renderer = true; failDump = false;
  async send(method, params) {
    this.calls.push({ method, params });
    if (method === 'Tracing.requestMemoryDump') {
      const index = this.count++;
      this.emit('Tracing.dataCollected', { value: [
        ...Array.from({ length: 10001 }, () => ({ ph: 'X', name: 'irrelevant' })),
        { ph: 'M', name: 'process_name', pid: 17, args: { name: this.renderer ? 'Renderer' : 'Other' } },
        { ph: 'v', id: index.toString(16), ts: 100 + index, pid: 17, args: { dumps: { allocators: {
          malloc: { attrs: { size: { type: 'scalar', units: 'bytes', value: '100' } } },
          'malloc/partitions/allocator': { attrs: { size: { type: 'scalar', units: 'bytes', value: '10' },
            wasted: { type: 'scalar', units: 'bytes', value: 'fffffffffffff000' } } },
        } } } },
      ] });
      return { dumpGuid: '0x' + (index + 1).toString(16), success: !this.failDump };
    }
    if (method === 'Tracing.end') this.emit('Tracing.tracingComplete', { dataLossOccurred: this.loss });
    return {};
  }
  async detach() { this.detached = true; }
}
async function setup(session = new Session()) {
  const saved = [], guards = [];
  const collector = await startInactiveNativeCollector({ session,
    guard: async phase => { guards.push(phase); }, save: bytes => saved.push(bytes) });
  return { session, saved, guards, collector };
}
test('actual collector stays behind inactive gates, filters unrelated event bursts and associates explicit dumps chronologically', async () => {
  const s = await setup();
  for (const [label, phase] of boundaries) await s.collector.request(label, phase);
  const result = await s.collector.finish();
  assert.deepEqual(s.guards, ['paused', ...boundaries.flatMap(([, phase]) => [phase, phase])]);
  for (const call of s.session.calls.filter(row => row.method === 'Tracing.requestMemoryDump'))
    assert.deepEqual(call.params, { deterministic: false, levelOfDetail: 'detailed' });
  assert.equal(s.session.calls[0].params.traceConfig.excludedCategories[0], '*');
  assert.deepEqual(s.session.calls[0].params.traceConfig.memoryDumpConfig.triggers, []);
  assert.equal(result.trace.events, 8); assert.equal(result.checkpoints.length, 4);
  assert.deepEqual(result.checkpoints.map(row => row.traceDumpId), ['0', '1', '2', '3']);
  assert.equal(result.checkpoints[0].processes[0].categories.malloc, 256);
  assert.equal(result.checkpoints[0].processes[0].categories.skia, null, 'Missing category is not zero');
  assert.equal(result.checkpoints[0].processes[0].outsideSafeIntegerRange[0].attributes.wasted.rawHex, '0xfffffffffffff000');
  assert.equal(JSON.parse(gunzipSync(s.saved[0])).traceEvents.length, 8);
  assert.equal(s.session.listenerCount('Tracing.dataCollected'), 0); assert.equal(s.session.detached, true);
});
test('an active page cannot start tracing or request a dump, and an abort still retires listeners/session', async () => {
  const session = new Session();
  await assert.rejects(startInactiveNativeCollector({ session, guard: async () => { throw Error('playing'); }, save() {} }));
  assert.equal(session.calls.length, 0);
  let active = false, saved = false;
  const c = await startInactiveNativeCollector({ session,
    guard: async () => { if (active) throw Error('playing'); }, save: () => { saved = true; } });
  active = true; await assert.rejects(c.request(...boundaries[0]));
  assert.equal(session.calls.filter(x => x.method === 'Tracing.requestMemoryDump').length, 0);
  await c.abort(); assert.equal(saved, true); assert.equal(session.detached, true);
});
test('loss, absent renderer allocation data and incomplete boundaries preserve raw evidence but cannot pass', async () => {
  for (const mode of ['loss', 'renderer', 'incomplete']) {
    const s = await setup();
    if (mode === 'loss') s.session.loss = true;
    if (mode === 'renderer') s.session.renderer = false;
    for (const [label, phase] of boundaries.slice(0, mode === 'incomplete' ? 1 : 4)) await s.collector.request(label, phase);
    await assert.rejects(s.collector.finish()); assert.equal(s.saved.length, 1);
    assert.equal(s.session.detached, true); assert.equal(s.collector.finished, true);
  }
});
test('a failed global dump cannot be recorded as zero native memory or a successful capture', async () => {
  const s = await setup(); s.session.failDump = true;
  await assert.rejects(s.collector.request(...boundaries[0]));
  await assert.rejects(s.collector.finish()); assert.equal(s.saved.length, 1); assert.equal(s.session.detached, true);
});
