import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { summarizeAttribution, measuredSource, measuredTree } from './attributionSummary.mjs';

const manifest = JSON.parse(readFileSync(new URL('./manifest.json', import.meta.url)));
const expected = JSON.parse(readFileSync(new URL('./results.json', import.meta.url)));
assert.equal(manifest.measuredSource, measuredSource); assert.equal(manifest.measuredTree, measuredTree);
assert.equal(manifest.rawOwnerReportsIncluded, false); assert.equal(manifest.rawHeapSnapshotsIncluded, false);
const summaries = [];
for (const file of manifest.captures) {
  assert.match(file.file, /^(short|long)-capture\.json\.gz$/);
  const compressed = readFileSync(new URL('./' + file.file, import.meta.url));
  assert.equal(compressed.length, file.compressedBytes);
  assert.equal(createHash('sha256').update(compressed).digest('hex'), file.sha256);
  const bytes = gunzipSync(compressed); assert.equal(bytes.length, file.uncompressedBytes);
  const capture = JSON.parse(bytes); assert.equal(capture.requestedSeconds, file.requestedSeconds);
  summaries.push(summarizeAttribution(capture));
}
assert.deepEqual(expected.captures, summaries, 'Published results reproduce from the durable evidence');
assert.equal(expected.physicalPhoneAcceptanceEstablished, false); assert.equal(expected.whiteScreenFixed, false);
console.log('CRYPTOID_ATTRIBUTION_EVIDENCE ' + JSON.stringify({ captures: summaries.length,
  completedTwentyMinuteLinuxObservations: summaries.filter(row => row.completedTwentyMinuteLinuxObservation).length,
  allObservedHomeOwnershipReleased: summaries.every(row => row.observedHomeOwnershipReleased),
  physicalPhoneAcceptanceEstablished: false, whiteScreenFixed: false }));
