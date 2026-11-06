import test from 'node:test';
import assert from 'node:assert/strict';
import {phasePoint,validateWindow} from './alignment.mjs';
const source='synthetic-source';
function snapshot(elapsedMs,volley=10){return {hidden:false,mounted:true,timeOrigin:100,scene:{status:'playing',technicalPause:false,ownerDiagnostics:false,
 encounter:'boss-fight',phase:'ATTACK_CYCLE',sector:20,bossId:2,liveTurrets:0,reactorOpen:true,frameAt:elapsedMs+100,coreVolley:volley},
 clock:{latest:{mode:'running',source,id:'one',unobservedGaps:0,elapsedMs,updatedAt:elapsedMs}}};}
function stage(){
 const before=snapshot(60000),after=snapshot(91000,16);
 return {before,after,points:Array.from({length:30},(_,i)=>({phasePoint:phasePoint(snapshot(60000+i*1000,10+Math.floor(i/5)),source),memory:{contentProcessObserved:true,summedPssKiB:1024*(200+i)}}))};
}
test('keeps all declared bins and measured workload ranges',()=>{const r=validateWindow(stage(),source);assert.equal(r.bins.length,6);assert.deepEqual(r.bins.map(x=>x.samples),[5,5,5,5,5,5]);assert.equal(r.workloadEqualityClaimed,false);});
test('rejects a first-salvo capture at the former unmatched start',()=>{const s=stage();s.before=snapshot(15536);assert.throws(()=>validateWindow(s,source),/start/);});
test('rejects a late start even with a long total capture',()=>{const s=stage();s.before=snapshot(64000);assert.throws(()=>validateWindow(s,source),/start/);});
test('rejects incomplete common interval',()=>{const s=stage();s.points=s.points.filter(x=>x.phasePoint.elapsedMs<85000);assert.throws(()=>validateWindow(s,source),/six/);});
test('rejects time changes, missing renderer PSS and document replacements',()=>{for(const change of [s=>s.points[1].phasePoint.elapsedMs=0,s=>s.points[1].memory.summedPssKiB=null,s=>s.points[1].phasePoint.timeOrigin=200]){const s=stage();change(s);assert.throws(()=>validateWindow(s,source));}});
test('rejects hidden, paused, different boss, technical pause and a clock gap',()=>{for(const change of [s=>s.hidden=true,s=>s.scene.status='paused',s=>s.scene.bossId=3,s=>s.scene.technicalPause=true,s=>s.clock.latest.unobservedGaps=1]){const s=snapshot(60000);change(s);assert.throws(()=>phasePoint(s,source));}});
