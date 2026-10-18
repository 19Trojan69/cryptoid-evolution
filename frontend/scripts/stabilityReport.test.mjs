import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readStabilityReport, technicalContext} from '../public/stability-report.mjs';
const context={reason:'performance',sector:19,block:9,phase:'ATTACK_CYCLE',encounter:'normal',status:'playing',width:430,height:825,enemies:4,projectiles:9,effects:2};
const keys=['cryptoid_game_diagnostics_v1','cryptoid_game_session_v1'];
const host=(events,session)=>({localStorage:{getItem:key=>{assert.equal(key,keys[0]);return events;}},sessionStorage:{getItem:key=>{assert.equal(key,keys[1]);return session;}}});
test('reads previous interruption and current session without touching account or save keys',()=>{
  const report=readStabilityReport(host(JSON.stringify([{...context,reason:'unexpected-restart',restartHint:'page-reload',at:'2026-10-18T14:29:00.000Z'}]),JSON.stringify({context,active:true,hidden:false,pageHidden:false,at:10000})),12000);
  assert.equal(report.available,true);assert.equal(report.events[0].sector,19);assert.equal(report.events[0].restartHint,'page-reload');
  assert.deepEqual(report.lastSession,{context,active:true,hidden:false,pageHidden:false,at:10000,ageMs:2000});
});
test('absent, denied, corrupt or oversized storage explicitly reports missing evidence',()=>{
  for(const h of [{},host(null,null),host('{bad','{bad'),host('x'.repeat(65537),null)]) assert.equal(readStabilityReport(h).available,false);
  const denied={};for(const key of ['localStorage','sessionStorage'])Object.defineProperty(denied,key,{get(){throw Error('denied');}});
  const report=readStabilityReport(denied);assert.equal(report.available,false);assert.equal(report.storage.events,'unavailable-or-invalid');
});
test('keeps at most twenty records and drops unknown or malformed values',()=>{
  const report=readStabilityReport(host(JSON.stringify(Array.from({length:100},(_,i)=>({...context,sector:i}))),null));
  assert.equal(report.events.length,20);assert.equal(report.events[0].sector,80);
  assert.equal(technicalContext([]),null);assert.equal(technicalContext(null),null);assert.equal(technicalContext({secret:'token'}),null);
  assert.deepEqual(technicalContext({sector:Infinity,frameMs:-1,phase:'private message',errorName:'token-in-error-name'}),null);
});
test('exports only allowed technical fields, never raw messages, stacks, user or saved progress',()=>{
  const input={...context,username:'private-user',uid:'private-id',accessToken:'private-token',score:9132,shards:428,message:'private-message',stack:'private-stack',browser:'private-browser',checkpoint:{password:'private-password'}};
  const report=readStabilityReport(host(JSON.stringify([input]),JSON.stringify({context:input,active:true,private:'private-marker'})));
  assert.deepEqual(report.events,[context]);assert.ok(!JSON.stringify(report).includes('private-'));assert.ok(!JSON.stringify(report).includes('9132'));
});
test('out-of-range timestamp cannot break export',()=>{
  assert.equal(readStabilityReport(host(null,null),Infinity).generatedAt,null);
});
test('standalone page cannot make network requests or import the game',()=>{
  const html=fs.readFileSync(new URL('../public/stability-report.html',import.meta.url),'utf8');
  const js=fs.readFileSync(new URL('../public/stability-report.mjs',import.meta.url),'utf8');
  assert.ok(html.includes("connect-src 'none'"));assert.ok(html.includes('readonly'));
  assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|setItem|removeItem|clear)\s*\(/.test(js));assert.ok(!/\bimport\s/.test(js));
});
