import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
assert.equal(results.firstPhysicalDeviceResult.savedActiveMs, owner.savedActiveMs);
assert.equal(results.firstPhysicalDeviceResult.savedMode, owner.savedMode);
const repeat = read('./evidence/owner-mask-candidate-repeat-failure.json');
assert.equal(repeat.runtimeSource, results.runtime.source); assert.equal(repeat.runtimeTree, results.runtime.tree);
assert.equal(repeat.savedActiveMs, 550312); assert.equal(repeat.displayedTime, '09:10'); assert.equal(repeat.savedMode, 'running');
assert.equal(repeat.clockAndBriefRunMatch, true); assert.equal(repeat.unobservedGaps, 0);
assert.equal(repeat.ownerObservation.whiteScreenReported, true); assert.equal(repeat.ownerObservation.leftRunningWithoutPlayingReported, null);
assert.equal(repeat.ownerObservation.deviceWarmthReported, null);
assert.equal(repeat.fullRecording, false); assert.equal(repeat.protection, true); assert.equal(repeat.fullSession, null);
assert.equal(repeat.retainedEvents, 6); assert.equal(repeat.collectorDrops, 0); assert.equal(repeat.recordedContactSequenceCount, 1);
assert.equal(repeat.maxContactsInRetainedTail, 1); assert.equal(repeat.firstContactSavedActiveMs, 74416);
assert.equal(repeat.lastContactSavedActiveMs, 77428); assert.equal(repeat.lastRecordedContactToLatestCheckpointWallMs, 472708);
assert.equal(repeat.newHomeDocumentAfterRunningCheckpoint, true); assert.equal(repeat.newDocumentAfterLastCheckpointMs, 1124);
assert.equal(repeat.bootAfterActiveSessionRecorded, true); assert.equal(repeat.lastSessionActive, true);
assert.equal(repeat.configuredOriginalHeatVisible, true); assert.equal(repeat.configuredHeatStandardAndWebkitMasksRemoved, true);
assert.equal(repeat.configuredReflectionHidden, true); assert.equal(repeat.whiteScreenFixed, false);
assert.equal(repeat.durableStableControlEstablished, false); assert.equal(repeat.twentyActiveMinuteTargetReached, false);
assert.equal(repeat.rawOwnerReportCommitted, false); assert.equal(repeat.nativeTerminationCauseMeasured, false);
assert.equal(repeat.includedPreviousOwnerCompletion.sameSource, true); assert.equal(repeat.includedPreviousOwnerCompletion.differentRunId, true);
assert.equal(repeat.includedPreviousOwnerCompletion.savedActiveMs, owner.savedActiveMs);
assert.equal(repeat.includedPreviousOwnerCompletion.savedMode, 'ended');
assert.equal(repeat.includedPreviousOwnerCompletion.matchesArchivedOwnerCompletion, true);
assert.equal(repeat.includedPreviousOwnerCompletion.homeAndEndedSequenceRetained, true);
assert.equal(results.physicalDeviceResult.savedActiveMs, repeat.savedActiveMs);
assert.equal(results.physicalDeviceResult.savedMode, repeat.savedMode);
assert.equal(results.physicalDeviceResult.status, 'failed-white-screen-owner-reported');
assert.equal(results.physicalDeviceResult.permanentRepairAccepted, false);
assert.equal(results.physicalDeviceResults.length, 2);
if (process.argv[2]) {
  const bytes = readFileSync(process.argv[2]), raw = JSON.parse(bytes);
  assert.equal(bytes.length, repeat.reportBytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), repeat.reportSha256);
  assert.equal(raw.source.sourceCommit, repeat.runtimeSource); assert.equal(raw.source.sourceTree, repeat.runtimeTree);
  assert.equal(raw.source.diagnosticScene, repeat.configuredTreatment);
  const latest = raw.stopwatch.latest, previous = raw.stopwatch.previous, brief = raw.briefDiagnostics.latest, priorBrief = raw.briefDiagnostics.previous;
  assert.deepEqual(latest, brief.clock); assert.deepEqual(previous, priorBrief.clock); assert.equal(raw.briefMatchesLatestStopwatch, true);
  assert.equal(latest.elapsedMs, repeat.savedActiveMs); assert.equal(latest.mode, 'running'); assert.equal(latest.source, previous.source);
  assert.notEqual(latest.id, previous.id); assert.equal(previous.elapsedMs, owner.savedActiveMs); assert.equal(previous.mode, 'ended');
  assert.equal(brief.options.fullRecording, false); assert.equal(brief.options.protection, true); assert.equal(raw.fullSession, null);
  assert.equal(priorBrief.options.fullRecording, false); assert.equal(priorBrief.options.protection, true);
  assert.equal(brief.events.length, 6); assert.equal(brief.dropped, 0);
  assert.equal(latest.updatedAt - brief.events.at(-1).at, repeat.lastRecordedContactToLatestCheckpointWallMs);
  assert.equal(raw.returnEvidence.activeDocument.route, 'home');
  assert.equal(raw.returnEvidence.activeDocument.startedAt - latest.updatedAt, repeat.newDocumentAfterLastCheckpointMs);
  assert.ok(raw.returnEvidence.reloadTrace.events.some(ev => ev.kind === 'boot-after-active-session' && ev.at > latest.updatedAt));
}
for (const key of ['newRuntimeCreated', 'newDeploymentCreated', 'newPhoneTestAssigned', 'publicReleaseAuthorized'])
  assert.equal(results.afterOwnerReport[key], false, key);
console.log('CRYPTOID_HEAT_MASK_EVIDENCE ' + JSON.stringify({ passed: true, source: results.runtime.source, desktopFlows: 4,
  phoneResult: 'same frozen runtime: prior normal 10:56, repeat owner White Screen 09:10',
  ownerSavedActiveMs: repeat.savedActiveMs, previousOwnerNormalMs: owner.savedActiveMs, whiteScreenFixed: false }));
