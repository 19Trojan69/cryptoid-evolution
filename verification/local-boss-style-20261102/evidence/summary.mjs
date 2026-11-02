import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { summarizeNative } from '../../inactive-native-allocation-20261101/evidence/summary.mjs';
import { processPss } from '../../memory-retention-attribution-20261101/evidence/attributionSummary.mjs';
export const measured = { source: '8d5fe35e24d5b09b8ac4016a69b56368335b4c27', tree: '91d459326f736db7e83891ced5f00df203bc9c8a' };
const builds = JSON.parse(readFileSync(new URL('expected-builds.json', import.meta.url)));
const mean = values => { assert.ok(values.length); return values.reduce((a, b) => a + b, 0) / values.length; };
export function summarizeLocalStyles(capture, trace, cell) {
  assert.ok(['control', 'leaves'].includes(cell.condition)); assert.ok([60, 1200].includes(cell.seconds));
  assert.ok([1, 2].includes(cell.replica)); if (cell.seconds === 60) assert.equal(cell.replica, 1);
  assert.equal(capture.requestedSeconds, cell.seconds);
  const native = summarizeNative(capture, trace, measured);
  assert.equal(capture.thrustComparison, undefined); assert.equal(capture.thrustBuildProof, undefined);
  assert.equal(capture.activeStyleWriteProbe, false); assert.equal(capture.activeNativeApiWrappers, false);
  assert.equal(capture.styleWriteObservation, undefined); assert.equal(capture.activeNativeTracing, false);
  assert.deepEqual(capture.localStyleComparison, { condition: cell.condition, replica: cell.replica, fidelity: cell.seconds === 60 });
  assert.deepEqual(capture.localStyleBuildProof, builds[cell.condition]);
  if (cell.seconds === 60) {
    const f = capture.localStyleFidelity; assert.equal(f.condition, cell.condition);
    assert.ok(Number.isSafeInteger(f.engines) && f.engines > 0 && f.engines <= 16);
    assert.ok(Number.isSafeInteger(f.chargeConsumers) && f.chargeConsumers > 0 && f.chargeConsumers <= 32);
    for (const k of ['originalInlineDeclarationsRestored', 'sameNativeComputedValues', 'sameNativeAnimationsStartsAndRates',
      'originalFiringClassRetained', 'onlyWhilePaused']) assert.equal(f[k], true);
    assert.equal(f.appOrAnimationClocksWritten, false); assert.equal(f.newTimersOrFrames, false);
    assert.equal(f.computedOutputs.heights.length, f.engines); assert.equal(f.computedOutputs.opacities.length, f.chargeConsumers);
  } else assert.equal(capture.localStyleFidelity, undefined, 'No short redistribution mutation in the long observation');
  const renderer = point => processPss(point.memory).byRoleKiB['chromium-renderer'];
  const first = capture.points.filter(p => p.activeMs < 60000), last = capture.points.filter(p => p.activeMs >= capture.observedActiveMs - 60000);
  assert.ok(first.length >= 8 && last.length >= 8, 'Adequate real first/last-minute sample coverage');
  const rendererFirstMinuteMean = mean(first.map(renderer)), rendererLastMinuteMean = mean(last.map(renderer));
  return { cell, sourceCommit: measured.source, sourceTree: measured.tree,
    completeAttributionCapture: true, observedActiveMs: native.observedActiveMs, observedWallMs: native.observedWallMs,
    volleysAdvanced: native.volleysAdvanced, engineVersion: native.engineVersion,
    actualInstalledPackages: native.actualInstalledPackages, lockSha256: native.lockSha256,
    longMemoryObservation: cell.seconds === 1200, shortFidelityOnly: cell.seconds === 60,
    fidelity: capture.localStyleFidelity ?? null, buildProof: capture.localStyleBuildProof,
    rendererPssKiB: { firstMinuteSamples: first.length, lastMinuteSamples: last.length,
      firstMinuteMean: rendererFirstMinuteMean, lastMinuteMean: rendererLastMinuteMean,
      firstToLastMinuteGrowth: rendererLastMinuteMean - rendererFirstMinuteMean,
      sampledPeak: Math.max(...capture.points.map(renderer)),
      observedUntilActiveMs: capture.points.at(-1).activeMs,
      unobservedTailMs: capture.observedActiveMs - capture.points.at(-1).activeMs },
    totalBrowserPssKiB: native.processPssKiB,
    sampledMaxima: native.sampledMaxima, checkpoints: native.checkpoints, trace: native.trace,
    nativeCheckpoints: native.nativeCheckpoints.map(row => ({ label: row.label,
      pssBeforeDump: row.pssBeforeDump, pssAfterDump: row.pssAfterDump,
      rendererFragments: row.rendererFragments.map(p => ({ processId: p.processId, fragmentIndex: p.fragmentIndex,
        allocatorCount: p.allocatorCount, categories: p.categories, reportedSizesMustNotBeSummed: true })),
      blinkHeap: row.blinkObjectAndHeapDetails.map(p => ({ processId: p.processId, fragmentIndex: p.fragmentIndex,
        heap: p.rows.find(r => r.path === 'blink_gc/main/heap'), focusedGlobalObjectTypes: p.focusedGlobalObjectTypes })) })),
    observedHomeOwnershipReleased: native.observedHomeOwnershipReleased,
    physicalPhoneAcceptanceEstablished: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false,
    limits: 'Unseeded synthetic Linux runs; sampled renderer PSS is not exact peak, retained bytes or phone RAM. Native categories overlap and inactive dumps/GC influence memory.' };
}
export function compareLocalStyleCohort(rows) {
  assert.equal(rows.length, 6); const keys = rows.map(r => `${r.cell.condition}/${r.cell.seconds}/${r.cell.replica}`);
  assert.equal(new Set(keys).size, 6);
  for (const condition of ['control', 'leaves']) for (const [seconds, replica] of [[60, 1], [1200, 1], [1200, 2]])
    assert.ok(keys.includes(`${condition}/${seconds}/${replica}`));
  for (const r of rows) {
    assert.equal(r.completeAttributionCapture, true); assert.equal(r.sourceCommit, measured.source); assert.equal(r.sourceTree, measured.tree);
    assert.equal(r.longMemoryObservation, r.cell.seconds === 1200); assert.equal(r.shortFidelityOnly, r.cell.seconds === 60);
    assert.equal(r.observedHomeOwnershipReleased, true);
    assert.match(r.engineVersion, /^\d+\.\d+\.\d+\.\d+$/); assert.match(r.lockSha256, /^[a-f0-9]{64}$/);
    for (const name of ['react', 'react-dom', 'react-router-dom', 'vite', 'typescript']) assert.match(r.actualInstalledPackages?.[name], /^\d+\.\d+\.\d+/);
    for (const k of ['engineVersion', 'actualInstalledPackages', 'lockSha256']) assert.deepEqual(r[k], rows[0][k]);
    for (const k of ['firstMinuteMean', 'lastMinuteMean', 'sampledPeak']) assert.ok(Number.isFinite(r.rendererPssKiB[k]) && r.rendererPssKiB[k] >= 0);
    assert.equal(r.rendererPssKiB.firstToLastMinuteGrowth, r.rendererPssKiB.lastMinuteMean - r.rendererPssKiB.firstMinuteMean);
  }
  const controls = rows.filter(r => r.cell.condition === 'control' && r.longMemoryObservation), leaves = rows.filter(r => r.cell.condition === 'leaves' && r.longMemoryObservation);
  const belowBoth = key => Math.max(...leaves.map(r => r.rendererPssKiB[key])) < Math.min(...controls.map(r => r.rendererPssKiB[key]));
  const criteria = { sampledRendererPeak: belowBoth('sampledPeak'), lastMinuteRendererMean: belowBoth('lastMinuteMean'),
    firstToLastMinuteRendererGrowth: belowBoth('firstToLastMinuteGrowth') };
  return { captures: [...rows].sort((a, b) => a.cell.condition.localeCompare(b.cell.condition) || a.cell.seconds - b.cell.seconds || a.cell.replica - b.cell.replica),
    predeclaredActiveCriteria: criteria, repeatedActiveMemoryBenefitUnderDeclaredCriteria: Object.values(criteria).every(Boolean),
    physicalPhoneAcceptanceEstablished: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false,
    limits: 'Two independent unseeded runs per condition; no general effect size, native termination attribution, deployment approval or permanent phone stability inferred.' };
}
// Preserve an aborted active interval without inventing its missing twenty-
// minute tail, inactive allocator dump, snapshot, cleanup result or pause cause.
export function summarizeFailedLocalStyles(capture, cell) {
  assert.equal(capture.sourceCommit, measured.source); assert.equal(capture.sourceTree, measured.tree);
  assert.equal(capture.complete, false); assert.equal(capture.requestedSeconds, cell.seconds);
  assert.equal(cell.seconds, 1200); assert.ok(['control', 'leaves'].includes(cell.condition)); assert.ok([1, 2].includes(cell.replica));
  assert.deepEqual(capture.localStyleComparison, { condition: cell.condition, replica: cell.replica, fidelity: false });
  assert.deepEqual(capture.localStyleBuildProof, builds[cell.condition]);
  assert.equal(capture.activeStyleWriteProbe, false); assert.equal(capture.activeNativeApiWrappers, false);
  for (const k of ['physicalDevice', 'physicalPiBrowser', 'whiteScreenFixed', 'nativeTerminationCauseMeasured',
    'clocksAccelerated', 'automaticResume', 'fullRecording', 'activeHeapProfilerAttached', 'activeForcedGc',
    'activeHeapSnapshots', 'activeScreenshots', 'activeNativeAnimationScans', 'activeNativeTracing']) assert.equal(capture[k], false);
  assert.equal(capture.checkpoints.length, 0); assert.equal(capture.snapshots.length, 0);
  assert.equal(capture.inactiveNativeAllocation, undefined); assert.equal(capture.localStyleFidelity, undefined);
  assert.equal(capture.observedActiveMs, undefined); assert.equal(capture.observedWallMs, undefined);
  assert.ok(capture.failure?.code); assert.ok(typeof capture.failure.message === 'string' && capture.failure.message.length <= 4096);
  assert.ok(capture.points.length > 0); assert.equal(capture.points[0].activeMs, 0);
  for (const [i, p] of capture.points.entries()) {
    assert.ok(Number.isFinite(p.activeMs) && p.activeMs >= 0 && p.activeMs < cell.seconds * 1000);
    if (i) assert.ok(p.activeMs > capture.points[i - 1].activeMs);
    processPss(p.memory); assert.deepEqual(p.canvas.failures, []);
  }
  const renderer = p => processPss(p.memory).byRoleKiB['chromium-renderer'], last = capture.points.at(-1);
  const paused = capture.failure.code === 'attribution-failed' && capture.failure.message.includes("+ 'paused'") && capture.failure.message.includes("- 'playing'");
  return { cell, sourceCommit: measured.source, sourceTree: measured.tree, completeAttributionCapture: false,
    classification: paused ? 'unexpected-pause-during-active-observation' : 'active-protocol-failed',
    failure: capture.failure, completedMeasuredActiveMs: null,
    engineVersion: capture.engineVersion, actualInstalledPackages: capture.actualInstalledPackages, lockSha256: capture.lockSha256,
    longMemoryObservation: false, shortFidelityOnly: false,
    partialSamples: { count: capture.points.length,
      firstMinuteSamples: capture.points.filter(p => p.activeMs < 60000).length,
      firstMinuteRendererMeanKiB: mean(capture.points.filter(p => p.activeMs < 60000).map(renderer)),
      lastSampledActiveMs: last.activeMs, lastSampledCoreVolley: last.coreVolley,
      sampledRendererPeakKiB: Math.max(...capture.points.map(renderer)), lastSampledRendererKiB: renderer(last),
      sampledTotalBrowserPeakKiB: Math.max(...capture.points.map(p => p.memory.summedPssKiB)) },
    fullTwentyMinuteRendererMetrics: null, nativeMemoryMeasurement: null, heapAnalysis: null, observedHomeOwnershipReleased: null,
    lastFailureObservationAvailable: !!capture.lastObservation,
    physicalPhoneAcceptanceEstablished: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false,
    limits: 'Last sampled time is not exact failure time. This source does not save the final scene/clock in its catch. A pause after high PSS does not identify GC, clock-gap, OS pressure, a white screen or a native termination cause.' };
}
export function classifyLocalStyleCohort(rows) {
  assert.ok(rows.length >= 2 && rows.length <= 6);
  const keys = rows.map(r => `${r.cell.condition}/${r.cell.seconds}/${r.cell.replica}`); assert.equal(new Set(keys).size, rows.length);
  const shorts = rows.filter(r => r.cell.seconds === 60);
  assert.deepEqual(shorts.map(r => r.cell.condition).sort(), ['control', 'leaves']);
  assert.ok(shorts.every(r => r.completeAttributionCapture && r.shortFidelityOnly));
  const longs = rows.filter(r => r.cell.seconds === 1200), failed = longs.filter(r => !r.completeAttributionCapture);
  if (rows.length === 6 && failed.length === 0) return { classification: 'complete-paired-protocol', ...compareLocalStyleCohort(rows) };
  return { classification: failed.length ? 'incomplete-protocol-no-predeclared-memory-acceptance' : 'long-observation-pending',
    completedShortGates: shorts.length, completedLongObservations: longs.length - failed.length,
    failedLongObservations: failed.length, missingLongObservations: 4 - longs.length,
    predeclaredActiveCriteria: null, repeatedActiveMemoryBenefitUnderDeclaredCriteria: false,
    physicalPhoneAcceptanceEstablished: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false };
}
