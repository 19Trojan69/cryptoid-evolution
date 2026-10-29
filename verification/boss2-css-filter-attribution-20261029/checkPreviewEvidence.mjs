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
if (receipt.deployment.status === 'READY') {
  const d = receipt.deployment;
  assert.equal(d.sourceCommit, receipt.sourceCommit); assert.equal(d.sourceTree, receipt.sourceTree);
  assert.equal(d.apiTarget, null); assert.equal(d.protection.enabled, true);
  assert.equal(d.protectionChanges, false); assert.equal(d.publicAliasChanges, false);
  assert.equal(d.browserFallbackAuthorized, true); assert.equal(d.priorApiBlock.httpStatus, 403);
  assert.equal(d.liveBrowserCheck.gameOpenedPaused, true);
  assert.equal(d.liveBrowserCheck.renderedCssFilters, 0); assert.equal(d.liveBrowserCheck.renderedBackdropFilters, 0);
  assert.equal(d.liveBrowserCheck.physicalDevice, false);
  const screenshot = readFileSync(directory + d.screenshot.file);
  assert.equal(screenshot.length, d.screenshot.bytes);
  assert.equal(createHash('sha256').update(screenshot).digest('hex'), d.screenshot.sha256);
}
console.log(JSON.stringify({ builtPreviewVerifications: 2, passed: true,
  sourceCommit: receipt.sourceCommit, controlHash, deploymentStatus: receipt.deployment.status }));
