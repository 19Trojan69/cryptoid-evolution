import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const r=read('./results.json'),e=read('./evidence/synthetic-mini-completion-comparison.json');
assert.equal(r.runtime.source,'d72db0a8ca5c70b91db9b7760366773e2836db66');
assert.equal(r.runtime.tree,'73c23f8a5dba0bb93ab676c4ad3954ddf7ff1228');
assert.equal(r.whiteScreenFixed,false);assert.equal(r.physicalDeviceTested,false);assert.equal(r.newOwnerPhoneResult,null);
assert.equal(r.verification.runId,41235613143);assert.equal(r.verification.status,'passed');assert.equal(r.verification.sourceTests,24);assert.equal(r.verification.shortDesktopFlows,4);
assert.equal(e.source,r.runtime.source);assert.equal(e.tree,r.runtime.tree);assert.equal(e.physicalDevice,false);assert.equal(e.observations.length,4);
for(const engine of ['chromium','webkit']) {
  const pair=e.observations.filter(o=>o.engine===engine);assert.equal(pair.length,2);
  for(const off of [false,true]) {
    const o=pair.find(o=>o.miniCompletionOff===off);assert.ok(o);assert.equal(o.complete,true);
    assert.equal(o.source,r.runtime.source);assert.equal(o.sourceTree,r.runtime.tree);assert.equal(o.physicalDevice,false);assert.equal(o.whiteScreenFixed,false);
    assert.equal(o.miniCompletionComparison,true);assert.equal(o.staticHotspotsOff,true);assert.equal(o.heatFlatFill,true);assert.equal(o.unmasked,true);assert.equal(o.reflectionOn,false);
    const proof=o.miniCompletionProof;assert.equal(proof.supported,true);assert.ok(proof.endEvents>=3);assert.ok(proof.startEvents>0);assert.equal(proof.observedPeakBossMini,1);assert.equal(proof.eventPhase,'none');
    assert.ok(proof.nativeCallsAtStart>0);assert.equal(proof.nativeCalls,proof.nativeCallsAtStart+proof.nativeCallsAtEnd+proof.nativeCallsOutsideEvents);
    if(off)assert.equal(proof.nativeCallsAtEnd,0);else assert.ok(proof.nativeCallsAtEnd>0);
    assert.equal(o.qaNativeProbeOnlyInTestContext,true);
    const m=o.originalMiniExplosionPulse;assert.ok(m.opacity>0);assert.ok(m.background.includes('radial-gradient'));assert.ok(m.sparks>=3&&m.sparks<=5);assert.equal(m.outsideHeatLayer,true);
    assert.equal(o.scene.hotspots.length,0);assert.equal(o.scene.heat.display,'block');assert.equal(o.scene.heat.rects,1);assert.equal(o.scene.heat.mask,'none');assert.equal(o.scene.heat.webkitMask,'none');assert.ok(o.scene.heat.inlineMask.includes('url('));
    assert.equal(o.scene.reflection.display,'none');assert.equal(o.scene.bossImageReady,true);assert.equal(o.scene.sceneCanvases,0);assert.equal(o.scene.backgroundPlanets,4);assert.ok(o.scene.backgroundStarCircles>=215);
    assert.ok(o.activeObservation.activeMs>=20000);assert.equal(o.activeObservation.sameDocument,true);
    for(const k of ['manualPauseFreezes','pointerSteeringPreserved','weaponMenuRoundtrip','normalExitAndReportPreserved'])assert.equal(o[k],true,k);
    assert.ok(o.reportScene.endsWith('-no-static-hotspots'+(off?'-no-mini-inspection':'')));
  }
  assert.deepEqual(pair[0].scene.bossRect,pair[1].scene.bossRect);
}
const prior=read('./evidence/initial-native-counter-failure.json');assert.equal(prior.source,'b5759f90948fae98fba7f0ec40e6168348b4ac13');assert.equal(prior.deployed,false);assert.equal(prior.observations.length,4);
assert.equal(prior.observations.filter(o=>o.complete).length,2);assert.ok(prior.observations.filter(o=>o.miniCompletionOff).every(o=>o.complete===false));
const owner=read('../boss2-static-hotspots-control-20261031/evidence/owner-static-hotspots-failure.json');assert.equal(owner.ownerWhiteScreenReported,true);assert.equal(owner.runtimeSource,r.basis.source);assert.equal(owner.runtimeTree,r.basis.tree);assert.equal(owner.savedActiveMs,900561);assert.equal(owner.savedMode,'running');assert.equal(owner.retainedEvents,32);assert.equal(owner.collectorDrops,26);assert.equal(owner.newDocumentAfterCheckpointMs,843);assert.equal(owner.lastRecordedContactToCheckpointWallMs,81524);assert.equal(owner.bootAfterActiveSessionRecorded,true);assert.equal(owner.stabilityGainProvenByLongerTime,false);
if(r.hostedCheck) {
  const h=read('./evidence/hosted-mini-completion-candidate.json');assert.equal(h.source,r.runtime.source);assert.equal(h.sourceTree,r.runtime.tree);assert.equal(h.physicalDevice,false);assert.equal(h.whiteScreenFixed,false);
  assert.equal(h.miniCompletionControlEnabled,true);assert.equal(h.qaNativeProbeDeployed,false);assert.equal(h.animationStartNativeDiscoveryRemains,true);
  assert.equal(h.staticHotspots,0);assert.equal(h.heatDisplay,'block');assert.equal(h.heatMask,'none');assert.equal(h.heatWebkitMask,'none');assert.equal(h.originalInlineHeatMaskRetained,true);assert.equal(h.reflectionDisplay,'none');
  assert.equal(h.originalBossImageReady,true);assert.equal(h.sceneCanvases,0);assert.equal(h.backgroundPlanets,4);assert.ok(h.backgroundStars>=215);
  assert.ok(h.originalMiniExplosion.opacity>0);assert.ok(h.originalMiniExplosion.background.includes('radial-gradient'));assert.ok(h.originalMiniExplosion.sparks>=3&&h.originalMiniExplosion.sparks<=5);assert.equal(h.originalMiniExplosion.outsideHeatLayer,true);
  for(const k of ['manualPauseFreezes','explicitResume','normalExit','pairedReport','lastTimeRestoredAfterReload'])assert.equal(h[k],true,k);
  assert.equal(h.savedMode,'ended');assert.equal(h.fullRecording,false);assert.equal(h.protection,true);assert.equal(h.fullSession,null);assert.equal(h.guestOnly,true);
  for(const k of ['liveBackend','realAccounts','payments','automaticUpload','automaticResume'])assert.equal(h[k],false,k);
  assert.equal(h.displayedTime,'01:24');assert.equal(h.stalledStateEntries,1);assert.equal(h.retainedEvents,16);assert.equal(h.collectorDrops,0);assert.equal(h.nativeCallCountersMeasuredInHostedFlow,false);assert.equal(h.notAllNativeQueriesRemoved,true);
  assert.equal(r.hostedCheck.ownerResult,false);assert.equal(r.hostedCheck.uninterruptedPerformanceClaimed,false);
  assert.equal(h.url,r.deployment.url);assert.equal(h.deploymentId,r.deployment.id);assert.equal(r.deployment.status,'READY');assert.equal(r.deployment.environment,'Preview');assert.equal(r.deployment.source,r.runtime.source);assert.equal(r.deployment.publicReleaseAuthorized,false);
}
console.log('CRYPTOID_MINI_COMPLETION_EVIDENCE '+JSON.stringify({passed:true,source:r.runtime.source,shortDesktopFlows:4,newOwnerPhoneResult:'not-tested',whiteScreenFixed:false}));
