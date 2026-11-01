import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { processPss, summarizeAttribution } from './attributionSummary.mjs';

const capture = () => JSON.parse(gunzipSync(readFileSync(new URL('./short-capture.json.gz', import.meta.url))));
test('real complete short capture verifies cleanup without becoming a twenty-minute or phone pass', () => {
  const result = summarizeAttribution(capture());
  assert.equal(result.observedActiveMs, 60000); assert.equal(result.completeAttributionCapture, true);
  assert.equal(result.completedTwentyMinuteLinuxObservation, false);
  assert.equal(result.observedHomeOwnershipReleased, true);
  assert.equal(result.whiteScreenFixed, false); assert.equal(result.permanentLeakProven, false);
  assert.equal(result.physicalPhoneAcceptanceEstablished, false);
});
test('wrong source, unfinished data and a relabeled short capture cannot pass', () => {
  for (const change of [row => row.sourceCommit = '0'.repeat(40), row => row.complete = false,
    row => row.requestedSeconds = 1200, row => row.points.splice(-3), row => row.points[2].activeMs = row.points[1].activeMs,
    row => row.checkpoints.splice(2, 1), row => row.failure = { code: 'renderer-crash' }]) {
    const row = capture(); change(row); assert.throws(() => summarizeAttribution(row));
  }
});
test('active profiling, altered cleanup and missing sample coverage invalidate the comparison', () => {
  for (const change of [row => row.activeForcedGc = true, row => row.activeHeapProfilerAttached = true,
    row => row.activeNativeAnimationScans = true, row => row.buildProof.cleanupPolicyChanged = true,
    row => row.points.splice(1, 4), row => row.checkpoints[6].forcedGc = false,
    row => row.checkpoints[4].sameGameDocument = false]) {
    const row = capture(); change(row); assert.throws(() => summarizeAttribution(row));
  }
});
test('a held Home resource remains a failed ownership observation, not a hidden capture error', () => {
  const row = capture(); row.checkpoints.find(point => point.label === 'home-after-gc').stats.painted.retainCount = 1;
  const result = summarizeAttribution(row);
  assert.equal(result.completeAttributionCapture, true); assert.equal(result.observedHomeOwnershipReleased, false);
});
test('missing PSS, incomplete process sums and graphics failure counters cannot be accepted', () => {
  const row = capture(), memory = row.points[0].memory;
  assert.equal(processPss(memory).totalKiB, memory.summedPssKiB);
  const missing = structuredClone(memory); missing.processes[0].pssKiB = null;
  assert.throws(() => processPss(missing));
  const partial = structuredClone(memory); partial.processes.pop();
  assert.throws(() => processPss(partial));
  row.points[0].canvas.failures = ['synthetic-context-lost'];
  assert.throws(() => summarizeAttribution(row));
});
