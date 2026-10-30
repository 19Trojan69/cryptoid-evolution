import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const r = read('./results.json'), c = read('./evidence/synthetic-boss-comparison.json');
assert.equal(r.runtime.source, '089d2267dc504611ecbf912b4422f3fb5f5cecf2');
assert.equal(r.runtime.tree, '908cfa6a957062afbaf63386ab3ef076499f2826');
assert.equal(r.runtime.deviceBranch, 'codex/boss2-boss-visual-device-20261030');
assert.equal(r.whiteScreenFixed, false); assert.equal(r.physicalDeviceResult, null);
assert.equal(r.publicMainSource, 'ce073547cf573375d141bf846f70e294138dbd73');
assert.equal(r.deployment.environment, 'preview'); assert.equal(r.deployment.status, 'Ready');
assert.equal(r.deployment.requireLogin, true); assert.equal(r.deployment.protection, 'Standard Protection');
assert.equal(r.deployment.customDomainsAssigned, false);
assert.equal(c.source, r.runtime.source); assert.equal(c.sourceTree, r.runtime.tree);
assert.equal(c.physicalDeviceResult, null); assert.equal(c.records.length, 4);
assert.deepEqual(new Set(c.records.map(x => x.engine + '/' + x.originalBoss)),
  new Set(['chromium/false', 'chromium/true', 'webkit/false', 'webkit/true']));
for (const x of c.records) {
  assert.equal(x.complete, true); assert.equal(x.controlled, true); assert.equal(x.source, r.runtime.source);
  assert.equal(x.physicalDevice, false); assert.equal(x.physicalCrashSimulated, false); assert.equal(x.whiteScreenFixed, false);
  assert.equal(x.comparison, 'original-boss-toggle'); assert.equal(x.fullRecording, false);
  assert.equal(x.originalBackground, true); assert.equal(x.steeringEventsSynthetic, true);
  for (const key of ['bannerMatches', 'pointerSteeringPreserved', 'weaponMenuRoundtrip', 'manualPauseFreezes', 'normalExitAndReportPreserved', 'originalBackgroundVisible']) assert.equal(x[key], true);
  assert.ok(x.activeObservation.activeMs >= 20000);
  const s = x.activeObservation.scene;
  assert.equal(s.starfields, 2); assert.equal(s.backgroundPlanets, 4); assert.ok(s.backgroundStarCircles >= 215);
  assert.ok(s.flatShips > 0); assert.equal(s.detailedNonBossShips, 0); assert.equal(s.playerShotBackground, 'none');
  if (x.originalBoss) {
    assert.equal(x.originalBossVisible, true); assert.equal(x.originalBossOuterSizePreserved, true);
    assert.equal(x.originalLayoutBoxesPreserved, true);
    for (const key of ['canvases', 'bossCanvases', 'bossImages', 'originalBosses', 'foregroundImages']) assert.equal(s[key], 1);
    assert.equal(s.flatBosses, 0);
  } else { assert.equal(s.canvases, 0); assert.equal(s.foregroundImages, 0); assert.equal(s.flatBosses, 1); }
}
const baseline = read('../boss2-background-control-20261030/evidence/owner-background-pi-completion.json');
assert.equal(baseline.runtimeSource, r.baseBackgroundPhoneSource);
assert.equal(baseline.ownerObservation.browser, 'Pi Browser'); assert.equal(baseline.displayedTime, '10:01');
assert.equal(baseline.ownerObservation.whiteScreenReported, false);
const h = r.hostedCheck;
assert.equal(h.physicalDevice, false); assert.equal(h.source, r.runtime.source);
assert.equal(h.diagnosticScene, 'flat-live-scene-original-background-original-boss'); assert.equal(h.pairedReport, true);
assert.equal(h.fullSession, null); assert.equal(h.fullRecording, false); assert.equal(h.protection, true);
assert.equal(h.normalExit, true); assert.equal(h.pauseObserved, true); assert.equal(h.reloadRestored, true);
assert.equal(h.sceneCanvases, 1); assert.equal(h.originalBossImages, 1); assert.ok(h.bossCanvasPixels > 1);
assert.equal(h.flatBosses, 0); assert.equal(h.detailedNonBossShips, 0);
assert.equal(h.reactorDisplay, 'none'); assert.equal(h.reactorRects, 0);
assert.equal(h.backgroundPlanets, 4); assert.ok(h.backgroundStarCircles >= 215); assert.ok(h.savedActiveMs > 0);
assert.equal(h.unexpectedTechnicalPauseObserved, false); assert.equal(h.displayedTime, '02:25');
const initial = read('./evidence/hosted-technical-pause.json'), extra = read('./evidence/hosted-extra-diagnostics.json');
assert.equal(initial.source, r.runtime.source); assert.equal(initial.unrequestedTechnicalPauseObserved, true);
assert.equal(initial.technicalAlertVisible, true); assert.equal(initial.whiteScreenObserved, false);
assert.equal(initial.pauseReasonPreserved, false); assert.equal(initial.manualResumeWorked, true);
assert.equal(extra.source, r.runtime.source); assert.equal(extra.displayedTime, '03:03');
assert.equal(extra.fullRecordingOption, true); assert.equal(extra.unexpectedTechnicalPauseObserved, false);
assert.equal(extra.completeFullSessionProduced, false); assert.equal(extra.fullSession, null);
assert.equal(r.desktopInvestigation.initialTechnicalPauseUnexplained, true);
assert.equal(r.desktopInvestigation.applicationNativeCauseProven, false);
assert.equal(r.desktopInvestigation.browserAutomationAsCauseProven, false);
assert.equal(createHash('sha256').update(readFileSync(new URL('./evidence/hosted-boss-control.jpg', import.meta.url))).digest('hex'), h.screenshotSha256);
console.log('CRYPTOID_BOSS_VISUAL_EVIDENCE ' + JSON.stringify({ passed: true, source: r.runtime.source,
  syntheticComparisons: 4, physicalDeviceResult: null, whiteScreenFixed: false }));
