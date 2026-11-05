import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {blob,digest,REDUCED_CSS,BASE_DEVICE_COMMIT,adaptDeviceBuilder} from './transform.mjs';

const root=resolve(new URL('../..',import.meta.url).pathname),condition=process.argv[2];
assert.ok(['control','candidate'].includes(condition));
assert.equal(process.env.VERCEL_ENV,'preview');
const path=root+'/verification/player-muzzle-webkit-device-20261105/build.mjs';
const original=readFileSync(path,'utf8');assert.equal(blob(original),'f45a54c137867e48b2f77585f8ea3d50e95edfcf');
const protectedPaths=['frontend/src/pages/GamePage.tsx','frontend/src/pages/GameShipVisual.tsx',
 'verification/critical-failure-journal-20261104/criticalState.mjs',
 'verification/critical-failure-journal-20261104/transform.mjs',
 'verification/boss2-stopwatch-20261029/stopwatchState.mjs'];
const before=protectedPaths.map(p=>({path:p,sha256:digest(readFileSync(root+'/'+p))}));
// Generated code stays beside its original module so all relative imports retain
// their original targets. It is removed even after a failed build.
const changed=adaptDeviceBuilder(original,condition);
const temporary=path.replace(/\.mjs$/,`.enemy-motion-${process.pid}.mjs`);
try {
 writeFileSync(temporary,changed);await import(pathToFileURL(temporary).href);
 const dir=root+'/verification/boss2-forensics-20261028/results/device-preview/site';
 const ip=dir+'/device-preview-info.json',hp=dir+'/index.html';
 const info=JSON.parse(readFileSync(ip,'utf8')),html=readFileSync(hp,'utf8');
 assert.equal(info.playerMuzzleLocalCandidate.enemyMotionCondition,condition);
 let finalHtml=html;
 if(condition==='candidate') {
  assert.equal(html.split('</head>').length,2);
  finalHtml=html.replace('</head>','<style id="enemy-motion-reduced">'+REDUCED_CSS+'</style></head>');
  writeFileSync(hp,finalHtml);
  info.criticalFailureJournal.onlyMuzzleWriterTargetChanged=false;
  info.criticalFailureJournal.enemyMotionConsumersAlsoChanged=true;
 }
 info.enemyMotionCandidate={version:1,condition,baseDeviceCommit:BASE_DEVICE_COMMIT,
  sourceFilesUnchanged:before,ordinaryEnemyCallersOnly:true,otherCallersRetainInheritedStyles:true,
  sameBankFlameLightFormulas:true,newDomNodes:0,newGameTimers:0,newFrames:0,newGlobalListeners:0,
  simulationOrAnimationClocksChanged:false,reducedMotionRetained:true,
  compiledControllerSha256:info.playerMuzzleLocalCandidate.compiledVirtualControllerSha256,
  originalVisualBlob:'54ed214a7fa2fdb024d46b639dd25e7bae32a2db',
  finalHtmlSha256:digest(finalHtml),baseHtmlSha256:digest(html),
  nativeCacheEntriesMeasured:false,nativeMemoryBenefitMeasured:false,physicalDeviceAccepted:false,
  whiteScreenFixed:false};
 writeFileSync(ip,JSON.stringify(info,null,2)+'\n');
 assert.deepEqual(protectedPaths.map(p=>({path:p,sha256:digest(readFileSync(root+'/'+p))})),before);
 console.log('ENEMY_MOTION_BUILD '+JSON.stringify(info.enemyMotionCandidate));
} finally {unlinkSync(temporary);assert.equal(readFileSync(path,'utf8'),original);}
