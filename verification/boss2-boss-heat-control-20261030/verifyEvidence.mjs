import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const r = read('./results.json'), c = read('./evidence/synthetic-heat-comparison.json');
assert.equal(r.runtime.source, '2a531983e5217b14141fb8623ecb35df65d7f700');
assert.equal(r.runtime.tree, '1d100eebfbe1b661ffd6bc404980aa919229325d');
assert.equal(r.runtime.deviceBranch, 'codex/boss2-boss-heat-device-20261030');
assert.equal(r.whiteScreenFixed, false);
assert.equal(r.publicMainSource, 'ce073547cf573375d141bf846f70e294138dbd73');
for (const key of ['weaponSimulationRetained', 'originalBossHullImageRetained', 'originalElementsAndMaskStylesRetained', 'originalPresentationComponentsAndHooksRetained']) assert.equal(r.treatment[key], true);
for (const key of ['simulationClocksChanged', 'inputChanged', 'audioChanged', 'extraSimulationTimersOrFrames', 'deviceTemperatureMeasured']) assert.equal(r.treatment[key], false);
assert.equal(r.baselinePhoneResults.length, 2);
for (const baseline of r.baselinePhoneResults) {
  const owner = read(baseline.receipt); assert.equal(owner.runtimeSource, baseline.source);
  assert.equal(owner.displayedTime, baseline.displayedTime); assert.equal(owner.savedMode, 'ended');
  assert.equal(owner.ownerObservation.whiteScreenReported, false); assert.equal(owner.normalHomeConfirmationEndRecorded, true);
}
assert.equal(c.source, r.runtime.source); assert.equal(c.sourceTree, r.runtime.tree);
assert.equal(c.physicalDeviceResult, null); assert.equal(c.records.length, 4);
assert.equal(c.sourceComponentTests, 11); assert.equal(c.typePreflight, 'passed'); assert.equal(c.originalSourceScopePins, 'passed');
assert.deepEqual(new Set(c.records.map(x => x.engine + '/' + x.heatOn)),
  new Set(['chromium/false', 'chromium/true', 'webkit/false', 'webkit/true']));
