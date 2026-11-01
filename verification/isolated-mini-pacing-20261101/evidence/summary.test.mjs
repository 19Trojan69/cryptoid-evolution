import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { summarizeIsolated, summarizeCohort } from './summary.mjs';
const expected = { source: '668d4115716bdb425947c4847e70113e8c497990', tree: 'cb0bed431f842cad4067e23ebb3e2036c243b04c' };
const capture = condition => JSON.parse(gunzipSync(readFileSync(new URL('./' + condition + '-short.json.gz', import.meta.url))));
const cell = condition => ({ condition, seconds: 60, replica: 1 });
const cohort = () => ['control', 'bypass'].flatMap(condition =>
  [['short', 60, 1], ['r1-long', 1200, 1], ['r2-long', 1200, 2]].map(([suffix, seconds, replica]) =>
    ({ cell: { condition, seconds, replica }, capture: JSON.parse(gunzipSync(readFileSync(
      new URL('./' + condition + '-' + suffix + '.json.gz', import.meta.url)))) })));

test('both actual full-original short captures prove the intended path without becoming long-run memory evidence', () => {
  for (const condition of ['control', 'bypass']) {
    const row = summarizeIsolated(capture(condition), expected, cell(condition));
    assert.equal(row.pathProofOnly, true); assert.equal(row.completedTwentyMinuteLinuxObservation, false);
    assert.equal(row.observedHomeOwnershipReleased, true); assert.equal(row.whiteScreenFixed, false);
  }
});
test('wrong source, wrong condition and mixed-in earlier visual changes cannot enter the cohort', () => {
  for (const change of [row => row.sourceCommit = '0'.repeat(40), row => row.sourceTree = '0'.repeat(40),
    row => row.isolatedMiniPacing.condition = 'control', row => row.isolatedBuildProof.allEarlierVisualControlsOff = false,
    row => row.condition = 'flat-live-scene', row => row.isolatedBuildProof.originalMiniMarkupAndCompletionRetained = false]) {
    const row = capture('bypass'); change(row);
    assert.throws(() => summarizeIsolated(row, expected, cell('bypass')));
  }
});
test('zero start events, missing original completion inspection and nonzero bypass calls invalidate native proof', () => {
  for (const change of [row => row.isolatedMiniNativeProof.miniStartEvents = 0,
    row => row.isolatedMiniNativeProof.miniEndEvents = 0, row => row.isolatedMiniNativeProof.miniQueriesTotal = 0,
    row => row.isolatedMiniNativeProof.miniQueriesAtStart = 1, row => row.isolatedMiniNativeProof.miniTimingUpdates = 1]) {
    const row = capture('bypass'); change(row);
    assert.throws(() => summarizeIsolated(row, expected, cell('bypass')));
  }
});
test('short results and probe-contaminated results cannot be relabeled as long observations', () => {
  const row = capture('bypass'); row.requestedSeconds = 1200; row.isolatedMiniPacing.pathProof = false;
  const long = { condition: 'bypass', replica: 1, seconds: 1200 };
  assert.throws(() => summarizeIsolated(row, expected, long), /No native wrapper/);
  delete row.isolatedMiniNativeProof;
  assert.throws(() => summarizeIsolated(row, expected, long));
});
test('missing and duplicate observation cells cannot make a complete repeated comparison', () => {
  const item = { capture: capture('control'), cell: cell('control') };
  assert.throws(() => summarizeCohort([item], expected));
  assert.throws(() => summarizeCohort(Array.from({ length: 6 }, () => structuredClone(item)), expected), /Duplicate/);
});
test('the six actual captures reproduce the negative result without promoting any phone acceptance', () => {
  const result = summarizeCohort(cohort(), expected);
  assert.equal(result.captures.filter(row => !row.pathProofOnly).length, 4);
  assert.equal(result.bypassLastMinutePssBelowBothControls, false);
  assert.ok(result.captures.filter(row => !row.pathProofOnly).every(row => row.volleysAdvanced === 428));
  assert.equal(result.physicalPhoneAcceptanceEstablished, false); assert.equal(result.whiteScreenFixed, false);
});
test('absent or mismatched engine, lock and installed-package evidence cannot become a matched cohort', () => {
  for (const key of ['engineVersion', 'lockSha256', 'actualInstalledPackages']) {
    const items = cohort(); for (const item of items) delete item.capture[key];
    assert.throws(() => summarizeCohort(items, expected), key);
  }
  const mixed = cohort(); mixed[3].capture.actualInstalledPackages.react = '0.0.0';
  assert.throws(() => summarizeCohort(mixed, expected));
});
