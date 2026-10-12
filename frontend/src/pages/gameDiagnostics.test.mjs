import test from 'node:test';
import assert from 'node:assert/strict';
import { recordGameDiagnostic, GAME_DIAGNOSTICS_KEY, createGameSessionDiagnostics, inspectGameSessionRestart, readGameDiagnosticContext, createGameFrameDiagnostics, exportGameDiagnostics } from './gameDiagnostics.ts';

const context = { reason:'performance', errorName:'', sector:25, block:5, phase:'FORMATION', encounter:'normal', status:'playing', width:390, height:844, browser:'fixture', lastSavedAt:12345 };
const storage = () => { const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))}; };
test('diagnostics redact unapproved fields, historical extras, URL queries and arbitrary error names',()=>{
 const s=storage();s.setItem(GAME_DIAGNOSTICS_KEY,JSON.stringify([{...context,account:'fixture-private',token:'fixture-secret',message:'fixture-secret',at:'2026-10-12'}]));
 recordGameDiagnostic({...context,errorName:'fixture-secret',account:'fixture-private',stack:'fixture-secret',to:'/game?token=fixture-secret',from:'/game',navigationAction:'POP',workMs:NaN},s);
 const records=JSON.parse(s.getItem(GAME_DIAGNOSTICS_KEY)),text=JSON.stringify(records);
 assert.ok(!text.includes('fixture-private'));assert.ok(!text.includes('fixture-secret'));
 assert.equal(records[0].buildId,'unknown');assert.equal(records[1].to,'other');assert.equal(records[1].from,'/game');
 assert.equal(records[1].errorName,'UnknownError');assert.equal(records[1].navigationAction,'POP');assert.ok(!('workMs' in records[1]));
 assert.doesNotThrow(()=>recordGameDiagnostic({...context,phase:null,status:undefined,browser:42},s));
 for(let i=0;i<100;i++)recordGameDiagnostic(context,s);assert.equal(JSON.parse(s.getItem(GAME_DIAGNOSTICS_KEY)).length,20);
});
test('startup on Home and a later game mount report a prior active session once with its original build',()=>{
 const s=storage(),reports=[];let now=10000;
 const first=createGameSessionDiagnostics(s,r=>reports.push(r),()=>now);
 first.update({...context,buildId:'fixture-old-build'},true,false,true);now+=100;
 inspectGameSessionRestart(s,r=>reports.push(r),()=>now,'reload');
 inspectGameSessionRestart(s,r=>reports.push(r),()=>now,'reload');
 const next=createGameSessionDiagnostics(s,r=>reports.push(r),()=>now,'reload');
 assert.equal(reports.length,1);assert.equal(reports[0].buildId,'fixture-old-build');assert.equal(reports[0].restartHint,'page-reload');
 assert.equal(readGameDiagnosticContext(s).lastSavedAt,12345);
 next.update({...context,buildId:'fixture-new-build'},true,false,true);next.finish();now+=100;
 inspectGameSessionRestart(s,r=>reports.push(r),()=>now);assert.equal(reports.length,1);
});
test('a marker without a build is explicitly unknown, and storage denial is harmless',()=>{
 const s=storage(),reports=[];s.setItem('cryptoid_game_session_v1',JSON.stringify({context,active:true,at:10000}));
 inspectGameSessionRestart(s,r=>reports.push(r),()=>10100);assert.equal(reports[0].buildId,'unknown');
 assert.doesNotThrow(()=>inspectGameSessionRestart({getItem(){throw Error('fixture');},setItem(){} }));
});
test('rolling frame/work samples remain fixed across a long run and exclude invalid values',()=>{
 const frames=createGameFrameDiagnostics();frames.sample(NaN,1);frames.sample(0,1);frames.sample(16,Infinity);
 assert.equal(frames.summary().frames,0);frames.sample(100,90);
 for(let i=0;i<50000;i++)frames.sample(16,2);
 assert.deepEqual(frames.summary(),{frames:1024,meanFrameMs:16,p95FrameMs:16,maxFrameMs:16,maxWorkMs:2});
 frames.sample(80,35);assert.equal(frames.summary().maxFrameMs,80);assert.equal(frames.summary().maxWorkMs,35);
});
test('manual export contains only twenty redacted local records and clearly reports storage denial',()=>{
 const s=storage();s.setItem(GAME_DIAGNOSTICS_KEY,JSON.stringify(Array.from({length:50},()=>({...context,token:'fixture-secret',user:'fixture-private',at:'2026-10-12'}))));
 const data=exportGameDiagnostics(s);assert.equal(data.entries.length,20);assert.equal(data.storageAvailable,true);
 assert.ok(!JSON.stringify(data).includes('fixture-secret'));assert.ok(!JSON.stringify(data).includes('fixture-private'));
 assert.equal(exportGameDiagnostics({getItem(){throw Error('fixture');}}).storageAvailable,false);
});
