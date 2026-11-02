import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { summarizeNative } from '../../inactive-native-allocation-20261101/evidence/summary.mjs';
import { processPss } from '../../memory-retention-attribution-20261101/evidence/attributionSummary.mjs';
export const measured = { source: '600892649a97b4ade8530ca84a507fded5872d0e', tree: 'fa80782bee79c11359713424de689d9a8766ce0f' };
const builds = JSON.parse(readFileSync(new URL('./expected-builds.json', import.meta.url)));
const median = values => {
  const sorted = [...values].sort((a, b) => a - b), i = Math.floor(sorted.length / 2);
  assert.ok(sorted.length); return sorted.length % 2 ? sorted[i] : (sorted[i - 1] + sorted[i]) / 2;
};
const rank90 = values => [...values].sort((a, b) => a - b)[Math.ceil(values.length * .9) - 1];
const natural = value => Number.isSafeInteger(value) && value >= 0;

export function summarizeThrust(capture, trace, cell) {
  assert.ok(['control', 'leaf'].includes(cell.condition)); assert.ok([60, 1200].includes(cell.seconds));
  assert.ok([1, 2].includes(cell.replica)); if (cell.seconds === 60) assert.equal(cell.replica, 1);
  assert.equal(capture.requestedSeconds, cell.seconds);
  const native = summarizeNative(capture, trace, measured);
  assert.deepEqual(capture.thrustComparison, { condition: cell.condition, replica: cell.replica, fidelity: cell.seconds === 60 });
  assert.deepEqual(capture.thrustBuildProof, builds[cell.condition]);
  assert.equal(capture.activeStyleWriteProbe, false); assert.equal(capture.styleWriteObservation, undefined);
  assert.equal(capture.activeNativeApiWrappers, false);
  if (cell.seconds === 60) {
    const fidelity = capture.thrustFidelity; assert.equal(fidelity.condition, cell.condition);
    assert.ok(natural(fidelity.engines) && fidelity.engines > 0);
    for (const key of ['sameComputedFlameHeights', 'sameNativeAnimationInstances', 'sameNativeStartsAndRates',
      'originalInlineStylesRestored', 'nonconsumerSvgInheritanceRemovedInLeaf', 'onlyWhilePaused']) assert.equal(fidelity[key], true);
    assert.equal(fidelity.appOrAnimationClocksWritten, false); assert.equal(fidelity.newTimersOrFrames, false);
  } else assert.equal(capture.thrustFidelity, undefined, 'No fidelity mutations in long measurements');
  const values = capture.points.map(row => row.memory.summedPssKiB);
  const renderer = row => processPss(row.memory).byRoleKiB['chromium-renderer'];
  let integral = 0;
  for (let i = 1; i < capture.points.length; i++) {
    const a = capture.points[i - 1], b = capture.points[i];
    integral += (b.activeMs - a.activeMs) * (a.memory.summedPssKiB + b.memory.summedPssKiB) / 2;
  }
  const coveredActiveMs = capture.points.at(-1).activeMs; assert.ok(coveredActiveMs > 0);
  const first = capture.points.filter(row => row.activeMs < 60000), last = capture.points.filter(row => row.activeMs >= capture.observedActiveMs - 60000);
  return { cell, sourceCommit: measured.source, sourceTree: measured.tree,
    requestedSeconds: capture.requestedSeconds, observedActiveMs: native.observedActiveMs,
    observedWallMs: native.observedWallMs, volleysAdvanced: native.volleysAdvanced,
    engineVersion: native.engineVersion, actualInstalledPackages: native.actualInstalledPackages, lockSha256: native.lockSha256,
    longMemoryObservation: cell.seconds === 1200, shortFidelityOnly: cell.seconds === 60,
    fidelity: capture.thrustFidelity ?? null, originalBuildProof: capture.thrustBuildProof,
    processPssKiB: { ...native.processPssKiB, medianAllSamples: median(values), rank90Sample: rank90(values),
      trapezoidalMeanOverCoveredSamples: integral / coveredActiveMs, coveredActiveMs,
      unobservedTailMs: capture.observedActiveMs - coveredActiveMs,
      rendererFirstMinuteMedian: median(first.map(renderer)), rendererLastMinuteMedian: median(last.map(renderer)) },
    sampledMaxima: native.sampledMaxima,
    maxAudioClockStalls: Math.max(...capture.points.map(row => { assert.ok(natural(row.audio.audioClockStalls)); return row.audio.audioClockStalls; })),
    checkpoints: native.checkpoints, trace: native.trace, traceAttachmentPss: native.traceAttachmentPss,
    nativeCheckpoints: native.nativeCheckpoints.map(row => ({ label: row.label,
      pssBeforeDump: row.pssBeforeDump, pssAfterDump: row.pssAfterDump,
      uniqueProcesses: row.uniqueProcesses, fragments: row.fragments,
      rendererFragments: row.rendererFragments.map(p => ({ processId: p.processId, fragmentIndex: p.fragmentIndex,
        allocatorCount: p.allocatorCount, categories: p.categories, reportedSizesMustNotBeSummed: true })),
      gpuProcessFragments: row.gpuProcessFragments.map(p => ({ processId: p.processId, fragmentIndex: p.fragmentIndex,
        categories: p.categories, reportedSizesMustNotBeSummed: true })),
      blinkHeap: row.blinkObjectAndHeapDetails.map(p => ({ processId: p.processId, fragmentIndex: p.fragmentIndex,
        heap: p.rows.find(row => row.path === 'blink_gc/main/heap'), focusedGlobalObjectTypes: p.focusedGlobalObjectTypes })) })),
    observedHomeOwnershipReleased: native.observedHomeOwnershipReleased,
    physicalPhoneAcceptanceEstablished: false, whiteScreenFixed: false,
    limits: 'Independent unseeded Linux runs. Short inactive redistribution is fidelity only. Long samples are not exact peak/retained memory; allocator categories/fragments overlap. Dumps and GC influence inactive measurements.' };
}

