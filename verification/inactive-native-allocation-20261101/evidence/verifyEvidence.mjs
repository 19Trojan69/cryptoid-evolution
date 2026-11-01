import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { summarizeNative, summarizePair, measured } from './summary.mjs';
const read = file => readFileSync(new URL('./' + file, import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(read('manifest.json'));
assert.equal(manifest.measuredSource, measured.source); assert.equal(manifest.measuredTree, measured.tree);
assert.equal(manifest.workflowConclusion, 'success');
assert.equal(manifest.rawOwnerReportsIncluded, false); assert.equal(manifest.rawHeapSnapshotsIncluded, false);
assert.equal(manifest.captures.length, 2);
const captures = [], summaries = [];
for (const entry of manifest.captures) {
  assert.ok(['short', 'long'].includes(entry.name));
  const bytes = read(entry.name + '-capture.json.gz');
  assert.equal(bytes.length, entry.compressedBytes); assert.equal(sha256(bytes), entry.sha256);
  const raw = gunzipSync(bytes); assert.equal(raw.length, entry.uncompressedBytes);
  assert.equal(sha256(raw), entry.originalJsonSha256);
  const capture = JSON.parse(raw);
  assert.equal(capture.requestedSeconds, entry.name === 'short' ? 60 : 1200);
  const trace = read(entry.name + '-native-memory.json.gz');
  summaries.push(summarizeNative(capture, trace)); captures.push(capture);
  assert.equal(entry.artifact.githubDigestMatched, true); assert.equal(entry.artifact.zipIntegrityPassed, true);
  assert.match(entry.artifact.sha256, /^[a-f0-9]{64}$/);
  assert.ok(Number.isSafeInteger(entry.artifact.bytes) && entry.artifact.bytes > bytes.length + trace.length);
  const heapBytes = read(entry.name + '-heaps.json');
  assert.equal(heapBytes.length, entry.heapAnalysis.bytes); assert.equal(sha256(heapBytes), entry.heapAnalysis.sha256);
  const analysis = JSON.parse(heapBytes);
  assert.equal(analysis.sourceCommit, measured.source); assert.equal(analysis.sourceTree, measured.tree);
  assert.equal(analysis.requestedSeconds, capture.requestedSeconds);
  assert.equal(analysis.originalDigestsSizesAndSummariesMatched, true);
  assert.equal(analysis.rawOwnerReportsIncluded, false); assert.equal(analysis.rawHeapSnapshotsIncluded, false);
  assert.equal(analysis.states.length, 2);
  for (const [index, state] of analysis.states.entries()) {
    const snapshot = capture.snapshots[index];
    assert.equal(state.label, snapshot.label); assert.equal(state.compressedSha256, snapshot.sha256);
    assert.equal(state.rawBytes, snapshot.bytes); assert.equal(state.graphNodes, snapshot.nodes);
    assert.equal(state.graphSelfBytes, snapshot.selfBytes);
  }
}
assert.equal(new Set(manifest.captures.map(row => row.artifact.id)).size, 2);
const result = JSON.parse(read('results.json'));
assert.equal(result.workflowRun, manifest.workflowRun); assert.equal(result.workflowConclusion, manifest.workflowConclusion);
assert.deepEqual(result.comparison, summarizePair(summaries));
console.log('CRYPTOID_INACTIVE_NATIVE_EVIDENCE ' + JSON.stringify({ source: measured.source,
  captures: captures.length, explicitNativeDumpsReparsed: summaries.reduce((n, row) => n + row.nativeCheckpoints.length, 0),
  heapAnalyses: captures.reduce((n, row) => n + row.snapshots.length, 0), whiteScreenFixed: false }));
