import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const results = read('./results.json');
assert.equal(results.whiteScreenFixed, false); assert.equal(results.physicalDeviceTested, false);
assert.equal(results.newPhoneTestAssigned, false);
assert.equal(results.runtime.source, '67dabc714907be6d3ae99ccf9ebeab170eb34b06');
assert.equal(results.runtime.tree, '72de7664d3ef9dcd21ddd407b081bb647885f4f7');
assert.equal(results.verification.runId, 41089492243); assert.equal(results.verification.status, 'passed');
assert.equal(results.verification.sourceComponentTests, 12);
const synthetic = read('./evidence/synthetic-mask-comparison.json');
assert.equal(synthetic.physicalDevice, false); assert.equal(synthetic.whiteScreenFixed, false);
assert.equal(synthetic.observations.length, 4);
for (const engine of ['chromium', 'webkit']) {
  const pair = synthetic.observations.filter(o => o.engine === engine);
  assert.equal(pair.length, 2);
  for (const unmasked of [false, true]) {
    const o = pair.find(o => o.unmasked === unmasked); assert.ok(o);
    assert.equal(o.complete, true); assert.equal(o.source, results.runtime.source); assert.equal(o.sourceTree, results.runtime.tree);
    assert.equal(o.physicalDevice, false); assert.equal(o.whiteScreenFixed, false);
    assert.ok(o.activeObservation.activeMs >= 20000); assert.equal(o.activeObservation.sameDocument, true);
    assert.equal(o.scene.heat.display, 'block'); assert.equal(o.scene.heat.rects, 1);
    assert.ok(o.scene.hotspots.length > 0 && o.scene.hotspots.length <= 8);
    assert.equal(o.scene.heat.mask === 'none', unmasked); assert.equal(o.scene.heat.webkitMask === 'none', unmasked);
    assert.ok(o.scene.heat.inlineMask.includes('url('));
    assert.equal(o.scene.reflection.display, 'none'); assert.equal(o.scene.reflection.rects, 0);
    assert.equal(o.scene.cascadeOnlyProbe.nonMaskPropertiesIdentical, true);
    assert.equal(o.scene.cascadeOnlyProbe.exactInlineStyleRestored, true);
    for (const key of ['manualPauseFreezes', 'pointerSteeringPreserved', 'weaponMenuRoundtrip', 'normalExitAndReportPreserved']) assert.equal(o[key], true, key);
    assert.equal(o.reportScene.endsWith('-unmasked-hull-heat'), unmasked);
  }
  assert.deepEqual(pair[0].scene.bossRect, pair[1].scene.bossRect);
}
const excluded = read('./evidence/initial-verifier-failure.json');
assert.equal(excluded.runId, 41088919802); assert.equal(excluded.completedBrowserFlows, 0);
assert.equal(excluded.gameOpened, false); assert.equal(excluded.candidateAccepted, false);
if (results.hostedCheck) {
  const hosted = read('./evidence/hosted-mask-candidate.json');
  assert.equal(hosted.source, results.runtime.source); assert.equal(hosted.sourceTree, results.runtime.tree);
  assert.equal(hosted.physicalDevice, false); assert.equal(hosted.whiteScreenFixed, false);
  assert.equal(hosted.activeHeatMask, 'none'); assert.ok(hosted.visibleOriginalHotspots > 0);
  assert.equal(hosted.normalExit, true); assert.equal(hosted.pairedReport, true);
}
console.log('CRYPTOID_HEAT_MASK_EVIDENCE ' + JSON.stringify({ passed: true, source: results.runtime.source, desktopFlows: 4, phoneResult: 'not-tested', whiteScreenFixed: false }));
