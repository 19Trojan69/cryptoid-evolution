import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { summarizeAttribution, measuredSource, measuredTree } from './attributionSummary.mjs';

const manifest = JSON.parse(readFileSync(new URL('./manifest.json', import.meta.url)));
const expected = JSON.parse(readFileSync(new URL('./results.json', import.meta.url)));
assert.equal(manifest.measuredSource, measuredSource); assert.equal(manifest.measuredTree, measuredTree);
assert.equal(manifest.rawOwnerReportsIncluded, false); assert.equal(manifest.rawHeapSnapshotsIncluded, false);
assert.equal(expected.workflowRun, manifest.workflowRun);
assert.equal(expected.workflowConclusion, manifest.workflowConclusion);
const summaries = [], captures = new Map();
for (const file of manifest.captures) {
  assert.match(file.file, /^(short|long)-capture\.json\.gz$/);
  const compressed = readFileSync(new URL('./' + file.file, import.meta.url));
  assert.equal(compressed.length, file.compressedBytes);
  assert.equal(createHash('sha256').update(compressed).digest('hex'), file.sha256);
  const bytes = gunzipSync(compressed); assert.equal(bytes.length, file.uncompressedBytes);
  const capture = JSON.parse(bytes); assert.equal(capture.requestedSeconds, file.requestedSeconds);
  summaries.push(summarizeAttribution(capture)); captures.set(file.requestedSeconds, capture);
}
for (const file of manifest.snapshotAnalyses) {
  assert.match(file.file, /^(short|long)-heap-comparison\.json$/);
  const bytes = readFileSync(new URL('./' + file.file, import.meta.url));
  assert.equal(bytes.length, file.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
  const analysis = JSON.parse(bytes), capture = captures.get(analysis.requestedSeconds);
  assert.ok(capture); assert.equal(analysis.sourceCommit, measuredSource);
  assert.equal(analysis.originalDigestsSizesAndSummariesMatched, true);
  assert.equal(analysis.rawOwnerReportsIncluded, false); assert.equal(analysis.rawHeapSnapshotsIncluded, false);
  assert.equal(analysis.states.length, capture.snapshots.length);
  for (const [index, state] of analysis.states.entries()) {
    const original = capture.snapshots[index];
    assert.equal(state.label, original.label); assert.equal(state.compressedSha256, original.sha256);
    assert.equal(state.rawBytes, original.bytes); assert.equal(state.graphNodes, original.nodes);
    assert.equal(state.graphSelfBytes, original.selfBytes);
  }
}
assert.deepEqual(expected.captures, summaries, 'Published results reproduce from the durable evidence');
assert.equal(expected.physicalPhoneAcceptanceEstablished, false); assert.equal(expected.whiteScreenFixed, false);
console.log('CRYPTOID_ATTRIBUTION_EVIDENCE ' + JSON.stringify({ captures: summaries.length,
  workflowConclusion: manifest.workflowConclusion,
  completedTwentyMinuteLinuxObservations: summaries.filter(row => row.completedTwentyMinuteLinuxObservation).length,
  allObservedHomeOwnershipReleased: summaries.every(row => row.observedHomeOwnershipReleased),
  physicalPhoneAcceptanceEstablished: false, whiteScreenFixed: false }));
