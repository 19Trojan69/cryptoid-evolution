import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const r = read('./results.json'), e = read('./evidence/synthetic-heat-fill-comparison.json');
assert.equal(r.runtime.source, 'f67fd2e41c372de600d197f2c8d943b7097b9209');
assert.equal(r.runtime.tree, 'b58083ab6ba44a523d6497e317af665d4344fb90');
assert.equal(r.whiteScreenFixed, false); assert.equal(r.physicalDeviceTested, false); assert.equal(r.newOwnerPhoneResult, null);
assert.equal(r.verification.runId, 41209575472); assert.equal(r.verification.status, 'passed');
assert.equal(r.verification.sourceComponentTests, 20); assert.equal(r.verification.shortDesktopFlows, 4);
assert.equal(e.physicalDevice, false); assert.equal(e.observations.length, 4);
for (const engine of ['chromium','webkit']) {
  const pair = e.observations.filter(o => o.engine === engine); assert.equal(pair.length, 2);
  for (const flat of [false,true]) {
    const o = pair.find(o => o.heatFlatFill === flat); assert.ok(o);
    assert.equal(o.complete, true); assert.equal(o.heatFlatFillComparison, true);
    assert.equal(o.source, r.runtime.source); assert.equal(o.sourceTree, r.runtime.tree);
    assert.equal(o.physicalDevice, false); assert.equal(o.whiteScreenFixed, false);
    assert.equal(o.unmasked, true); assert.equal(o.reflectionOn, false);
    assert.equal(o.scene.heat.mask, 'none'); assert.equal(o.scene.heat.webkitMask, 'none');
    assert.equal(o.scene.heat.display, 'block'); assert.equal(o.scene.heat.rects, 1); assert.equal(o.scene.heat.overflow, 'hidden');
    assert.ok(o.scene.heat.inlineMask.includes('url(')); assert.equal(o.scene.reflection.display, 'none'); assert.equal(o.scene.reflection.rects, 0);
    assert.ok(o.activeObservation.activeMs >= 20000); assert.equal(o.activeObservation.sameDocument, true);
    assert.equal(o.initialActiveObservationBeforeSyntheticSteering, true);
    assert.ok(o.scene.hotspots.length > 0 && o.scene.hotspots.length <= 8);
    for (const h of o.scene.hotspots) {
      assert.equal(h.rects, 1); assert.equal(Number(h.opacity), .48); assert.equal(Number(h.innerOpacity), .72);
      assert.equal(h.animation, 'none'); assert.equal(h.innerAnimation, 'none'); assert.equal(h.nativeAnimations, 0);
      assert.ok(h.transform.startsWith('matrix(')); assert.ok(h.innerBorderRadius.length > 0);
      if (flat) { assert.equal(h.background, 'none'); assert.equal(h.innerBackgroundColor, 'rgb(255, 121, 40)'); }
      else assert.ok(h.background.includes('radial-gradient'));
    }
    assert.equal(o.scene.cascadeOnlyProbe.nonMaskPropertiesIdentical, true); assert.equal(o.scene.cascadeOnlyProbe.exactInlineStyleRestored, true);
    assert.equal(o.scene.bossImageReady, true); assert.equal(o.scene.sceneCanvases, 0);
    assert.equal(o.scene.backgroundPlanets, 4); assert.ok(o.scene.backgroundStarCircles >= 215);
    for (const key of ['manualPauseFreezes','pointerSteeringPreserved','weaponMenuRoundtrip','normalExitAndReportPreserved']) assert.equal(o[key], true);
    assert.ok(o.reportScene.endsWith('-hidden-hull-reflection-unmasked-hull-heat' + (flat ? '-flat-fill' : '')));
  }
  assert.deepEqual(pair[0].scene.bossRect, pair[1].scene.bossRect);
}
const repeat = read('../boss2-boss-heat-unmasked-20261030/evidence/owner-mask-candidate-repeat-failure.json');
assert.equal(repeat.runtimeSource, r.basis.failedOwnerSource); assert.equal(repeat.savedActiveMs, 550312);
assert.equal(repeat.ownerObservation.whiteScreenReported, true); assert.equal(repeat.savedMode, 'running');
assert.equal(repeat.includedPreviousOwnerCompletion.sameSource, true); assert.equal(repeat.includedPreviousOwnerCompletion.savedActiveMs, 656318);
assert.equal(repeat.includedPreviousOwnerCompletion.savedMode, 'ended'); assert.equal(repeat.durableStableControlEstablished, false);
assert.equal(repeat.retainedEvents, 6); assert.equal(repeat.collectorDrops, 0); assert.equal(repeat.lastRecordedContactToLatestCheckpointWallMs, 472708);
assert.equal(r.deployment.status, 'READY'); assert.equal(r.deployment.environment, 'Preview');
assert.equal(r.deployment.source, r.runtime.source); assert.equal(r.deployment.previewOnly, true);
assert.equal(r.deployment.publicReleaseAuthorized, false); assert.equal(r.deployment.gitAutomaticDeployment, false);
if (r.hostedCheck) {
  const h = read('./evidence/hosted-heat-fill-candidate.json');
  assert.equal(h.source, r.runtime.source); assert.equal(h.sourceTree, r.runtime.tree);
  assert.equal(h.physicalDevice, false); assert.equal(h.whiteScreenFixed, false);
  assert.equal(h.heatMask, 'none'); assert.equal(h.heatWebkitMask, 'none'); assert.equal(h.reflectionDisplay, 'none');
  assert.equal(h.originalInlineHeatMaskRetained, true); assert.ok(h.visibleHotspots > 0);
  for (const s of h.hotspots) { assert.equal(s.backgroundImage, 'none'); assert.equal(s.backgroundColor, 'rgb(255, 121, 40)'); assert.equal(Number(s.innerOpacity), .72); }
  assert.equal(h.manualPauseFreezes, true); assert.equal(h.explicitResume, true);
  assert.equal(h.normalExit, true); assert.equal(h.pairedReport, true); assert.equal(h.savedMode, 'ended');
  assert.equal(h.fullRecording, false); assert.equal(h.protection, true); assert.equal(h.fullSession, null);
  assert.equal(h.lastTimeRestoredAfterReload, true);
  assert.equal(h.url, r.deployment.url); assert.equal(h.deploymentId, r.deployment.id);
  assert.equal(h.originalBossImageReady, true); assert.equal(h.sceneCanvases, 0);
  assert.equal(h.backgroundPlanets, 4); assert.ok(h.backgroundStars >= 215);
  assert.equal(h.displayedTime, '01:12'); assert.equal(h.stalledStateEntries, 4);
  assert.equal(h.retainedEvents, 22); assert.equal(h.collectorDrops, 0);
  assert.equal(h.guestOnly, true);
  for (const k of ['liveBackend','realAccounts','payments','automaticUpload','automaticResume']) assert.equal(h[k], false);
  assert.equal(r.hostedCheck.ownerResult, false); assert.equal(r.hostedCheck.uninterruptedPerformanceClaimed, false);
}
console.log('CRYPTOID_HEAT_FLAT_FILL_EVIDENCE ' + JSON.stringify({ passed: true, source: r.runtime.source,
  desktopFlows: 4, newOwnerPhoneResult: 'not-tested', whiteScreenFixed: false }));
