import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { summarizeCohort, summarizeIsolated } from './summary.mjs';
const manifest = JSON.parse(readFileSync(new URL('./manifest.json', import.meta.url)));
const expected = { source: manifest.measuredSource, tree: manifest.measuredTree }, items = [];
assert.equal(manifest.rawOwnerReportsIncluded, false); assert.equal(manifest.rawHeapSnapshotsIncluded, false);
for (const entry of manifest.captures) {
  assert.match(entry.file, /^(control|bypass)-(short|r[12]-long)\.json\.gz$/);
  const compressed = readFileSync(new URL('./' + entry.file, import.meta.url));
  assert.equal(compressed.length, entry.compressedBytes);
  assert.equal(createHash('sha256').update(compressed).digest('hex'), entry.sha256);
  const raw = gunzipSync(compressed); assert.equal(raw.length, entry.uncompressedBytes);
  assert.equal(createHash('sha256').update(raw).digest('hex'), entry.originalJsonSha256);
  const capture = JSON.parse(raw); summarizeIsolated(capture, expected, entry.cell);
  items.push({ capture, cell: entry.cell });
}
for (const file of manifest.snapshotAnalyses) {
  assert.match(file.file, /^(control|bypass)-(short|r[12]-long)-heaps\.json$/);
  const bytes = readFileSync(new URL('./' + file.file, import.meta.url));
  assert.equal(bytes.length, file.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
  const analysis = JSON.parse(bytes), item = items.find(item => JSON.stringify(item.cell) === JSON.stringify(analysis.cell));
  assert.ok(item); assert.equal(analysis.sourceCommit, expected.source); assert.equal(analysis.sourceTree, expected.tree);
  assert.equal(analysis.originalDigestsSizesAndSummariesMatched, true);
  assert.equal(analysis.rawOwnerReportsIncluded, false); assert.equal(analysis.rawHeapSnapshotsIncluded, false);
  for (const [index, state] of analysis.states.entries()) {
    const snapshot = item.capture.snapshots[index];
    assert.equal(state.compressedSha256, snapshot.sha256); assert.equal(state.rawBytes, snapshot.bytes);
    assert.equal(state.graphNodes, snapshot.nodes); assert.equal(state.graphSelfBytes, snapshot.selfBytes);
  }
}
const result = JSON.parse(readFileSync(new URL('./results.json', import.meta.url)));
if (manifest.figure) {
  assert.equal(manifest.figure.file, 'process-memory.png');
  const bytes = readFileSync(new URL('./process-memory.png', import.meta.url));
  assert.equal(bytes.length, manifest.figure.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.figure.sha256);
}
assert.equal(result.workflowRun, manifest.workflowRun); assert.equal(result.workflowConclusion, manifest.workflowConclusion);
if (manifest.workflowConclusion === 'in_progress') {
  assert.deepEqual(result.shortCaptures, items.map(item => summarizeIsolated(item.capture, expected, item.cell)));
  assert.equal(result.cohortComplete, false);
} else {
  assert.equal(manifest.workflowConclusion, 'success'); assert.equal(manifest.snapshotAnalyses.length, 6);
  assert.deepEqual(result.comparison, summarizeCohort(items, expected)); assert.equal(result.cohortComplete, true);
}
console.log('CRYPTOID_ISOLATED_EVIDENCE ' + JSON.stringify({ captures: items.length,
  workflowConclusion: manifest.workflowConclusion, cohortComplete: result.cohortComplete, whiteScreenFixed: false }));
