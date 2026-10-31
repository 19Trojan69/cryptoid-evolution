import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const results = read('./results.json');
assert.equal(results.runtime.source, 'e16befbb1251b14b0f2742f8a984c29a00173c41');
assert.equal(results.runtime.tree, 'b09af3b2dec4f19e17e37485759b19fda79fb6f5');
assert.equal(results.whiteScreenFixed, false); assert.equal(results.physicalDeviceTested, true);
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
const failedOwner = read('./evidence/owner-reflection-restoration-failure.json');
assert.equal(failedOwner.runtimeSource, results.runtime.source); assert.equal(failedOwner.runtimeTree, results.runtime.tree);
assert.equal(failedOwner.savedActiveMs, 528993); assert.equal(failedOwner.displayedTime, '08:48');
assert.equal(failedOwner.savedMode, 'running'); assert.equal(failedOwner.unobservedGaps, 0);
assert.equal(failedOwner.clockAndBriefRunMatch, true); assert.equal(failedOwner.fullRecording, false);
assert.equal(failedOwner.protection, true); assert.equal(failedOwner.fullSession, null);
assert.equal(failedOwner.retainedEvents, 32); assert.equal(failedOwner.collectorDrops, 41);
assert.equal(failedOwner.newHomeDocumentAfterRunningCheckpoint, true); assert.equal(failedOwner.newDocumentAfterLastCheckpointMs, 1021);
assert.equal(failedOwner.bootAfterActiveSessionRecorded, true); assert.equal(failedOwner.lastSessionActive, true);
assert.equal(failedOwner.configuredReflectionVisibleWithOriginalImageMask, true);
assert.equal(failedOwner.configuredActiveHeatImageMaskRemoved, true);
assert.equal(failedOwner.ownerObservation.whiteScreenReported, true);
assert.equal(failedOwner.ownerObservation.returnToDiagnosticPageReported, true);
assert.equal(failedOwner.ownerObservation.normalExitReported, false);
assert.equal(failedOwner.ownerObservation.deviceWarmthReported, null);
assert.equal(failedOwner.nativeTerminationCauseMeasured, false); assert.equal(failedOwner.exactCrashTimeMeasured, false);
assert.equal(failedOwner.rawOwnerReportCommitted, false); assert.equal(failedOwner.whiteScreenFixed, false);
assert.equal(results.newOwnerPhoneResult.status, 'failed-white-screen-owner-reported');
assert.equal(results.newOwnerPhoneResult.savedActiveMs, failedOwner.savedActiveMs);
assert.equal(results.newOwnerPhoneResult.permanentRepairAccepted, false);
if (process.argv[2]) {
  // Optional local-only comparison to the supplied raw report. Never write it to Git.
  const bytes = readFileSync(process.argv[2]), raw = JSON.parse(bytes);
  assert.equal(bytes.length, failedOwner.reportBytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), failedOwner.reportSha256);
  assert.equal(raw.source.sourceCommit, failedOwner.runtimeSource); assert.equal(raw.source.sourceTree, failedOwner.runtimeTree);
  assert.equal(raw.source.diagnosticScene, failedOwner.configuredTreatment);
  const clock = raw.stopwatch.latest, brief = raw.briefDiagnostics.latest, ret = raw.returnEvidence;
  assert.deepEqual(clock, brief.clock); assert.equal(raw.briefMatchesLatestStopwatch, true);
  assert.equal(clock.elapsedMs, failedOwner.savedActiveMs); assert.equal(clock.mode, failedOwner.savedMode);
  assert.equal(clock.unobservedGaps, failedOwner.unobservedGaps);
  assert.equal(brief.options.fullRecording, failedOwner.fullRecording); assert.equal(brief.options.protection, failedOwner.protection);
  assert.equal(raw.fullSession, null); assert.equal(brief.events.length, failedOwner.retainedEvents);
  assert.equal(brief.dropped, failedOwner.collectorDrops);
  assert.equal(ret.activeDocument.route, 'home');
  assert.equal(ret.activeDocument.startedAt - clock.updatedAt, failedOwner.newDocumentAfterLastCheckpointMs);
  assert.equal(ret.lastSession.active, true); assert.equal(ret.lastSession.context.status, 'playing');
  assert.ok(ret.reloadTrace.events.some(e => e.kind === 'boot-after-active-session' && e.at > clock.updatedAt && e.route === 'home'));
}
console.log('CRYPTOID_UNMASKED_REFLECTION_EVIDENCE ' + JSON.stringify({ passed: true, source: results.runtime.source,
  desktopFlows: 4, newOwnerPhoneResult: 'failed-white-screen-owner-reported', savedOwnerTime: '08:48', whiteScreenFixed: false }));
