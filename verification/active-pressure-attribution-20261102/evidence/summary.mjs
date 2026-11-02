import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { pressurePlan, rendererPss } from '../policy.mjs';
import { summarizeMemoryTrace } from '../../boss2-native-memory-20261029/nativeSummary.mjs';

export const measured = { source: '9a21529a247fb18e1e4dbec1036f1a24f7331d4d', tree: '1be9590fc563383da4a954adf9cb93ddef39d615' };
const natural = value => Number.isSafeInteger(value) && value >= 0;
const sha256 = value => createHash('sha256').update(value).digest('hex');
const flagsFalse = ['additionalFullRecording', 'randomnessSeeded', 'clocksAccelerated', 'automaticResume',
  'activeApiWrappers', 'activeHeapProfiler', 'activeHeapSnapshots', 'activeScreenshots', 'activeAnimationScans',
  'requestedGc', 'memoryComparisonEligible', 'physicalDevice', 'physicalPiBrowser', 'nativeTerminationCauseMeasured', 'whiteScreenFixed'];
const rawEvents = (probe, trace) => {
  assert.ok(Buffer.isBuffer(trace)); assert.equal(probe.trace.compressedBytes, trace.length);
  assert.equal(probe.trace.sha256, sha256(trace));
  const raw = gunzipSync(trace, { maxOutputLength: 8 * 1024 * 1024 });
  assert.equal(probe.trace.bytes, raw.length); const events = JSON.parse(raw).traceEvents;
  assert.ok(events.length <= 128); assert.equal(probe.trace.events, events.length); return events;
};

