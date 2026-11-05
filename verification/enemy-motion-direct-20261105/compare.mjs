import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(new URL('../..',import.meta.url).pathname),replica=process.argv[2];
assert.ok(['1','2'].includes(replica));
const order=replica==='1'?['control','candidate']:['candidate','control'];
const folder='verification/enemy-motion-direct-20261105';
const captures={};
for(const condition of order){
 execFileSync(process.execPath,[folder+'/build.mjs',condition],{cwd:root,stdio:'inherit',env:{...process.env,VERCEL_ENV:'preview'}});
 execFileSync(process.execPath,[folder+'/run.mjs','memory','chromium',condition,replica],{cwd:root,stdio:'inherit'});
 const result=JSON.parse(readFileSync(root+'/'+folder+`/results/memory-chromium-${condition}-r${replica}/verification.json`,'utf8'));
 assert.equal(result.complete,true);assert.equal(result.normalReportVerified,true);assert.equal(result.criticalReportVerified,true);
 assert.equal(result.enemyMotionCandidate.condition,condition);assert.equal(result.requestedActiveSeconds,180);
 const points=result.cycles[0].points;
 assert.ok(points.length>=20,'Existing five-second active samples required');
 const late=points.filter(p=>p.activeMs>=120000).map(p=>p.linuxBrowserDescendantPssKiB);
 assert.ok(late.length>=8&&late.every(x=>Number.isFinite(x)&&x>0));
 captures[condition]={sourceCommit:result.sourceCommit,sourceTree:result.sourceTree,engineVersion:result.engineVersion,
  activeMs:result.cycles[0].observedActiveMs,samples:points.length,lateSamples:late.length,
  latePssKiB:{min:Math.min(...late),max:Math.max(...late),mean:late.reduce((a,b)=>a+b,0)/late.length},
  peakPssKiB:Math.max(...points.map(p=>p.linuxBrowserDescendantPssKiB)),
  originalCollectorMemoryEligibilityFlag:result.memoryComparisonEligible,
  normalReportVerified:true,criticalReportVerified:true};
}
assert.equal(captures.control.sourceCommit,captures.candidate.sourceCommit);
assert.equal(captures.control.sourceTree,captures.candidate.sourceTree);
assert.equal(captures.control.engineVersion,captures.candidate.engineVersion);
const receipt={version:1,replica:Number(replica),order,captures,complete:true,
 candidateLateMeanLower:captures.candidate.latePssKiB.mean<captures.control.latePssKiB.mean,
 candidateLateRangeEntirelyBelowControl:captures.candidate.latePssKiB.max<captures.control.latePssKiB.min,
 matchedCollectorSetup:true,independentUnseededGameRuns:true,
 historicalFailedMemoryGatesReclassified:false,universalThresholdInvented:false,
 nativeCacheEntryCountMeasured:false,physicalDevice:false,whiteScreenFixed:false,
 limits:['New short matched-collector observations only; historical memoryComparisonEligible:false is retained.',
 'Whole Linux browser-descendant PSS includes more than a renderer and is not phone or GPU memory.',
 'No native high-pressure qualification, long-run leak proof or physical-device acceptance.',
 'A single lower mean or overlap does not justify a new phone endurance request.']};
mkdirSync(root+'/'+folder+'/results',{recursive:true});
writeFileSync(root+'/'+folder+`/results/comparison-r${replica}.json`,JSON.stringify(receipt,null,2)+'\n');
console.log('ENEMY_MOTION_COMPARISON '+JSON.stringify(receipt));
