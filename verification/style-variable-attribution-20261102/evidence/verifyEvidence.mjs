import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { summarizeStyle, measured } from './summary.mjs';
const read = file => readFileSync(new URL('./' + file, import.meta.url));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(read('manifest.json'));
assert.equal(manifest.measuredSource, measured.source); assert.equal(manifest.measuredTree, measured.tree);
assert.equal(manifest.workflowConclusion, 'success'); assert.equal(manifest.rawOwnerReportsIncluded, false);
assert.equal(manifest.rawHeapSnapshotsIncluded, false); assert.equal(manifest.artifact.githubDigestMatched, true);
assert.equal(manifest.artifact.zipIntegrityPassed, true); assert.equal(manifest.capture.file, 'capture.json.gz');
const compressed = read('capture.json.gz');
assert.equal(compressed.length, manifest.capture.compressedBytes); assert.equal(digest(compressed), manifest.capture.sha256);
const raw = gunzipSync(compressed); assert.equal(raw.length, manifest.capture.uncompressedBytes);
assert.equal(digest(raw), manifest.capture.originalJsonSha256);
const capture = JSON.parse(raw), result = JSON.parse(read('results.json'));
assert.equal(result.workflowRun, manifest.workflowRun); assert.equal(result.workflowConclusion, manifest.workflowConclusion);
assert.deepEqual(result.summary, summarizeStyle(capture));
const bytes = read('heaps.json'); assert.equal(bytes.length, manifest.heapAnalysis.bytes);
assert.equal(digest(bytes), manifest.heapAnalysis.sha256);
const heaps = JSON.parse(bytes); assert.equal(heaps.sourceCommit, measured.source); assert.equal(heaps.sourceTree, measured.tree);
assert.equal(heaps.requestedSeconds, 60); assert.equal(heaps.originalDigestsSizesAndSummariesMatched, true);
assert.equal(heaps.rawHeapSnapshotsIncluded, false); assert.equal(heaps.rawOwnerReportsIncluded, false);
assert.equal(heaps.states.length, 2);
for (const [index, row] of heaps.states.entries()) {
  const snapshot = capture.snapshots[index]; assert.equal(row.label, snapshot.label);
  assert.equal(row.compressedSha256, snapshot.sha256); assert.equal(row.rawBytes, snapshot.bytes);
  assert.equal(row.graphNodes, snapshot.nodes); assert.equal(row.graphSelfBytes, snapshot.selfBytes);
}
console.log('CRYPTOID_STYLE_WRITE_EVIDENCE ' + JSON.stringify({ source: measured.source,
  activeMs: capture.observedActiveMs, customPropertyCalls: result.summary.totals.calls,
  apiRestorationVerified: true, memoryComparisonEligible: false, whiteScreenFixed: false }));
