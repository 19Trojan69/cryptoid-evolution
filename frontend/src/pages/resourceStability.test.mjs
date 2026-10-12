import test from 'node:test';
import assert from 'node:assert/strict';
import { ResourceCache } from './resourceCache.ts';
import { activateBossExplosion, bossExplosionReady } from './effectLifecycle.ts';
import { createGameSessionDiagnostics } from './gameDiagnostics.ts';
import { appendPendingSave } from '../lib/saveOutbox.ts';

test('cache remains bounded across 500 sectors and protects mounted variants',()=>{
 const disposed=[];const cache=new ResourceCache(4,400,url=>disposed.push(url));
 const release=cache.retain('player');cache.set('player','player-url',100);
 for(let sector=0;sector<500;sector++)cache.set('enemy-'+sector,'url-'+sector,100);
 assert.equal(cache.size,4);assert.equal(cache.bytes,400);assert.ok(!disposed.includes('player-url'));
 release();release();for(let i=0;i<4;i++)cache.set('next-'+i,'new-'+i,100);
 assert.ok(disposed.includes('player-url'));assert.equal(disposed.length,501);
});
test('boss blast mounts after the original fall delay and keeps its timeline',()=>{
 const before={kind:'boss-explosion',startedAt:1000,finalDelayMs:5000};
 assert.equal(bossExplosionReady(before),false);assert.equal(activateBossExplosion(before,5999),before);
 const after=activateBossExplosion(before,6000);assert.equal(after.startedAt,6000);assert.equal(bossExplosionReady(after),true);assert.equal(activateBossExplosion(after,6200),after);
});
test('outbox coalesces only unsent consecutive checkpoints without crossing reward barriers',()=>{
 const cp=(n,runId='a',stage=25)=>({path:'/progress/checkpoint',body:{runId,combat:{stage,encounter:'normal',sequence:n},save:{hearts:n>3?1:3,shards:n}}});
 const first=cp(1),entries=[first];for(let n=2;n<=1000;n++)appendPendingSave(entries,cp(n),first);
 assert.equal(entries.length,2);assert.equal(entries[0],first);assert.equal(entries[1].body.combat.sequence,1000);
 const reward={path:'/rewards/event',body:{runId:'a',kind:'block',stage:25}};
 appendPendingSave(entries,reward,first);appendPendingSave(entries,cp(1001),first);appendPendingSave(entries,cp(1002,'b'),first);
 assert.equal(entries.length,5);assert.equal(entries[2],reward);assert.equal(entries[3].body.save.hearts,1);
});
test('restart markers distinguish foreground, hidden, manual reload and orderly exit',()=>{
 let time=10_000;const data=new Map(),reports=[];
 const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const context={reason:'performance',errorName:'',sector:25,phase:'FORMATION',encounter:'normal',status:'playing',width:390,height:760,browser:'test'};
 let monitor=createGameSessionDiagnostics(storage,e=>reports.push(e),()=>time);
 monitor.update(context,true,false,true);time+=1000;
 monitor=createGameSessionDiagnostics(storage,e=>reports.push(e),()=>time);assert.equal(reports[0].restartHint,'foreground-interrupted');
 monitor.pagehide();monitor.update(context,true,true,true);time+=1000;
 monitor=createGameSessionDiagnostics(storage,e=>reports.push(e),()=>time);assert.equal(reports[1].restartHint,'background-interrupted');
 monitor.update(context,true,false,true);time+=1000;
 monitor=createGameSessionDiagnostics(storage,e=>reports.push(e),()=>time,'reload');assert.equal(reports[2].restartHint,'page-reload');
 monitor.update(context,true,false,true);monitor.finish();time+=1000;
 createGameSessionDiagnostics(storage,e=>reports.push(e),()=>time);assert.equal(reports.length,3);
 assert.doesNotThrow(()=>createGameSessionDiagnostics({getItem:()=>{throw Error('denied')},setItem:()=>{}},()=>{},()=>time));
});

