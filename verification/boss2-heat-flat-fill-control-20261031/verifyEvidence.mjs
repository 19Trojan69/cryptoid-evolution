import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const r = read('./results.json'), e = read('./evidence/synthetic-heat-fill-comparison.json');
assert.equal(r.runtime.source, 'f67fd2e41c372de600d197f2c8d943b7097b9209');
assert.equal(r.runtime.tree, 'b58083ab6ba44a523d6497e317af665d4344fb90');
assert.equal(r.whiteScreenFixed, false); assert.equal(r.physicalDeviceTested, true); assert.equal(r.newOwnerPhoneResult.status, 'matched-repeat-running-checkpoint-then-new-home-document');
assert.equal(r.newOwnerPhoneResult.whiteScreenReportedForEarlierAttempt, true);
assert.equal(r.newOwnerPhoneResult.whiteScreenExplicitlyRestatedForThisRepeat, false);
assert.equal(r.newOwnerPhoneResult.reportReceived, true);
assert.equal(r.newOwnerPhoneResult.exportSourceVerified, true);
assert.equal(r.newOwnerPhoneResult.exportSource, r.runtime.source);
assert.equal(r.newOwnerPhoneResult.exportTree, r.runtime.tree);
assert.equal(r.newOwnerPhoneResult.runtimeSourceVerified, true);
assert.equal(r.newOwnerPhoneResult.runtimeSource, r.runtime.source); assert.equal(r.newOwnerPhoneResult.runtimeTree, r.runtime.tree);
assert.equal(r.newOwnerPhoneResult.savedActiveMs, 525494); assert.equal(r.newOwnerPhoneResult.displayedTime, '08:45'); assert.equal(r.newOwnerPhoneResult.savedMode, 'running');
const message = read('./evidence/owner-white-screen-message.json');
assert.equal(message.ownerMessage, 'mit whitescreen'); assert.equal(message.ownerObservation.whiteScreenReported, true);
assert.equal(message.precedingRequestedPreview.source, r.runtime.source); assert.equal(message.precedingRequestedPreview.tree, r.runtime.tree);
assert.equal(message.accompanyingReportReceived, false); assert.equal(message.runtimeSourceVerified, false);
assert.equal(message.runtimeSource, null); assert.equal(message.savedActiveMs, null); assert.equal(message.displayedTime, null);
assert.equal(message.previousOwner0910TimeAppliedToThisRun, false); assert.equal(message.assistant0112TimeAppliedToThisRun, false);
assert.equal(message.nativeTerminationCauseMeasured, false); assert.equal(message.permanentRepairAccepted, false);
const received = read('./evidence/owner-flat-fill-export-without-run.json');
assert.equal(received.reportFile, 'cryptoid-diagnose-2026-10-31T18-07-25-440Z-f9407023.json');
assert.equal(received.reportBytes, 2451);
assert.equal(received.reportSha256, 'ee4a42bac00f2eaf8add4e6fcb5da83a55ba1aabf449a55d6488575c0aeb5b5e');
assert.equal(received.exportSource, r.runtime.source); assert.equal(received.exportTree, r.runtime.tree);
assert.equal(received.currentExportPageMatchesDeliveredCandidate, true);
assert.equal(received.savedFailedRunSourceVerified, false);
assert.equal(received.ownerObservation.whiteScreenReported, true);
for (const k of ['runtimeSource','runtimeTree','latestStopwatch','previousStopwatch','latestBrief','previousBrief',
  'savedActiveMs','savedMode','displayedTime','retainedEvents','collectorDrops','recordedGaps','testOptions','fullRecording','protection']) assert.equal(received[k], null, k);
assert.equal(received.stopwatchStorage, 'absent'); assert.equal(received.briefStorage, 'absent');
assert.equal(received.returnSessionStorage, 'absent'); assert.equal(received.lastSessionMarker, null);
assert.equal(received.currentDocumentRoute, 'home'); assert.equal(received.currentDocumentNavigationType, 'navigate');
assert.ok(received.currentDocumentAgeMsAtExport >= 8000 && received.currentDocumentAgeMsAtExport < 8100);
assert.deepEqual(received.reloadTraceEventKinds, ['app-boot']); assert.equal(received.bootAfterActiveSessionRecorded, false);
assert.equal(received.briefMatchesLatestStopwatch, false); assert.equal(received.testOptionsHistoryEntries, 0);
assert.equal(received.testOptionsMatchedByStartTime, false); assert.equal(received.fullSession, null);
assert.equal(received.fullSessionNullConfirmed, true); assert.equal(received.crashTailSessionCount, 0); assert.equal(received.flightRecorderCount, 0);
assert.deepEqual(Object.values(received.crashTailStorage), ['absent','absent','absent','absent']);
for (const k of ['nativeTerminationCauseMeasured','exactCrashTimeMeasured','whiteScreenFixed','permanentRepairAccepted',
  'old0910TimeApplied','assistant0112TimeApplied','unchangedRepeatRequested','newRuntimeChangeMade','newDeploymentCreated']) assert.equal(received[k], false, k);
