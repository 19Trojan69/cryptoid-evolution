import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { summarizeAttribution } from '../../memory-retention-attribution-20261101/evidence/attributionSummary.mjs';
import { comparisonProof, assertPathProof } from '../comparison.mjs';

const pacing = readFileSync(new URL('../../../frontend/src/lib/cssFramePacing.ts', import.meta.url), 'utf8');
export function summarizeIsolated(capture, expected, cell) {
  assert.ok(['control', 'bypass'].includes(cell.condition));
  assert.ok([1, 2].includes(cell.replica)); assert.ok([60, 1200].includes(cell.seconds));
  const short = cell.seconds === 60;
  assert.deepEqual(capture.isolatedMiniPacing, { condition: cell.condition, replica: cell.replica, pathProof: short });
  assert.equal(capture.requestedSeconds, cell.seconds);
  assert.deepEqual(capture.isolatedBuildProof, comparisonProof(pacing, cell.condition));
  if (short) {
    assertPathProof(capture.isolatedMiniNativeProof, cell.condition);
    assert.ok(capture.isolatedMiniNativeProof.miniQueriesTotal > 0,
      'Original completion inspection remains observed even when start registration is bypassed');
  } else assert.equal(capture.isolatedMiniNativeProof, undefined, 'No native wrapper observations in long memory runs');
  return { condition: cell.condition, replica: cell.replica, pathProofOnly: short,
    nativePathProof: short ? capture.isolatedMiniNativeProof : null,
    ...summarizeAttribution(capture, expected) };
}

export function summarizeCohort(items, expected) {
  assert.equal(items.length, 6, 'Two short path proofs and four independent long observations');
  const seen = new Set();
  const rows = items.map(({ capture, cell }) => {
    const key = [cell.condition, cell.seconds, cell.replica].join(':');
    assert.ok(!seen.has(key), 'Duplicate observation cell'); seen.add(key);
    return summarizeIsolated(capture, expected, cell);
  });
  for (const condition of ['control', 'bypass']) {
    assert.ok(seen.has(condition + ':60:1'));
    for (const replica of [1, 2]) assert.ok(seen.has(condition + ':1200:' + replica));
  }
  const reference = items[0].capture;
  assert.match(reference.engineVersion, /^\d+\.\d+\.\d+\.\d+$/);
  assert.match(reference.lockSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(Object.keys(reference.actualInstalledPackages).sort(), ['react', 'react-dom', 'react-router-dom', 'typescript', 'vite']);
  for (const version of Object.values(reference.actualInstalledPackages)) assert.match(version, /^\d+\.\d+\.\d+(?:[-+].+)?$/);
  for (const { capture } of items) {
    assert.equal(capture.engineVersion, reference.engineVersion);
    assert.equal(capture.lockSha256, reference.lockSha256);
    assert.deepEqual(capture.actualInstalledPackages, reference.actualInstalledPackages);
  }
  const longs = rows.filter(row => !row.pathProofOnly);
  const range = values => ({ minimum: Math.min(...values), maximum: Math.max(...values) });
  const conditions = Object.fromEntries(['control', 'bypass'].map(condition => {
    const group = longs.filter(row => row.condition === condition);
    return [condition, { replicas: group.length,
      firstMinuteMedianPssKiB: range(group.map(row => row.processPssKiB.firstMinuteMedian)),
      lastMinuteMedianPssKiB: range(group.map(row => row.processPssKiB.lastMinuteMedian)),
      growthPssKiB: range(group.map(row => row.processPssKiB.lastMinuteMedian - row.processPssKiB.firstMinuteMedian)),
      pausedAfterGcPssKiB: range(group.map(row => row.checkpoints.find(c => c.label === 'paused-after-gc').pss.totalKiB)),
      cssConfigurationsCumulative: range(group.map(row => row.sampledMaxima.cssConfiguredCumulative)),
      homeOwnershipReleasedInBoth: group.every(row => row.observedHomeOwnershipReleased) }];
  }));
  return { sourceCommit: expected.source, sourceTree: expected.tree, captures: rows, conditions,
    bypassLastMinutePssBelowBothControls: conditions.bypass.lastMinuteMedianPssKiB.maximum
      < conditions.control.lastMinuteMedianPssKiB.minimum,
    interpretation: 'Two unseeded repetitions per condition; scalar ranges only, no significance estimate, matched random workload, native allocator attribution or physical smartphone acceptance.',
    nativeTerminationCauseMeasured: false, physicalPhoneAcceptanceEstablished: false, whiteScreenFixed: false };
}
