import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { detailPlan, rendererPss, limits, requireDetailTrigger } from '../policy.mjs';
import { classifyDetailed } from '../classify.mjs';
import { memoryTraceEvents } from '../../boss2-native-memory-20261029/nativeSummary.mjs';
export const measured = { source: '79f70ae9868151de2e01f5e0d0c7b67e230656a8', tree: '5517bb7b76cd16baca31d31ff3710919c6655011' };
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const falseFlags = ['additionalFullRecording', 'randomnessSeeded', 'clocksAccelerated', 'automaticResume',
  'activeApiWrappers', 'activeHeapProfiler', 'activeHeapSnapshots', 'activeScreenshots', 'activeAnimationScans',
  'requestedGc', 'memoryComparisonEligible', 'physicalDevice', 'physicalPiBrowser', 'nativeTerminationCauseMeasured', 'whiteScreenFixed'];
const compactType = row => ({ type: row.typeName, typeId: row.typeId, bytes: row.bytes, objectCount: row.objectCount });
function rawEvents(probe, trace) {
  assert.ok(Buffer.isBuffer(trace)); assert.equal(probe.trace.file, 'active-detailed-memory.json.gz');
  assert.equal(probe.trace.compressedBytes, trace.length); assert.equal(probe.trace.sha256, sha256(trace));
  const raw = gunzipSync(trace, { maxOutputLength: limits.rawBytes }); assert.equal(probe.trace.bytes, raw.length);
  const events = JSON.parse(raw).traceEvents; assert.equal(events.length, probe.trace.events);
  assert.ok(events.length <= limits.events); assert.deepEqual(memoryTraceEvents(events), events); return events;
}
export function summarizeDetailed(capture, trace, cell) {
  assert.equal(capture.version, 1); assert.equal(capture.kind, 'active-blink-detail-attribution');
  assert.equal(capture.sourceCommit, measured.source); assert.equal(capture.sourceTree, measured.tree);
  const plan = detailPlan({ CRYPTOID_ACTIVE_BLINK_DETAIL_MODE: cell.mode, CRYPTOID_BLINK_DETAIL_REPLICA: String(cell.replica),
    CRYPTOID_SOAK_CONDITION: 'original', CRYPTOID_LIFETIME_ATTRIBUTION: '1' });
  assert.deepEqual(capture.plan, plan); assert.equal(capture.calibrationOnly, cell.mode === 'calibration');
  assert.equal(capture.originalArtwork, true); assert.equal(capture.collisionProtection, true);
  for (const flag of falseFlags) assert.equal(capture[flag], false, flag);
  assert.equal(capture.actualHostOS, 'linux'); assert.match(capture.engineVersion, /^\d+\.\d+\.\d+\.\d+$/);
  assert.match(capture.lockSha256, /^[a-f0-9]{64}$/);
  for (const name of ['react', 'react-dom', 'react-router-dom', 'vite', 'typescript'])
    assert.match(capture.actualInstalledPackages?.[name], /^\d+\.\d+\.\d+/);
  assert.deepEqual(capture.changedTrackedPaths, []);
  assert.ok(Array.isArray(capture.workingTreeStatus) && capture.workingTreeStatus.length <= 64);
  for (const path of capture.workingTreeStatus)
    assert.ok(['?? frontend/package-lock.json', '?? verification/boss2-forensics-20261028/package-lock.json'].includes(path));
  if (capture.nativeProbe || capture.normalExitVerified || capture.complete) {
    assert.equal(capture.buildProof.originalArtworkRetained, true);
    assert.deepEqual(capture.buildProof.moduleOnlyScalarGetters, ['cssFramePacingStats', 'paintedShipResourceStats', 'canvasEffectResources']);
    for (const key of ['capturesGameInstance', 'newAppTimersOrFrames', 'activeNativeAnimationScan', 'cleanupPolicyChanged', 'shippedRuntimeSourceEdited'])
      assert.equal(capture.buildProof[key], false);
    assert.equal(capture.stopwatchBuildProof.existingClockReused, true);
    assert.equal(capture.stopwatchBuildProof.simulationClocksChanged, false);
  }
  assert.equal(typeof capture.complete, 'boolean'); assert.ok(Array.isArray(capture.points));
  if (capture.points.length) assert.equal(capture.points[0].activeMs, 0); else assert.equal(capture.complete, false);
  for (const [i, point] of capture.points.entries()) {
    assert.ok(Number.isFinite(point.activeMs) && point.activeMs >= 0);
    if (i) assert.ok(point.activeMs > capture.points[i - 1].activeMs);
    rendererPss(point.memory); assert.ok(Number.isSafeInteger(point.memory.summedPssKiB));
    assert.ok(point.now - point.frameAt >= -50 && point.now - point.frameAt <= 2500);
  }
  const summary = { cell, sourceCommit: measured.source, sourceTree: measured.tree,
    runtimeComplete: capture.complete, outcome: capture.outcome ?? null, failure: capture.failure ?? null,
    classification: capture.complete ? cell.mode === 'calibration' ? 'calibration-pass' : 'active-detail-pressure-captured'
      : ['pressure-threshold-not-observed', 'pressure-changed-during-probe'].includes(capture.outcome)
        ? 'diagnostic-objective-unmet' : 'observation-or-collection-failed',
    observedActiveMs: capture.observedActiveMs ?? null, observedWallMs: capture.observedWallMs ?? null,
    engineVersion: capture.engineVersion, actualInstalledPackages: capture.actualInstalledPackages, lockSha256: capture.lockSha256,
    workingTreeStatus: capture.workingTreeStatus, buildWorkingTreeDirty: capture.buildWorkingTreeDirty,
    points: capture.points.length, maximumSampledRendererPssKiB: capture.points.length
      ? Math.max(...capture.points.map(p => rendererPss(p.memory))) : null,
    pressureEvidenceQualified: false, native: null,
    physicalPhoneAcceptanceEstablished: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false };
  const probe = capture.nativeProbe;
  if (probe?.complete) {
    assert.equal(probe.tracingStarted, true); assert.equal(probe.tracingStopped, true); assert.equal(probe.sessionDetached, true);
    assert.equal(probe.activeInstrumentation, true); assert.equal(probe.levelOfDetail, 'detailed');
    for (const key of ['deterministic', 'memoryComparisonEligible', 'physicalDevice', 'nativeTerminationCauseMeasured', 'whiteScreenFixed'])
      assert.equal(probe[key], false);
    assert.deepEqual(probe.automaticDumpTriggers, []); assert.equal(probe.maximumExplicitDumps, 1);
    requireDetailTrigger(capture.trigger); assert.deepEqual(probe.trigger, capture.trigger);
    assert.equal(capture.trigger.mode, plan.mode); assert.equal(capture.trigger.activeMs, capture.observedActiveMs);
    assert.equal(capture.trigger.activeMs, capture.points.at(-1).activeMs);
    assert.deepEqual(capture.trigger.memory, capture.points.at(-1).memory);
    const states = [probe.stateBeforeTrace, probe.stateBeforeDump, probe.stateAfterDump, probe.stateAfterTrace];
    for (const [i, state] of states.entries()) {
      assert.equal(typeof state.clockId, 'string'); assert.ok(state.clockId.length > 0);
      assert.ok(Number.isFinite(state.timeOrigin) && state.timeOrigin > 0);
      assert.equal(state.source, measured.source); assert.equal(state.clockId, states[0].clockId);
      assert.equal(state.timeOrigin, states[0].timeOrigin); assert.equal(state.gameStatus, 'playing');
      assert.equal(state.technicalPause, false); assert.equal(state.hidden, false); assert.equal(state.mounted, true);
      assert.equal(state.clockMode, 'running'); assert.equal(state.unobservedGaps, 0);
      assert.ok(state.now - state.frameAt >= -50 && state.now - state.frameAt <= 2500);
      if (i) assert.ok(state.clockElapsedMs >= states[i - 1].clockElapsedMs);
    }
    assert.ok(states.at(-1).frameAt > states[0].frameAt);
    const pss = { trigger: rendererPss(capture.trigger.memory), beforeDump: rendererPss(probe.beforeDumpMemory),
      afterDump: rendererPss(probe.afterDumpMemory), afterTrace: rendererPss(probe.afterTraceMemory) };
    assert.deepEqual(probe.rendererPssKiB, pss);
    const qualified = plan.mode === 'pressure' && Object.values(pss).every(kib => kib >= plan.qualificationKiB);
    assert.equal(probe.pressureMaintainedAtSampledBoundaries, qualified); assert.equal(capture.pressureEvidenceQualified, qualified);
    assert.equal(probe.requests.length, 1); assert.equal(probe.requests[0].success, true);
    assert.equal(probe.trace.dataLossOccurred, false); assert.equal(probe.trace.collectorFault, null);
    const events = rawEvents(probe, trace), dump = classifyDetailed(events, probe.requests);
    assert.deepEqual(probe.dump, dump, 'Full native class sizes/counts, IDs, units and process fragments must match raw data');
    summary.pressureEvidenceQualified = qualified;
    summary.native = { collectionComplete: true, pssKiB: pss, captureWallMs: probe.captureWallMs, requestWallMs: probe.requestWallMs,
      trace: probe.trace, pressureVerifiedAtSampledBoundariesOnly: true,
      rendererFragments: dump.processes.filter(p => /renderer/i.test(p.processName)).map(p => ({
        processId: p.processId, fragmentIndex: p.fragmentIndex, allocatorCount: p.allocatorCount, categories: p.categories,
        blinkHeap: p.blinkHeap, reportedHeapFragmentation: p.reportedHeapFragmentation,
        heapUnusedFractionPercentDerived: p.heapUnusedFractionPercentDerived, heapSpaces: p.heapSpaces,
        globalTypeRows: p.globalObjectTypes.length, positiveGlobalTypeRows: p.globalObjectTypes.filter(t => t.bytes > 0).length,
        largestGlobalObjectTypes: p.largestGlobalObjectTypes.slice(0, 20).map(compactType),
        focusedGlobalObjectTypes: p.focusedGlobalObjectTypes.map(t => ({ type: t.type, rows: t.rows.map(compactType) })),
        typeNamesAreNotAllocationStacksOrRetainerPaths: true })),
      categoriesAndFragmentsMustNotBeSummed: true, classSizesAreNotPostGcRetainedBytes: true,
      classObjectCountsAreNotLiveCacheEntryCounts: true };
  } else if (probe) {
    assert.equal(capture.complete, false); assert.equal(capture.pressureEvidenceQualified, false); assert.ok(probe.failure?.code);
    const events = probe.trace ? rawEvents(probe, trace) : null; if (!probe.trace) assert.equal(trace, null);
    summary.native = { collectionComplete: false, failure: probe.failure, events: events?.length ?? null,
      traceDataLoss: probe.trace?.dataLossOccurred ?? null, collectorFault: probe.trace?.collectorFault ?? null,
      classSizesAttributed: false };
  } else { assert.equal(trace, null); assert.equal(capture.complete, false); assert.equal(capture.pressureEvidenceQualified, false); }
  if (capture.normalExitVerified) {
    assert.equal(capture.qaControllerBridgeRemoved, true); assert.ok(capture.volleysAdvanced > 0);
    assert.deepEqual(capture.lifecycle.map(p => p.label),
      ['paused-immediate', 'paused-settled-without-requested-gc', 'home-settled-without-requested-gc']);
    summary.volleysAdvanced = capture.volleysAdvanced;
    summary.lifecyclePssKiB = capture.lifecycle.map(p => ({ label: p.label, renderer: rendererPss(p.memory), total: p.memory.summedPssKiB }));
    summary.homeCountersAtUnmount = capture.lifecycle.at(-1).stats;
    summary.nativeCleanupEstablishedByCounters = false;
  }
  if (capture.complete) {
    assert.equal(capture.failure, undefined); assert.equal(capture.normalExitVerified, true);
    assert.equal(capture.outcome, plan.mode === 'calibration' ? 'calibration-collected' : 'active-pressure-collected');
    assert.ok(plan.mode === 'calibration' || summary.pressureEvidenceQualified);
  } else {
    assert.ok(capture.failure?.code);
    if (capture.outcome === 'pressure-threshold-not-observed') {
      assert.equal(plan.mode, 'pressure'); assert.equal(probe, undefined); assert.equal(capture.normalExitVerified, true);
      assert.ok(capture.observedActiveMs >= plan.maxActiveMs); assert.ok(capture.points.at(-1).activeMs >= plan.maxActiveMs);
      assert.ok(capture.points.filter(p => p.activeMs >= plan.minActiveMs).every(p => rendererPss(p.memory) < plan.triggerKiB));
      assert.equal(capture.failure.code, capture.outcome);
    } else if (capture.outcome === 'pressure-changed-during-probe') {
      assert.equal(plan.mode, 'pressure'); assert.equal(probe.complete, true); assert.equal(summary.pressureEvidenceQualified, false);
      assert.equal(capture.failure.code, capture.outcome);
    }
  }
  return summary;
}
