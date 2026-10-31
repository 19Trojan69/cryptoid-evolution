import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const r = read('./results.json'), e = read('./evidence/synthetic-reflection-mask-comparison.json');
assert.equal(r.runtime.source, 'ebe70ac8ac80ebd8bce3f00273a9182520f51323');
assert.equal(r.runtime.tree, 'bd6fd845ad281496f668c151ab6b1cbb3e94f350');
assert.equal(r.whiteScreenFixed, false); assert.equal(r.physicalDeviceTested, true);
assert.equal(r.newOwnerPhoneResult.status, 'failed-white-screen-owner-reported'); assert.equal(e.physicalDevice, false);
assert.equal(r.verification.sourceComponentTests, 16); assert.equal(r.verification.shortDesktopFlows, 4);
assert.equal(r.verification.runId, 41187402778); assert.equal(r.verification.status, 'passed');
assert.equal(e.observations.length, 4);
for (const engine of ['chromium','webkit']) {
  const pair = e.observations.filter(o => o.engine === engine); assert.equal(pair.length, 2);
  for (const removed of [false,true]) {
    const o = pair.find(o => o.reflectionMaskRemoved === removed); assert.ok(o);
    assert.equal(o.complete, true); assert.equal(o.reflectionMaskComparison, true);
    assert.equal(o.reflectionOn, true); assert.equal(o.unmasked, true);
    assert.equal(o.source, r.runtime.source); assert.equal(o.sourceTree, r.runtime.tree);
    assert.equal(o.physicalDevice, false); assert.equal(o.whiteScreenFixed, false);
    assert.ok(o.activeObservation.activeMs >= 20000); assert.equal(o.activeObservation.sameDocument, true);
    assert.equal(o.scene.heat.mask, 'none'); assert.equal(o.scene.heat.webkitMask, 'none');
    assert.equal(o.scene.heat.display, 'block'); assert.equal(o.scene.heat.rects, 1);
    assert.ok(o.scene.hotspots.length > 0 && o.scene.hotspots.length <= 8);
    for (const s of o.scene.hotspots) { assert.ok(Number(s.opacity) > 0); assert.equal(s.rects, 1); }
    const reflection = o.scene.reflection, pulse = o.originalReflectionPulse;
    assert.equal(reflection.display, 'block'); assert.equal(reflection.rects, 1);
    assert.ok(reflection.inlineMask.includes('url('));
    for (const obj of [reflection,pulse]) {
      assert.equal(obj.blend, 'screen'); assert.ok(obj.background.includes('linear-gradient'));
      for (const key of ['mask','webkitMask']) {
        if (removed) assert.equal(obj[key], 'none'); else assert.ok(obj[key].includes('url('));
      }
    }
    assert.ok(pulse.opacity > 0); assert.equal(pulse.display, 'block'); assert.equal(pulse.rects, 1);
    assert.equal(o.scene.reflectionCascadeOnlyProbe.nonMaskPropertiesIdentical, true);
    assert.equal(o.scene.reflectionCascadeOnlyProbe.exactInlineStyleRestored, true);
    assert.equal(o.scene.reflectionCascadeOnlyProbe.oppositeMask === 'none', !removed);
    assert.equal(o.scene.bossImageReady, true); assert.equal(o.scene.sceneCanvases, 0);
    assert.equal(o.scene.backgroundPlanets, 4); assert.ok(o.scene.backgroundStarCircles >= 215);
    for (const key of ['manualPauseFreezes','pointerSteeringPreserved','weaponMenuRoundtrip','normalExitAndReportPreserved']) assert.equal(o[key], true);
    assert.ok(o.reportScene.endsWith(removed ? '-unmasked-hull-heat-unmasked-hull-reflection' : '-unmasked-hull-heat-restored-hull-reflection'));
  }
  assert.deepEqual(pair[0].scene.bossRect, pair[1].scene.bossRect);
}
const failed = read('../boss2-unmasked-heat-reflection-20261030/evidence/owner-reflection-restoration-failure.json');
assert.equal(failed.runtimeSource, r.basis.failedOwnerSource); assert.equal(failed.savedActiveMs, 528993);
assert.equal(failed.ownerObservation.whiteScreenReported, true); assert.equal(failed.bootAfterActiveSessionRecorded, true);
const completed = read('../boss2-boss-heat-unmasked-20261030/evidence/owner-mask-candidate-completion.json');
assert.equal(completed.runtimeSource, r.basis.precedingNormalOwnerSource); assert.equal(completed.savedActiveMs, 656318);
assert.equal(completed.ownerObservation.normalExitReported, true);
if (r.hostedCheck) {
  const h = read('./evidence/hosted-reflection-mask-candidate.json');
  assert.equal(h.source, r.runtime.source); assert.equal(h.sourceTree, r.runtime.tree);
  assert.equal(h.physicalDevice, false); assert.equal(h.whiteScreenFixed, false);
  assert.equal(h.heatMask, 'none'); assert.equal(h.heatWebkitMask, 'none');
  assert.equal(h.reflectionMask, 'none'); assert.equal(h.reflectionWebkitMask, 'none');
  assert.equal(h.reflectionDisplay, 'block'); assert.equal(h.reflectionBlend, 'screen');
  assert.equal(h.originalInlineReflectionMaskRetained, true); assert.ok(h.visibleHotspots > 0);
  assert.equal(h.manualPauseFreezes, true); assert.equal(h.explicitResume, true);
  assert.equal(h.normalExit, true); assert.equal(h.pairedReport, true); assert.equal(h.savedMode, 'ended');
  assert.equal(h.fullRecording, false); assert.equal(h.protection, true); assert.equal(h.fullSession, null);
  assert.equal(h.lastTimeRestoredAfterReload, true);
}
const idle = read('./evidence/owner-both-masks-idle-failure.json');
assert.equal(idle.runtimeSource, r.runtime.source); assert.equal(idle.runtimeTree, r.runtime.tree);
assert.equal(idle.savedActiveMs, 560125); assert.equal(idle.displayedTime, '09:20'); assert.equal(idle.savedMode, 'running');
assert.equal(idle.ownerObservation.whiteScreenReported, true); assert.equal(idle.ownerObservation.leftRunningWithoutPlayingReported, true);
assert.equal(idle.ownerObservation.normalExitReported, false); assert.equal(idle.ownerObservation.deviceWarmthReported, null);
assert.equal(idle.clockAndBriefRunMatch, true); assert.equal(idle.unobservedGaps, 0);
assert.equal(idle.retainedEvents, 6); assert.equal(idle.collectorDrops, 0);
assert.equal(idle.recordedContactSequenceCount, 1); assert.equal(idle.maxContactsRecorded, 1);
assert.equal(idle.recordedContactStartSavedActiveMs, 124389); assert.ok(Math.abs(idle.recordedContactEndSavedActiveMs - 126397) < .01);
assert.equal(idle.lastRecordedContactToLatestCheckpointWallMs, 433126); assert.equal(idle.laterContactRecorded, false);
assert.equal(idle.inputCompletelyRuledOut, false); assert.equal(idle.lastTouchProvesTrigger, false);
assert.equal(idle.newHomeDocumentAfterRunningCheckpoint, true); assert.equal(idle.newDocumentAfterLastCheckpointMs, 663);
assert.equal(idle.bootAfterActiveSessionRecorded, true); assert.equal(idle.lastSessionActive, true);
assert.equal(idle.configuredBothOriginalLayersVisible, true); assert.equal(idle.configuredBothLayersActiveStandardAndWebkitMasksRemoved, true);
assert.equal(idle.configuredReflectionBlend, 'screen'); assert.equal(idle.fullRecording, false); assert.equal(idle.protection, true);
assert.equal(idle.fullSession, null); assert.equal(idle.nativeTerminationCauseMeasured, false); assert.equal(idle.exactCrashTimeMeasured, false);
assert.equal(idle.whiteScreenFixed, false); assert.equal(idle.rawOwnerReportCommitted, false);
assert.equal(r.newOwnerPhoneResult.savedActiveMs, idle.savedActiveMs); assert.equal(r.newOwnerPhoneResult.permanentRepairAccepted, false);
if (process.argv[2]) {
  // Optional local-only pairing; raw reports are never copied into this repository.
  const bytes = readFileSync(process.argv[2]), raw = JSON.parse(bytes);
  assert.equal(bytes.length, idle.reportBytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), idle.reportSha256);
  assert.equal(raw.source.sourceCommit, idle.runtimeSource); assert.equal(raw.source.sourceTree, idle.runtimeTree);
  assert.equal(raw.source.diagnosticScene, idle.configuredTreatment);
  const clock = raw.stopwatch.latest, brief = raw.briefDiagnostics.latest, ret = raw.returnEvidence;
  assert.deepEqual(clock, brief.clock); assert.equal(raw.briefMatchesLatestStopwatch, true);
  assert.equal(clock.elapsedMs, idle.savedActiveMs); assert.equal(clock.mode, idle.savedMode); assert.equal(clock.unobservedGaps, 0);
  assert.equal(brief.options.fullRecording, false); assert.equal(brief.options.protection, true); assert.equal(raw.fullSession, null);
  assert.equal(brief.events.length, 6); assert.equal(brief.dropped, 0);
  const contacts = brief.events.filter(ev => ev.kind !== 'state');
  assert.equal(contacts[0].elapsedMs, idle.recordedContactStartSavedActiveMs);
  assert.equal(contacts.at(-1).elapsedMs, idle.recordedContactEndSavedActiveMs);
  assert.equal(clock.updatedAt - contacts.at(-1).at, idle.lastRecordedContactToLatestCheckpointWallMs);
  assert.equal(contacts.filter(ev => ev.kind === 'pointerdown').length, idle.recordedContactSequenceCount);
  assert.equal(ret.activeDocument.route, 'home'); assert.equal(ret.activeDocument.startedAt - clock.updatedAt, 663);
  assert.equal(ret.lastSession.active, true); assert.equal(ret.lastSession.context.status, 'playing');
  assert.ok(ret.reloadTrace.events.some(ev => ev.kind === 'boot-after-active-session' && ev.at > clock.updatedAt && ev.route === 'home'));
}
console.log('CRYPTOID_REFLECTION_MASK_EVIDENCE ' + JSON.stringify({ passed: true, source: r.runtime.source,
  desktopFlows: 4, newOwnerPhoneResult: 'failed-white-screen-owner-reported', savedOwnerTime: '09:20', whiteScreenFixed: false }));
