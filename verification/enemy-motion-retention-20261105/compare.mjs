import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
const root=new URL('../..',import.meta.url).pathname.replace(/\/$/,''),folder='verification/enemy-motion-direct-20261105',out=root+'/verification/enemy-motion-retention-20261105/results';
mkdirSync(out,{recursive:true});const captures={};
for(const condition of ['control','candidate']){
 execFileSync(process.execPath,[folder+'/build.mjs',condition],{cwd:root,stdio:'inherit',env:{...process.env,VERCEL_ENV:'preview'}});
 execFileSync(process.execPath,['verification/enemy-motion-retention-20261105/run.mjs','memory','chromium',condition,'1'],{cwd:root,stdio:'inherit'});
 const dir=root+'/'+folder+`/results/memory-chromium-${condition}-r1`;cpSync(dir,out+'/'+condition,{recursive:true});
 const d=JSON.parse(readFileSync(dir+'/verification.json','utf8'));
 assert.equal(d.complete,true);assert.equal(d.requestedActiveSeconds,600);assert.equal(d.normalReportVerified,true);assert.equal(d.criticalReportVerified,true);
 assert.equal(d.enemyMotionCandidate.condition,condition);const points=d.cycles[0].points;assert.ok(points.length>=20);
 const stat=rows=>{assert.ok(rows.length>=8&&rows.every(p=>Number.isFinite(p.linuxBrowserDescendantPssKiB)&&p.linuxBrowserDescendantPssKiB>0));
  const a=rows.map(p=>p.linuxBrowserDescendantPssKiB);return{samples:a.length,min:Math.min(...a),max:Math.max(...a),mean:a.reduce((a,b)=>a+b,0)/a.length};};
 captures[condition]={sourceCommit:d.sourceCommit,sourceTree:d.sourceTree,engineVersion:d.engineVersion,activeMs:d.cycles[0].observedActiveMs,
  samples:points.length,firstMinutePssKiB:stat(points.filter(p=>p.activeMs<=60000)),lastMinutePssKiB:stat(points.filter(p=>p.activeMs>=540000)),
  highestSampledPssKiB:Math.max(...points.map(p=>p.linuxBrowserDescendantPssKiB)),originalMemoryEligibilityFlag:d.memoryComparisonEligible,
  normalReportVerified:true,criticalReportVerified:true};
 writeFileSync(out+'/progress.json',JSON.stringify({completedConditions:Object.keys(captures),captures},null,2)+'\n');
}
for(const k of ['sourceCommit','sourceTree','engineVersion'])assert.equal(captures.control[k],captures.candidate[k]);
const result={version:1,complete:true,order:['control','candidate'],activeSecondsPerMainRun:600,captures,
 candidateLateMeanLower:captures.candidate.lastMinutePssKiB.mean<captures.control.lastMinutePssKiB.mean,
 lateRangesOverlap:Math.max(captures.control.lastMinutePssKiB.min,captures.candidate.lastMinutePssKiB.min)<=Math.min(captures.control.lastMinutePssKiB.max,captures.candidate.lastMinutePssKiB.max),
 singlePair:true,independentUnseededScenes:true,wholeLinuxBrowserDescendantPss:true,traceOrForcedGcDuringComparison:false,
 physicalDevice:false,nativeTerminationCauseMeasured:false,whiteScreenFixed:false,
 limits:['Ten minutes per arm after the earlier three-minute observations; not a new phone test.',
 'A single pair is descriptive, not a replicated causal memory improvement or native pressure qualification.',
 'The original eligibility flags and historical failed gates remain unchanged. No universal memory threshold.',
 'Process PSS is not pure renderer, GPU or phone memory; sampled maxima are not instantaneous peaks.']};
writeFileSync(out+'/comparison.json',JSON.stringify(result,null,2)+'\n');console.log('ENEMY_RETENTION_COMPARISON '+JSON.stringify(result));
