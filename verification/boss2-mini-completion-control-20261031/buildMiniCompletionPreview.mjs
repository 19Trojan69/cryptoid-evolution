import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { diagnosticSceneName, bossMiniCompletionInspectionDisabled } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
import { originalFinishedEffectBlob } from './miniCompletionControl.mjs';
assert.equal(process.env.VERCEL_ENV,'preview','Protected guest Preview only');
const enabled=process.env.CRYPTOID_BOSS_MINI_INSPECTION_OFF!=='0';
Object.assign(process.env,{CRYPTOID_BOSS_MINI_INSPECTION_OFF:enabled?'1':'0',CRYPTOID_BOSS_STATIC_HOTSPOTS_OFF:'1',CRYPTOID_BOSS_HEAT_FLAT_FILL:'1'});
await import('../boss2-static-hotspots-control-20261031/buildHotspotPreview.mjs');
assert.equal(bossMiniCompletionInspectionDisabled(),enabled);
const root=resolve(new URL('../..',import.meta.url).pathname),out=root+'/verification/boss2-forensics-20261028/results/device-preview/site';
const label=enabled?'TREFFERTEST: Originaltreffer; native Abschlussprüfung aus':'TREFFERTEST: Originaltreffer; native Abschlussprüfung an';
writeFileSync(out+'/diagnostic-mini-completion.css','.device-preview-menu section::before { content: '+JSON.stringify(label)+' !important; }\n');
const path=out+'/index.html',html=readFileSync(path,'utf8');assert.equal(html.split('</head>').length,2);writeFileSync(path,html.replace('</head>','<link rel="stylesheet" href="/diagnostic-mini-completion.css"></head>'));
const ip=out+'/device-preview-info.json',info=JSON.parse(readFileSync(ip,'utf8'));assert.equal(info.diagnosticScene,diagnosticSceneName());assert.equal(info.bossStaticHotspotControl.enabled,true);assert.equal(info.guestOnly,true);assert.equal(info.liveBackend,false);
info.bossMiniCompletionControl={version:1,enabled,label,originalFinishedEffectBlob,failedOwnerSource:'290113362eea446aa9d4171aaaddd7220e3bf646',failedOwnerSavedActiveMs:900561,
  change:'Boss mini only: return from completion handler before native getAnimations; use existing parent-owned fallback lifetime',
  originalFinishedEffectComponentHookAndHandlerRetained:true,originalMiniMarkupCssSparksDurationsRetained:true,otherEffectsNativeInspectionRetained:true,
  nativeInspectionSkippedOnlyForBossMini:enabled,animationStartNativeDiscoveryRemains:true,notAllNativeQueriesRemoved:true,earlyFinishedDomRemovalSkippedOnlyForBossMini:enabled,invisibleMiniMayRemainUntilParentUpdate:enabled,
  oneLatestKeyedBossMiniAtMost:true,simulationBossHitAndHullFireArraysUnchanged:true,staticBossHotspotsStillOmitted:true,heatMaskStillNone:true,reflectionStillHidden:true,
  originalBossImageHealthBackgroundPreparationRetained:true,bossWeaponsViewStillExcluded:true,previousFilterReactorExplosionCanvasControlsRetained:true,
  sourceGameFilesChanged:false,buildOnlyFinishedEffectGuard:enabled,gameplayChanged:false,simulationClocksChanged:false,inputChanged:false,audioChanged:false,
  newCanvasOrAsset:false,extraTimersOrFrames:false,qaNativeInspectionProbeDeployed:false,physicalDeviceTested:false,nativeTerminationCauseMeasured:false,whiteScreenFixed:false,productionCandidate:false};
info.buildOnlyTransforms.push('Boss mini native-completion inspection guard; authored animation/markup and existing parent-owned fallback retained');
writeFileSync(ip,JSON.stringify(info,null,2)+'\n');console.log('CRYPTOID_MINI_COMPLETION_BUILD '+JSON.stringify({source:info.sourceCommit,scene:info.diagnosticScene,control:info.bossMiniCompletionControl}));
