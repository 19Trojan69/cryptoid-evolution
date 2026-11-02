import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { summarizeThrust, summarizeCohort } from './summary.mjs';
import { summarizeWebKitFailure } from './webkitSummary.mjs';
const read = file => readFileSync(new URL('./' + file, import.meta.url));
const capture = condition => JSON.parse(gunzipSync(read(condition + '-short.json.gz')));
const trace = condition => read(condition + '-short-native.json.gz');
const short = condition => ({ condition, replica: 1, seconds: 60 });
test('both actual short native captures prove redistribution and retirement without becoming long memory evidence', () => {
  for (const condition of ['control', 'leaf']) {
    const r = summarizeThrust(capture(condition), trace(condition), short(condition));
    assert.equal(r.shortFidelityOnly, true); assert.equal(r.longMemoryObservation, false);
    assert.equal(r.fidelity.sameComputedFlameHeights, true); assert.equal(r.whiteScreenFixed, false);
  }
});
test('wrong source, mixed condition and any active observer cannot enter the comparison', () => {
  for (const mutate of [row => row.sourceCommit = '0'.repeat(40), row => row.sourceTree = '0'.repeat(40),
    row => row.thrustComparison.condition = 'control', row => row.activeStyleWriteProbe = true,
    row => row.activeNativeApiWrappers = true, row => row.thrustBuildProof.transformedBlob = '0'.repeat(40)]) {
    const row = capture('leaf'); mutate(row); assert.throws(() => summarizeThrust(row, trace('leaf'), short('leaf')));
  }
});
test('missing native fidelity, altered heights or lost data cannot masquerade as a completed short gate', () => {
  for (const mutate of [row => delete row.thrustFidelity, row => row.thrustFidelity.sameComputedFlameHeights = false,
    row => row.thrustFidelity.originalInlineStylesRestored = false, row => row.inactiveNativeAllocation.trace.dataLossOccurred = true]) {
    const row = capture('leaf'); mutate(row); assert.throws(() => summarizeThrust(row, trace('leaf'), short('leaf')));
  }
});
test('shorts cannot be relabeled as long observations or duplicated into a complete repetition cohort', () => {
  const row = capture('leaf'); row.requestedSeconds = 1200; row.thrustComparison.fidelity = false; delete row.thrustFidelity;
  assert.throws(() => summarizeThrust(row, trace('leaf'), { condition: 'leaf', replica: 1, seconds: 1200 }));
  const r = summarizeThrust(capture('leaf'), trace('leaf'), short('leaf'));
  assert.throws(() => summarizeCohort([r])); assert.throws(() => summarizeCohort(Array.from({ length: 6 }, () => structuredClone(r))));
});
const webkit = (condition, replica) => JSON.parse(gunzipSync(read(`webkit-${condition}-r${replica}.json.gz`)));
test('all four failed WebKit reports remain failed; two earlier control UI/fidelity cycles remain visible', () => {
  const results = ['control', 'leaf'].flatMap(condition => [1, 2].map(replica =>
    summarizeWebKitFailure(webkit(condition, replica), { condition, replica })));
  assert.ok(results.every(row => row.protocolAccepted === false && row.recordedClockGapGateFailure));
  assert.equal(results.find(row => row.cell.condition === 'control' && row.cell.replica === 2).completedUiCycles, 2);
  assert.ok(results.every(row => row.nativeCrashOrWhitePixelsMeasured === false && row.whiteScreenFixed === false));
});
test('false completion, hidden clock gaps, wrong WebKit sources and a broken partial fidelity cannot be published', () => {
  for (const mutate of [row => row.complete = true, row => row.sourceCommit = '0'.repeat(40),
    row => row.lastObservation.clock.latest.unobservedGaps = 0, row => row.cycles[0].thrustFidelity.sameComputedFlameHeights = false]) {
    const row = webkit('control', 2); mutate(row);
    assert.throws(() => summarizeWebKitFailure(row, { condition: 'control', replica: 2 }));
  }
});
const cohort = () => ['control', 'leaf'].flatMap(condition => [[60, 1], [1200, 1], [1200, 2]].map(([seconds, replica]) => {
  const name = seconds === 60 ? condition + '-short' : condition + '-r' + replica + '-long';
  return summarizeThrust(JSON.parse(gunzipSync(read(name + '.json.gz'))), read(name + '-native.json.gz'), { condition, seconds, replica });
}));
test('all six actual captures preserve the mixed result rather than turning lower absolute endpoints into an automatic fix', () => {
  const result = summarizeCohort(cohort());
  assert.equal(result.longObservations, 4); assert.equal(result.leafBelowBothControls.lastMinuteMedianPss, true);
  assert.equal(result.leafBelowBothControls.firstToLastMinuteIncrease, false);
  assert.equal(result.leafBelowBothControls.pausedBlinkBeforeRequestedGc, false);
  assert.ok(result.captures.filter(row => row.longMemoryObservation).every(row => row.volleysAdvanced === 428));
  assert.equal(result.physicalPhoneAcceptanceEstablished, false); assert.equal(result.whiteScreenFixed, false);
});
test('missing or mismatched actual engine/package/lock evidence cannot become a matched cohort', () => {
  const base = cohort();
  for (const key of ['engineVersion', 'lockSha256', 'actualInstalledPackages']) {
    const copy = structuredClone(base); for (const row of copy) delete row[key];
    assert.throws(() => summarizeCohort(copy));
  }
  const changed = structuredClone(base); changed[3].actualInstalledPackages.react = '0.0.0';
  assert.throws(() => summarizeCohort(changed));
});
