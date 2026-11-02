import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { summarizeStyleRun, compareReplicas } from './summary.mjs';
const read = file => readFileSync(new URL(file, import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const stages = [
  ['initial-failed-r1', '5806d22ef61e37bd0c535d3c4b33bd5a5afc937e', 'c3a8c541fc23e5d55788db2d31a2f01f6e5357f3', 41420951968, 1, false],
  ['diagnostic-failed-r1', '15ef6827050cc0fab1178458f53e6439f72f3f30', '0e200d3293a270279a73399d74868d004e3edddf', 41422549736, 1, false],
  ['restoration-order-failed-r1', '483b4b86e25115e7fb48f75c4286175258220c02', 'd8766c7c62d6588ade31d74d57e9797d0e1dd006', 41424050264, 1, false],
  ['accepted-r1', '37e51af5b74a3f2e6a623d6b440f181174e32cf2', 'a9c03ae78b66dc9077138bf75da92a14744c7f05', 41424651767, 1, true],
  ['accepted-r2', '37e51af5b74a3f2e6a623d6b440f181174e32cf2', 'a9c03ae78b66dc9077138bf75da92a14744c7f05', 41424651767, 2, true],
];
const manifest = JSON.parse(read('manifest.json')), results = JSON.parse(read('results.json'));
assert.equal(manifest.version, 1); assert.equal(manifest.rawOwnerReportsIncluded, false); assert.equal(manifest.rawHeapSnapshotsIncluded, false);
assert.equal(manifest.captures.length, stages.length); const summaries = [];
const checked = (entry, prefix) => {
  assert.ok(entry.file.startsWith(prefix)); assert.match(entry.file, /^[a-z0-9-]+(?:\.json\.gz|-source-scope\.txt)$/);
  const bytes = read(entry.file); assert.equal(bytes.length, entry.bytes); assert.equal(sha256(bytes), entry.sha256); return bytes;
};
for (const [index, [name, source, tree, run, replica, complete]] of stages.entries()) {
  const entry = manifest.captures[index]; assert.equal(entry.name, name); assert.equal(entry.workflowRun, run);
  assert.equal(entry.sourceGatesConclusion, 'success'); assert.equal(entry.scopeAfterConclusion, 'success');
  assert.equal(entry.jobConclusion, complete ? 'success' : 'failure');
  assert.equal(entry.workflowConclusion, complete ? 'success' : 'failure');
  assert.equal(entry.artifact.head_sha, source); assert.equal(entry.artifact.githubDigestMatched, true);
  assert.equal(entry.artifact.zipIntegrityPassed, true); assert.equal(entry.artifact.digest, 'sha256:' + entry.artifact.sha256);
  assert.ok(Number.isSafeInteger(entry.artifact.id) && entry.artifact.id > 0);
  assert.equal(checked(entry.scopeAfter, name).toString('utf8').trim(),
    'CRYPTOID_MINI_START_SCOPE {"passed":true,"originalSourcesUnchanged":true}');
  const raw = gunzipSync(checked(entry, name), { maxOutputLength: 4 * 1024 * 1024 });
  assert.equal(raw.length, entry.uncompressedBytes); assert.equal(sha256(raw), entry.originalJsonSha256);
  const capture = JSON.parse(raw), traces = {};
  for (const t of entry.timelines) { assert.equal(traces[t.condition], undefined); traces[t.condition] = checked(t, name); }
  summaries.push(summarizeStyleRun(capture, traces, { source, tree, replica, complete }));
}
assert.equal(new Set(manifest.captures.map(c => c.artifact.id)).size, 5);
for (const s of summaries) for (const key of ['engineVersion', 'actualInstalledPackages', 'lockSha256']) assert.deepEqual(s[key], summaries[0][key]);
assert.deepEqual(results.captures, summaries); assert.deepEqual(results.comparison, compareReplicas(summaries.filter(s => s.complete)));
assert.equal(results.comparison.bothLocalStyleWorkReductionRepeated, true);
console.log('CRYPTOID_STYLE_RECALC_EVIDENCE ' + JSON.stringify({ failedCapturesPreserved: summaries.filter(s => !s.complete).length,
  acceptedReplicas: results.comparison.acceptedReplicas, rows: results.comparison.rows,
  activeRuntimeMemoryBenefitEstablished: false, whiteScreenFixed: false }));
