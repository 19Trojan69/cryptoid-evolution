import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { summarizeThrust, summarizeCohort, measured } from './summary.mjs';
import { summarizeWebKitFailure, webkitMeasured } from './webkitSummary.mjs';
const read = file => readFileSync(new URL('./' + file, import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(read('manifest.json')), results = JSON.parse(read('results.json'));
assert.equal(manifest.rawOwnerReportsIncluded, false); assert.equal(manifest.rawHeapSnapshotsIncluded, false);
const checkFile = entry => {
  const bytes = read(entry.file); assert.equal(bytes.length, entry.bytes); assert.equal(sha256(bytes), entry.sha256); return bytes;
};
checkFile(manifest.expectedBuilds);
const capture = entry => {
  assert.equal(entry.artifact.githubDigestMatched, true); assert.equal(entry.artifact.zipIntegrityPassed, true);
  assert.ok(Number.isSafeInteger(entry.artifact.id) && entry.artifact.id > 0);
  assert.match(entry.artifact.sha256, /^[a-f0-9]{64}$/);
  const raw = gunzipSync(checkFile(entry)); assert.equal(raw.length, entry.uncompressedBytes);
  assert.equal(sha256(raw), entry.originalJsonSha256); return JSON.parse(raw);
};
assert.equal(manifest.chromium.measuredSource, measured.source); assert.equal(manifest.chromium.measuredTree, measured.tree);
assert.equal(manifest.chromium.conclusion, 'success'); assert.equal(manifest.chromium.captures.length, 6);
const summaries = [];
for (const entry of manifest.chromium.captures) {
  assert.match(entry.file, /^(control|leaf)-(short|r[12]-long)\.json\.gz$/);
  const c = capture(entry); summaries.push(summarizeThrust(c, checkFile(entry.nativeTrace), entry.cell));
  const analysis = JSON.parse(checkFile(entry.heapAnalysis));
  assert.equal(analysis.sourceCommit, measured.source); assert.equal(analysis.sourceTree, measured.tree);
  assert.deepEqual(analysis.cell, entry.cell); assert.equal(analysis.originalDigestsSizesAndSummariesMatched, true);
  assert.equal(analysis.rawHeapSnapshotsIncluded, false); assert.equal(analysis.rawOwnerReportsIncluded, false);
  assert.equal(analysis.states.length, 2);
  for (const [index, row] of analysis.states.entries()) {
    const snapshot = c.snapshots[index]; assert.equal(row.label, snapshot.label);
    assert.equal(row.compressedSha256, snapshot.sha256); assert.equal(row.rawBytes, snapshot.bytes);
    assert.equal(row.graphNodes, snapshot.nodes); assert.equal(row.graphSelfBytes, snapshot.selfBytes);
  }
}
assert.equal(results.chromium.workflowRun, manifest.chromium.workflowRun);
assert.equal(results.chromium.conclusion, 'success'); assert.deepEqual(results.chromium.comparison, summarizeCohort(summaries));
assert.equal(manifest.webkit.measuredSource, webkitMeasured.source); assert.equal(manifest.webkit.measuredTree, webkitMeasured.tree);
assert.equal(manifest.webkit.conclusion, 'failure'); assert.equal(manifest.webkit.captures.length, 4);
const webkit = manifest.webkit.captures.map(entry => {
  assert.match(entry.file, /^webkit-(control|leaf)-r[12]\.json\.gz$/);
  return summarizeWebKitFailure(capture(entry), entry.cell);
});
assert.equal(new Set(webkit.map(row => row.cell.condition + '/' + row.cell.replica)).size, 4);
assert.equal(results.webkit.workflowRun, manifest.webkit.workflowRun); assert.equal(results.webkit.conclusion, 'failure');
assert.deepEqual(results.webkit.failedCaptures, webkit);
assert.equal(new Set([...manifest.chromium.captures, ...manifest.webkit.captures].map(row => row.artifact.id)).size, 10);
if (manifest.figure) { assert.equal(manifest.figure.file, 'process-memory.png'); checkFile(manifest.figure); }
assert.equal(results.whiteScreenFixed, false); assert.equal(results.physicalPhoneAcceptanceEstablished, false);
console.log('CRYPTOID_THRUST_SCOPE_EVIDENCE ' + JSON.stringify({ chromiumCaptures: summaries.length,
  nativeDumpsReparsed: summaries.reduce((n, row) => n + row.nativeCheckpoints.length, 0),
  longObservations: 4, webkitFailedCapturesPreserved: webkit.length, whiteScreenFixed: false }));
