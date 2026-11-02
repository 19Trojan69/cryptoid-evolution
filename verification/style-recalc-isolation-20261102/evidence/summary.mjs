import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { conditions, pairs } from '../sceneProbe.mjs';
import { maxBytes, maxEvents, summarizeTimeline } from '../timeline.mjs';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

// Recompute from the archived native events. A failed scene proof never becomes
// an accepted comparison, even if its partial trace contains usable counters.
export function summarizeStyleRun(capture, traces, expected) {
  assert.equal(capture.version, 1); assert.equal(capture.kind, 'paused-native-style-recalc-isolation');
  assert.equal(capture.sourceCommit, expected.source); assert.equal(capture.sourceTree, expected.tree);
  assert.equal(capture.replica, expected.replica); assert.equal(capture.complete, expected.complete);
  for (const key of ['originalArtwork', 'syntheticPausedStyleSweep']) assert.equal(capture[key], true);
  for (const key of ['gameOrAnimationClocksWritten', 'newAppTimersOrFrames', 'requestedGc', 'heapSnapshots',
    'activeApiWrappers', 'physicalDevice', 'physicalPiBrowser', 'nativeTerminationCauseMeasured',
    'performanceOrMemoryBenefitEstablished', 'whiteScreenFixed']) assert.equal(capture[key], false);
  assert.equal(capture.memoryDumpRequests, 0); assert.deepEqual(capture.pairs, pairs);
  assert.match(capture.engineVersion, /^\d+\.\d+\.\d+\.\d+$/); assert.match(capture.lockSha256, /^[a-f0-9]{64}$/);
  assert.equal(capture.consumerSourceProof.cssBlob, '43dea6284bc694bac6026e5928aaf42e4a461ec2');
  assert.deepEqual(capture.consumerSourceProof, { cssBlob: '43dea6284bc694bac6026e5928aaf42e4a461ec2',
    thrustConsumers: 1, chargeConsumers: 2, firingOverridePreserved: true,
    ...(capture.complete ? { noInlineStyleAttributeSelector: true } : {}) });
  const order = capture.replica === 1 ? conditions : [...conditions].reverse(); assert.deepEqual(capture.order, order);
  assert.ok(capture.cases.length > 0 && capture.cases.length <= 4);
  const guard = row => {
    assert.equal(row.source, expected.source); assert.equal(row.clockMode, 'paused'); assert.equal(row.status, 'paused');
    assert.equal(row.hidden, false); assert.equal(row.technicalPause, false);
    assert.ok(Number.isFinite(row.timeOrigin) && Number.isFinite(row.elapsedMs) && row.elapsedMs > 0);
    assert.ok(Number.isSafeInteger(row.coreVolley) && row.coreVolley > 0); assert.equal(typeof row.clockId, 'string');
    assert.deepEqual(row, capture.pausedSource);
  };
  guard(capture.pausedSource);
  const compared = [];
  for (const [index, c] of capture.cases.entries()) {
    assert.equal(c.condition, order[index]); assert.equal(c.prefix, `cryptoid-recalc-r${capture.replica}-${c.condition}-`);
    assert.equal(c.activeGameProfile, false); assert.equal(c.syntheticPausedStyleSweep, true);
    assert.equal(c.requestedGc, false); assert.equal(c.memoryDumpRequests, 0); assert.equal(c.heapProfiler, false);
    assert.equal(c.appOrAnimationClocksWritten, false); guard(c.before);
    const bytes = traces[c.condition]; assert.ok(Buffer.isBuffer(bytes));
    assert.equal(bytes.length, c.trace.compressedBytes); assert.equal(sha256(bytes), c.trace.sha256);
    const raw = gunzipSync(bytes, { maxOutputLength: maxBytes }); assert.equal(raw.length, c.trace.bytes);
    const events = JSON.parse(raw).traceEvents; assert.equal(events.length, c.trace.events); assert.ok(events.length <= maxEvents);
    if (capture.complete) {
      assert.equal(c.complete, true); assert.equal(c.failure, undefined); guard(c.after);
      assert.equal(c.trace.dataLossOccurred, false); assert.equal(c.trace.collectorFault, null);
      assert.equal(c.sessionDetached, true); assert.equal(c.tracingStopped, true);
      assert.equal(c.stopFailure, undefined); assert.equal(c.saveFailure, undefined);
      assert.equal(c.proof.condition, c.condition); assert.equal(c.proof.prefix, c.prefix); assert.equal(c.proof.steps, 16);
      assert.ok(c.proof.engines > 0 && c.proof.engines <= 16); assert.ok(c.proof.chargeConsumers > 0 && c.proof.chargeConsumers <= 32);
      assert.equal(c.proof.firingFidelityCases, index === 0 ? 10 : 0);
      for (const key of ['originalInlineDeclarationsRestored', 'originalFiringClassRestored', 'originalComputedOutputsRestored',
        'sameNativeAnimationsStartsAndRates', 'onlyWhilePaused']) assert.equal(c.proof[key], true);
      const materialized = c.proof.emptySvgStyleAttributeIndices;
      assert.ok(Array.isArray(materialized)); assert.equal(new Set(materialized).size, materialized.length);
      for (const i of materialized) assert.ok(Number.isSafeInteger(i) && i >= 2 + c.proof.engines
        && i < 2 + c.proof.engines + c.proof.chargeConsumers);
      assert.equal(c.proof.originalInlineAttributePresenceRestored, materialized.length === 0);
      assert.equal(c.proof.appOrAnimationClocksWritten, false); assert.equal(c.proof.newAppTimersOrFrames, false);
      assert.equal(c.proof.outputs.length, 16);
      for (const output of c.proof.outputs) {
        assert.equal(output.heights.length, c.proof.engines); assert.equal(output.opacities.length, c.proof.chargeConsumers);
        for (const value of output.heights) assert.match(value, /^\d+(?:\.\d+)?px$/);
        for (const value of output.opacities) assert.ok(value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1);
      }
      const native = summarizeTimeline(events, { prefix: c.prefix, steps: 16, frameId: capture.frameId });
      assert.deepEqual(c.native, native);
      compared.push({ condition: c.condition, totalElementStyleCalculations: native.totalElementStyleCalculations,
        calculationsPerStep: native.steps.map(s => s.elementStyleCalculations),
        emptySvgStyleAttributeIndices: materialized, rawStyleAttributePresenceIdentical: c.proof.originalInlineAttributePresenceRestored });
    }
  }
  assert.deepEqual(Object.keys(traces).sort(), capture.cases.map(c => c.condition).sort());
  if (capture.complete) {
    assert.equal(capture.failure, undefined); assert.equal(capture.cases.length, 4); guard(capture.afterAll);
    assert.equal(capture.sameNativeComputedOutputsAcrossConditions, true); assert.equal(capture.normalExitVerified, true);
    const root = capture.cases.find(c => c.condition === 'root');
    for (const c of capture.cases) assert.deepEqual(c.proof.outputs, root.proof.outputs);
  } else {
    assert.equal(capture.failure.code, 'native-style-recalc-probe-failed'); assert.ok(capture.failure.message);
    assert.equal(capture.sameNativeComputedOutputsAcrossConditions, undefined);
    assert.ok(capture.cases.some(c => !c.complete));
  }
  return { source: expected.source, tree: expected.tree, replica: capture.replica, complete: capture.complete,
    classification: capture.complete ? 'accepted-paused-style-work-comparison' : 'failed-scene-proof-no-comparison',
    failureCode: capture.failure?.code ?? null, engineVersion: capture.engineVersion,
    actualInstalledPackages: capture.actualInstalledPackages, lockSha256: capture.lockSha256,
    nativeWork: capture.complete ? conditions.map(condition => compared.find(c => c.condition === condition)) : null,
    memoryBenefitEstablished: false, physicalPhoneAcceptanceEstablished: false, whiteScreenFixed: false };
}

