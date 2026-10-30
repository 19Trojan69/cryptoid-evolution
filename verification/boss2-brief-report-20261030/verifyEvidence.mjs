import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const receipt = read('./results.json'), evidence = read('./evidence/synthetic-browser-results.json');
assert.equal(evidence.source, receipt.deployedSource);
assert.equal(evidence.sourceTree, receipt.deployedTree);
assert.equal(evidence.workflowRun, receipt.verification.acceptedWorkflow);
assert.deepEqual(evidence.records.map(r => r.result.engine).sort(), ['chromium', 'webkit']);
for (const record of evidence.records) {
  assert.equal(record.status, 'success'); assert.ok(receipt.verification.acceptedJobs.includes(record.jobId));
  const r = record.result;
  assert.equal(r.source, receipt.deployedSource); assert.equal(r.complete, true);
  assert.equal(r.physicalDevice, false); assert.equal(r.physicalCrashSimulated, false);
  assert.equal(r.whiteScreenFixed, false); assert.equal(r.fullRecording, false); assert.equal(r.multiContactsSynthetic, true);
  assert.ok(r.activeObservedMs >= 20000);
  for (const key of ['syntheticContactCapture', 'pauseFreezes', 'activeReloadRestoresReport',
    'uniqueFilenameDownloadTextAndShareAgree', 'previousRunPreservedAndNormalEnd']) assert.equal(r[key], true, key);
}
const screenshot = readFileSync(new URL('./' + receipt.hostedDesktopCheck.screenshot, import.meta.url));
assert.equal(screenshot.length, receipt.hostedDesktopCheck.screenshotBytes);
assert.equal(createHash('sha256').update(screenshot).digest('hex'), receipt.hostedDesktopCheck.screenshotSha256);
assert.equal(receipt.physicalOwnerResultForThisVersion, null);
assert.equal(receipt.whiteScreenFixed, false); assert.equal(receipt.preview.environment, 'preview');
assert.equal(receipt.preview.publicRelease, false); assert.equal(receipt.preview.protectionSettingsChanged, false);
assert.equal(receipt.hostedDesktopCheck.timeIsOwnerPhoneResult, false);
console.log('CRYPTOID_BRIEF_EVIDENCE ' + JSON.stringify({ passed: true, source: receipt.deployedSource, syntheticEngines: 2, physicalResult: false, whiteScreenFixed: false }));
