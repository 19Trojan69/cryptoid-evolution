import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const results = read('./results.json');
assert.equal(results.runtime.source, 'e16befbb1251b14b0f2742f8a984c29a00173c41');
assert.equal(results.runtime.tree, 'b09af3b2dec4f19e17e37485759b19fda79fb6f5');
assert.equal(results.whiteScreenFixed, false); assert.equal(results.physicalDeviceTested, false);
assert.equal(results.verification.runId, 41100206610); assert.equal(results.verification.status, 'passed');
assert.equal(results.verification.sourceComponentTests, 14);
const evidence = read('./evidence/synthetic-reflection-comparison.json');
assert.equal(evidence.physicalDevice, false); assert.equal(evidence.observations.length, 4);
for (const engine of ['chromium', 'webkit']) {
  const pair = evidence.observations.filter(o => o.engine === engine); assert.equal(pair.length, 2);
  for (const reflectionOn of [false, true]) {
    const o = pair.find(o => o.reflectionOn === reflectionOn); assert.ok(o);
    assert.equal(o.complete, true); assert.equal(o.reflectionComparison, true); assert.equal(o.unmasked, true);
    assert.equal(o.source, results.runtime.source); assert.equal(o.sourceTree, results.runtime.tree);
    assert.equal(o.physicalDevice, false); assert.equal(o.whiteScreenFixed, false);
    assert.ok(o.activeObservation.activeMs >= 20000); assert.equal(o.activeObservation.sameDocument, true);
    assert.equal(o.scene.heat.mask, 'none'); assert.equal(o.scene.heat.webkitMask, 'none');
    assert.ok(o.scene.hotspots.length > 0 && o.scene.hotspots.length <= 8);
    assert.equal(o.scene.heat.display, 'block'); assert.equal(o.scene.heat.rects, 1);
    assert.equal(o.scene.reflection.display, reflectionOn ? 'block' : 'none');
    assert.equal(o.scene.reflection.rects, reflectionOn ? 1 : 0);
    assert.ok(o.scene.reflection.mask.includes('url(')); assert.ok(o.scene.reflection.webkitMask.includes('url('));
    if (reflectionOn) {
      assert.ok(o.originalReflectionPulse.opacity > 0); assert.equal(o.originalReflectionPulse.display, 'block');
      assert.ok(o.originalReflectionPulse.mask.includes('url('));
      assert.ok(o.reportScene.endsWith('-unmasked-hull-heat-restored-hull-reflection'));
    } else assert.ok(o.reportScene.endsWith('-hidden-hull-reflection-unmasked-hull-heat'));
    for (const key of ['manualPauseFreezes','pointerSteeringPreserved','weaponMenuRoundtrip','normalExitAndReportPreserved']) assert.equal(o[key], true, key);
    assert.equal(o.scene.sceneCanvases, 0); assert.equal(o.scene.backgroundPlanets, 4);
  }
  assert.deepEqual(pair[0].scene.bossRect, pair[1].scene.bossRect);
}
const owner = read('../boss2-boss-heat-unmasked-20261030/evidence/owner-mask-candidate-completion.json');
assert.equal(owner.runtimeSource, results.baselineOwner.source); assert.equal(owner.savedActiveMs, 656318);
assert.equal(owner.savedMode, 'ended'); assert.equal(owner.ownerObservation.normalExitReported, true);
if (results.hostedCheck) {
  const hosted = read('./evidence/hosted-reflection-candidate.json');
  assert.equal(hosted.source, results.runtime.source); assert.equal(hosted.sourceTree, results.runtime.tree);
  assert.equal(hosted.physicalDevice, false); assert.equal(hosted.whiteScreenFixed, false);
  assert.equal(hosted.activeHeatMask, 'none'); assert.ok(hosted.visibleOriginalHotspots > 0);
  assert.equal(hosted.reflectionDisplay, 'block'); assert.equal(hosted.reflectionRects, 1);
  assert.equal(hosted.originalReflectionMaskRetained, true);
  assert.equal(hosted.originalReflectionPulseObserved, false); // Honest sampled limitation; both CI engines measured a positive original pulse above.
  assert.equal(hosted.activeHeatWebkitMask, 'none'); assert.equal(hosted.savedMode, 'ended');
  assert.equal(hosted.fullRecording, false); assert.equal(hosted.protection, true); assert.equal(hosted.fullSession, null);
  assert.equal(hosted.manualPauseFreezes, true); assert.equal(hosted.lastTimeRestoredAfterReload, true);
  assert.equal(hosted.stalledStateEntries, 3); assert.equal(hosted.displayedTime, '01:11');
  assert.equal(hosted.normalExit, true); assert.equal(hosted.pairedReport, true);
}
console.log('CRYPTOID_UNMASKED_REFLECTION_EVIDENCE ' + JSON.stringify({ passed: true, source: results.runtime.source,
  desktopFlows: 4, newOwnerPhoneResult: 'not-tested', whiteScreenFixed: false }));
