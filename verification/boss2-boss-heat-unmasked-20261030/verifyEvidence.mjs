import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const results = read('./results.json');
assert.equal(results.whiteScreenFixed, false); assert.equal(results.physicalDeviceTested, true);
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
const owner = read('./evidence/owner-mask-candidate-completion.json');
assert.equal(owner.runtimeSource, results.runtime.source); assert.equal(owner.runtimeTree, results.runtime.tree);
assert.equal(owner.ownerObservation.browser, 'Pi Browser'); assert.equal(owner.ownerObservation.browserConfirmedByOwner, true);
assert.equal(owner.ownerObservation.normalExitReported, true); assert.equal(owner.ownerObservation.selfEndedReported, true);
assert.equal(owner.ownerObservation.whiteScreenAbsenceExplicitlyStated, false);
assert.equal(owner.ownerObservation.deviceWarmthReported, null); assert.equal(owner.ownerObservation.temperatureMeasured, false);
assert.equal(owner.reportFilename, 'cryptoid-diagnose-2026-10-30T17-22-59-959Z-9100dd82.json');
assert.equal(owner.reportBytes, 7739); assert.equal(owner.reportSha256, '06e4cce2ea0ebbd66d25004bfe3e082dd775c16f07d81d599f1ee598fcf99281');
assert.equal(owner.rawOwnerReportCommitted, false); assert.equal(owner.savedActiveMs, 656318);
assert.equal(owner.displayedTime, '10:56'); assert.equal(owner.savedMode, 'ended'); assert.equal(owner.unobservedGaps, 0);
assert.equal(owner.clockAndBriefRunMatch, true); assert.equal(owner.normalHomeConfirmationEndRecorded, true);
assert.equal(owner.fullRecording, false); assert.equal(owner.protection, true); assert.equal(owner.fullSession, null);
assert.equal(owner.retainedEvents, 32); assert.equal(owner.collectorDrops, 271);
assert.equal(owner.lastSessionActive, false); assert.equal(owner.activeDocumentStartedBeforeRun, true);
assert.equal(owner.allRetainedBootsBeforeRunStart, true); assert.equal(owner.bootAfterActiveSessionRecorded, false);
assert.equal(owner.configuredActiveHeatImageMaskRemoved, true); assert.equal(owner.configuredOriginalHotspotsVisible, true);
assert.equal(owner.configuredReflectionHidden, true); assert.equal(owner.physicalSceneDomMeasuredByReport, false);
assert.equal(owner.nativeTerminationCauseMeasured, false); assert.equal(owner.whiteScreenFixed, false);
assert.equal(results.physicalDeviceResult.savedActiveMs, owner.savedActiveMs);
assert.equal(results.physicalDeviceResult.savedMode, owner.savedMode);
assert.equal(results.physicalDeviceResult.permanentRepairAccepted, false);
for (const key of ['newRuntimeCreated', 'newDeploymentCreated', 'newPhoneTestAssigned', 'publicReleaseAuthorized'])
  assert.equal(results.afterOwnerReport[key], false, key);
console.log('CRYPTOID_HEAT_MASK_EVIDENCE ' + JSON.stringify({ passed: true, source: results.runtime.source, desktopFlows: 4,
  phoneResult: 'owner Pi Browser normal exit 10:56', ownerSavedActiveMs: owner.savedActiveMs, whiteScreenFixed: false }));
