import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const r=read('./results.json'),e=read('./evidence/synthetic-mini-start-comparison.json');
assert.equal(r.whiteScreenFixed,false);assert.equal(r.physicalDeviceTested,false);assert.equal(r.newOwnerPhoneResult,null);
assert.equal(r.verification.status,'passed');assert.equal(r.verification.sourceTests,26);assert.equal(r.verification.shortDesktopFlows,4);
assert.equal(e.source,r.runtime.source);assert.equal(e.tree,r.runtime.tree);assert.equal(e.physicalDevice,false);assert.equal(e.observations.length,4);
for(const engine of ['chromium','webkit']) {
  const pair=e.observations.filter(o=>o.engine===engine);assert.equal(pair.length,2);
  for(const off of [false,true]) {
    const o=pair.find(o=>o.miniStartOff===off);assert.ok(o);assert.equal(o.complete,true);
    assert.equal(o.source,r.runtime.source);assert.equal(o.sourceTree,r.runtime.tree);assert.equal(o.physicalDevice,false);assert.equal(o.whiteScreenFixed,false);
    for(const k of ['miniStartComparison','miniCompletionComparison','miniCompletionOff','staticHotspotsOff','heatFlatFill','unmasked'])assert.equal(o[k],true,k);
    assert.equal(o.reflectionOn,false);const proof=o.miniCompletionProof;
    assert.equal(proof.supported,true);assert.equal(proof.timingProbeSupported,true);assert.ok(proof.startEvents>0);assert.ok(proof.endEvents>=3);assert.equal(proof.observedPeakBossMini,1);assert.equal(proof.eventPhase,'none');
    assert.equal(proof.nativeCallsAtEnd,0);
    if(off){assert.equal(proof.nativeCalls,0);assert.equal(proof.nativeCallsAtStart,0);assert.equal(proof.nativeMiniTimingUpdates,0);}
    else{assert.ok(proof.nativeCallsAtStart>0);assert.ok(proof.nativeMiniTimingUpdates>0);}
    assert.equal(o.qaNativeProbeOnlyInTestContext,true);
    const m=o.originalMiniExplosionPulse;assert.ok(m.opacity>0);assert.ok(m.background.includes('radial-gradient'));assert.ok(m.sparks>=3&&m.sparks<=5);assert.equal(m.outsideHeatLayer,true);assert.equal(m.duration,'0.38s');
    assert.equal(o.scene.hotspots.length,0);assert.equal(o.scene.heat.display,'block');assert.equal(o.scene.heat.rects,1);assert.equal(o.scene.heat.mask,'none');assert.equal(o.scene.heat.webkitMask,'none');assert.ok(o.scene.heat.inlineMask.includes('url('));
    assert.equal(o.scene.reflection.display,'none');assert.equal(o.scene.bossImageReady,true);assert.equal(o.scene.sceneCanvases,0);assert.equal(o.scene.backgroundPlanets,4);assert.ok(o.scene.backgroundStarCircles>=215);
    assert.ok(o.activeObservation.activeMs>=20000);assert.equal(o.activeObservation.sameDocument,true);
    for(const k of ['manualPauseFreezes','pointerSteeringPreserved','weaponMenuRoundtrip','normalExitAndReportPreserved'])assert.equal(o[k],true,k);
    assert.ok(o.reportScene.endsWith('-no-mini-inspection'+(off?'-no-mini-start-pacing':'')));
  }
  assert.deepEqual(pair[0].scene.bossRect,pair[1].scene.bossRect);
}
const basis=read('../boss2-mini-completion-control-20261031/evidence/owner-mini-completion-abrupt-return.json');
assert.equal(basis.runtimeSource,r.basis.source);assert.equal(basis.runtimeTree,r.basis.tree);assert.equal(basis.savedActiveMs,962934);assert.equal(basis.savedMode,'running');assert.equal(basis.newDocumentAfterCheckpointMs,203);
assert.equal(basis.ownerWhiteScreenExplicitlyRestatedForThisRun,true);assert.equal(basis.bootAfterActiveSessionRecorded,true);assert.equal(basis.normalEndRecorded,false);assert.equal(basis.stabilityGainProvenByLongerTime,false);
if(r.hostedCheck){
  const h=read('./evidence/hosted-mini-start-candidate.json');assert.equal(h.source,r.runtime.source);assert.equal(h.sourceTree,r.runtime.tree);assert.equal(h.physicalDevice,false);assert.equal(h.whiteScreenFixed,false);
  assert.equal(h.miniStartControlEnabled,true);assert.equal(h.qaNativeProbeDeployed,false);assert.equal(h.nativeCallCountersMeasuredInHostedFlow,false);
  assert.equal(h.staticHotspots,0);assert.equal(h.heatDisplay,'block');assert.equal(h.heatMask,'none');assert.equal(h.heatWebkitMask,'none');assert.equal(h.originalInlineHeatMaskRetained,true);assert.equal(h.reflectionDisplay,'none');
  assert.equal(h.originalBossImageReady,true);assert.equal(h.sceneCanvases,0);assert.equal(h.backgroundPlanets,4);assert.ok(h.backgroundStars>=215);
  assert.ok(h.originalMiniExplosion.opacity>0);assert.ok(h.originalMiniExplosion.background.includes('radial-gradient'));assert.ok(h.originalMiniExplosion.sparks>=3&&h.originalMiniExplosion.sparks<=5);assert.equal(h.originalMiniExplosion.outsideHeatLayer,true);
  for(const k of ['manualPauseFreezes','explicitResume','normalExit','pairedReport','lastTimeRestoredAfterReload','guestOnly'])assert.equal(h[k],true,k);
  assert.equal(h.savedMode,'ended');assert.equal(h.fullRecording,false);assert.equal(h.protection,true);assert.equal(h.fullSession,null);
  for(const k of ['liveBackend','realAccounts','payments','automaticUpload','automaticResume'])assert.equal(h[k],false,k);
  assert.equal(r.hostedCheck.ownerResult,false);assert.equal(r.hostedCheck.uninterruptedPerformanceClaimed,false);
  assert.equal(h.url,r.deployment.url);assert.equal(h.deploymentId,r.deployment.id);assert.equal(r.deployment.status,'READY');assert.equal(r.deployment.environment,'Preview');assert.equal(r.deployment.source,r.runtime.source);assert.equal(r.deployment.publicReleaseAuthorized,false);
}
console.log('CRYPTOID_MINI_START_EVIDENCE '+JSON.stringify({passed:true,source:r.runtime.source,shortDesktopFlows:4,newOwnerPhoneResult:'not-tested',whiteScreenFixed:false}));