export function summarizeCohort(rows) {
  assert.equal(rows.length, 6);
  const keys = rows.map(row => `${row.cell.condition}/${row.cell.seconds}/${row.cell.replica}`);
  assert.equal(new Set(keys).size, 6, 'No duplicated cell');
  for (const condition of ['control', 'leaf']) for (const [seconds, replica] of [[60, 1], [1200, 1], [1200, 2]])
    assert.ok(keys.includes(`${condition}/${seconds}/${replica}`), 'Every predeclared observation present');
  for (const row of rows) {
    assert.match(row.engineVersion, /^\d+\.\d+\.\d+\.\d+$/); assert.match(row.lockSha256, /^[a-f0-9]{64}$/);
    for (const name of ['react', 'react-dom', 'react-router-dom', 'vite', 'typescript'])
      assert.match(row.actualInstalledPackages?.[name], /^\d+\.\d+\.\d+/);
    for (const key of ['engineVersion', 'actualInstalledPackages', 'lockSha256']) assert.deepEqual(row[key], rows[0][key]);
  }
  const controls = rows.filter(row => row.cell.condition === 'control' && row.longMemoryObservation);
  const leaves = rows.filter(row => row.cell.condition === 'leaf' && row.longMemoryObservation);
  const belowBoth = get => Math.max(...leaves.map(get)) < Math.min(...controls.map(get));
  const blink = row => {
    const fragments = row.nativeCheckpoints.find(row => row.label === 'paused-settled-before-gc').rendererFragments;
    assert.equal(fragments.length, 1); assert.ok(Number.isFinite(fragments[0].categories.blink_gc));
    return fragments[0].categories.blink_gc;
  };
  return { captures: [...rows].sort((a, b) => a.cell.condition.localeCompare(b.cell.condition)
      || a.cell.seconds - b.cell.seconds || a.cell.replica - b.cell.replica),
    longObservations: 4, randomnessSeeded: false, pairedRenderWorkProven: false,
    leafBelowBothControls: {
      lastMinuteMedianPss: belowBoth(row => row.processPssKiB.lastMinuteMedian),
      sampledMeanPss: belowBoth(row => row.processPssKiB.trapezoidalMeanOverCoveredSamples),
      sampledPeakPss: belowBoth(row => row.processPssKiB.peakSample),
      firstToLastMinuteIncrease: belowBoth(row => row.processPssKiB.lastMinuteMedian - row.processPssKiB.firstMinuteMedian),
      pausedBlinkBeforeRequestedGc: belowBoth(blink) },
    allObservedHomeOwnershipReleased: rows.every(row => row.observedHomeOwnershipReleased),
    physicalPhoneAcceptanceEstablished: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false,
    limits: 'Ordering of two independent repetitions per condition is reported, not a general causal effect size or smartphone stability proof. No automatic repair acceptance is derived.' };
}
