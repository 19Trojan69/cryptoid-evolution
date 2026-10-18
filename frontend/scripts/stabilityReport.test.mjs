import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readStabilityReport, technicalContext, readOwnerStabilityReport} from '../src/pages/stabilityReport.mjs';
const context={reason:'performance',sector:19,block:9,phase:'ATTACK_CYCLE',encounter:'normal',status:'playing',width:430,height:825,enemies:4,projectiles:9,effects:2};
const EVENT_KEY='cryptoid_game_diagnostics_v1', SESSION_KEY='cryptoid_game_session_v1', RELOAD_KEY='cryptoid_reload_trace_v2';
const host=(events,session,reloadLocal=null,reloadSession=reloadLocal)=>({
  localStorage:{getItem:key=>key===EVENT_KEY?events:key===RELOAD_KEY?reloadLocal:null},
  sessionStorage:{getItem:key=>key===SESSION_KEY?session:key===RELOAD_KEY?reloadSession:null}
});
test('reads previous interruption and current session without touching account or save keys',()=>{
  const report=readStabilityReport(host(JSON.stringify([{...context,reason:'unexpected-restart',restartHint:'page-reload',at:'2026-10-18T14:29:00.000Z'}]),JSON.stringify({context,active:true,hidden:false,pageHidden:false,at:10000})),12000);
  assert.equal(report.available,true);assert.equal(report.events[0].sector,19);assert.equal(report.events[0].restartHint,'page-reload');
  assert.deepEqual(report.lastSession,{context,active:true,hidden:false,pageHidden:false,at:10000,ageMs:2000});
  assert.equal(report.reloadTrace,null);assert.equal(report.version,3);
});
test('absent, denied, corrupt or oversized storage explicitly reports missing evidence',()=>{
  for(const h of [{},host(null,null),host('{bad','{bad','{bad','{bad'),host('x'.repeat(131073),null)]) assert.equal(readStabilityReport(h).available,false);
  const denied={};for(const key of ['localStorage','sessionStorage'])Object.defineProperty(denied,key,{get(){throw Error('denied');}});
  const report=readStabilityReport(denied);assert.equal(report.available,false);assert.equal(report.storage.events,'unavailable-or-invalid');assert.equal(report.storage.reloadSession,'unavailable-or-invalid');
});
test('keeps at most twenty interruption records and drops unknown or malformed values',()=>{
  const report=readStabilityReport(host(JSON.stringify(Array.from({length:100},(_,i)=>({...context,sector:i}))),null));
  assert.equal(report.events.length,20);assert.equal(report.events[0].sector,80);
  assert.equal(technicalContext([]),null);assert.equal(technicalContext(null),null);assert.equal(technicalContext({secret:'token'}),null);
  assert.deepEqual(technicalContext({sector:Infinity,frameMs:-1,phase:'private message',errorName:'token-in-error-name'}),null);
});
test('reload trace returns the final sixty-second technical window with boss and freeze evidence',()=>{
  const reload=[
    {kind:'heartbeat',at:1000,bootId:'boot-a',context:{...context,browser:'private-browser',username:'private-user',bossId:2,bossHealth:450,bossMaxHealth:900,liveTurrets:2,totalTurrets:4,reactorOpen:false}},
    {kind:'main-thread-gap',at:65000,bootId:'boot-a',gapMs:1730,errorName:'TypeError',context:{...context,sector:20,encounter:'boss-fight',bossId:2,bossHealth:300,bossMaxHealth:900,liveTurrets:1,totalTurrets:4,reactorOpen:false,stack:'private-stack'}},
    {kind:'app-boot',at:70000,bootId:'boot-b',navigationType:'reload',route:'home'},
    {kind:'boot-after-active-session',at:70000,bootId:'boot-b',navigationType:'reload',route:'home',source:'reload-trace',context:{...context,sector:20,encounter:'boss-fight'}},
  ];
  const report=readStabilityReport(host(null,null,JSON.stringify(reload),JSON.stringify(reload)));
  assert.equal(report.reloadTrace.windowMs,60000);assert.equal(report.reloadTrace.events.length,3);
  assert.equal(report.reloadTrace.events[0].kind,'main-thread-gap');assert.equal(report.reloadTrace.events[0].gapMs,1730);
  assert.equal(report.reloadTrace.events[0].context.bossHealth,300);assert.equal(report.reloadTrace.events[2].source,'reload-trace');
  assert.ok(!JSON.stringify(report).includes('private-'));
});
test('v3 exports bounded transition resource counters without private payloads',()=>{
  const resource={kind:'resource-normal-start',at:80000,bootId:'boot-c',context:{...context,sector:21,phase:'SECTOR_INTRO',
    jsHeapBytes:123456789,domNodes:742,runningAnimations:6,canvasNodes:3,imageNodes:28,
    paintedEntries:19,paintedBytes:12000000,paintedSources:8,paintedPending:2,paintedRetained:7,paintedRetainCount:9,
    canvasRegisteredEffects:1,canvasSourceImages:4,canvasTextureEntries:8,canvasCacheBytes:6000000,canvasSurfaceBytes:1400000,
    canvasRetainedHullUsers:2,canvasFailureCount:0,audioState:'running',audioVoices:3,audioWeaponVoices:2,audioBossVoices:0,
    audioEffectVoices:1,audioSampleBuffers:37,audioRockBuffers:2,audioBufferBytes:9000000,estimatedResourceBytes:28400000,
    username:'private-user',stack:'private-stack',rawCacheKeys:['secret']}};
  const report=readStabilityReport(host(null,null,JSON.stringify([resource]),JSON.stringify([resource])));
  const event=report.reloadTrace.events[0];
  assert.equal(event.kind,'resource-normal-start');assert.equal(event.context.paintedEntries,19);
  assert.equal(event.context.canvasCacheBytes,6000000);assert.equal(event.context.audioState,'running');
  assert.equal(event.context.estimatedResourceBytes,28400000);assert.ok(!JSON.stringify(report).includes('private-'));assert.ok(!JSON.stringify(report).includes('rawCacheKeys'));
});
test('exports only allowed technical fields, never raw messages, stacks, user or saved progress',()=>{
  const input={...context,username:'private-user',uid:'private-id',accessToken:'private-token',score:9132,shards:428,message:'private-message',stack:'private-stack',browser:'private-browser',checkpoint:{password:'private-password'}};
  const report=readStabilityReport(host(JSON.stringify([input]),JSON.stringify({context:input,active:true,private:'private-marker'})));
  assert.deepEqual(report.events,[context]);assert.ok(!JSON.stringify(report).includes('private-'));assert.ok(!JSON.stringify(report).includes('9132'));
});
test('out-of-range timestamp cannot break export',()=>{
  assert.equal(readStabilityReport(host(null,null),Infinity).generatedAt,null);
});
test('server owner approval is required before storage is touched',async()=>{
  let reads=0,verified=false;
  const getHost=()=>{assert.equal(verified,true);reads++;return host(JSON.stringify([context]),null);};
  for(const value of [null,{}, {canAdmin:false},{canAdmin:'true'}]) await assert.rejects(readOwnerStabilityReport(async()=>value,getHost),/owner_access_required/);
  await assert.rejects(readOwnerStabilityReport(async()=>{throw Error('401');},getHost),/401/);
  assert.equal(reads,0);
  const report=await readOwnerStabilityReport(async()=>{verified=true;return {canAdmin:true};},getHost);
  assert.equal(reads,1);assert.equal(report.events[0].sector,19);
});
test('a dismissed owner view cannot read data after a pending permission check',async()=>{
  let finish;const status=new Promise(resolve=>{finish=resolve;});let active=true;
  const request=readOwnerStabilityReport(()=>status,()=>{throw Error('late storage access');},()=>active);
  active=false;finish({canAdmin:true});assert.equal(await request,null);
});
test('public standalone files are absent and the export lives inside the owner branch',()=>{
  assert.equal(fs.existsSync(new URL('../public/stability-report.html',import.meta.url)),false);
  assert.equal(fs.existsSync(new URL('../public/stability-report.mjs',import.meta.url)),false);
  const admin=fs.readFileSync(new URL('../src/pages/AdminPage.tsx',import.meta.url),'utf8');
  assert.ok(admin.includes('view === "diagnostics" && <OwnerStabilityReport />'));
  assert.ok(admin.includes('const allowed = auth.authReady && auth.canAdmin;'));
  assert.ok(admin.indexOf('<OwnerStabilityReport />')>admin.indexOf('<div className="admin-owner">'));
  const report=fs.readFileSync(new URL('../src/pages/stabilityReport.mjs',import.meta.url),'utf8');
  assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|setItem|removeItem|clear)\s*\(/.test(report));
});
