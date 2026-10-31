import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const r = read('./results.json'), e = read('./evidence/synthetic-reflection-blend-comparison.json');
assert.equal(r.runtime.source, '18bb097a473d8afa2bbdaa12e1babef5e9ef39cc');
assert.equal(r.runtime.tree, 'dbb6c12a329bcd3862993a10e4b9811f2dc5c372');
assert.equal(r.whiteScreenFixed, false); assert.equal(r.physicalDeviceTested, false); assert.equal(r.newOwnerPhoneResult, null);
assert.equal(r.verification.sourceComponentTests, 18); assert.equal(r.verification.shortDesktopFlows, 4);
assert.equal(r.verification.status, 'passed'); assert.equal(r.verification.runId, 41189758667);
assert.equal(e.physicalDevice, false); assert.equal(e.observations.length, 4);
for (const engine of ['chromium','webkit']) {
  const pair = e.observations.filter(o => o.engine === engine); assert.equal(pair.length, 2);
  for (const normal of [false,true]) {
    const o = pair.find(o => o.reflectionNormalBlend === normal); assert.ok(o);
    assert.equal(o.complete, true); assert.equal(o.reflectionBlendComparison, true);
    assert.equal(o.source, r.runtime.source); assert.equal(o.sourceTree, r.runtime.tree);
    assert.equal(o.physicalDevice, false); assert.equal(o.whiteScreenFixed, false);
    assert.equal(o.reflectionMaskRemoved, true); assert.equal(o.reflectionOn, true); assert.equal(o.unmasked, true);
    assert.ok(o.activeObservation.activeMs >= 20000); assert.equal(o.activeObservation.sameDocument, true);
    assert.equal(o.initialActiveObservationBeforeSyntheticSteering, true);
    assert.equal(o.scene.heat.display, 'block'); assert.equal(o.scene.heat.rects, 1);
    assert.equal(o.scene.reflection.display, 'block'); assert.equal(o.scene.reflection.rects, 1);
    assert.ok(o.scene.reflection.inlineMask.includes('url(')); assert.ok(o.scene.heat.inlineMask.includes('url('));
    for (const layer of [o.scene.heat,o.scene.reflection,o.originalReflectionPulse]) {
      assert.equal(layer.mask, 'none'); assert.equal(layer.webkitMask, 'none');
    }
    for (const reflection of [o.scene.reflection,o.originalReflectionPulse]) {
      assert.equal(reflection.blend, normal ? 'normal' : 'screen'); assert.ok(reflection.background.includes('linear-gradient'));
    }
    assert.ok(o.originalReflectionPulse.opacity > 0); assert.equal(o.originalReflectionPulse.display, 'block');
    assert.ok(o.scene.hotspots.length > 0 && o.scene.hotspots.length <= 8);
    for (const h of o.scene.hotspots) { assert.equal(h.rects, 1); assert.ok(Number(h.opacity) > 0); assert.equal(h.nativeAnimations, 0); }
    assert.equal(o.scene.reflectionBlendOnlyProbe.nonBlendPropertiesIdentical, true);
    assert.equal(o.scene.reflectionBlendOnlyProbe.exactInlineStyleRestored, true);
    assert.equal(o.scene.reflectionBlendOnlyProbe.oppositeBlend, normal ? 'screen' : 'normal');
    assert.equal(o.scene.bossImageReady, true); assert.equal(o.scene.sceneCanvases, 0);
    assert.equal(o.scene.backgroundPlanets, 4); assert.ok(o.scene.backgroundStarCircles >= 215);
    for (const key of ['manualPauseFreezes','pointerSteeringPreserved','weaponMenuRoundtrip','normalExitAndReportPreserved']) assert.equal(o[key], true);
    assert.ok(o.reportScene.endsWith('-unmasked-hull-heat-unmasked-hull-reflection' + (normal ? '-normal-blend' : '')));
  }
  assert.deepEqual(pair[0].scene.bossRect, pair[1].scene.bossRect);
  assert.equal(pair[0].scene.reflection.background, pair[1].scene.reflection.background);
}
const failed = read('../boss2-reflection-mask-control-20261031/evidence/owner-both-masks-idle-failure.json');
assert.equal(failed.runtimeSource, r.basis.failedOwnerSource); assert.equal(failed.savedActiveMs, 560125);
assert.equal(failed.ownerObservation.whiteScreenReported, true); assert.equal(failed.ownerObservation.leftRunningWithoutPlayingReported, true);
assert.equal(failed.retainedEvents, 6); assert.equal(failed.collectorDrops, 0);
assert.equal(failed.lastRecordedContactToLatestCheckpointWallMs, 433126); assert.equal(failed.bootAfterActiveSessionRecorded, true);
if (r.hostedCheck) {
  const h = read('./evidence/hosted-reflection-blend-candidate.json');
  assert.equal(h.source, r.runtime.source); assert.equal(h.sourceTree, r.runtime.tree);
  assert.equal(h.physicalDevice, false); assert.equal(h.whiteScreenFixed, false);
  for (const key of ['heatMask','heatWebkitMask','reflectionMask','reflectionWebkitMask']) assert.equal(h[key], 'none');
  assert.equal(h.reflectionBlend, 'normal'); assert.equal(h.reflectionDisplay, 'block'); assert.ok(h.visibleHotspots > 0);
  assert.equal(h.originalInlineReflectionMaskRetained, true); assert.equal(h.originalInlineHeatMaskRetained, true);
  assert.equal(h.manualPauseFreezes, true); assert.equal(h.explicitResume, true);
  assert.equal(h.normalExit, true); assert.equal(h.pairedReport, true); assert.equal(h.savedMode, 'ended');
  assert.equal(h.fullRecording, false); assert.equal(h.protection, true); assert.equal(h.fullSession, null);
  assert.equal(h.lastTimeRestoredAfterReload, true);
}
console.log('CRYPTOID_REFLECTION_BLEND_EVIDENCE ' + JSON.stringify({ passed: true, source: r.runtime.source,
  desktopFlows: 4, newOwnerPhoneResult: 'not-tested', whiteScreenFixed: false }));
