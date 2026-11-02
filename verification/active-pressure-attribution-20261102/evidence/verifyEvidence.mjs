import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { measured, summarizePressure } from './summary.mjs';
const read = file => readFileSync(new URL(file, import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(read('manifest.json')), results = JSON.parse(read('results.json'));
assert.equal(manifest.rawOwnerReportsIncluded, false); assert.equal(manifest.rawHeapSnapshotsIncluded, false);
assert.equal(manifest.source, measured.source); assert.equal(manifest.tree, measured.tree);
assert.equal(manifest.workflowRun, 41390668660); assert.equal(manifest.sourceGatesConclusion, 'success');
assert.equal(manifest.captures.length, 3); const summaries = [];
const checked = entry => {
  assert.match(entry.file, /^(calibration|pressure)-r[12](?:-native)?\.json\.gz$/);
  const bytes = read(entry.file); assert.equal(bytes.length, entry.bytes); assert.equal(sha256(bytes), entry.sha256); return bytes;
};
for (const entry of manifest.captures) {
  assert.equal(entry.artifact.head_sha, measured.source);
  assert.equal(entry.artifact.githubDigestMatched, true); assert.equal(entry.artifact.zipIntegrityPassed, true);
  assert.equal(entry.artifact.digest, 'sha256:' + entry.artifact.sha256);
  assert.ok(Number.isSafeInteger(entry.artifact.id) && entry.artifact.id > 0);
  assert.equal(entry.activePointLogExactlyMatched, true);
  const raw = gunzipSync(checked(entry), { maxOutputLength: 8 * 1024 * 1024 });
  assert.equal(raw.length, entry.uncompressedBytes); assert.equal(sha256(raw), entry.originalJsonSha256);
  const capture = JSON.parse(raw), trace = entry.nativeTrace ? checked(entry.nativeTrace) : null;
  const summary = summarizePressure(capture, trace, entry.cell);
  assert.equal(entry.jobConclusion, summary.runtimeComplete ? 'success' : 'failure'); summaries.push(summary);
}
assert.equal(new Set(manifest.captures.map(c => c.artifact.id)).size, 3);
assert.deepEqual(summaries.map(s => s.cell), [{ mode: 'calibration', replica: 1 }, { mode: 'pressure', replica: 1 }, { mode: 'pressure', replica: 2 }]);
assert.equal(summaries[0].classification, 'calibration-pass');
for (const row of summaries) for (const key of ['engineVersion', 'actualInstalledPackages', 'lockSha256'])
  assert.deepEqual(row[key], summaries[0][key]);
assert.equal(results.workflowRun, manifest.workflowRun); assert.equal(results.conclusion, manifest.conclusion);
assert.equal(manifest.conclusion, summaries.every(s => s.runtimeComplete) ? 'success' : 'failure');
assert.deepEqual(results.captures, summaries);
assert.equal(results.highPressureCaptures, summaries.filter(s => s.pressureEvidenceQualified).length);
assert.equal(results.physicalPhoneAcceptanceEstablished, false); assert.equal(results.whiteScreenFixed, false);
console.log('CRYPTOID_ACTIVE_PRESSURE_EVIDENCE ' + JSON.stringify({ captures: summaries.length,
  highPressureCaptures: results.highPressureCaptures, classifications: summaries.map(s => s.classification),
  whiteScreenFixed: false }));
