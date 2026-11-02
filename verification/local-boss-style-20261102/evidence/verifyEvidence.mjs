import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { summarizeLocalStyles, compareLocalStyleCohort, measured } from './summary.mjs';
const read = name => readFileSync(new URL(name, import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const m = JSON.parse(read('manifest.json')), r = JSON.parse(read('results.json'));
assert.equal(m.version, 1); assert.equal(m.source, measured.source); assert.equal(m.tree, measured.tree);
assert.equal(m.workflowRun, 41427163697); assert.equal(m.rawOwnerReportsIncluded, false); assert.equal(m.rawHeapSnapshotsIncluded, false);
assert.ok(['short-only-long-pending', 'complete-paired-protocol'].includes(m.status));
const complete = m.status === 'complete-paired-protocol'; assert.equal(m.workflowConclusion, complete ? 'success' : null);
assert.equal(m.captures.length, complete ? 6 : 2); const summaries = [];
const check = (e, name) => {
  assert.ok(e.file.startsWith(name)); assert.match(e.file, /^(control|leaves)-r[12]-(60|1200)(?:\.json\.gz|-native\.json\.gz|-heaps\.json|-source-scope\.txt)$/);
  const b = read(e.file); assert.equal(b.length, e.bytes); assert.equal(sha256(b), e.sha256); return b;
};
for (const e of m.captures) {
  const cell = e.cell, name = `${cell.condition}-r${cell.replica}-${cell.seconds}`;
  assert.equal(e.name, name); assert.equal(e.sourceGatesConclusion, 'success'); assert.equal(e.jobConclusion, 'success');
  assert.equal(e.scopeAfterConclusion, 'success'); assert.equal(e.artifact.head_sha, measured.source);
  assert.equal(e.artifact.githubDigestMatched, true); assert.equal(e.artifact.zipIntegrityPassed, true);
  assert.equal(e.artifact.digest, 'sha256:' + e.artifact.sha256);
  assert.equal(check(e.scopeAfter, name).toString('utf8').trim(), 'CRYPTOID_MINI_START_SCOPE {"passed":true,"originalSourcesUnchanged":true}');
  const raw = gunzipSync(check(e, name), { maxOutputLength: 16 * 1024 * 1024 });
  assert.equal(raw.length, e.uncompressedBytes); assert.equal(sha256(raw), e.originalJsonSha256);
  const capture = JSON.parse(raw); assert.equal(e.activePointLogExactlyMatched, true);
  assert.equal(sha256(Buffer.from(capture.points.map(p => JSON.stringify(p) + '\n').join(''))), e.activePointLogSha256);
  summaries.push(summarizeLocalStyles(capture, check(e.nativeTrace, name), cell));
  const heap = JSON.parse(check(e.heapAnalysis, name));
  assert.equal(heap.sourceCommit, measured.source); assert.equal(heap.sourceTree, measured.tree); assert.deepEqual(heap.cell, cell);
  assert.equal(heap.originalDigestsSizesAndSummariesMatched, true); assert.equal(heap.rawOwnerReportsIncluded, false);
  assert.equal(heap.rawHeapSnapshotsIncluded, false); assert.equal(heap.whiteScreenFixed, false); assert.equal(heap.states.length, 2);
  for (const [i, state] of heap.states.entries()) {
    const s = capture.snapshots[i]; assert.equal(state.label, s.label); assert.equal(state.compressedSha256, s.sha256);
    assert.equal(state.rawBytes, s.bytes); assert.equal(state.graphNodes, s.nodes); assert.equal(state.graphSelfBytes, s.selfBytes);
  }
  assert.equal(heap.pausedToHome.nodesDelta, capture.snapshots[1].nodes - capture.snapshots[0].nodes);
  assert.equal(heap.pausedToHome.selfBytesDelta, capture.snapshots[1].selfBytes - capture.snapshots[0].selfBytes);
}
assert.equal(new Set(m.captures.map(e => e.artifact.id)).size, m.captures.length);
for (const s of summaries) for (const k of ['engineVersion', 'actualInstalledPackages', 'lockSha256']) assert.deepEqual(s[k], summaries[0][k]);
assert.equal(r.status, m.status); assert.deepEqual(r.captures, summaries);
if (complete) assert.deepEqual(r.cohort, compareLocalStyleCohort(summaries));
else { assert.deepEqual(m.captures.map(e => e.cell), [{ condition: 'control', seconds: 60, replica: 1 }, { condition: 'leaves', seconds: 60, replica: 1 }]); assert.equal(r.cohort, null); }
assert.equal(r.whiteScreenFixed, false); assert.equal(r.physicalPhoneAcceptanceEstablished, false);
console.log('CRYPTOID_LOCAL_STYLE_EVIDENCE ' + JSON.stringify({ captures: summaries.length, status: m.status,
  repeatedActiveMemoryBenefitUnderDeclaredCriteria: r.cohort?.repeatedActiveMemoryBenefitUnderDeclaredCriteria ?? null,
  physicalPhoneAcceptanceEstablished: false, whiteScreenFixed: false }));
