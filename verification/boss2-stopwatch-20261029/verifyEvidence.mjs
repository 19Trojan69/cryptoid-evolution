import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
const read = file => readFileSync(new URL(file, import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const result = JSON.parse(read('results.json'));
for (const record of [result, result.priorCandidate].filter(Boolean)) {
  const raw = read(record.evidence.file);
  assert.equal(raw.length, record.evidence.bytes); assert.equal(hash(raw), record.evidence.sha256);
  const data = JSON.parse(gunzipSync(raw));
  assert.equal(data.syntheticOnly, true); assert.equal(data.physicalDeviceEvidence, false);
  assert.equal(data.workflowRunId, record.workflowRunId); assert.equal(data.captures.length, 2);
  assert.deepEqual(data.captures.map(c => c.engine).sort(), ['chromium', 'webkit']);
  for (const capture of data.captures) {
    const v = capture.verification;
    assert.equal(v.complete, true); assert.equal(v.physicalDevice, false); assert.equal(v.whiteScreenFixed, false);
    assert.equal(v.build.sourceCommit, record.sourceCommit); assert.equal(v.build.sourceTree, record.sourceTree);
    assert.equal(capture.artifact.zipIntegrityVerified, true);
    assert.equal(v.build.diagnosticCssControl.kind, 'all-css-filters-off');
    assert.equal(v.build.diagnosticStopwatch.checkpointMs, 1000);
    assert.equal(v.build.diagnosticStopwatch.hardCrashTimeIsExact, false);
    for (const key of ['initialPauseZero', 'realPauseFreezes', 'resumeKeepsSameRun', 'normalExitKeepsVisibleTime',
      'explicitReloadRestoresWithoutAddingTime', 'newPreparationDoesNotEraseOldTime', 'newStartPreservesPreviousRun'])
      assert.equal(v[key], true, key);
    if (record === result) {
      assert.equal(hash(read('stopwatchState.mjs')), v.build.diagnosticStopwatch.stateSha256);
      assert.equal(hash(read('stopwatch.css')), v.build.diagnosticStopwatch.cssSha256);
      const js = read('stopwatchBrowser.mjs').toString().replace('__CRYPTOID_STOPWATCH_SOURCE__', record.sourceCommit)
        .replace("'./stopwatchState.mjs'", "'./diagnostic-stopwatch-state.js'");
      assert.equal(hash(js), v.build.diagnosticStopwatch.browserSha256);
    }
  }
}
assert.equal(result.workflowConclusion, 'success'); assert.equal(result.focusedModelTests, 12);
assert.equal(result.whiteScreenFixed, false); assert.equal(result.physicalDeviceVerified, false);
if (result.deployment) {
  assert.equal(result.deployment.status, 'READY'); assert.equal(result.deployment.sourceCommit, result.sourceCommit);
  assert.equal(result.deployment.sourceTree, result.sourceTree); assert.equal(result.deployment.apiTarget, null);
  assert.equal(result.deployment.protection.enabled, true);
  const proof = read(result.deployment.screenshot.file);
  assert.equal(proof.length, result.deployment.screenshot.bytes);
  assert.equal(hash(proof), result.deployment.screenshot.sha256);
}
console.log('CRYPTOID_STOPWATCH_EVIDENCE ' + JSON.stringify({ passed: true, source: result.sourceCommit,
  nativeBrowserFlows: 2, priorCandidatePreserved: !!result.priorCandidate, physicalDevice: false, whiteScreenFixed: false }));
