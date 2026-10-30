import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const r = read('./results.json'), c = read('./evidence/synthetic-weapon-comparison.json');
assert.equal(r.runtime.source, '68bbf03220a868762606136308844aa24a8a2a75');
assert.equal(r.runtime.tree, '720ab2d65fbdf386ab39e7f9fb909799e74370ee');
assert.equal(r.whiteScreenFixed, false);
const owner = read('./evidence/owner-weapon-control-failure.json');
assert.equal(owner.runtimeSource, r.runtime.source); assert.equal(owner.runtimeTree, r.runtime.tree);
assert.equal(owner.ownerObservation.browser, 'Pi Browser'); assert.equal(owner.ownerObservation.whiteScreenReported, true);
assert.equal(owner.ownerObservation.browserConfirmedByOwner, true); assert.equal(owner.savedActiveMs, 510289);
assert.equal(owner.displayedTime, '08:30'); assert.equal(owner.savedMode, 'running');
assert.equal(owner.fullRecording, false); assert.equal(owner.protection, true); assert.equal(owner.fullSession, null);
assert.equal(owner.clockAndBriefRunMatch, true); assert.equal(owner.normalExitRecorded, false);
assert.equal(owner.newDocumentMsAfterLastCheckpoint, 943); assert.equal(owner.lastRetainedInputActiveMsBeforeCheckpoint, 11043);
assert.equal(owner.nativeTerminationCauseMeasured, false); assert.equal(owner.physicalSceneDomMeasuredByReport, false);
assert.equal(r.physicalDeviceResult.evidence, 'evidence/owner-weapon-control-failure.json');
assert.equal(r.runtime.deviceBranch, 'codex/boss2-boss-weapon-device-20261030');
assert.equal(r.publicMainSource, 'ce073547cf573375d141bf846f70e294138dbd73');
assert.equal(r.treatment.weaponSimulationRetained, true); assert.equal(r.treatment.inputChanged, false);
assert.equal(r.treatment.simulationClocksChanged, false); assert.equal(r.treatment.audioChanged, false);
assert.equal(r.treatment.componentPresentationHooksAlsoExcluded, true); assert.equal(r.treatment.purePixelOnlyIsolation, false);
const baseline = read('../boss2-boss-visual-control-20261030/evidence/owner-boss-visual-failure.json');
assert.equal(baseline.runtimeSource, r.baselineFailedPhone.source);
assert.equal(baseline.ownerObservation.browser, 'Pi Browser'); assert.equal(baseline.displayedTime, '08:57');
assert.equal(baseline.ownerObservation.whiteScreenReported, true);
assert.equal(baseline.ownerObservation.fingerCausationEstablished, false);
assert.equal(c.source, r.runtime.source); assert.equal(c.sourceTree, r.runtime.tree);
assert.equal(c.physicalDeviceResult, null); assert.equal(c.records.length, 4);
assert.equal(c.sourceComponentTests, 8); assert.equal(c.typePreflight, 'passed'); assert.equal(c.originalSourceScopePins, 'passed');
assert.deepEqual(new Set(c.records.map(x => x.engine + '/' + x.weaponCanvasOff)),
  new Set(['chromium/false', 'chromium/true', 'webkit/false', 'webkit/true']));
for (const x of c.records) {
  assert.equal(x.complete, true); assert.equal(x.source, r.runtime.source);
  assert.equal(x.physicalDevice, false); assert.equal(x.physicalCrashSimulated, false); assert.equal(x.whiteScreenFixed, false);
  assert.equal(x.comparison, 'boss-weapon-component-toggle'); assert.equal(x.fullRecording, false);
  assert.equal(x.originalBoss, true); assert.equal(x.originalBackground, true); assert.equal(x.steeringEventsSynthetic, true);
  for (const key of ['bannerMatches', 'pointerSteeringPreserved', 'weaponMenuRoundtrip', 'manualPauseFreezes',
    'normalExitAndReportPreserved', 'originalBackgroundVisible', 'originalBossVisible']) assert.equal(x[key], true);
  assert.ok(x.activeObservation.activeMs >= 20000);
  const s = x.activeObservation.scene;
  assert.equal(s.starfields, 2); assert.equal(s.backgroundPlanets, 4); assert.ok(s.backgroundStarCircles >= 215);
  assert.ok(s.flatShips > 0); assert.equal(s.detailedNonBossShips, 0); assert.equal(s.playerShotBackground, 'none');
  assert.equal(s.canvases, x.weaponCanvasOff ? 0 : 1); assert.equal(s.bossCanvases, x.weaponCanvasOff ? 0 : 1);
  assert.equal(s.bossImages, 1); assert.equal(s.bossReflections, 1); assert.equal(s.originalBosses, 1);
  assert.equal(s.foregroundImages, 1); assert.equal(s.flatBosses, 0); assert.equal(s.weaponLoadingImages, 0);
  if (x.weaponCanvasOff) {
    assert.equal(x.originalBossOuterSizePreserved, true); assert.equal(x.originalLayoutBoxesPreserved, true);
  }
}
const d = r.deployment;
assert.equal(d.environment, 'preview'); assert.equal(d.status, 'Ready');
assert.equal(d.requireLogin, true); assert.equal(d.protection, 'Standard Protection');
assert.equal(d.customDomainsAssigned, false); assert.equal(d.productionCandidate, false);
const h = r.hostedCheck;
assert.equal(h.physicalDevice, false); assert.equal(h.source, r.runtime.source); assert.equal(h.sourceTree, r.runtime.tree);
assert.equal(h.diagnosticScene, 'flat-live-scene-original-background-original-boss-no-weapon-canvas');
assert.equal(h.pairedReport, true); assert.equal(h.fullRecording, false); assert.equal(h.protection, true);
assert.equal(h.normalExit, true); assert.equal(h.reloadRestored, true); assert.equal(h.savedMode, 'ended');
assert.equal(h.sceneCanvases, 0); assert.equal(h.originalBossImages, 1); assert.equal(h.bossImageReady, true);
assert.equal(h.originalBossReflections, 1); assert.equal(h.detailedNonBossShips, 0);
assert.equal(h.backgroundPlanets, 4); assert.ok(h.backgroundStarCircles >= 215);
assert.equal(h.reactorDisplay, 'none'); assert.equal(h.reactorRects, 0);
assert.equal(h.screenshotIsOwnerPhoneResult, false);
assert.equal(createHash('sha256').update(readFileSync(new URL(h.screenshot, import.meta.url))).digest('hex'), h.screenshotSha256);
assert.equal(r.nextPhoneProtocol.targetActiveMinutes, 10);
console.log('CRYPTOID_BOSS_WEAPON_EVIDENCE ' + JSON.stringify({ passed: true, source: r.runtime.source,
  syntheticComparisons: 4, physicalDeviceResult: r.physicalDeviceResult, whiteScreenFixed: false }));