// This is an instrumented diagnostic, not the older uninstrumented 20-minute
// comparison protocol. Reparse the raw allocator events and independently
// qualify all four external renderer-PSS boundaries before reporting pressure.
export function summarizePressure(capture, trace, cell) {
  assert.equal(capture.version, 1); assert.equal(capture.kind, 'active-pressure-attribution');
  assert.equal(capture.sourceCommit, measured.source); assert.equal(capture.sourceTree, measured.tree);
  const plan = pressurePlan({ CRYPTOID_ACTIVE_PRESSURE_MODE: cell.mode,
    CRYPTOID_PRESSURE_REPLICA: String(cell.replica), CRYPTOID_SOAK_CONDITION: 'original', CRYPTOID_LIFETIME_ATTRIBUTION: '1' });
  assert.deepEqual(capture.plan, plan); assert.equal(capture.calibrationOnly, cell.mode === 'calibration');
  for (const key of flagsFalse) assert.equal(capture[key], false, key);
  assert.equal(capture.originalArtwork, true); assert.equal(capture.collisionProtection, true);
  assert.equal(capture.actualHostOS, 'linux'); assert.match(capture.engineVersion, /^\d+\.\d+\.\d+\.\d+$/);
  assert.match(capture.lockSha256, /^[a-f0-9]{64}$/);
  for (const name of ['react', 'react-dom', 'react-router-dom', 'vite', 'typescript'])
    assert.match(capture.actualInstalledPackages?.[name], /^\d+\.\d+\.\d+/);
  assert.ok(Array.isArray(capture.changedTrackedPaths));
  for (const path of capture.changedTrackedPaths)
    assert.equal(path, 'verification/boss2-forensics-20261028/package-lock.json', 'No game or fixture source drift');
  assert.equal(capture.buildProof.originalArtworkRetained, true);
  assert.deepEqual(capture.buildProof.moduleOnlyScalarGetters, ['cssFramePacingStats', 'paintedShipResourceStats', 'canvasEffectResources']);
  for (const key of ['capturesGameInstance', 'newAppTimersOrFrames', 'activeNativeAnimationScan', 'cleanupPolicyChanged', 'shippedRuntimeSourceEdited'])
    assert.equal(capture.buildProof[key], false);
  assert.equal(typeof capture.complete, 'boolean'); assert.ok(Array.isArray(capture.points));
  if (capture.points.length) assert.equal(capture.points[0].activeMs, 0);
  else assert.equal(capture.complete, false);
  for (const [i, point] of capture.points.entries()) {
    assert.ok(Number.isFinite(point.activeMs) && point.activeMs >= 0);
    if (i) assert.ok(point.activeMs > capture.points[i - 1].activeMs);
    rendererPss(point.memory); assert.ok(natural(point.memory.summedPssKiB));
    assert.ok(point.now - point.frameAt >= -50 && point.now - point.frameAt <= 2500);
  }
  const summary = { cell, sourceCommit: capture.sourceCommit, sourceTree: capture.sourceTree,
    runtimeComplete: capture.complete, outcome: capture.outcome ?? null, failure: capture.failure ?? null,
    classification: capture.complete ? cell.mode === 'calibration' ? 'calibration-pass' : 'active-pressure-captured'
      : ['pressure-threshold-not-observed', 'pressure-changed-during-probe'].includes(capture.outcome)
        ? 'diagnostic-objective-unmet' : 'observation-or-collection-failed',
    observedActiveMs: capture.observedActiveMs, observedWallMs: capture.observedWallMs,
    engineVersion: capture.engineVersion, actualInstalledPackages: capture.actualInstalledPackages, lockSha256: capture.lockSha256,
    changedTrackedPaths: capture.changedTrackedPaths, buildWorkingTreeDirty: capture.buildWorkingTreeDirty,
    maximumSampledRendererPssKiB: capture.points.length ? Math.max(...capture.points.map(p => rendererPss(p.memory))) : null,
    maximumSampledTotalPssKiB: capture.points.length ? Math.max(...capture.points.map(p => p.memory.summedPssKiB)) : null,
    points: capture.points.length, native: null, pressureEvidenceQualified: false,
    nativeTerminationCauseMeasured: false, physicalPhoneAcceptanceEstablished: false, whiteScreenFixed: false };
  const probe = capture.nativeProbe;
  if (probe?.complete) {
    assert.equal(probe.complete, true); assert.equal(probe.tracingStarted, true);
    assert.equal(probe.tracingStopped, true); assert.equal(probe.sessionDetached, true);
    for (const key of ['activeInstrumentation', 'lightDumpOnly']) assert.equal(probe[key], true);
    for (const key of ['deterministic', 'memoryComparisonEligible', 'physicalDevice', 'nativeTerminationCauseMeasured', 'whiteScreenFixed'])
      assert.equal(probe[key], false);
    assert.deepEqual(probe.automaticDumpTriggers, []); assert.equal(probe.maximumExplicitDumps, 1);
    assert.deepEqual(probe.trigger, capture.trigger); assert.equal(capture.trigger.mode, cell.mode);
    assert.equal(capture.trigger.metric, plan.metric); assert.equal(capture.trigger.thresholdKiB, plan.thresholdKiB);
    assert.deepEqual(capture.trigger.memory, capture.points.at(-1).memory);
    assert.equal(capture.trigger.activeMs, capture.points.at(-1).activeMs);
    assert.ok(capture.trigger.activeMs >= plan.minActiveMs && capture.trigger.activeMs <= plan.maxActiveMs + 5000);
    assert.equal(capture.observedActiveMs, capture.trigger.activeMs);
    for (const state of [probe.stateBeforeDump, probe.stateAfterDump]) {
      assert.equal(state.gameStatus, 'playing'); assert.equal(state.technicalPause, false);
      assert.equal(state.clockMode, 'running'); assert.equal(state.unobservedGaps, 0);
      assert.ok(state.now - state.frameAt >= -50 && state.now - state.frameAt <= 2500);
    }
    assert.equal(probe.stateBeforeDump.timeOrigin, probe.stateAfterDump.timeOrigin);
    assert.ok(probe.stateAfterDump.clockElapsedMs >= probe.stateBeforeDump.clockElapsedMs);
    const pss = { trigger: rendererPss(capture.trigger.memory), beforeDump: rendererPss(probe.beforeDumpMemory),
      afterDump: rendererPss(probe.afterDumpMemory), afterTrace: rendererPss(probe.afterTraceMemory) };
    assert.deepEqual(probe.rendererPssKiB, pss); assert.ok(pss.trigger >= plan.thresholdKiB);
    const qualified = cell.mode === 'pressure' && Object.values(pss).every(value => value >= plan.thresholdKiB);
    assert.equal(probe.pressureMaintainedAcrossProbe, qualified); assert.equal(capture.pressureEvidenceQualified, qualified);
    assert.equal(probe.requests.length, 1); assert.equal(probe.requests[0].success, true);
    assert.equal(probe.trace.dataLossOccurred, false); assert.equal(probe.trace.collectorFault, null);
    const events = rawEvents(probe, trace);
    assert.ok(events.some(e => e.ph === 'v'));
    for (const e of events.filter(e => e.ph === 'v')) assert.equal(e.args.dumps.level_of_detail, 'light');
    const parsed = summarizeMemoryTrace(events, probe.requests, { exportedSnapshotIds: true });
    assert.equal(parsed.length, 1); const dump = parsed[0];
    for (const key of ['label', 'association', 'traceDumpId', 'requestDumpGuid', 'timestampUs', 'matchedProcessDumps', 'matchedDumpEvents'])
      assert.deepEqual(probe.dump[key], dump[key]);
    assert.equal(probe.dump.processes.length, dump.processes.length);
    for (const p of dump.processes) {
      const saved = probe.dump.processes.find(s => s.fragmentIndex === p.fragmentIndex);
      assert.equal(saved.processId, p.processId); assert.equal(saved.processName, p.processName);
      assert.equal(saved.reportedSizesMustNotBeSummed, true);
      for (const [path, bytes] of Object.entries(saved.categories))
        assert.equal(bytes, p.allocators.find(a => a.path === path)?.bytes ?? null);
      assert.deepEqual(saved.blinkHeap, p.allocators.find(a => a.path === 'blink_gc/main/heap') ?? null);
    }
    const renderers = probe.dump.processes.filter(p => /renderer/i.test(p.processName));
    assert.ok(renderers.some(p => p.blinkHeap?.bytes !== null && p.blinkHeap?.bytes !== undefined));
    summary.pressureEvidenceQualified = qualified;
    summary.native = { pssKiB: pss, requestWallMs: probe.requestWallMs, captureWallMs: probe.captureWallMs,
      events: events.length, processFragments: dump.processes.length, rendererFragments: renderers,
      pressureVerifiedAtSampledBoundariesOnly: true,
      categoriesAndFragmentsOverlapMustNotBeSummed: true };
  } else if (probe) {
    assert.equal(capture.complete, false); assert.equal(capture.pressureEvidenceQualified, false);
    assert.ok(probe.failure?.code); const events = probe.trace ? rawEvents(probe, trace) : null;
    if (!probe.trace) assert.equal(trace, null);
    summary.native = { collectionComplete: false, failure: probe.failure, events: events?.length ?? null,
      traceDataLoss: probe.trace?.dataLossOccurred ?? null, collectorFault: probe.trace?.collectorFault ?? null,
      allocationSizesAttributed: false };
  } else {
    assert.equal(trace, null); assert.equal(capture.complete, false); assert.equal(capture.pressureEvidenceQualified, false);
  }
  if (capture.normalExitVerified) {
    assert.equal(capture.qaControllerBridgeRemoved, true); assert.ok(capture.volleysAdvanced > 0);
    assert.deepEqual(capture.lifecycle.map(p => p.label),
      ['paused-immediate', 'paused-settled-without-requested-gc', 'home-settled-without-requested-gc']);
    summary.lifecyclePssKiB = capture.lifecycle.map(p => ({ label: p.label,
      renderer: rendererPss(p.memory), total: p.memory.summedPssKiB }));
    summary.homeStats = capture.lifecycle.at(-1).stats;
  }
  if (capture.complete) {
    assert.equal(capture.normalExitVerified, true); assert.equal(capture.failure, undefined);
    assert.equal(capture.outcome, cell.mode === 'calibration' ? 'calibration-collected' : 'active-pressure-collected');
    assert.ok(cell.mode === 'calibration' || summary.pressureEvidenceQualified);
  } else {
    assert.ok(capture.failure?.code, 'Failed observations retain an explicit failure');
    if (capture.outcome === 'pressure-threshold-not-observed') {
      assert.equal(cell.mode, 'pressure'); assert.equal(probe, undefined);
      assert.equal(capture.normalExitVerified, true); assert.ok(capture.observedActiveMs >= plan.maxActiveMs);
      assert.ok(capture.points.at(-1).activeMs >= plan.maxActiveMs);
      assert.ok(capture.points.filter(p => p.activeMs >= plan.minActiveMs).every(p => rendererPss(p.memory) < plan.thresholdKiB));
      assert.equal(capture.failure.code, capture.outcome);
    } else if (capture.outcome === 'pressure-changed-during-probe') {
      assert.equal(cell.mode, 'pressure'); assert.equal(probe.complete, true);
      assert.equal(summary.pressureEvidenceQualified, false); assert.equal(capture.failure.code, capture.outcome);
    }
  }
  return summary;
}
