import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const result = read('./results.json'), evidence = read('./evidence/synthetic-renderer-comparison.json');
assert.equal(evidence.source, result.runtimeSource); assert.equal(evidence.sourceTree, result.runtimeTree);
assert.equal(evidence.workflowRun, result.verification.workflowRun); assert.equal(evidence.records.length, 4);
for (const engine of ['chromium', 'webkit']) {
  const rows = evidence.records.filter(r => r.engine === engine); assert.equal(rows.length, 2);
  for (const controlled of [false, true]) {
    const r = rows.find(r => r.controlled === controlled); assert.ok(r);
    assert.equal(r.source, result.runtimeSource); assert.equal(r.complete, true);
    assert.equal(r.physicalDevice, false); assert.equal(r.physicalCrashSimulated, false); assert.equal(r.whiteScreenFixed, false);
    assert.equal(r.fullRecording, false); assert.ok(r.activeObservation.elapsedMs >= 20000);
    assert.ok(r.activeObservation.destroyed > 0); assert.ok(r.activeObservation.coreVolley > 0);
    assert.equal(r.pauseFreezes, true); assert.equal(r.reportAndNormalEndPreserved, true);
    if (controlled) {
      assert.ok(r.activeObservation.originalImpacts > 0);
      for (const key of ['draws', 'cacheBytes', 'surfaceBytes', 'sourceImages', 'textureEntries']) assert.equal(r.activeObservation.canvasResources[key], 0, key);
    } else assert.ok(r.activeObservation.canvasResources.draws > 0);
  }
}
const owner = read('./evidence/owner-canvas-control-failure.json');
assert.deepEqual(result.physicalOwnerResultForNewControl, owner);
assert.equal(owner.runtimeSource, result.runtimeSource);
assert.equal(owner.ownerObservation, 'White Screen');
assert.equal(owner.configuredTreatment, 'existing-original-impact-fallback');
assert.equal(owner.displayedTime, '05:27'); assert.equal(owner.savedActiveMs, 327312);
assert.equal(owner.clockAndBriefRunMatch, true); assert.equal(owner.finalFingerReleaseKnown, false);
assert.equal(owner.nativeTerminationCauseMeasured, false); assert.equal(result.whiteScreenFixed, false);
assert.equal(result.preview.publicRelease, false); assert.equal(result.preview.protectionChanged, false);
const image = readFileSync(new URL('./' + result.hostedDesktopCheck.screenshot, import.meta.url));
assert.equal(image.length, result.hostedDesktopCheck.screenshotBytes);
assert.equal(createHash('sha256').update(image).digest('hex'), result.hostedDesktopCheck.screenshotSha256);
console.log('CRYPTOID_CANVAS_EVIDENCE ' + JSON.stringify({ passed: true, source: result.runtimeSource, syntheticConditions: 4, ownerReportedWhiteScreen: true, savedOwnerTime: owner.displayedTime, whiteScreenFixed: false }));
