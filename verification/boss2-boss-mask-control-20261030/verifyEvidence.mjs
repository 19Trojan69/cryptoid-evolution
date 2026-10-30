import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const r = read('./results.json'), c = read('./evidence/synthetic-mask-comparison.json');
assert.equal(r.runtime.source, 'eb018b2b5e422aaf65beb66a64c77b870b3c156e');
assert.equal(r.runtime.tree, 'caf5d0fd529b58911b88294afc9b52e118d35bdd');
assert.equal(r.whiteScreenFixed, false); assert.equal(r.physicalDeviceResult, null);
assert.equal(r.runtime.deviceBranch, 'codex/boss2-boss-mask-device-20261030');
assert.equal(r.publicMainSource, 'ce073547cf573375d141bf846f70e294138dbd73');
for (const key of ['weaponSimulationRetained', 'originalBossHullImageRetained', 'originalElementsAndMaskStylesRetained', 'originalPresentationComponentsAndHooksRetained'])
  assert.equal(r.treatment[key], true);
for (const key of ['simulationClocksChanged', 'inputChanged', 'audioChanged', 'extraSimulationTimersOrFrames'])
  assert.equal(r.treatment[key], false);
const baseline = read('../boss2-boss-weapon-control-20261030/evidence/owner-weapon-control-failure.json');
assert.equal(baseline.runtimeSource, r.baselineFailedPhone.source);
assert.equal(baseline.ownerObservation.browser, 'Pi Browser'); assert.equal(baseline.displayedTime, '08:30');
assert.equal(baseline.ownerObservation.whiteScreenReported, true); assert.equal(baseline.nativeTerminationCauseMeasured, false);
assert.equal(c.source, r.runtime.source); assert.equal(c.sourceTree, r.runtime.tree);
assert.equal(c.physicalDeviceResult, null); assert.equal(c.records.length, 4);
assert.equal(c.sourceComponentTests, 9); assert.equal(c.typePreflight, 'passed'); assert.equal(c.originalSourceScopePins, 'passed');
assert.deepEqual(new Set(c.records.map(x => x.engine + '/' + x.maskLayersOff)),
  new Set(['chromium/false', 'chromium/true', 'webkit/false', 'webkit/true']));
for (const x of c.records) {
  assert.equal(x.complete, true); assert.equal(x.source, r.runtime.source);
  assert.equal(x.physicalDevice, false); assert.equal(x.physicalCrashSimulated, false); assert.equal(x.whiteScreenFixed, false);
  assert.equal(x.comparison, 'boss-masked-layer-toggle'); assert.equal(x.fullRecording, false);
  assert.equal(x.originalBoss, true); assert.equal(x.originalBackground, true); assert.equal(x.weaponCanvasOff, true);
  assert.equal(x.steeringEventsSynthetic, true);
  for (const key of ['bannerMatches', 'pointerSteeringPreserved', 'weaponMenuRoundtrip', 'manualPauseFreezes',
    'normalExitAndReportPreserved', 'originalBackgroundVisible', 'originalBossVisible']) assert.equal(x[key], true);
  assert.ok(x.activeObservation.activeMs >= 20000);
  const s = x.activeObservation.scene;
  assert.equal(s.starfields, 2); assert.equal(s.backgroundPlanets, 4); assert.ok(s.backgroundStarCircles >= 215);
  assert.ok(s.flatShips > 0); assert.equal(s.detailedNonBossShips, 0); assert.equal(s.playerShotBackground, 'none');
  assert.equal(s.canvases, 0); assert.equal(s.bossCanvases, 0); assert.equal(s.bossImages, 1);
  assert.equal(s.bossReflections, 1); assert.equal(s.originalBosses, 1); assert.equal(s.foregroundImages, 1);
  assert.equal(s.flatBosses, 0); assert.equal(s.bossMaskLayers.length, 2);
  for (const layer of s.bossMaskLayers) {
    assert.equal(layer.maskConfigured, true);
    if (x.maskLayersOff) { assert.equal(layer.display, 'none'); assert.equal(layer.rects, 0); }
    else { assert.notEqual(layer.display, 'none'); assert.ok(layer.rects > 0); }
  }
  if (x.maskLayersOff) {
    assert.equal(x.onlyMaskedBossLayersHidden, true);
    assert.equal(x.originalBossOuterSizePreserved, true); assert.equal(x.originalLayoutBoxesPreserved, true);
  }
}
const d = r.deployment;
assert.equal(d.environment, 'preview'); assert.equal(d.status, 'Ready');
assert.equal(d.requireLogin, true); assert.equal(d.protection, 'Standard Protection');
assert.equal(d.customDomainsAssigned, false); assert.equal(d.productionCandidate, false);
const h = r.hostedCheck;
assert.equal(h.physicalDevice, false); assert.equal(h.source, r.runtime.source); assert.equal(h.sourceTree, r.runtime.tree);
assert.equal(h.diagnosticScene, 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-masks');
assert.equal(h.pairedReport, true); assert.equal(h.fullRecording, false); assert.equal(h.protection, true);
assert.equal(h.normalExit, true); assert.equal(h.reloadRestored, true); assert.equal(h.savedMode, 'ended');
assert.equal(h.sceneCanvases, 0); assert.equal(h.originalBossImages, 1); assert.equal(h.bossImageReady, true);
assert.equal(h.maskLayers.length, 2);
for (const layer of h.maskLayers) { assert.equal(layer.display, 'none'); assert.equal(layer.rects, 0); assert.equal(layer.maskConfigured, true); }
assert.equal(h.backgroundPlanets, 4); assert.ok(h.backgroundStarCircles >= 215);
assert.equal(h.screenshotIsOwnerPhoneResult, false);
assert.equal(createHash('sha256').update(readFileSync(new URL(h.screenshot, import.meta.url))).digest('hex'), h.screenshotSha256);
assert.equal(r.nextPhoneProtocol.targetActiveMinutes, 10);
console.log('CRYPTOID_BOSS_MASK_EVIDENCE ' + JSON.stringify({ passed: true, source: r.runtime.source,
  syntheticComparisons: 4, physicalDeviceResult: null, whiteScreenFixed: false }));
