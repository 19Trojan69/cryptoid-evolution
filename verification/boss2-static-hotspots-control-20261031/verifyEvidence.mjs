import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const r=read('./results.json'),e=read('./evidence/synthetic-static-hotspot-comparison.json');
assert.equal(r.runtime.source,'290113362eea446aa9d4171aaaddd7220e3bf646');
assert.equal(r.runtime.tree,'6acb9cff2dd908f0532cd986319f0965a46b5da0');
assert.equal(r.whiteScreenFixed,false);assert.equal(r.physicalDeviceTested,true);assert.equal(r.newOwnerPhoneResult.status,'failed-white-screen-owner-reported');
assert.equal(r.newOwnerPhoneResult.ownerWhiteScreenReported,true);
assert.equal(r.verification.runId,41231656473);assert.equal(r.verification.status,'passed');assert.equal(r.verification.sourceTests,22);assert.equal(r.verification.shortDesktopFlows,4);
assert.equal(e.source,r.runtime.source);assert.equal(e.tree,r.runtime.tree);assert.equal(e.physicalDevice,false);assert.equal(e.observations.length,4);
for(const engine of ['chromium','webkit']) {
  const pair=e.observations.filter(o=>o.engine===engine);assert.equal(pair.length,2);
  for(const off of [false,true]) {
    const o=pair.find(o=>o.staticHotspotsOff===off);assert.ok(o);assert.equal(o.complete,true);
    assert.equal(o.source,r.runtime.source);assert.equal(o.sourceTree,r.runtime.tree);
    assert.equal(o.staticHotspotsComparison,true);assert.equal(o.physicalDevice,false);assert.equal(o.whiteScreenFixed,false);
    assert.equal(o.heatFlatFill,true);assert.equal(o.unmasked,true);assert.equal(o.reflectionOn,false);
    assert.equal(o.scene.heat.display,'block');assert.equal(o.scene.heat.rects,1);assert.equal(o.scene.heat.mask,'none');assert.equal(o.scene.heat.webkitMask,'none');
    assert.ok(o.scene.heat.inlineMask.includes('url('));assert.equal(o.scene.heat.overflow,'hidden');assert.equal(o.scene.reflection.display,'none');assert.equal(o.scene.reflection.rects,0);
    if(off)assert.equal(o.scene.hotspots.length,0);else {
      assert.ok(o.scene.hotspots.length>0&&o.scene.hotspots.length<=8);
      for(const s of o.scene.hotspots) {assert.equal(s.background,'none');assert.equal(s.innerBackgroundColor,'rgb(255, 121, 40)');assert.equal(Number(s.opacity),.48);assert.equal(Number(s.innerOpacity),.72);}
    }
    const mini=o.originalMiniExplosionPulse;assert.ok(mini.opacity>0);assert.ok(mini.background.includes('radial-gradient'));assert.ok(mini.sparks>=3&&mini.sparks<=5);assert.equal(mini.outsideHeatLayer,true);
    if(off)assert.equal(mini.hotspots,0);
    assert.ok(o.activeObservation.activeMs>=20000);assert.equal(o.activeObservation.sameDocument,true);assert.equal(o.initialActiveObservationBeforeSyntheticSteering,true);
    assert.equal(o.scene.bossImageReady,true);assert.equal(o.scene.sceneCanvases,0);assert.equal(o.scene.backgroundPlanets,4);assert.ok(o.scene.backgroundStarCircles>=215);
    for(const k of ['manualPauseFreezes','pointerSteeringPreserved','weaponMenuRoundtrip','normalExitAndReportPreserved'])assert.equal(o[k],true,k);
    assert.ok(o.reportScene.endsWith('-unmasked-hull-heat-flat-fill'+(off?'-no-static-hotspots':'')));
  }
  assert.deepEqual(pair[0].scene.bossRect,pair[1].scene.bossRect);
}
const owner=read('../boss2-heat-flat-fill-control-20261031/evidence/owner-flat-fill-repeat-abrupt-return.json');
assert.equal(owner.runtimeSource,r.basis.source);assert.equal(owner.runtimeTree,r.basis.tree);assert.equal(owner.savedActiveMs,525494);assert.equal(owner.savedMode,'running');assert.equal(owner.briefMatchesLatestStopwatch,true);
assert.equal(owner.bootAfterActiveSessionRecorded,true);assert.equal(owner.normalEndRecorded,false);assert.equal(owner.whitePixelsMeasured,false);assert.equal(owner.ownerWhiteScreenExplicitlyRestatedForThisRepeat,false);
assert.equal(owner.retainedEvents,6);assert.equal(owner.collectorDrops,0);assert.equal(owner.lastRecordedContactToCheckpointWallMs,489581);assert.ok(owner.newDocumentAfterCheckpointMs>=730&&owner.newDocumentAfterCheckpointMs<731);
const failed=read('./evidence/owner-static-hotspots-failure.json');
assert.equal(failed.runtimeSource,r.runtime.source);assert.equal(failed.runtimeTree,r.runtime.tree);assert.equal(failed.ownerWhiteScreenReported,true);
assert.equal(failed.savedActiveMs,900561);assert.equal(failed.displayedTime,'15:00');assert.equal(failed.savedMode,'running');assert.equal(failed.recordedGaps,0);
assert.equal(failed.retainedEvents,32);assert.equal(failed.collectorDrops,26);assert.equal(failed.lastRecordedContactToCheckpointWallMs,81524);
assert.equal(failed.newDocumentAfterCheckpointMs,843);assert.equal(failed.bootAfterActiveSessionRecorded,true);assert.equal(failed.normalEndRecorded,false);
assert.equal(failed.stabilityGainProvenByLongerTime,false);assert.equal(failed.nativeTerminationCauseMeasured,false);assert.equal(failed.permanentRepairAccepted,false);
if(process.argv[2]) {
  const b=readFileSync(process.argv[2]),raw=JSON.parse(b),c=raw.stopwatch.latest,q=raw.briefDiagnostics.latest;
  assert.equal(b.length,failed.reportBytes);assert.equal(createHash('sha256').update(b).digest('hex'),failed.reportSha256);
  assert.deepEqual(c,q.clock);assert.equal(raw.briefMatchesLatestStopwatch,true);assert.equal(c.source,r.runtime.source);assert.equal(raw.source.sourceCommit,r.runtime.source);assert.equal(raw.source.sourceTree,r.runtime.tree);
  assert.equal(c.elapsedMs,failed.savedActiveMs);assert.equal(c.mode,failed.savedMode);assert.equal(c.unobservedGaps,failed.recordedGaps);
  assert.equal(q.events.length,32);assert.equal(q.dropped,26);assert.deepEqual(q.options,{scene:'reactor',fullRecording:false,protection:true});assert.equal(raw.fullSession,null);
  const contacts=q.events.filter(e=>['touchend','pointerup','lostpointercapture'].includes(e.kind));assert.equal(c.updatedAt-Math.max(...contacts.map(e=>e.at)),failed.lastRecordedContactToCheckpointWallMs);
  assert.equal(raw.returnEvidence.activeDocument.startedAt-c.updatedAt,843);assert.equal(raw.returnEvidence.activeDocument.route,'home');assert.equal(raw.returnEvidence.lastSession.active,true);assert.ok(raw.returnEvidence.reloadTrace.events.some(e=>e.kind==='boot-after-active-session'));
}
if(r.hostedCheck) {
  const h=read('./evidence/hosted-static-hotspot-candidate.json');
  assert.equal(h.source,r.runtime.source);assert.equal(h.sourceTree,r.runtime.tree);assert.equal(h.physicalDevice,false);assert.equal(h.whiteScreenFixed,false);
  assert.equal(h.staticHotspots,0);assert.equal(h.heatDisplay,'block');assert.equal(h.heatMask,'none');assert.equal(h.heatWebkitMask,'none');assert.equal(h.originalInlineHeatMaskRetained,true);assert.equal(h.reflectionDisplay,'none');
  assert.equal(h.originalBossImageReady,true);assert.equal(h.sceneCanvases,0);assert.equal(h.backgroundPlanets,4);assert.ok(h.backgroundStars>=215);
  assert.ok(h.originalMiniExplosion.opacity>0);assert.ok(h.originalMiniExplosion.background.includes('radial-gradient'));assert.ok(h.originalMiniExplosion.sparks>=3&&h.originalMiniExplosion.sparks<=5);assert.equal(h.originalMiniExplosion.outsideHeatLayer,true);
  for(const k of ['manualPauseFreezes','explicitResume','normalExit','pairedReport','lastTimeRestoredAfterReload'])assert.equal(h[k],true,k);
  assert.equal(h.savedMode,'ended');assert.equal(h.fullRecording,false);assert.equal(h.protection,true);assert.equal(h.fullSession,null);
  assert.equal(h.stalledStateEntries,1);assert.equal(h.displayedTime,'01:32');assert.equal(h.retainedEvents,16);assert.equal(h.collectorDrops,0);
  assert.equal(h.guestOnly,true);for(const k of ['liveBackend','realAccounts','payments','automaticUpload','automaticResume'])assert.equal(h[k],false,k);
  assert.equal(r.hostedCheck.ownerResult,false);assert.equal(r.hostedCheck.uninterruptedPerformanceClaimed,false);
  assert.equal(h.url,r.deployment.url);assert.equal(h.deploymentId,r.deployment.id);
  assert.equal(r.deployment.environment,'Preview');assert.equal(r.deployment.source,r.runtime.source);assert.equal(r.deployment.status,'READY');assert.equal(r.deployment.publicReleaseAuthorized,false);
}
console.log('CRYPTOID_STATIC_HOTSPOT_EVIDENCE '+JSON.stringify({passed:true,source:r.runtime.source,shortDesktopFlows:4,newOwnerPhoneResult:'owner White Screen at saved15:00/running with static hotspots omitted',whiteScreenFixed:false}));
