import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const r = read('./results.json'), e = read('./evidence/synthetic-reflection-blend-comparison.json');
assert.equal(r.runtime.source, '18bb097a473d8afa2bbdaa12e1babef5e9ef39cc');
assert.equal(r.runtime.tree, 'dbb6c12a329bcd3862993a10e4b9811f2dc5c372');
assert.equal(r.whiteScreenFixed, false); assert.equal(r.physicalDeviceTested, true);
assert.equal(r.newOwnerPhoneResult.status, 'failed-white-screen-owner-reported');
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
const latest = read('./evidence/owner-normal-blend-failure.json');
assert.equal(latest.runtimeSource, r.runtime.source); assert.equal(latest.runtimeTree, r.runtime.tree);
assert.equal(latest.savedActiveMs, 567442); assert.equal(latest.displayedTime, '09:27'); assert.equal(latest.savedMode, 'running');
assert.equal(latest.unobservedGaps, 0); assert.equal(latest.clockAndBriefRunMatch, true);
assert.equal(latest.ownerObservation.whiteScreenReported, true); assert.equal(latest.ownerObservation.normalExitReported, false);
assert.equal(latest.ownerObservation.leftRunningWithoutPlayingReported, null); assert.equal(latest.ownerObservation.deviceWarmthReported, null);
assert.equal(latest.retainedEvents, 32); assert.equal(latest.collectorDrops, 34); assert.equal(latest.maxContactsInRetainedTail, 2);
assert.equal(latest.gestureEventsInRetainedTail, true); assert.equal(latest.lastTouchProvesTrigger, false);
assert.equal(latest.lastRetainedEventSavedActiveMs, 514230); assert.equal(latest.lastRetainedEventToLatestCheckpointWallMs, 52733);
assert.equal(latest.newHomeDocumentAfterRunningCheckpoint, true); assert.equal(latest.newDocumentAfterLastCheckpointMs, 562);
assert.equal(latest.bootAfterActiveSessionRecorded, true); assert.equal(latest.lastSessionActive, true);
assert.equal(latest.configuredReflectionBlend, 'normal'); assert.equal(latest.configuredBothOriginalBossLayersVisible, true);
assert.equal(latest.configuredBothLayersActiveStandardAndWebkitMasksRemoved, true);
assert.equal(latest.fullRecording, false); assert.equal(latest.protection, true); assert.equal(latest.fullSession, null);
assert.equal(latest.exactCrashTimeMeasured, false); assert.equal(latest.nativeTerminationCauseMeasured, false);
assert.equal(latest.rawOwnerReportCommitted, false); assert.equal(latest.whiteScreenFixed, false);
assert.equal(r.newOwnerPhoneResult.savedActiveMs, latest.savedActiveMs); assert.equal(r.newOwnerPhoneResult.permanentRepairAccepted, false);
const review = read('./evidence/comparison-review.json');
const oldControl = read('../boss2-boss-heat-unmasked-20261030/evidence/owner-mask-candidate-completion.json');
const repeatedControl = read('../boss2-boss-heat-unmasked-20261030/evidence/owner-mask-candidate-repeat-failure.json');
assert.equal(review.previousReviewLatestFailedOwnerSource, latest.runtimeSource);
assert.equal(review.latestFailedOwnerSource, repeatedControl.runtimeSource); assert.equal(review.latestFailedOwnerSavedActiveMs, 550312);
assert.equal(review.latestSuccessfulControlSource, oldControl.runtimeSource); assert.equal(review.latestSuccessfulControlSavedActiveMs, 656318);
assert.equal(review.successLongerThanLatestFailedCheckpointByMs, oldControl.savedActiveMs - repeatedControl.savedActiveMs);
assert.equal(review.successLongerThanLatestFailedCheckpointByMs, 106006); assert.equal(review.durableStableControlEstablished, false);
assert.equal(review.unchangedControlRepeatFailed, true); assert.equal(review.includedSameExportPriorNormalCompletion, true);
assert.equal(review.interpretation.bothMaskRemovalInsufficientAsRepair, true);
assert.equal(review.interpretation.screenToNormalChangeInsufficientAsRepair, true);
assert.equal(review.newRuntimeCreated, false); assert.equal(review.newDeploymentCreated, false); assert.equal(review.newPublicRelease, false);
assert.equal(review.targetedSourceReview.originalSourcesEdited, false); assert.equal(review.targetedSourceReview.earlierCleanupBenchmarksRepeated, false);
assert.equal(review.nextOwnerComparison.source, oldControl.runtimeSource); assert.equal(review.nextOwnerComparison.tree, oldControl.runtimeTree);
assert.equal(review.nextOwnerComparison.existingFrozenControlOnly, true); assert.equal(review.nextOwnerComparison.targetActiveMinutes, 20);
assert.equal(review.nextOwnerComparison.state, 'completed-failed'); assert.equal(review.nextOwnerComparison.result.savedActiveMs, 550312);
assert.equal(review.nextOwnerComparison.result.twentyMinuteTargetReached, false);
if (process.argv[2]) {
  const bytes = readFileSync(process.argv[2]), raw = JSON.parse(bytes);
  assert.equal(bytes.length, latest.reportBytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), latest.reportSha256);
  assert.equal(raw.source.sourceCommit, latest.runtimeSource); assert.equal(raw.source.sourceTree, latest.runtimeTree);
  assert.equal(raw.source.diagnosticScene, latest.configuredTreatment);
  const clock = raw.stopwatch.latest, brief = raw.briefDiagnostics.latest, ret = raw.returnEvidence;
  assert.deepEqual(clock, brief.clock); assert.equal(raw.briefMatchesLatestStopwatch, true);
  assert.equal(clock.elapsedMs, latest.savedActiveMs); assert.equal(clock.mode, 'running'); assert.equal(clock.unobservedGaps, 0);
  assert.equal(brief.options.fullRecording, false); assert.equal(brief.options.protection, true); assert.equal(raw.fullSession, null);
  assert.equal(brief.events.length, 32); assert.equal(brief.dropped, 34);
  assert.equal(brief.events.at(-1).kind, latest.lastRetainedEventKind);
  assert.equal(brief.events.at(-1).elapsedMs, latest.lastRetainedEventSavedActiveMs);
  assert.equal(clock.updatedAt - brief.events.at(-1).at, latest.lastRetainedEventToLatestCheckpointWallMs);
  assert.equal(ret.activeDocument.route, 'home'); assert.equal(ret.activeDocument.startedAt - clock.updatedAt, 562);
  assert.equal(ret.lastSession.active, true); assert.equal(ret.lastSession.context.status, 'playing');
  assert.ok(ret.reloadTrace.events.some(ev => ev.kind === 'boot-after-active-session' && ev.at > clock.updatedAt && ev.route === 'home'));
}
console.log('CRYPTOID_REFLECTION_BLEND_EVIDENCE ' + JSON.stringify({ passed: true, source: r.runtime.source,
  desktopFlows: 4, newOwnerPhoneResult: 'failed-white-screen-owner-reported', savedOwnerTime: '09:27',
  controlConfirmation: 'same 67dabc71 failed 09:10; previous 10:56 retained', newRuntime: false, whiteScreenFixed: false }));
