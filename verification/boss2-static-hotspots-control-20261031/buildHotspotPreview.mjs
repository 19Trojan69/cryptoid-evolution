import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { diagnosticSceneName, bossStaticHotspotsDisabled } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
import { originalHullDamageBlob } from './hotspotControl.mjs';
assert.equal(process.env.VERCEL_ENV, 'preview', 'Protected guest Preview only');
const enabled = process.env.CRYPTOID_BOSS_STATIC_HOTSPOTS_OFF !== '0';
Object.assign(process.env, { CRYPTOID_BOSS_STATIC_HOTSPOTS_OFF:enabled?'1':'0', CRYPTOID_BOSS_HEAT_FLAT_FILL:'1' });
await import('../boss2-heat-flat-fill-control-20261031/buildHeatFillPreview.mjs');
assert.equal(bossStaticHotspotsDisabled(),enabled);
const root=resolve(new URL('../..',import.meta.url).pathname);
const output=root+'/verification/boss2-forensics-20261028/results/device-preview/site';
const label=enabled?'HITZESPURENTEST: statische Markierungen aus; Treffer bleiben an':'HITZESPURENTEST: statische Markierungen an; Treffer bleiben an';
const css='.device-preview-menu section::before { content: '+JSON.stringify(label)+' !important; }\n';
writeFileSync(output+'/diagnostic-static-hotspots.css',css);
const htmlPath=output+'/index.html',html=readFileSync(htmlPath,'utf8');assert.equal(html.split('</head>').length,2);
writeFileSync(htmlPath,html.replace('</head>','<link rel="stylesheet" href="/diagnostic-static-hotspots.css"></head>'));
const infoPath=output+'/device-preview-info.json',info=JSON.parse(readFileSync(infoPath,'utf8'));
assert.equal(info.diagnosticScene,diagnosticSceneName());assert.equal(info.bossHeatFlatFillCandidate.enabled,true);
assert.equal(info.bossHeatMaskCandidate.activeHeatImageMaskRemoved,true);assert.equal(info.bossHeatMaskCandidate.reflectionHidden,true);
assert.equal(info.guestOnly,true);assert.equal(info.liveBackend,false);assert.equal(info.bossWeaponControl.disabled,true);
info.bossHeatMaskCandidate.label=label;
info.bossHeatMaskCandidate.originalHeatComponentPositionsKeysTransformsBoundsAndOpacityRetained=!enabled;
info.bossHeatFlatFillCandidate.originalHotspotComponentsPositionsKeysTransformsShapeBoundsAndOpacityRetained=!enabled;
info.bossStaticHotspotControl={version:1,enabled,label,originalHullDamageBlob,
  failedRepeatSource:'f67fd2e41c372de600d197f2c8d943b7097b9209',failedRepeatSavedActiveMs:525494,failedRepeatSavedMode:'running',
  change:'Only guard sites.map with !boss; original non-boss path and mini-explosion JSX unchanged',
  originalHullDamageComponentAndPropsRetained:true,originalHeatLayerAndInlineMaskRetained:true,
  originalEarlyReturnRetained:true,originalMiniExplosionFragmentRetained:true,
  simulationHullFireArraysAndDamageUnchanged:true,staticHotspotChildrenOmitted:enabled,
  activeHeatMasksStillNone:true,reflectionStillHidden:true,priorFlatFillCssStillPresent:true,
  originalBossImageHealthBackgroundPreparationRetained:true,bossWeaponsViewStillExcluded:true,
  gameplayChanged:false,simulationClocksChanged:false,inputChanged:false,audioChanged:false,
  extraTimersOrFrames:false,newCanvasOrAsset:false,sourceFilesChanged:false,buildOnlyHullDamageTransform:enabled,
  physicalDeviceTested:false,nativeTerminationCauseMeasured:false,whiteScreenFixed:false,productionCandidate:false};
info.buildOnlyTransforms.push('Boss-only static heat child guard; enclosing HullDamage/masks, separate mini-explosions and simulation remain');
writeFileSync(infoPath,JSON.stringify(info,null,2)+'\n');
console.log('CRYPTOID_STATIC_HOTSPOT_BUILD '+JSON.stringify({source:info.sourceCommit,scene:info.diagnosticScene,control:info.bossStaticHotspotControl}));
