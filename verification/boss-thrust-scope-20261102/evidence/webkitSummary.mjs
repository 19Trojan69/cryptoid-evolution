import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
export const webkitMeasured = { source: '7254b8acb121497c6fcf708f19dbcbae95edd177', tree: '8cd5cac70de6e375a881d93ea086747c2d9dd26f' };
const builds = JSON.parse(readFileSync(new URL('./expected-builds.json', import.meta.url)));
export function summarizeWebKitFailure(capture, cell) {
  assert.equal(capture.sourceCommit, webkitMeasured.source); assert.equal(capture.sourceTree, webkitMeasured.tree);
  assert.equal(capture.complete, false); assert.equal(capture.engine, 'webkit'); assert.equal(capture.actualHostOS, 'linux');
  assert.equal(capture.requestedActiveSeconds, 60); assert.equal(capture.run, 'smoke');
  for (const key of ['physicalDevice', 'physicalPiBrowser', 'nativeTerminationCauseMeasured', 'whiteScreenFixed',
    'clocksAccelerated', 'automaticResume', 'activeScreenshots', 'forcedGc', 'heapSnapshots', 'memoryComparisonEligible']) assert.equal(capture[key], false);
  assert.equal(capture.shortEngineCompatibilityOnly, true);
  assert.ok(['control', 'leaf'].includes(cell.condition)); assert.ok([1, 2].includes(cell.replica));
  assert.deepEqual(capture.thrustComparison, { ...cell, fidelity: true });
  assert.deepEqual(capture.thrustBuildProof, builds[cell.condition]);
  assert.match(capture.failure.message, /No hidden\/unobserved interval accepted/);
  const completed = capture.cycles.filter(row => row.complete);
  for (const row of completed) {
    assert.ok(row.observedActiveMs >= row.requestedMs); assert.ok(row.volleysAdvanced > 0);
    for (const key of ['pauseFreezeVerified', 'weaponRoundtripVerified', 'qaInspectionBridgeReleased', 'normalExitVerified']) assert.equal(row[key], true);
    assert.equal(row.thrustFidelity.condition, cell.condition);
    for (const key of ['sameComputedFlameHeights', 'sameNativeAnimationInstances', 'sameNativeStartsAndRates',
      'originalInlineStylesRestored', 'nonconsumerSvgInheritanceRemovedInLeaf', 'onlyWhilePaused']) assert.equal(row.thrustFidelity[key], true);
    assert.equal(row.thrustFidelity.appOrAnimationClocksWritten, false);
  }
  const last = capture.lastObservation, clock = last.clock.latest;
  assert.ok(Number.isSafeInteger(clock.unobservedGaps) && clock.unobservedGaps > 0);
  assert.equal(capture.cycles.at(-1).complete, false); assert.notEqual(capture.normalReportVerified, true);
  return { cell, sourceCommit: webkitMeasured.source, sourceTree: webkitMeasured.tree, engineVersion: capture.engineVersion,
    protocolAccepted: false, recordedClockGapGateFailure: true, failedCycle: capture.cycles.at(-1).cycle,
    completedUiCycles: completed.length, completedMeasuredActiveMs: completed.map(row => row.observedActiveMs),
    nativeFidelityPasses: completed.map(row => row.thrustFidelity),
    lastState: { gameStatus: last.scene.status, technicalPause: last.scene.technicalPause,
      clockMode: clock.mode, unobservedClockGaps: clock.unobservedGaps, savedClockElapsedMs: clock.elapsedMs },
    nativeCrashOrWhitePixelsMeasured: false, gameFreezeProven: false,
    memoryComparisonEligible: false, physicalPhoneAcceptanceEstablished: false, whiteScreenFixed: false,
    limits: 'A failed startup/remount clock-coverage gate is preserved as failed. Completed earlier UI/fidelity cycles do not complete the full protocol or establish a physical iPhone freeze, native crash or White Screen cause.' };
}
