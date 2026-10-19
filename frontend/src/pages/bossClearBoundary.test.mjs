import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createBossBoundaryDiagnostics} from './bossBoundaryDiagnostics.ts';
const kinds=['boss-victory-source-set','boss-victory-play-returned','boss-victory-play-settled','boss-victory-ended','boss-music-return-source-set','boss-music-return-play-returned','boss-music-return-play-settled','boss-clear-timer-ready','boss-heart-collected','boss-extra-life-audio-returned'];
test('clear milestones are once per encounter even if the clear-ready condition remains true for thousands of frames',()=>{
 const events=[],probe=createBossBoundaryDiagnostics(k=>events.push(k));probe.clearStart(20);
 for(let frame=0;frame<2000;frame++)for(const kind of kinds)probe.clearMark(20,kind);
 assert.deepEqual(events,kinds);probe.clearStart(40);probe.clearMark(40,'boss-victory-no-track');assert.equal(events.at(-1),'boss-victory-no-track');
});
test('async settlement is observed once and cannot leak into bonus, a later encounter, or unmounted gameplay',async()=>{
 for(const end of ['clearStop','finish','new-encounter']){
  const events=[],probe=createBossBoundaryDiagnostics(k=>events.push(k));probe.clearStart(20);
  let settle;const promise=new Promise(resolve=>settle=resolve);probe.clearPlayback(20,'boss-victory-play-settled',promise);
  probe.clearPlayback(20,'boss-victory-play-settled',promise);
  if(end==='new-encounter')probe.clearStart(40);else probe[end]();
  settle(true);await promise;await Promise.resolve();assert.deepEqual(events,[]);
 }
});
test('settlement observes resolved false and rejected playback without retrying or throwing',async()=>{
 for(const playback of [Promise.resolve(true),Promise.resolve(false),Promise.reject(new Error('fixture'))]){
  const events=[],probe=createBossBoundaryDiagnostics(k=>events.push(k));probe.clearStart(20);
  probe.clearPlayback(20,'boss-victory-play-settled',playback);await Promise.resolve();assert.deepEqual(events,['boss-victory-play-settled']);
 }
});
test('optional record failures do not escape into the audio callback or clear loop',async()=>{
 const probe=createBossBoundaryDiagnostics(()=>{throw new Error('storage unavailable');});probe.clearStart(20);
 assert.doesNotThrow(()=>probe.clearMark(20,'boss-clear-timer-ready'));
 probe.clearPlayback(20,'boss-victory-play-settled',Promise.resolve(true));await Promise.resolve();probe.finish();
});
const source=fs.readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
const baseline=execFileSync('git',['show','92f392e:frontend/src/pages/GamePage.tsx'],{encoding:'utf8'});
function body(code,name){const prefix='const '+name+' = () => {';const start=code.indexOf(prefix);assert.ok(start>=0);let depth=1,i=start+prefix.length;for(;depth;i++){if(code[i]==='{')depth++;if(code[i]==='}')depth--;}return code.slice(start+prefix.length,i-1);}
async function sequence(code,owner,{muted=false,paused=false,fault=null}={}){
 const calls=[],events=[],probe=owner?createBossBoundaryDiagnostics(k=>events.push(k)):null;probe?.clearStart(20);
 const track={currentSource:'/audio/dreadnought-duel.mp3',audio:{loop:true},setSource(src,time){calls.push(['source',src,time]);if(fault==='source')throw new Error('source');this.currentSource=src;},setVolume(v){calls.push(['volume',v]);},play(){calls.push(['play']);if(fault==='play')throw new Error('play');return Promise.resolve(true);}};
 const scope={ownerDiagnostics:owner,bossBoundaryRef:{current:probe},performanceProbeRef:{current:null},recordReloadEvent(){},bossVictoryPendingRef:{current:true},bossVictoryFinishedRef:{current:false},musicRef:{current:muted?null:track},track,stateRef:{current:{sector:20,encounter:'boss-clear',status:paused?'paused':'playing'}},regularMusicPositionRef:{current:42},readMusicVolume:()=>25};
 let error=null;
 try{vm.runInNewContext('(function(){'+body(code,'startBossVictory')+'})()',scope);if(!muted)vm.runInNewContext('(function(){'+body(code,'finishVictoryMusic')+'})()',scope);}catch(e){error=e.message;}
 await Promise.resolve();
 return {calls,pending:scope.bossVictoryPendingRef.current,finished:scope.bossVictoryFinishedRef.current,source:track.currentSource,loop:track.audio.loop,error,events};
}
test('actual victory and ended callback bodies keep audio/state/exception behavior identical for owner and ordinary players',async()=>{
 for(const owner of [false,true])for(const scenario of [{},{muted:true},{paused:true},{fault:'source'},{fault:'play'}]){
  const expected=await sequence(baseline,owner,scenario),actual=await sequence(source,owner,scenario);
  const {events,...result}=actual;const {events:_,...control}=expected;assert.deepEqual(result,control);
  if(!owner)assert.deepEqual(events,[]);
 }
 const normal=await sequence(source,true);assert.ok(normal.events.includes('boss-victory-ended'));assert.ok(normal.events.includes('boss-music-return-play-settled'));
 const muted=await sequence(source,true,{muted:true});assert.deepEqual(muted.events,['boss-victory-no-track']);
});
test('only verified owner gameplay constructs the observer and exporter accepts every new technical milestone',async()=>{
 assert.ok(source.includes('ownerDiagnostics ? createBossBoundaryDiagnostics(recordOwnerResourceSnapshot) : null'));
 const {readStabilityReport}=await import('./stabilityReport.mjs');
 const events=[...kinds,'boss-victory-no-track'].map((kind,i)=>({kind,at:1000+i,bootId:'fixture',context:{sector:20,phase:'SECTOR_CLEAR',encounter:'boss-clear',status:'playing',uid:'private-uid'}}));
 const host={localStorage:{getItem:key=>key==='cryptoid_reload_trace_v2'?JSON.stringify(events):null},sessionStorage:{getItem:()=>null}};
 const report=readStabilityReport(host,3000);assert.deepEqual(report.reloadTrace.events.map(e=>e.kind),events.map(e=>e.kind));assert.ok(!JSON.stringify(report).includes('private-uid'));
});
