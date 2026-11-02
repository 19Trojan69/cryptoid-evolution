import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { summarizeFlow, classifyFlows } from './summary.mjs';
import '../package-evidence/verifyEvidence.mjs';
import '../environment-fix-evidence/verifyEvidence.mjs';
import '../hosted-preview-evidence/verifyEvidence.mjs';
const read = name => readFileSync(new URL(name, import.meta.url));
const m = JSON.parse(read('manifest.json')), results = JSON.parse(read('results.json')), rows = [];
assert.equal(m.version, 1); assert.equal(m.rawOwnerReportsIncluded, false);
function checked(r) {
  assert.match(r.file, /^(initial|fresh-frame)-(chromium|webkit)-(control|leaves)-r[12]-(short|long)-(verification\.json|build-info\.json|source-scope\.txt|cycle-[012]\.jsonl)$/);
  const b = read(r.file); assert.equal(b.length, r.bytes); assert.equal(createHash('sha256').update(b).digest('hex'), r.sha256); return b;
}
for (const cell of m.captures) {
  assert.equal(cell.artifact.head_sha, cell.sourceCommit); assert.equal(cell.artifact.githubDigestMatched, true);
  assert.equal(cell.artifact.zipIntegrityPassed, true); assert.equal(cell.artifact.digest, 'sha256:' + cell.artifact.sha256);
  assert.equal(checked(cell.scope).toString('utf8').trim(), 'CRYPTOID_MINI_START_SCOPE {"passed":true,"originalSourcesUnchanged":true}');
  const c = JSON.parse(checked(cell.observation)), build = JSON.parse(checked(cell.build));
  assert.equal(build.sourceCommit, c.sourceCommit); assert.equal(build.sourceTree, c.sourceTree);
  assert.deepEqual(build.qaClockGapProbe, c.clockGapBuildProof); assert.deepEqual(build.qaLocalBossStyle, c.localStyleBuildProof);
  for (const p of cell.pointLogs) {
    const cycle = Number(p.file.match(/cycle-([012])\.jsonl$/)[1]);
    const lines = checked(p).toString('utf8');
    assert.equal(lines, c.cycles[cycle].points.map(point => JSON.stringify(point) + '\n').join(''));
  }
  assert.equal(cell.pointLogs.length, c.cycles.filter(r => r.points.length > 0).length);
  rows.push(summarizeFlow(c, cell));
}
assert.equal(new Set(m.captures.map(c => c.artifact.id)).size, m.captures.length);
assert.deepEqual(results.captures, rows); assert.deepEqual(results.cohort, classifyFlows(rows)); assert.equal(results.whiteScreenFixed, false);
console.log('CRYPTOID_FULL_GAME_CLOCK_EVIDENCE ' + JSON.stringify(results.cohort));
