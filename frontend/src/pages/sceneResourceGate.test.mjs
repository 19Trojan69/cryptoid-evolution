import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneResourceGate } from './sceneResourceGate.ts';
import { slowerEnemyArrival, restoreSlowerArrival, bossEscortVisualScale } from './enemyArrival.ts';
import { ResourceCache } from './resourceCache.ts';
const deferred=()=>{let resolve,reject;const ready=new Promise((a,b)=>{resolve=a;reject=b});return{ready,resolve,reject};};
test('all 500-stage arrival times use 75% speed and restored progress migrates exactly once',()=>{
 for(let duration=1000;duration<=12000;duration+=37){
  const next=slowerEnemyArrival(duration);assert.ok(Math.abs(duration/next-.75)<.001);
  const old={entryDuration:duration,entryElapsed:duration*.4,radius:18,health:3};
  const fixed=restoreSlowerArrival(old,duration);
  assert.ok(Math.abs(fixed.entryElapsed/fixed.entryDuration-.4)<1e-12);
  assert.deepEqual(restoreSlowerArrival(fixed,duration),fixed);
  assert.equal(fixed.radius,18);assert.equal(fixed.health,3);
 }
 assert.equal(slowerEnemyArrival(1430),1907);assert.equal(slowerEnemyArrival(1850),2467);
 assert.equal(bossEscortVisualScale(true),1.25);assert.equal(bossEscortVisualScale(false),1);
 assert.equal(restoreSlowerArrival({entryDuration:1430,entryElapsed:2430},1430).entryElapsed,2907,'resting sway age preserved');
 assert.equal(restoreSlowerArrival({entryDuration:1300,entryElapsed:650},1430,1300).entryElapsed,1907/2,'older approved arrivals migrate too');
});
test('a scene remains gated until the full batch is ready; duplicate checks start no extra work',async()=>{
 const pending=[],faults=[],job=deferred();let calls=0,releases=0;
 const gate=new SceneResourceGate(x=>pending.push(x),x=>faults.push(x));
 const load=()=>{calls++;return{ready:job.ready,release:()=>releases++};};
 for(let i=0;i<1000;i++)assert.equal(gate.ensure('wave',load),false);
 assert.equal(calls,1);job.resolve();await Promise.resolve();
 assert.equal(gate.ensure('wave',load),true);assert.deepEqual(pending,[true,false]);
 gate.dispose();gate.dispose();assert.equal(releases,1);assert.equal(faults.length,0);
});
test('stale work cannot reveal a replacement scene or a scene after unmount',async()=>{
 const a=deferred(),b=deferred(),pending=[];let releases=0;
 const gate=new SceneResourceGate(x=>pending.push(x),()=>assert.fail());
 gate.ensure('a',()=>({ready:a.ready,release:()=>releases++}));
 gate.ensure('b',()=>({ready:b.ready,release:()=>releases++}));
 a.resolve();await Promise.resolve();assert.deepEqual(pending,[true,true]);
 gate.dispose();b.resolve();await Promise.resolve();assert.equal(releases,2);assert.deepEqual(pending,[true,true]);
});
test('failed loading pauses once; explicit retry starts one fresh batch',async()=>{
 const a=deferred(),b=deferred(),faults=[];let releases=0;
 const gate=new SceneResourceGate(()=>{},x=>faults.push(x));
 gate.ensure('a',()=>({ready:a.ready,release:()=>releases++}));a.reject(new Error('fixture'));await Promise.resolve();
 for(let i=0;i<100;i++)assert.equal(gate.ensure('a',()=>assert.fail()),false);
 assert.equal(faults.length,1);gate.retry();assert.equal(releases,1);
 gate.ensure('a',()=>({ready:b.ready,release:()=>releases++}));b.resolve();await Promise.resolve();
 assert.equal(gate.ensure('a',()=>assert.fail()),true);gate.dispose();assert.equal(releases,2);
});
test('decoded formations switch synchronously without a waiting callback or lost frame',async()=>{
 const waiting=[],gate=new SceneResourceGate(value=>waiting.push(value),()=>assert.fail());
 for(let wave=0;wave<1000;wave++) {
  assert.equal(gate.ensure(String(wave),()=>({ready:Promise.resolve(),isReady:()=>true,release(){}})),true);
 }
 await Promise.resolve();assert.equal(waiting.includes(true),false);
 gate.dispose();
});
test('incoming resources are pinned before old forecast pins release and trim the cache',()=>{
 const revoked=[],cache=new ResourceCache(1,Infinity,url=>revoked.push(url));
 const gate=new SceneResourceGate(()=>{},()=>assert.fail());
 const oldPin=cache.retain('next');cache.set('next','decoded-next');
 gate.ensure('old',()=>({ready:Promise.resolve(),isReady:()=>true,release:oldPin}));
 cache.set('recent','recent-resource');
 assert.equal(gate.ensure('next',()=>{
  const release=cache.retain('next');
  return{ready:Promise.resolve(),isReady:()=>cache.get('next')==='decoded-next',release};
 }),true);
 assert.equal(cache.get('next'),'decoded-next');assert.equal(revoked.includes('decoded-next'),false);
 gate.dispose();
});
