import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneResourcePreloader } from './sceneResourcePreloader.ts';
import { ResourceCache } from './resourceCache.ts';
const deferred = () => { let resolve, reject; const ready = new Promise((a,b) => {resolve=a;reject=b;}); return {ready,resolve,reject}; };

test('the incoming forecast acquires pins before outgoing release can revoke its images', () => {
  const revoked=[], cache=new ResourceCache(1,Infinity,url=>revoked.push(url));
  const preloader=new SceneResourcePreloader(()=>assert.fail());
  preloader.prepare('first',()=>{const release=cache.retain('next');cache.set('next','blob:next');return {ready:Promise.resolve(),release};});
  cache.set('other','blob:other');
  preloader.prepare('next',()=>{const release=cache.retain('next');assert.equal(cache.get('next'),'blob:next');return {ready:Promise.resolve(),release};});
  assert.equal(cache.get('next'),'blob:next');assert.equal(revoked.includes('blob:next'),false);
  preloader.dispose();
});

test('a pending forecast never blocks and repeated renders do not allocate another batch', async () => {
  const job=deferred(), faults=[];let loads=0,releases=0;
  const preloader=new SceneResourcePreloader(error=>faults.push(error));
  for(let i=0;i<10000;i++)preloader.prepare('same',()=>{loads++;return {ready:job.ready,release:()=>releases++};});
  assert.equal(loads,1);assert.equal(releases,0);
  preloader.dispose();preloader.dispose();job.reject(new Error('cancelled old job'));await Promise.resolve();
  assert.equal(releases,1);assert.deepEqual(faults,[]);
});

test('failed preparation retains the preceding pins and later scenes recover without stale errors', async () => {
  const old=deferred(),next=deferred(),faults=[];let oldReleased=0,nextReleased=0;
  const preloader=new SceneResourcePreloader(error=>faults.push(error));
  preloader.prepare('old',()=>({ready:old.ready,release:()=>oldReleased++}));
  preloader.prepare('failed',()=>{throw new Error('fixture');});assert.equal(oldReleased,0);
  preloader.prepare('next',()=>({ready:next.ready,release:()=>nextReleased++}));assert.equal(oldReleased,1);
  old.reject(new Error('stale'));next.reject(new Error('current'));await Promise.resolve();
  assert.deepEqual(faults.map(error=>error.message),['fixture','current']);
  preloader.dispose();assert.equal(nextReleased,1);
});
