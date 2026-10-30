import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const result = read('./results.json'), comparison = read('./evidence/synthetic-scene-comparison.json');
assert.equal(result.runtime.source, '9b38b695fc3f9b81407dfe97c5feb8128ca95767');
assert.equal(result.runtime.tree, '994db1d2a9daaf63eed6ecdf2a24af01a08baa5d');
assert.equal(result.runtime.deviceBranch, 'codex/boss2-flat-device-20261030');
assert.equal(result.whiteScreenFixed, false);
const owner = read('./evidence/owner-flat-scene-completion.json');
assert.equal(result.physicalDeviceResult.evidence, 'evidence/owner-flat-scene-completion.json');
assert.equal(result.physicalDeviceResult.status, 'owner-reported-normal-end-without-white-screen');
assert.equal(owner.runtimeSource, result.runtime.source); assert.equal(owner.runtimeTree, result.runtime.tree);
assert.equal(owner.reportSha256, 'b5442c4693c56113a45d3d44d516cd730cc73c382b6238ed5c53de757b924c49');
assert.equal(owner.savedActiveMs, 530855); assert.equal(owner.displayedTime, '08:50');
assert.equal(owner.savedMode, 'ended'); assert.equal(owner.clockAndBriefRunMatch, true);
assert.equal(owner.ownerObservation.whiteScreen, false); assert.equal(owner.ownerObservation.normalExit, true);
assert.equal(owner.ownerObservation.unplannedPausesReported, 2); assert.equal(owner.whiteScreenFixed, false);
assert.equal(owner.fullRecording, false); assert.equal(owner.protection, true); assert.equal(owner.fullSession, null);
assert.equal(owner.retainedEvents, 32); assert.equal(owner.collectorDrops, 199);
assert.deepEqual(owner.retainedNonExitPause.sequence, ['touchend', 'blur', 'state']);
assert.equal(owner.retainedNonExitPause.nativeFocusLossReasonMeasured, false);
assert.equal(owner.bothOwnerReportedPausesFullyRetained, false);
assert.deepEqual(owner.lastContextField, { width: 430, height: 711 });
assert.deepEqual(owner.precedingFailureLastContextField, { width: 430, height: 825 });
assert.equal(owner.rawOwnerReportCommitted, false);
assert.equal(result.deployment.environment, 'preview'); assert.equal(result.deployment.status, 'Ready');
assert.equal(result.deployment.customDomainsAssigned, false);
assert.equal(result.deployment.requireLogin, true); assert.equal(result.deployment.protection, 'Standard Protection');
assert.equal(result.publicMainSource, 'ce073547cf573375d141bf846f70e294138dbd73');
assert.equal(comparison.source, result.runtime.source); assert.equal(comparison.sourceTree, result.runtime.tree);
assert.equal(comparison.physicalDeviceResult, null); assert.equal(comparison.records.length, 4);
assert.deepEqual(new Set(comparison.records.map(r => r.engine + '/' + r.controlled)),
  new Set(['chromium/false', 'chromium/true', 'webkit/false', 'webkit/true']));
for (const r of comparison.records) {
  assert.equal(r.complete, true); assert.equal(r.source, result.runtime.source);
  assert.equal(r.physicalDevice, false); assert.equal(r.physicalCrashSimulated, false); assert.equal(r.whiteScreenFixed, false);
  assert.equal(r.fullRecording, false); assert.equal(r.steeringEventsSynthetic, true);
  for (const key of ['bannerMatches', 'pointerSteeringPreserved', 'weaponMenuRoundtrip', 'manualPauseFreezes', 'normalExitAndReportPreserved']) assert.equal(r[key], true);
  assert.ok(r.activeObservation.activeMs >= 20000);
  const scene = r.activeObservation.scene;
  if (r.controlled) {
    assert.equal(r.originalLayoutBoxesPreserved, true);
    for (const key of ['canvases', 'images', 'starfields', 'detailedShips']) assert.equal(scene[key], 0);
    assert.equal(scene.flatBosses, 1); assert.ok(scene.flatShips > 0); assert.equal(scene.playerShotBackground, 'none');
  } else { assert.ok(scene.canvases > 0); assert.ok(scene.images > 0); assert.ok(scene.starfields > 0); }
}
assert.equal(result.hostedCheck.physicalDevice, false); assert.equal(result.hostedCheck.source, result.runtime.source);
assert.equal(result.hostedCheck.diagnosticScene, 'flat-live-scene'); assert.equal(result.hostedCheck.pairedReport, true);
assert.equal(result.hostedCheck.fullSession, null); assert.equal(result.hostedCheck.fullRecording, false);
assert.equal(result.hostedCheck.normalExit, true); assert.equal(result.hostedCheck.pauseObserved, true);
assert.equal(result.hostedCheck.sceneCanvases, 0); assert.equal(result.hostedCheck.sceneImages, 0);
assert.ok(result.hostedCheck.savedActiveMs > 0);
const screenshot = readFileSync(new URL('./evidence/hosted-flat-scene.jpg', import.meta.url));
assert.equal(createHash('sha256').update(screenshot).digest('hex'), result.hostedCheck.screenshotSha256);
console.log('CRYPTOID_FLAT_EVIDENCE ' + JSON.stringify({ passed: true, source: result.runtime.source,
  syntheticComparisons: 4, physicalDeviceResult: result.physicalDeviceResult.status, whiteScreenFixed: false }));
