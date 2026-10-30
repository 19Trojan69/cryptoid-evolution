import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const r = read('./results.json'), c = read('./evidence/synthetic-background-comparison.json');
assert.equal(r.runtime.source, '8e34152c5552f0ed02101566190ae68620105434');
assert.equal(r.runtime.tree, 'b520b9fe62e6636dcf7e047c1b3aa011a9bec8fc');
assert.equal(r.runtime.deviceBranch, 'codex/boss2-background-device-20261030');
assert.equal(r.whiteScreenFixed, false);
const owner = read('./evidence/owner-background-completion.json');
assert.equal(r.physicalDeviceResult.evidence, 'evidence/owner-background-completion.json');
assert.equal(r.physicalDeviceResult.status, 'owner-reported-no-failures-with-recorded-normal-end');
assert.equal(owner.runtimeSource, r.runtime.source); assert.equal(owner.runtimeTree, r.runtime.tree);
assert.equal(owner.reportSha256, 'dfab75e85e8eaaabf340fb52a00ba65274dba0fd674417e3f26289d8218a3bcf');
assert.equal(owner.configuredTreatment, 'flat-live-scene-original-background');
assert.equal(owner.savedActiveMs, 638167); assert.equal(owner.displayedTime, '10:38'); assert.equal(owner.savedMode, 'ended');
assert.equal(owner.ownerObservation.noFailuresReported, true); assert.equal(owner.ownerObservation.whiteScreenReported, false);
assert.equal(owner.ownerObservation.browser, null); assert.equal(r.physicalDeviceResult.browserConfirmationPending, true);
assert.equal(owner.clockAndBriefRunMatch, true); assert.equal(owner.normalHomeConfirmationEndRecorded, true);
assert.equal(owner.fullRecording, false); assert.equal(owner.protection, true); assert.equal(owner.fullSession, null);
assert.equal(owner.unobservedGaps, 0); assert.equal(owner.collectorDrops, 66); assert.equal(owner.retainedEvents, 32);
assert.deepEqual(owner.lastContextField, { width: 430, height: 711 });
assert.equal(owner.browserIdentityMeasuredByReport, false); assert.equal(owner.rawOwnerReportCommitted, false);
assert.equal(owner.reloadTracePresent, false); assert.equal(owner.whiteScreenFixed, false);
assert.equal(r.publicMainSource, 'ce073547cf573375d141bf846f70e294138dbd73');
assert.equal(r.deployment.environment, 'preview'); assert.equal(r.deployment.status, 'Ready');
assert.equal(r.deployment.requireLogin, true); assert.equal(r.deployment.protection, 'Standard Protection');
assert.equal(r.deployment.customDomainsAssigned, false);
assert.equal(c.source, r.runtime.source); assert.equal(c.sourceTree, r.runtime.tree);
assert.equal(c.physicalDeviceResult, null); assert.equal(c.records.length, 4);
assert.deepEqual(new Set(c.records.map(x => x.engine + '/' + x.originalBackground)),
  new Set(['chromium/false', 'chromium/true', 'webkit/false', 'webkit/true']));
for (const x of c.records) {
  assert.equal(x.complete, true); assert.equal(x.controlled, true); assert.equal(x.source, r.runtime.source);
  assert.equal(x.physicalDevice, false); assert.equal(x.physicalCrashSimulated, false); assert.equal(x.whiteScreenFixed, false);
  assert.equal(x.comparison, 'original-background-toggle'); assert.equal(x.fullRecording, false);
  assert.equal(x.steeringEventsSynthetic, true);
  for (const key of ['bannerMatches', 'pointerSteeringPreserved', 'weaponMenuRoundtrip', 'manualPauseFreezes', 'normalExitAndReportPreserved']) assert.equal(x[key], true);
  assert.ok(x.activeObservation.activeMs >= 20000);
  const s = x.activeObservation.scene;
  for (const key of ['canvases', 'foregroundImages', 'detailedShips']) assert.equal(s[key], 0);
  assert.equal(s.flatBosses, 1); assert.ok(s.flatShips > 0); assert.equal(s.playerShotBackground, 'none');
  if (x.originalBackground) {
    assert.equal(x.originalBackgroundVisible, true); assert.equal(x.originalLayoutBoxesPreserved, true);
    assert.equal(s.starfields, 2); assert.ok(s.backgroundStarCircles >= 215); assert.equal(s.backgroundPlanets, 4);
  } else { assert.equal(s.starfields, 0); assert.equal(s.backgroundPlanets, 0); assert.equal(s.backgroundStarCircles, 0); }
}
const pi = read('../boss2-flat-scene-control-20261030/evidence/owner-flat-scene-pi-completion.json');
assert.equal(pi.runtimeSource, r.baseFlatPhoneSource); assert.equal(pi.displayedTime, '09:15');
assert.equal(pi.ownerObservation.browser, 'Pi Browser'); assert.equal(pi.ownerObservation.noFailuresReported, true);
const h = r.hostedCheck;
assert.equal(h.physicalDevice, false); assert.equal(h.source, r.runtime.source);
assert.equal(h.diagnosticScene, 'flat-live-scene-original-background'); assert.equal(h.pairedReport, true);
assert.equal(h.fullSession, null); assert.equal(h.fullRecording, false); assert.equal(h.protection, true);
assert.equal(h.normalExit, true); assert.equal(h.pauseObserved, true); assert.equal(h.reloadRestored, true);
assert.equal(h.sceneCanvases, 0); assert.equal(h.foregroundImages, 0); assert.equal(h.backgroundPlanets, 4);
assert.ok(h.backgroundStarCircles >= 215); assert.ok(h.savedActiveMs > 0);
assert.equal(createHash('sha256').update(readFileSync(new URL('./evidence/hosted-background-control.jpg', import.meta.url))).digest('hex'), h.screenshotSha256);
console.log('CRYPTOID_BACKGROUND_EVIDENCE ' + JSON.stringify({ passed: true, source: r.runtime.source,
  syntheticComparisons: 4, physicalDeviceResult: r.physicalDeviceResult.status, browserConfirmationPending: true, whiteScreenFixed: false }));