for (const x of c.records) {
  assert.equal(x.complete, true); assert.equal(x.source, r.runtime.source);
  assert.equal(x.physicalDevice, false); assert.equal(x.physicalCrashSimulated, false); assert.equal(x.whiteScreenFixed, false);
  assert.equal(x.comparison, 'boss-heat-only-toggle'); assert.equal(x.fullRecording, false);
  assert.equal(x.originalBoss, true); assert.equal(x.originalBackground, true); assert.equal(x.weaponCanvasOff, true);
  assert.equal(x.steeringEventsSynthetic, true); assert.equal(x.bossReflectionStillHidden, true);
  assert.equal(x.originalHeatLayerVisible, x.heatOn);
  for (const key of ['bannerMatches', 'pointerSteeringPreserved', 'weaponMenuRoundtrip', 'manualPauseFreezes',
    'normalExitAndReportPreserved', 'originalBackgroundVisible', 'originalBossVisible']) assert.equal(x[key], true);
  assert.ok(x.activeObservation.activeMs >= 20000);
  const s = x.activeObservation.scene;
  assert.equal(s.starfields, 2); assert.equal(s.backgroundPlanets, 4); assert.ok(s.backgroundStarCircles >= 215);
  assert.ok(s.flatShips > 0); assert.equal(s.detailedNonBossShips, 0); assert.equal(s.playerShotBackground, 'none');
  assert.equal(s.canvases, 0); assert.equal(s.bossCanvases, 0); assert.equal(s.bossImages, 1);
  assert.equal(s.bossReflections, 1); assert.equal(s.originalBosses, 1); assert.equal(s.foregroundImages, 1);
  assert.equal(s.flatBosses, 0); assert.equal(s.bossMaskLayers.length, 2); assert.ok(s.bossHeatHotspots > 0);
  for (const layer of s.bossMaskLayers) {
    assert.equal(layer.maskConfigured, true);
    if (x.heatOn && layer.className.split(' ').includes('hull-heat-layer')) {
      assert.notEqual(layer.display, 'none'); assert.ok(layer.rects > 0); assert.ok(layer.opacity > 0);
    } else { assert.equal(layer.display, 'none'); assert.equal(layer.rects, 0); }
  }
  if (x.heatOn) {
    assert.ok(s.visibleBossHeatHotspots > 0); assert.equal(x.originalBossOuterSizePreserved, true); assert.equal(x.originalLayoutBoxesPreserved, true);
  } else assert.equal(s.visibleBossHeatHotspots, 0);
}
const d = r.deployment;
assert.equal(d.environment, 'preview'); assert.equal(d.status, 'Ready');
assert.equal(d.requireLogin, true); assert.equal(d.protection, 'Standard Protection');
assert.equal(d.customDomainsAssigned, false); assert.equal(d.productionCandidate, false);
const h = r.hostedCheck;
assert.equal(h.physicalDevice, false); assert.equal(h.source, r.runtime.source); assert.equal(h.sourceTree, r.runtime.tree);
assert.equal(h.diagnosticScene, 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-reflection');
assert.equal(h.pairedReport, true); assert.equal(h.fullRecording, false); assert.equal(h.protection, true);
assert.equal(h.normalExit, true); assert.equal(h.reloadRestored, true); assert.equal(h.savedMode, 'ended');
assert.equal(h.sceneCanvases, 0); assert.equal(h.originalBossImages, 1); assert.equal(h.bossImageReady, true);
assert.equal(h.maskLayers.length, 2); assert.ok(h.visibleBossHeatHotspots > 0);
for (const layer of h.maskLayers) {
  assert.equal(layer.maskConfigured, true);
  if (layer.className.split(' ').includes('hull-heat-layer')) { assert.notEqual(layer.display, 'none'); assert.ok(layer.rects > 0); assert.ok(layer.opacity > 0); }
  else { assert.equal(layer.display, 'none'); assert.equal(layer.rects, 0); }
}
assert.equal(h.backgroundPlanets, 4); assert.ok(h.backgroundStarCircles >= 215);
assert.equal(h.screenshotIsOwnerPhoneResult, false);
assert.equal(createHash('sha256').update(readFileSync(new URL(h.screenshot, import.meta.url))).digest('hex'), h.screenshotSha256);
assert.equal(r.nextPhoneProtocol.targetActiveMinutes, 10);
const p = r.physicalDeviceResult, owner = read('./' + p.evidence);
assert.equal(owner.runtimeSource, r.runtime.source); assert.equal(owner.runtimeTree, r.runtime.tree);
assert.equal(owner.configuredTreatment, h.diagnosticScene);
assert.equal(owner.reportSha256, '6c0f6956a8bd1c2037394c964fe65adcb7719811184cc57c4f701dd675258ac6');
assert.equal(owner.reportBytes, 8291);
assert.equal(owner.savedActiveMs, 516166); assert.equal(owner.displayedTime, '08:36');
assert.equal(owner.savedMode, 'running'); assert.equal(owner.unobservedGaps, 0);
assert.equal(owner.clockAndBriefRunMatch, true); assert.equal(owner.fullRecording, false);
assert.equal(owner.protection, true); assert.equal(owner.fullSession, null);
assert.equal(owner.ownerObservation.browser, 'Pi Browser'); assert.equal(owner.ownerObservation.browserConfirmedByOwner, true);
assert.equal(owner.ownerObservation.whiteScreenReported, true); assert.equal(owner.ownerObservation.returnToTestPageReported, true);
assert.equal(owner.ownerObservation.normalExitReported, false); assert.equal(owner.ownerObservation.slightDeviceWarmthReported, true);
assert.equal(owner.ownerObservation.temperatureMeasured, false); assert.equal(owner.nativeTerminationCauseMeasured, false);
assert.equal(owner.exactCrashTime, false); assert.equal(owner.normalExitRecorded, false);
assert.equal(owner.retainedEvents, 32); assert.equal(owner.collectorDrops, 298);
assert.equal(owner.lastRetainedInput.kind, 'touchstart'); assert.equal(owner.lastRetainedInput.contacts, 1);
assert.equal(owner.savedActiveMs - owner.lastRetainedInput.elapsedMs, owner.lastRetainedInputActiveMsBeforeCheckpoint);
assert.equal(owner.lastRetainedInputActiveMsBeforeCheckpoint, 2008);
assert.equal(owner.releaseAfterLastTouchstartRecorded, false);
assert.equal(owner.newDocumentAfterRunningCheckpoint, true); assert.equal(owner.newDocumentMsAfterLastCheckpoint, 679);
assert.equal(owner.bootAfterActiveSessionRecorded, true); assert.equal(owner.physicalSceneDomMeasuredByReport, false);
assert.equal(owner.configuredOriginalHullHeatRestored, true); assert.equal(owner.configuredHullReflectionHidden, true);
for (const key of ['savedActiveMs', 'displayedTime', 'savedMode', 'exactCrashTime', 'nativeTerminationCauseMeasured']) assert.equal(p[key], owner[key]);
for (const key of ['browser', 'browserConfirmedByOwner', 'whiteScreenReported', 'normalExitReported', 'slightDeviceWarmthReported', 'temperatureMeasured']) assert.equal(p[key], owner.ownerObservation[key]);
assert.equal(r.nextPhoneProtocol.status, 'completed-with-white-screen');
assert.equal(r.nextAction.newPhoneTestAssigned, false); assert.equal(r.nextAction.newRuntimeCreated, false);
console.log('CRYPTOID_BOSS_HEAT_EVIDENCE ' + JSON.stringify({ passed: true, source: r.runtime.source,
  syntheticComparisons: 4, physicalDeviceResult: p, whiteScreenFixed: false }));
