import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { diagnosticCssByCase, filterPreviewLabel } from './filterStyles.mjs';
const directory = fileURLToPath(new URL('.', import.meta.url));
const receipt = JSON.parse(readFileSync(directory + 'preview-results.json'));
const compressed = readFileSync(directory + receipt.evidence.file);
assert.equal(compressed.length, receipt.evidence.bytes);
assert.equal(createHash('sha256').update(compressed).digest('hex'), receipt.evidence.sha256);
const evidence = JSON.parse(gunzipSync(compressed));
assert.equal(evidence.syntheticOnly, true); assert.equal(evidence.physicalOwnerReportsIncluded, false);
assert.equal(evidence.sourceCommit, receipt.sourceCommit);
assert.deepEqual(evidence.captures.map(c => c.engine).sort(), ['chromium', 'webkit']);
const controlHash = createHash('sha256').update(diagnosticCssByCase['all-css-filters-off']).digest('hex');
for (const c of evidence.captures) {
  const v = c.verification, saved = receipt.verifications.find(r => r.engine === c.engine);
  assert.equal(v.complete, true); assert.equal(saved.jobConclusion, 'success');
  assert.equal(v.sourceCommit, receipt.sourceCommit); assert.equal(v.diagnosticStylesBuiltIn, true);
  assert.ok(v.observedActiveSeconds >= 90); assert.equal(v.observedActiveSeconds, saved.activeSeconds);
  assert.equal(v.builtInControlVerified.controlSha256, controlHash);
  assert.equal(v.builtInControlVerified.label, filterPreviewLabel);
  assert.equal(v.additionalFullRecordingAbsent, true); assert.deepEqual(v.unexpectedExternalRequests, []);
  assert.equal(v.finalPausedAppearance.filterCount, 0); assert.equal(v.finalPausedAppearance.backdropCount, 0);
}
assert.equal(receipt.whiteScreenFixed, false);
console.log(JSON.stringify({ builtPreviewVerifications: 2, passed: true,
  sourceCommit: receipt.sourceCommit, controlHash, deploymentStatus: receipt.deployment.status }));
