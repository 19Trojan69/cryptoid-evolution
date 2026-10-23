// Aggregate bounded synthetic localhost captures. No application imports/writes.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

const root=resolve(process.argv[2]||'.');
const output=process.argv[3];
const scenarios=[
 ['layers-sector57-original','original appearance; warmed control'],
 ['layer-milky-sector57','diagnostic exclusion: milky-band visibility:hidden'],
 ['layer-formation-sector57','diagnostic exclusion: formation-data-stream visibility:hidden'],
 ['layer-milky-cache-sector57','unaccepted milky-band will-change:transform'],
 ['layer-starfield-cache-sector57','unaccepted starfield will-change:transform'],
 ['layer-opaque-background-sector57','unaccepted opaque wrapper around both backgrounds'],
 ['layer-static-background-sector57','unaccepted separate opaque static-starfield cache'],
];
const rounded=x=>Math.round(x*1000)/1000;
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
function* flatten(record){yield record;for(const child of record.children||[])yield* flatten(child);}
function intervals(records,type,start,end){
 const ranges=records.filter(r=>r.type===type&&r.endTime>start&&r.startTime<end)
  .map(r=>[Math.max(start,r.startTime),Math.min(end,r.endTime)]).sort((a,b)=>a[0]-b[0]);
 let previous=-Infinity,total=0;
 for(const [a,b] of ranges){total+=Math.max(0,b-Math.max(a,previous));previous=Math.max(previous,b);}
 return {events:ranges.length,intervalUnionMs:rounded(total*1000),longestClippedEventMs:rounded(Math.max(0,...ranges.map(([a,b])=>b-a))*1000)};
}
const report={sourceCommit:'19de3e692f75a1c3e2eddf3438acc937c9dcac19',runtimeGuard:'4c384023a4fae3d84403ade7beae7934e22e39fd',
 localOnly:true,engine:'Linux WPE-WebKit26.5 software rendering',viewport:{width:430,height:825,dpr:3},renderThreads:2,
 originalFontsServedLocally:true,productionRuntimeChanged:false,published:false,physicalDeviceVerified:false,historicalWhiteScreenFixProven:false,
 method:'Native Timeline/ScriptProfiler/CPUProfiler after audio warmup; same-type nested/overlapping intervals merged and clipped from active-start to first pre-handler fault or active-end. Categories overlap and must not be added. Controlled inputs and nondeterministic gameplay mean these are exploratory comparisons, not identical-frame benchmarks.',
 cases:[],pixelComparisons:[],limitations:[
 'Software driver and profiler affect timing; no iOS/PiBrowser or mobile-memory attribution.',
 'LayerTree paintCount remained zero in every snapshot and cannot attribute individual repaints.',
 'LayerTree memory is a CSS-sized backing estimate, not resident process memory or a portable DPR-scaled total.',
 'Native RAF dispatch counts are callbacks, not presented-frame counts/FPS.',
 'Short smoke completion is not campaign acceptance.',
 'Synthetic frozen DOM images are compared within each engine only; Canvas snapshots replace the corresponding Canvas nodes. Native animations are held at1000ms. Invalid unchanged controls are explicitly excluded.',
 ]};
