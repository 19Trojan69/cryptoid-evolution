import test from 'node:test';
import assert from 'node:assert/strict';
import { observeBossResources, reportBossResource } from './bossResourceDiagnostics.ts';
import { preloadBossWeapons } from './bossWeaponTextures.ts';
import { backupTrace } from './traceBackupFormat.ts';

test('real texture loader reports load dimensions while sharing the same image promise', async () => {
 const previous=globalThis.Image,images=[],events=[];
 globalThis.Image=class { naturalWidth=2048;naturalHeight=966;constructor(){images.push(this);} };
 const stop=observeBossResources((kind,details)=>events.push({kind,...details}));
 try {
  const config={id:4,weaponImage:'/diagnostic-test-guns.webp'};
  const first=preloadBossWeapons(config);assert.equal(first,preloadBossWeapons(config));assert.equal(images.length,1);
  assert.equal(images[0].src,config.weaponImage);images[0].onload();assert.equal(await first,images[0]);
  assert.deepEqual(events.map(e=>e.kind),['boss-texture-start','boss-texture-ready']);assert.equal(events[1].bossTextureHeight,966);
  const trace=backupTrace({version:2,environment:'developer-only',events:events.map(e=>({...e,sector:40,url:'sensitive-url'}))});
  assert.equal(trace.events[1].bossTextureWidth,2048);assert.ok(!JSON.stringify(trace).includes('sensitive-url'));
 }finally{stop();globalThis.Image=previous;}
});
test('a faulty diagnostic subscriber cannot interrupt texture loading and unsubscribe releases it', async () => {
 const previous=globalThis.Image;let image;
 globalThis.Image=class { constructor(){image=this;} };
 const stop=observeBossResources(()=>{throw Error('diagnostic failure');});
 try {const p=preloadBossWeapons({id:5,weaponImage:'/diagnostic-second-guns.webp'});image.onload();assert.equal(await p,image);}
 finally {stop();globalThis.Image=previous;}
 assert.doesNotThrow(()=>reportBossResource('boss-canvas-release',{bossId:5}));
});
