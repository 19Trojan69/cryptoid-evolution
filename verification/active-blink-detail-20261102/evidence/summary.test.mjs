import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { summarizeDetailed } from './summary.mjs';
const read = file => readFileSync(new URL(file, import.meta.url));
const source = () => JSON.parse(gunzipSync(read('calibration-r1.json.gz')));
const trace = () => read('calibration-r1-native.json.gz');
const cell = { mode: 'calibration', replica: 1 };
test('actual active detailed calibration reparses named classes and fractional time without claiming pressure, retained bytes or live cache counts', () => {
  const c = source(), s = summarizeDetailed(c, trace(), cell);
  assert.equal(s.classification, 'calibration-pass'); assert.equal(s.pressureEvidenceQualified, false);
  assert.equal(s.observedActiveMs, 60002.70000000001); assert.equal(s.native.requestWallMs, 389);
  const p = s.native.rendererFragments.find(p => p.globalTypeRows);
  assert.equal(p.globalTypeRows, 1224); assert.equal(p.blinkHeap.bytes, 100565232);
  const h = p.largestGlobalObjectTypes.find(t => t.type === 'blink::HashTrieNode<blink::CSSVariableData>');
  assert.equal(h.bytes, 3531648); assert.equal(h.objectCount.value, 12984);
  assert.equal(p.reportedHeapFragmentation.reportedUnits, 'objects'); assert.equal(p.reportedHeapFragmentation.value, 74);
  assert.equal(Math.floor(p.heapUnusedFractionPercentDerived), 74);
  assert.equal(s.native.classSizesAreNotPostGcRetainedBytes, true);
  assert.equal(s.native.classObjectCountsAreNotLiveCacheEntryCounts, true);
  assert.equal(s.nativeCleanupEstablishedByCounters, false); assert.equal(s.whiteScreenFixed, false);
});
test('stored object counts, native type identity and raw digest cannot be changed independently of the preserved detailed trace', () => {
  const c = source(), p = c.nativeProbe.dump.processes.find(p => p.globalObjectTypes.length);
  p.globalObjectTypes.find(t => t.typeName === 'blink::HashTrieNode<blink::CSSVariableData>').objectCount.value++;
  assert.throws(() => summarizeDetailed(c, trace(), cell));
  const altered = Buffer.from(trace()); altered[40] ^= 1;
  assert.throws(() => summarizeDetailed(source(), altered, cell));
  const identity = source(), types = identity.nativeProbe.dump.processes.find(p => p.globalObjectTypes.length).globalObjectTypes;
  types[0].typeId = '0xabcdef'; assert.throws(() => summarizeDetailed(identity, trace(), cell));
});
test('calibration and a detail payload cannot promote themselves to a pressure pass or bypass the original trigger reserve', () => {
  for (const mutate of [c => c.pressureEvidenceQualified = true,
    c => c.nativeProbe.pressureMaintainedAtSampledBoundaries = true,
    c => c.outcome = 'active-pressure-collected', c => c.plan.triggerKiB = 768 * 1024]) {
    const c = source(); mutate(c); assert.throws(() => summarizeDetailed(c, trace(), cell));
  }
  assert.throws(() => summarizeDetailed(source(), trace(), { mode: 'pressure', replica: 1 }));
});
test('source drift, hidden time, a paused or stalled game, clock gaps and missing dependency provenance invalidate asserted successful evidence', () => {
  for (const mutate of [c => c.sourceTree = '0'.repeat(40), c => c.changedTrackedPaths.push('frontend/src/pages/GamePage.tsx'),
    c => c.workingTreeStatus.push('?? frontend/src/newRuntime.ts'), c => delete c.engineVersion,
    c => delete c.actualInstalledPackages, c => c.requestedGc = true,
    c => c.nativeProbe.stateAfterDump.hidden = true, c => c.nativeProbe.stateAfterDump.technicalPause = true,
    c => c.nativeProbe.stateAfterTrace.unobservedGaps = 1, c => c.nativeProbe.stateAfterTrace.clockId = 'different',
    c => c.nativeProbe.stateAfterTrace.frameAt = c.nativeProbe.stateBeforeTrace.frameAt,
    c => c.nativeProbe.tracingStopped = false]) {
    const c = source(); mutate(c); assert.throws(() => summarizeDetailed(c, trace(), cell));
  }
});
test('a deliberately modeled partial trace fault retains raw evidence without attributing object sizes or a phone cause', () => {
  // An altered fixture tests failure handling; it is not a measured extra run.
  const c = source(); c.complete = false; delete c.outcome;
  c.failure = { code: 'active-blink-detail-observation-failed', message: 'Synthetic fault' };
  c.nativeProbe.complete = false; c.nativeProbe.failure = { code: 'active-detailed-collection-failed', message: 'Synthetic loss' };
  c.nativeProbe.trace.dataLossOccurred = true;
  const s = summarizeDetailed(c, trace(), cell);
  assert.equal(s.classification, 'observation-or-collection-failed'); assert.equal(s.native.collectionComplete, false);
  assert.equal(s.native.classSizesAttributed, false); assert.equal(s.native.rendererFragments, undefined);
  assert.equal(s.pressureEvidenceQualified, false); assert.equal(s.nativeTerminationCauseMeasured, false);
  assert.equal(s.physicalPhoneAcceptanceEstablished, false);
});
test('both real twenty-minute originals remain unmet pressure targets with absent native detail, never zero-sized heaps or new fixes', () => {
  for (const replica of [1, 2]) {
    const c = JSON.parse(gunzipSync(read(`pressure-r${replica}.json.gz`)));
    const s = summarizeDetailed(c, null, { mode: 'pressure', replica });
    assert.equal(s.runtimeComplete, false); assert.equal(s.classification, 'diagnostic-objective-unmet');
    assert.ok(s.observedActiveMs >= 1200000); assert.equal(s.volleysAdvanced, 428);
    assert.ok(s.maximumSampledRendererPssKiB < 832 * 1024);
    assert.equal(c.trigger, undefined); assert.equal(c.nativeProbe, undefined);
    assert.equal(s.native, null); assert.equal(s.pressureEvidenceQualified, false); assert.equal(s.whiteScreenFixed, false);
  }
  const altered = JSON.parse(gunzipSync(read('pressure-r1.json.gz')));
  altered.complete = true; assert.throws(() => summarizeDetailed(altered, null, { mode: 'pressure', replica: 1 }));
});