assert.equal(received.storageReadInterpretation.blob, 'e2546655a0c3c553b4d275d2effbb57b5407be1a');
assert.equal(received.storageReadInterpretation.causeKnown, false);
if (process.argv[2] && createHash('sha256').update(readFileSync(process.argv[2])).digest('hex') === received.reportSha256) {
  const bytes = readFileSync(process.argv[2]), raw = JSON.parse(bytes);
  assert.equal(bytes.length, received.reportBytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), received.reportSha256);
  assert.equal(raw.source.sourceCommit, received.exportSource); assert.equal(raw.source.sourceTree, received.exportTree);
  assert.equal(raw.source.diagnosticScene, received.diagnosticScene); assert.equal(raw.preparedAt, received.preparedAt);
  for (const [reportKey, receiptPrefix] of [['stopwatch','Stopwatch'],['briefDiagnostics','Brief']]) {
    const value = raw[reportKey]; assert.equal(value.storage, 'absent');
    assert.equal(value.latest, received['latest'+receiptPrefix]); assert.equal(value.previous, received['previous'+receiptPrefix]);
  }
  assert.equal(raw.stopwatch.displayedTime, null); assert.equal(raw.briefMatchesLatestStopwatch, false);
  assert.equal(raw.testOptions, null); assert.deepEqual(raw.testOptionsHistory, []); assert.equal(raw.fullSession, null);
  const back = raw.returnEvidence;
  assert.equal(back.activeDocument.ageMs, received.currentDocumentAgeMsAtExport);
  assert.equal(back.activeDocument.route, received.currentDocumentRoute); assert.equal(back.activeDocument.navigationType, received.currentDocumentNavigationType);
  assert.equal(back.lastSession, null); assert.equal(back.storage.session, received.returnSessionStorage);
  assert.deepEqual(back.reloadTrace.events.map(e => e.kind), received.reloadTraceEventKinds);
  assert.deepEqual(raw.crashTails.storage, received.crashTailStorage); assert.equal(raw.crashTails.sessions.length, 0); assert.equal(raw.flightRecorders.length, 0);
}
const repeatFill = read('./evidence/owner-flat-fill-repeat-abrupt-return.json');
assert.equal(repeatFill.runtimeSource, r.runtime.source); assert.equal(repeatFill.runtimeTree, r.runtime.tree);
assert.equal(repeatFill.savedActiveMs, 525494); assert.equal(repeatFill.displayedTime, '08:45'); assert.equal(repeatFill.savedMode, 'running');
assert.equal(repeatFill.briefMatchesLatestStopwatch, true); assert.equal(repeatFill.recordedGaps, 0);
assert.equal(repeatFill.retainedEvents, 6); assert.equal(repeatFill.collectorDrops, 0); assert.equal(repeatFill.lastRecordedContactToCheckpointWallMs, 489581);
assert.ok(repeatFill.newDocumentAfterCheckpointMs >= 730 && repeatFill.newDocumentAfterCheckpointMs < 731);
assert.equal(repeatFill.bootAfterActiveSessionRecorded, true); assert.equal(repeatFill.precedingSessionActive, true); assert.equal(repeatFill.precedingStatus, 'playing');
assert.equal(repeatFill.fullRecording, false); assert.equal(repeatFill.protection, true); assert.equal(repeatFill.fullSession, null);
assert.equal(repeatFill.normalEndRecorded, false); assert.equal(repeatFill.whitePixelsMeasured, false); assert.equal(repeatFill.ownerWhiteScreenExplicitlyRestatedForThisRepeat, false);
if (process.argv[2]) {
  const b = readFileSync(process.argv[2]), sha = createHash('sha256').update(b).digest('hex');
  assert.ok([received.reportSha256, repeatFill.reportSha256].includes(sha), 'Known owner export required');
  if (sha === repeatFill.reportSha256) {
    const raw = JSON.parse(b), c = raw.stopwatch.latest, brief = raw.briefDiagnostics.latest;
    assert.equal(b.length, repeatFill.reportBytes); assert.deepEqual(c, brief.clock); assert.equal(c.source, r.runtime.source);
    assert.equal(raw.source.sourceCommit, r.runtime.source); assert.equal(raw.source.sourceTree, r.runtime.tree);
    assert.equal(c.elapsedMs, repeatFill.savedActiveMs); assert.equal(c.mode, repeatFill.savedMode); assert.equal(c.unobservedGaps, repeatFill.recordedGaps);
    assert.equal(brief.events.length, repeatFill.retainedEvents); assert.equal(brief.dropped, repeatFill.collectorDrops);
    assert.deepEqual(brief.options, {scene:'reactor',fullRecording:false,protection:true}); assert.equal(raw.fullSession, null);
    assert.equal(raw.returnEvidence.activeDocument.startedAt-c.updatedAt, repeatFill.newDocumentAfterCheckpointMs);
    assert.equal(raw.returnEvidence.activeDocument.route, 'home'); assert.equal(raw.returnEvidence.lastSession.active, true);
    assert.ok(raw.returnEvidence.reloadTrace.events.some(e=>e.kind==='boot-after-active-session'));
  }
}
const review = read('./evidence/source-review-after-owner-message.json');
assert.equal(review.source, r.runtime.source); assert.equal(review.tree, r.runtime.tree);
assert.equal(review.decision.newRuntimeChangeMade, false); assert.equal(review.decision.newDeploymentCreated, false);
assert.equal(review.decision.additionalUnchangedPhoneRepeatRequested, false); assert.equal(review.decision.causeEstablished, false);
assert.equal(review.pins['frontend/src/pages/HullDamage.tsx'], '50616cc7bb7f0f419c0bcc3b6303a57d47e62439');
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
  desktopFlows: 4, newOwnerPhoneResult: 'matched repeat 08:45 running then new home document; no accepted fix', whiteScreenFixed: false }));
