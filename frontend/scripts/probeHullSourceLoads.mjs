// Allocation-attempt probe of the real source cache with deliberately pending
// image loads. It measures JS-created Image objects, not native process memory.
import {build} from 'esbuild';
import assert from 'node:assert/strict';
import Module from 'node:module';
import {execFileSync} from 'node:child_process';
import {hullSourcePlan} from '../src/pages/hullSourcePlan.ts';
const root=new URL('../',import.meta.url).pathname;
const baselineRef=process.argv.find(a=>a.startsWith('--baseline-ref='))?.slice('--baseline-ref='.length);
const stages=Number(process.argv.find(a=>a.startsWith('--stages='))?.slice('--stages='.length)||100);
const result=await build({absWorkingDir:root,entryPoints:['src/pages/paintedShip.ts'],bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',define:{'import.meta.env':'{}'},plugins:[{name:'pending-image-host',setup(b){
 if(baselineRef)b.onLoad({filter:/\/paintedShip\.ts$/},()=>({loader:'ts',contents:execFileSync('git',['show',`${baselineRef}:frontend/src/pages/paintedShip.ts`],{cwd:root,encoding:'utf8'})}));
 b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'react'}));
 b.onLoad({filter:/.*/,namespace:'react'},()=>({loader:'js',contents:'export const useState=()=>{};export const useEffect=()=>{};'}));
}}]});
const images=[];
globalThis.Image=class{constructor(){images.push(this);}set src(value){this.url=value;}naturalWidth=512;naturalHeight=512;};
globalThis.window={location:{hostname:'example.invalid'},localStorage:{getItem:()=>null}};
const mod=new Module(import.meta.filename);mod.paths=Module._nodeModulePaths(import.meta.dirname);mod._compile(result.outputFiles[0].text,import.meta.filename);
for(let stage=1;stage<=stages;stage++)if(stage%10)for(const offset of [0,6,12])mod.exports.preloadHullSources(hullSourcePlan(stage,'normal',offset,0));
const stats=mod.exports.paintedShipResourceStats();
console.log(JSON.stringify({baselineRef:baselineRef??null,allocationAttempts:images.length,uniqueImageURLs:new Set(images.map(i=>i.url)).size,reportedSources:stats.sources,active:stats.sourceActive??null,queued:stats.sourceQueued??null,stages,scenario:'Actual normal-block source plans, callbacks deliberately pending',limits:'Code-level pending-load pressure probe, not evidence of actual iPhone network stalls or crash cause.'}));
assert.ok(images.length<=3,'actual native Image allocation attempts are bounded, including evicted/pending entries');
assert.ok(stats.sourceActive<=3&&stats.sourceActive+stats.sourceQueued<=8,'speculative queue is bounded separately from the LRU');
