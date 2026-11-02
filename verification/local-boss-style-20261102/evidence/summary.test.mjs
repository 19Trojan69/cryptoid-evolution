import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { summarizeLocalStyles, compareLocalStyleCohort, measured } from './summary.mjs';
const read = file => readFileSync(new URL(file, import.meta.url));
function actual(condition) {
  const name = condition + '-r1-60';
  return { c: JSON.parse(gunzipSync(read(name + '.json.gz'))), trace: read(name + '-native.json.gz'), cell: { condition, seconds: 60, replica: 1 } };
}
function fixture() {
  return ['control', 'leaves'].flatMap(condition => [[60, 1], [1200, 1], [1200, 2]].map(([seconds, replica]) => {
    const first = condition === 'control' ? 300 : 200, last = condition === 'control' ? 600 : 250;
    return { cell: { condition, seconds, replica }, sourceCommit: measured.source, sourceTree: measured.tree,
      completeAttributionCapture: true, longMemoryObservation: seconds === 1200, shortFidelityOnly: seconds === 60,
      observedHomeOwnershipReleased: true, engineVersion: '151.0.7922.34', lockSha256: 'a'.repeat(64),
      actualInstalledPackages: Object.fromEntries(['react', 'react-dom', 'react-router-dom', 'vite', 'typescript'].map(n => [n, '1.2.3'])),
      rendererPssKiB: { firstMinuteMean: first, lastMinuteMean: last, firstToLastMinuteGrowth: last - first, sampledPeak: last + 20 } };
  }));
}
test('predeclared active peak, late mean and growth must each improve in both repetitions over both controls', () => {
  const result = compareLocalStyleCohort(fixture()); assert.equal(result.repeatedActiveMemoryBenefitUnderDeclaredCriteria, true);
  assert.equal(result.physicalPhoneAcceptanceEstablished, false); assert.equal(result.whiteScreenFixed, false);
  for (const key of ['sampledPeak', 'lastMinuteMean', 'firstToLastMinuteGrowth']) {
    const rows = fixture(), leaf = rows.at(-1), original = rows[1];
    if (key === 'firstToLastMinuteGrowth') { leaf.rendererPssKiB.firstMinuteMean = 0; leaf.rendererPssKiB.lastMinuteMean = 350; leaf.rendererPssKiB.firstToLastMinuteGrowth = 350; }
    else { leaf.rendererPssKiB[key] = original.rendererPssKiB[key]; leaf.rendererPssKiB.firstToLastMinuteGrowth = leaf.rendererPssKiB.lastMinuteMean - leaf.rendererPssKiB.firstMinuteMean; }
    assert.equal(compareLocalStyleCohort(rows).repeatedActiveMemoryBenefitUnderDeclaredCriteria, false);
  }
});
test('short records, duplicated cells, missing cleanup and mixed engine/source identities cannot become a repeated active improvement', () => {
  assert.throws(() => compareLocalStyleCohort(fixture().slice(0, 2)));
  for (const change of [r => r[5] = r[4], r => r[0].observedHomeOwnershipReleased = false,
    r => r[3].engineVersion = '152.0.0.1', r => r[4].sourceCommit = '0'.repeat(40),
    r => r[5].longMemoryObservation = false, r => r[2].completeAttributionCapture = false]) {
    const rows = fixture(); change(rows); assert.throws(() => compareLocalStyleCohort(rows));
  }
});
test('both real short captures reparse their native evidence, exact built distribution and completed home ownership release without becoming long evidence', () => {
  for (const condition of ['control', 'leaves']) {
    const { c, trace, cell } = actual(condition), s = summarizeLocalStyles(c, trace, cell);
    assert.equal(s.longMemoryObservation, false); assert.equal(s.shortFidelityOnly, true);
    assert.equal(s.fidelity.sameNativeComputedValues, true); assert.equal(s.observedHomeOwnershipReleased, true);
    assert.equal(s.whiteScreenFixed, false); assert.throws(() => compareLocalStyleCohort([s]));
    assert.throws(() => summarizeLocalStyles(c, trace, { ...cell, seconds: 1200 }));
  }
});
test('active profiling, changed artwork, incomplete native traces, unaccounted process bytes or failed fidelity cannot pass the captured protocol', () => {
  for (const change of [c => c.activeForcedGc = true, c => c.localStyleBuildProof.originalMemoizedArtworkRetained = false,
    c => c.localStyleFidelity.sameNativeAnimationsStartsAndRates = false,
    c => c.inactiveNativeAllocation.trace.dataLossOccurred = true, c => c.automaticResume = true,
    c => c.points[0].memory.summedPssKiB++, c => c.complete = false]) {
    const { c, trace, cell } = actual('leaves'); change(c); assert.throws(() => summarizeLocalStyles(c, trace, cell));
  }
  const { c, trace, cell } = actual('control'); assert.throws(() => summarizeLocalStyles(c, trace.subarray(1), cell));
});
