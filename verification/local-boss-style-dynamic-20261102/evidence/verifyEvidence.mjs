import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { summarizeDynamic, classifyDynamicSet } from './summary.mjs';
const read = name => readFileSync(new URL(name, import.meta.url));
const manifest = JSON.parse(read('manifest.json')), summaries = [];
assert.equal(manifest.version, 1); assert.equal(manifest.rawOwnerReportsIncluded, false);
assert.equal(manifest.rawHeapSnapshotsIncluded, false); assert.match(manifest.expectedCssBlob, /^[a-f0-9]{40}$/);
function checked(record) {
  assert.match(record.file, /^(initial|height-diagnostic|cssom)-(chromium|webkit)-(observation\.json|build-info\.json|source-scope\.txt)$/);
  const b = read(record.file); assert.equal(b.length, record.bytes);
  assert.equal(createHash('sha256').update(b).digest('hex'), record.sha256); return b;
}
for (const cell of manifest.captures) {
  assert.equal(cell.artifact.githubDigestMatched, true); assert.equal(cell.artifact.zipIntegrityPassed, true);
  assert.equal(cell.artifact.digest, 'sha256:' + cell.artifact.sha256);
  assert.equal(cell.artifact.head_sha, cell.sourceCommit); assert.ok(Number.isSafeInteger(cell.runId) && cell.runId > 0);
  assert.equal(checked(cell.scope).toString('utf8').trim(), 'CRYPTOID_MINI_START_SCOPE {"passed":true,"originalSourcesUnchanged":true}');
  const c = JSON.parse(checked(cell.observation)), build = JSON.parse(checked(cell.build));
  for (const k of Object.keys(build)) assert.deepEqual(c[k], build[k], 'Actual compiled build field ' + k);
  summaries.push(summarizeDynamic(c, cell, manifest.expectedCssBlob));
}
assert.equal(new Set(manifest.captures.map(c => c.artifact.id)).size, manifest.captures.length);
const result = JSON.parse(read('results.json'));
assert.deepEqual(result.captures, summaries); assert.deepEqual(result.cohort, classifyDynamicSet(summaries));
assert.equal(result.whiteScreenFixed, false);
console.log('CRYPTOID_DYNAMIC_STYLE_EVIDENCE ' + JSON.stringify(result.cohort));