export function compareReplicas(summaries) {
  assert.equal(summaries.length, 2); assert.deepEqual(summaries.map(s => s.replica), [1, 2]);
  for (const s of summaries) {
    assert.equal(s.complete, true); assert.equal(s.classification, 'accepted-paused-style-work-comparison');
    for (const key of ['source', 'tree', 'engineVersion', 'actualInstalledPackages', 'lockSha256']) assert.deepEqual(s[key], summaries[0][key]);
    assert.deepEqual(s.nativeWork.map(c => c.condition), conditions);
  }
  const rows = conditions.map(condition => {
    const values = summaries.map(s => s.nativeWork.find(c => c.condition === condition).totalElementStyleCalculations);
    const roots = summaries.map(s => s.nativeWork.find(c => c.condition === 'root').totalElementStyleCalculations);
    return { condition, totalElementStyleCalculations: values,
      syntheticWorkReductionPercentFromOwnRoot: values.map((v, i) => roots[i] > 0 ? (roots[i] - v) / roots[i] * 100 : null) };
  });
  const both = rows.find(r => r.condition === 'both-local');
  return { acceptedReplicas: 2, rows,
    bothLocalStyleWorkReductionRepeated: both.syntheticWorkReductionPercentFromOwnRoot.every(n => n !== null && n > 0),
    activeRuntimeMemoryBenefitEstablished: false, physicalPhoneAcceptanceEstablished: false, whiteScreenFixed: false };
}
