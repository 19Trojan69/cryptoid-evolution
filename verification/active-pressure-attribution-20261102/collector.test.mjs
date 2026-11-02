import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { gunzipSync } from 'node:zlib';
import { pressurePlan, rendererPss, requireActivePressureState, requirePressureTrigger } from './policy.mjs';
import { captureActiveLight } from './collector.mjs';
const memory = pssKiB => ({ available: true, contentProcessObserved: true,
  processes: [{ role: 'chromium-renderer', pssKiB }], summedPssKiB: pssKiB });
const trigger = mode => ({ mode, metric: 'chromium-renderer-pss', thresholdKiB: mode === 'pressure' ? 768 * 1024 : 0,
  activeMs: 60000, memory: memory(900 * 1024) });
class Session extends EventEmitter {
  calls = []; detached = false; success = true; loss = false; renderer = true;
  async send(method, params) {
    this.calls.push({ method, params });
    if (method === 'Tracing.requestMemoryDump') {
      this.emit('Tracing.dataCollected', { value: [
        ...Array.from({ length: 10001 }, () => ({ ph: 'X', name: 'irrelevant' })),
        { ph: 'M', name: 'process_name', pid: 5, args: { name: this.renderer ? 'Renderer' : 'Other' } },
        { ph: 'v', id: '0', ts: 17, pid: 5, args: { dumps: { allocators: {
          'blink_gc/main/heap': { attrs: { size: { type: 'scalar', units: 'bytes', value: '64000000' },
            allocated_objects_size: { type: 'scalar', units: 'bytes', value: '10000000' } } },
          'malloc/unsafe': { attrs: { unused: { type: 'scalar', units: 'bytes', value: 'fffffffffffff000' } } },
        } } } },
      ] }); return { success: this.success, dumpGuid: '0x1' };
    }
    if (method === 'Tracing.end') this.emit('Tracing.tracingComplete', { dataLossOccurred: this.loss });
    return {};
  }
  async detach() { this.detached = true; }
}
async function collect(session = new Session(), opts = {}) {
  const saved = [], gates = [];
  const result = await captureActiveLight({ session, trigger: trigger('pressure'),
    guard: async () => { gates.push('actual-playing'); return { mode: 'running' }; },
    sample: () => memory(900 * 1024), save: value => saved.push(value), ...opts });
  return { result, session, saved, gates };
}
test('actual collector requires one explicit light nondeterministic request, preserves raw data/hex values and retires the session', async () => {
  const s = await collect(); assert.equal(s.result.complete, true);
  assert.equal(s.session.calls.filter(c => c.method === 'Tracing.requestMemoryDump').length, 1);
  assert.deepEqual(s.session.calls.find(c => c.method === 'Tracing.requestMemoryDump').params,
    { deterministic: false, levelOfDetail: 'light' });
  assert.deepEqual(s.session.calls[0].params.traceConfig.memoryDumpConfig.triggers, []);
  assert.equal(s.gates.length, 3); assert.equal(s.result.dump.processes[0].blinkHeap.bytes, 1677721600);
  assert.equal(s.result.dump.processes[0].categories.canvas, null);
  assert.equal(s.result.dump.processes[0].outsideSafeIntegerRange[0].attributes.unused.rawHex, '0xfffffffffffff000');
  assert.equal(JSON.parse(gunzipSync(s.saved[0])).traceEvents.length, 2);
  assert.equal(s.result.pressureMaintainedAcrossProbe, true); assert.equal(s.result.memoryComparisonEligible, false);
  assert.equal(s.session.detached, true); assert.equal(s.session.listenerCount('Tracing.dataCollected'), 0);
});
test('low PSS, an early clock or a rejected active state cannot start tracing and still retire the supplied session', async () => {
  for (const t of [{ ...trigger('pressure'), memory: memory(767 * 1024) }, { ...trigger('pressure'), activeMs: 59999 }]) {
    const session = new Session();
    await assert.rejects(collect(session, { trigger: t })); assert.equal(session.calls.length, 0); assert.equal(session.detached, true);
  }
  const session = new Session(); await assert.rejects(collect(session, { guard: async () => { throw Error('paused'); } }), /paused/);
  assert.equal(session.calls.length, 0); assert.equal(session.detached, true);
});
test('calibration and a pressure drop cannot be relabeled as a maintained high-pressure capture', async () => {
  const calibration = await collect(new Session(), { trigger: trigger('calibration') });
  assert.equal(calibration.result.complete, true); assert.equal(calibration.result.pressureMaintainedAcrossProbe, false);
  const dropped = await collect(new Session(), { sample: () => memory(400 * 1024) });
  assert.equal(dropped.result.complete, true); assert.equal(dropped.result.pressureMaintainedAcrossProbe, false);
});
test('data loss, absent native renderer counters, failed dump and post-dump state fault preserve partial evidence without a pass', async () => {
  for (const which of ['loss', 'renderer', 'dump', 'gate']) {
    const session = new Session();
    if (which === 'loss') session.loss = true; if (which === 'renderer') session.renderer = false;
    if (which === 'dump') session.success = false;
    let checked = 0;
    const s = await collect(session, { guard: async () => { if (which === 'gate' && ++checked === 3) throw Error('technical-pause'); } });
    assert.equal(s.result.complete, false); assert.equal(s.saved.length, 1); assert.equal(s.session.detached, true);
    assert.equal(s.session.listenerCount('Tracing.dataCollected'), 0);
  }
});
test('fixed mode policy and real active-source/frame guards exclude other treatments, pauses, stale frames and hidden clock gaps', () => {
  const env = { CRYPTOID_ACTIVE_PRESSURE_MODE: 'pressure', CRYPTOID_SOAK_CONDITION: 'original', CRYPTOID_LIFETIME_ATTRIBUTION: '1' };
  assert.equal(pressurePlan(env).thresholdKiB, 768 * 1024); assert.equal(pressurePlan(env).maxActiveMs, 1200000);
  assert.equal(pressurePlan({ ...env, CRYPTOID_ACTIVE_PRESSURE_MODE: 'calibration' }).thresholdKiB, 0);
  for (const patch of [{ CRYPTOID_ACTIVE_PRESSURE_MODE: 'other' }, { CRYPTOID_THRUST_SCOPE: 'leaf' },
    { CRYPTOID_STYLE_WRITE_PROBE: '0' }, { CRYPTOID_INACTIVE_NATIVE_TRACE: '0' }, { CRYPTOID_PRESSURE_REPLICA: '3' }])
    assert.throws(() => pressurePlan({ ...env, ...patch }));
  const source = 'a'.repeat(40), first = { timeOrigin: 9, clock: { latest: { id: 'test' } } };
  const row = { timeOrigin: 9, hidden: false, mounted: true, now: 100,
    scene: { status: 'playing', technicalPause: false, encounter: 'boss-fight', sector: 20, reactorOpen: true,
      ownerDiagnostics: false, buildFlags: { development: false, production: true }, frameAt: 90 },
    clock: { latest: { id: 'test', source, mode: 'running', unobservedGaps: 0 } } };
  requireActivePressureState(row, first, source);
  for (const mutate of [r => r.hidden = true, r => r.scene.status = 'paused', r => r.scene.frameAt = -5000,
    r => r.scene.technicalPause = true, r => r.clock.latest.unobservedGaps = 1, r => r.clock.latest.source = 'b'.repeat(40)]) {
    const changed = structuredClone(row); mutate(changed); assert.throws(() => requireActivePressureState(changed, first, source));
  }
  assert.equal(rendererPss(memory(123)), 123); assert.throws(() => requirePressureTrigger({ ...trigger('pressure'), thresholdKiB: 0 }));
});
