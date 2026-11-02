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
