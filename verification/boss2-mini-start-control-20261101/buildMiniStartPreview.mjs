import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bossMiniStartPacingDisabled, diagnosticSceneName } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
import { originalCssFramePacingBlob } from './miniStartControl.mjs';
assert.equal(process.env.VERCEL_ENV,'preview','Protected guest Preview only');
const enabled=process.env.CRYPTOID_BOSS_MINI_START_PACING_OFF!=='0';
Object.assign(process.env,{CRYPTOID_BOSS_MINI_START_PACING_OFF:enabled?'1':'0',CRYPTOID_BOSS_MINI_INSPECTION_OFF:'1'});
await import('../boss2-mini-completion-control-20261031/buildMiniCompletionPreview.mjs');
assert.equal(bossMiniStartPacingDisabled(),enabled);
const root=resolve(new URL('../..',import.meta.url).pathname),out=root+'/verification/boss2-forensics-20261028/results/device-preview/site';
const label=enabled?'TREFFERTEST: Originaltreffer; zusätzliche Animationstaktung aus':'TREFFERKONTROLLE: Originaltreffer; zusätzliche Animationstaktung an';
writeFileSync(out+'/diagnostic-mini-start.css','.device-preview-menu section::before { content: '+JSON.stringify(label)+' !important; }\n');
const path=out+'/index.html',html=readFileSync(path,'utf8');assert.equal(html.split('</head>').length,2);writeFileSync(path,html.replace('</head>','<link rel="stylesheet" href="/diagnostic-mini-start.css"></head>'));
const ip=out+'/device-preview-info.json',info=JSON.parse(readFileSync(ip,'utf8'));
assert.equal(info.diagnosticScene,diagnosticSceneName());assert.equal(info.bossMiniCompletionControl.enabled,true);assert.equal(info.guestOnly,true);assert.equal(info.liveBackend,false);
info.bossMiniCompletionControl.animationStartNativeDiscoveryRemains=!enabled;
info.bossMiniCompletionControl.notAllNativeQueriesRemoved=true;
info.bossMiniStartControl={version:1,enabled,label,originalCssFramePacingBlob,
  basisSource:'d72db0a8ca5c70b91db9b7760366773e2836db66',basisSavedActiveMs:962934,basisSavedMode:'running',
  change:'Only boss-mini root and descendants bypass optional cssFramePacing discovery and registration; authored native CSS playback remains',
  bossMiniCompletionInspectionStillOff:true,bossMiniEarlyFinishedDomRemovalStillOff:true,
  miniTargetNativeDiscoverySkipped:enabled,miniNativePacingRegistrationSkipped:enabled,
  miniNativeTimingUpdatesAndListenersSkipped:enabled,miniAdditional60HzQuantizationSkipped:enabled,
  authoredMiniMarkupKeyframesDurationsSparksRetained:true,authoredNativeCssPlaybackRetained:true,
  otherEffectsPacingRetained:true,oneLatestKeyedBossMiniAtMost:true,sourceGameFilesChanged:false,
  gameplayChanged:false,simulationClocksChanged:false,inputChanged:false,audioChanged:false,
  extraTimersOrFrames:false,newCanvasOrAsset:false,qaNativeProbeDeployed:false,
  rootInitialDiscoveryRemains:true,notAllGlobalNativeQueriesRemoved:true,
  staticBossHotspotsStillOmitted:true,heatMaskStillNone:true,reflectionStillHidden:true,bossWeaponsViewStillExcluded:true,
  physicalDeviceTested:false,nativeTerminationCauseMeasured:false,whiteScreenFixed:false,productionCandidate:false};
info.buildOnlyTransforms.push('Boss-mini only: bypass optional native animation-start discovery/pacing; authored CSS playback remains');
writeFileSync(ip,JSON.stringify(info,null,2)+'\n');
console.log('CRYPTOID_MINI_START_BUILD '+JSON.stringify({source:info.sourceCommit,scene:info.diagnosticScene,control:info.bossMiniStartControl}));