for(const [tag,scenario] of scenarios){
 const traceBuffer=readFileSync(resolve(root,'timeline-'+tag+'.json'));
 const audit=JSON.parse(traceBuffer);
 const records=audit.records.flatMap(r=>[...flatten(r)]);
 const start=records.find(r=>r.type==='TimeStamp'&&r.data?.message==='local-active-window-start')?.startTime;
 const endings=records.filter(r=>r.type==='TimeStamp'&&r.startTime>start&&(r.data?.message==='local-active-window-end'||r.data?.message?.startsWith('local-game-fault-'))).sort((a,b)=>a.startTime-b.startTime);
 const ending=endings[0];
 if(!Number.isFinite(start)||!ending)throw new Error('Unbounded active window: '+tag);
 const end=ending.startTime;
 const resultBuffer=readFileSync(resolve(root,'full-scene-results-'+tag+'.json'));
 const run=JSON.parse(resultBuffer),native=run.results.find(r=>r.engine==='webkit');
 const types=Object.fromEntries(['Paint','RecalculateStyles','Layout','FireAnimationFrame','FunctionCall'].map(t=>[t,intervals(records,t,start,end)]));
 const script=intervals(audit.script.map(r=>({...r,type:'ScriptEvaluation'})),'ScriptEvaluation',start,end);
 const cpu=audit.cpu.filter((r,i)=>i>0&&r.timestamp>=start&&r.timestamp<=end);
 const mean=fn=>rounded(cpu.reduce((n,r)=>n+fn(r),0)/Math.max(1,cpu.length));
 const peaks=(native.nativeProcessMemory||[]).flatMap(s=>s.processes.filter(p=>p.name==='WPEWebProcess').map(p=>p.peakRssKiB));
 report.cases.push({tag,scenario,traceSha256:hash(traceBuffer),resultSha256:hash(resultBuffer),runtimePackages:run.runtimePackages,
  activeWindowMs:rounded((end-start)*1000),steadyStateTimingEligible:end-start>=5,excludedTimingReason:end-start<5?'Interrupted near capture startup; no useful sustained active window':null,terminalSignal:ending.data.message.startsWith('local-game-fault-')?ending.data.message.slice('local-game-fault-'.length):null,
  timeline:types,scriptEvaluationIntervalUnionMs:script.intervalUnionMs,
  cpu:{samples:cpu.length,meanUsagePercent:mean(r=>r.usage),meanLlvmpipeThreadUsagePercent:mean(r=>r.threads.filter(t=>t.name.startsWith('llvmpipe-')).reduce((n,t)=>n+t.usage,0)),exclusiveToTimelineCategories:false},
  contentProcessLifetimePeakRssMiB:rounded(Math.max(0,...peaks)/1024),peakIncludesFrozenPixelAudit:!!native.staticLayerPixels,
  layerSnapshots:(audit.layers||[]).map(s=>({label:s.label,count:s.layers.length,estimatedBackingBytes:s.layers.reduce((n,l)=>n+l.memory,0),paintCounts:[...new Set(s.layers.map(l=>l.paintCount))],namedCacheLayers:s.layers.filter(l=>l.reasons?.willChange).map(({layerId,bounds,compositedBounds,memory,reasons,attributes})=>({layerId,bounds,compositedBounds,memory,reasons,attributes}))})),
  unhandledJavaScriptErrors:native.errors.length,consoleErrors:native.consoleErrors.length,canvasContextLosses:(native.final||native.failureSnapshot)?.native?.contextLosses,
  failure:native.failure||null,unsupported:audit.unsupported,overflow:audit.overflow,
 });
}
for(const tag of ['layer-cache-frozen-pixels','layer-cache-pixel-controls','layer-starfield-pixel-controls','layer-opaque-background-sector57','layer-static-background-sector57']){
 const path=resolve(root,'full-scene-results-'+tag+'.json');if(!existsSync(path))continue;
 const buffer=readFileSync(path),run=JSON.parse(buffer);
 report.pixelComparisons.push({tag,resultSha256:hash(buffer),engines:run.results.map(r=>{
  const comparison=r.staticLayerPixels;
  const hasControl=comparison?.pairs.some(p=>p.hint==='unchanged-control');
  const unstable=comparison?.pairs.some(p=>p.hint==='unchanged-control'&&!p.exact)&&!comparison?.pairs.some(p=>p.hint==='settled-control'&&p.exact);
  const unstableReversion=comparison?.pairs.some(p=>p.hint?.startsWith('reverted-')&&!p.exact);
  return {engine:r.engine,dpr:r.viewport.dpr,comparison:comparison||null,eligible:!!comparison&&hasControl&&!comparison.aborted&&!unstable&&!unstableReversion,exclusion:!comparison?'Did not reach pixel audit after technical interruption':!hasControl?'No unchanged-image controls; exploratory only':unstable?'Unchanged-control images differed; do not attribute this difference to the candidate':unstableReversion?'Reversion did not restore the reference exactly; no complete unchanged-output proof':null};
 })});
}
report.conclusion={localContributor:'The oversized filtered milky-band is a substantial contributor to native Paint in this software-rendered fixture; hiding the formation-data stream does not remove that Paint cost.',
 acceptedRenderingCorrection:false,reason:'Cache hints shift work to software graphics, do not establish better presented-frame rate or sustained stability, and fail complete unchanged-output acceptance. The separate-static probe reaches loop-stall527ms after recording starts; it is excluded as a useful steady-state timing comparison and is not proof that the candidate caused that pause.',
 nextBoundary:'Do not integrate or deploy these rendering experiments, reduce artwork, disable the stall guard, or repeat a full owner campaign to validate these local counters. The independently tested recorder callback guard remains the only runtime correction on the candidate branch.'};
const json=JSON.stringify(report,null,2)+'\n';
if(output)writeFileSync(output,json);else process.stdout.write(json);
