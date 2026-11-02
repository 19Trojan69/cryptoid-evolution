import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { detailPlan, requireDetailTrigger, rendererPss, limits } from './policy.mjs';
import { classifyDetailed, unsignedScalar } from './classify.mjs';
import { captureActiveDetail } from './collector.mjs';
const memory = pssKiB => ({ available: true, contentProcessObserved: true,
  processes: [{ role: 'chromium-renderer', pssKiB }], summedPssKiB: pssKiB });
const trigger = mode => ({ mode, metric: 'chromium-renderer-pss', triggerKiB: mode === 'pressure' ? 832 * 1024 : 0,
  qualificationKiB: mode === 'pressure' ? 768 * 1024 : 0, activeMs: 60000, memory: memory(900 * 1024) });
const scalar = (value, units = 'bytes') => ({ type: 'scalar', units, value });
const type = id => `blink_objects/blink_gc/main/blink::ComputedStyle (0x${id})`;
const events = () => [
  { ph: 'M', name: 'process_name', pid: 5, args: { name: 'Renderer' } },
  { ph: 'v', id: '0', ts: 17, pid: 5, args: { dumps: { level_of_detail: 'detailed', allocators: {
    'blink_gc/main/heap': { attrs: { size: scalar('64000000'), allocated_objects_size: scalar('10000000'), fragmentation: scalar('4e', 'percent') } },
    [type('1')]: { attrs: { size: scalar('1000'), allocated_objects_size: scalar('1000'), object_count: scalar('a', 'objects') } },
    [type('2')]: { attrs: { size: scalar('2000'), object_count: scalar('b', 'objects') } },
    'blink_gc/main/heap/NormalPageSpace3/pages/page_0/types/blink::ComputedStyle (0x1)': {
      attrs: { allocated_objects_size: scalar('1000'), object_count: scalar('a', 'objects') } },
    'malloc/unsafe': { attrs: { unused: scalar('fffffffffffff000') } },
  } } } },
];
class Session extends EventEmitter {
  calls = []; detached = false; success = true; loss = false; detachFails = false; modify = value => value;
  async send(method, params) {
    this.calls.push({ method, params });
    if (method === 'Tracing.requestMemoryDump') {
      this.emit('Tracing.dataCollected', { value: this.modify([
        ...Array.from({ length: 10001 }, () => ({ ph: 'X', name: 'unrelated' })), ...events(),
      ]) }); return { success: this.success, dumpGuid: '0x1' };
    }
    if (method === 'Tracing.end') this.emit('Tracing.tracingComplete', { dataLossOccurred: this.loss });
    return {};
  }
  async detach() { this.detached = true; if (this.detachFails) throw Error('Synthetic detach fault'); }
}
async function collect(session = new Session(), opts = {}) {
  const saved = []; let frame = 100;
  const result = await captureActiveDetail({ session, trigger: trigger('pressure'),
    guard: async () => ({ gameStatus: 'playing', frameAt: frame += 10 }),
    sample: () => memory(900 * 1024), save: bytes => saved.push(bytes), ...opts });
  return { result, saved, session };
}
test('one active detailed request returns actual named global types and retires tracing, listeners and session', async () => {
  const s = await collect(); assert.equal(s.result.complete, true);
  assert.deepEqual(s.session.calls.find(c => c.method === 'Tracing.requestMemoryDump').params,
    { deterministic: false, levelOfDetail: 'detailed' });
  assert.equal(s.session.calls.filter(c => c.method === 'Tracing.requestMemoryDump').length, 1);
  assert.deepEqual(s.session.calls[0].params.traceConfig.memoryDumpConfig.triggers, []);
  assert.equal(s.session.calls[0].params.traceConfig.traceBufferSizeInKb, 16384);
  assert.equal(s.result.dump.processes[0].blinkHeap.bytes, 1677721600);
  assert.equal(s.result.dump.processes[0].reportedHeapFragmentation.value, 78);
  assert.equal(s.result.dump.processes[0].reportedHeapFragmentation.reportedUnits, 'percent');
  assert.equal(s.result.dump.processes[0].heapUnusedFractionPercentDerived, 84);
  assert.equal(s.result.trace.events, 2); assert.equal(JSON.parse(gunzipSync(s.saved[0])).traceEvents.length, 2);
  assert.equal(s.result.pressureMaintainedAtSampledBoundaries, true);
  assert.equal(s.result.tracingStopped, true); assert.equal(s.result.sessionDetached, true);
  assert.equal(s.session.listenerCount('Tracing.dataCollected'), 0); assert.equal(s.session.listenerCount('Tracing.tracingComplete'), 0);
});
test('global object counts are hexadecimal; identical names keep their unique native IDs without adding per-page duplicates', () => {
  const p = classifyDetailed(events(), [{ success: true, dumpGuid: '1' }]).processes[0];
  assert.equal(p.globalObjectTypes.length, 2); assert.deepEqual(p.globalObjectTypes.map(t => t.objectCount.value), [10, 11]);
  assert.deepEqual(p.globalObjectTypes.map(t => t.bytes), [4096, 8192]);
  assert.deepEqual(p.globalObjectTypes.map(t => t.typeId), ['0x1', '0x2']);
  assert.equal(p.categories.canvas, null); assert.equal(p.focusedGlobalObjectTypes.find(t => t.type === 'blink::ComputedStyle').rows.length, 2);
  assert.equal(p.outsideSafeIntegerRange[0].attributes.unused.rawHex, '0xfffffffffffff000');
  assert.equal(p.typeNamesAreNotAllocationStacksOrRetainerPaths, true);
  assert.deepEqual(unsignedScalar(scalar('fffffffffffff000', 'objects'), 'objects'),
    { value: null, rawHex: '0xfffffffffffff000', reason: 'outside-safe-integer-range' });
  assert.deepEqual(unsignedScalar(undefined, 'objects'), { value: null, reason: 'not-reported' });
  assert.throws(() => unsignedScalar(scalar('12', 'bytes'), 'objects'));
  assert.throws(() => unsignedScalar(scalar('not-hex', 'objects'), 'objects'));
});
test('a heap-only light export cannot masquerade as a successful detailed class capture', async () => {
  for (const mode of ['light', 'no-classes', 'unknown']) {
    const session = new Session();
    session.modify = rows => {
      const e = rows.find(e => e.ph === 'v');
      if (mode === 'light') e.args.dumps.level_of_detail = 'light';
      if (mode === 'no-classes') for (const key of Object.keys(e.args.dumps.allocators))
        if (key.startsWith('blink_objects/')) delete e.args.dumps.allocators[key];
      if (mode === 'unknown') for (const key of Object.keys(e.args.dumps.allocators)) if (key.startsWith('blink_objects/')) {
        e.args.dumps.allocators[key.replace('blink::ComputedStyle', 'Unknown')] = e.args.dumps.allocators[key]; delete e.args.dumps.allocators[key];
      }
      return rows;
    };
    const s = await collect(session); assert.equal(s.result.complete, false); assert.equal(s.saved.length, 1);
    assert.equal(s.result.sessionDetached, true);
  }
});
test('the reserve is a trigger requirement while the retained pressure boundary stays 768 MiB', async () => {
  const s = await collect(new Session(), { sample: () => memory(800 * 1024) });
  assert.equal(s.result.complete, true); assert.equal(s.result.pressureMaintainedAtSampledBoundaries, true);
  const dropped = await collect(new Session(), { sample: () => memory(767 * 1024) });
  assert.equal(dropped.result.complete, true); assert.equal(dropped.result.pressureMaintainedAtSampledBoundaries, false);
  const calibration = await collect(new Session(), { trigger: trigger('calibration') });
  assert.equal(calibration.result.complete, true); assert.equal(calibration.result.pressureMaintainedAtSampledBoundaries, false);
  const session = new Session(); await assert.rejects(collect(session, { trigger: { ...trigger('pressure'), memory: memory(831 * 1024) } }));
  assert.equal(session.calls.length, 0); assert.equal(session.detached, true);
});
test('rejected activity cannot start tracing and a post-dump pause, failed dump, data loss or budget overflow cannot pass', async () => {
  const before = new Session(); await assert.rejects(collect(before, { guard: async () => { throw Error('paused'); } }));
  assert.equal(before.calls.length, 0); assert.equal(before.detached, true);
  for (const which of ['pause', 'dump', 'loss', 'budget', 'byte-budget']) {
    const session = new Session(); let frame = 100, checks = 0;
    if (which === 'dump') session.success = false; if (which === 'loss') session.loss = true;
    if (which === 'budget') session.modify = rows => [...rows, ...Array.from({ length: limits.events }, () => events()[0])];
    if (which === 'byte-budget') session.modify = rows => [...rows, { ...events()[0], padding: 'x'.repeat(limits.rawBytes) }];
    const s = await collect(session, { guard: async () => {
      if (which === 'pause' && ++checks === 3) throw Error('technical-pause'); return { frameAt: frame += 10 };
    } });
    assert.equal(s.result.complete, false); assert.equal(s.saved.length, 1); assert.equal(s.result.sessionDetached, true);
    assert.equal(s.session.listenerCount('Tracing.dataCollected'), 0);
    if (which.includes('budget')) assert.equal(s.result.trace.collectorFault, 'native-event-or-byte-budget');
  }
});
test('failure to detach or actual game-frame progress cannot be hidden behind a complete payload', async () => {
  const session = new Session(); session.detachFails = true;
  const detach = await collect(session); assert.equal(detach.result.complete, false); assert.equal(detach.result.sessionDetached, false);
  const stalled = await collect(new Session(), { guard: async () => ({ frameAt: 100 }) });
  assert.equal(stalled.result.complete, false); assert.equal(stalled.saved.length, 1);
});
test('fixed detailed mode excludes previous treatments and rejects altered or early pressure policies', () => {
  const env = { CRYPTOID_ACTIVE_BLINK_DETAIL_MODE: 'pressure', CRYPTOID_SOAK_CONDITION: 'original', CRYPTOID_LIFETIME_ATTRIBUTION: '1' };
  const plan = detailPlan(env); assert.equal(plan.triggerKiB, 832 * 1024); assert.equal(plan.qualificationKiB, 768 * 1024);
  assert.equal(plan.levelOfDetail, 'detailed'); assert.equal(plan.maxActiveMs, 1200000);
  for (const patch of [{ CRYPTOID_ACTIVE_PRESSURE_MODE: 'pressure' }, { CRYPTOID_THRUST_SCOPE: 'leaf' },
    { CRYPTOID_STYLE_WRITE_PROBE: '0' }, { CRYPTOID_BLINK_DETAIL_REPLICA: '3' }, { CRYPTOID_SOAK_CONDITION: 'mini-start' }])
    assert.throws(() => detailPlan({ ...env, ...patch }));
  for (const patch of [{ activeMs: 59999 }, { qualificationKiB: 700 * 1024 }, { triggerKiB: 768 * 1024 }])
    assert.throws(() => requireDetailTrigger({ ...trigger('pressure'), ...patch }));
  assert.equal(rendererPss(memory(1)), 1);
});
test('the preserved original detailed Chromium dump independently validates native class/count parsing without a new game run', () => {
  const raw = JSON.parse(gunzipSync(readFileSync(new URL('../inactive-native-allocation-20261101/evidence/long-native-memory.json.gz', import.meta.url))));
  const memory = raw.traceEvents.filter(e => e.ph === 'v' && e.args?.dumps);
  const firstId = memory[0].id ?? memory[0].id2?.global;
  const selected = raw.traceEvents.filter(e => e.ph === 'M' || e.ph === 'v' && (e.id ?? e.id2?.global) === firstId);
  const d = classifyDetailed(selected, [{ success: true, dumpGuid: '1', label: 'preserved-inactive-fixture-only' }]);
  const renderer = d.processes.find(p => /renderer/i.test(p.processName) && p.globalObjectTypes.length);
  const hashTrie = renderer.globalObjectTypes.find(t => t.typeName === 'blink::HashTrieNode<blink::CSSVariableData>');
  assert.equal(hashTrie.bytes, 19405024); assert.equal(hashTrie.objectCount.value, 71342);
  assert.equal(renderer.reportedHeapFragmentation.reportedUnits, 'objects');
  assert.equal(renderer.reportedHeapFragmentation.value, 73);
  assert.equal(Math.floor(renderer.heapUnusedFractionPercentDerived), 73);
  assert.ok(renderer.globalObjectTypes.length > 100);
});
