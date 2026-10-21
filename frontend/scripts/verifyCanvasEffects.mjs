// Actual candidate module, mocked browser allocation/decoding. This verifies
// abort-during-preparation and completed-resource release, not pixel rendering.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import Module from 'node:module';
const result=await build({entryPoints:[new URL('../src/pages/CanvasEffects.tsx',import.meta.url).pathname],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'mock-hook',setup(b){b.onResolve({filter:/\/paintedShip$/},()=>({path:'hull-hook',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const usePaintedShipStyle=()=>({});',loader:'js'}));}}]});
const pendingImages=[],canvases=[];
globalThis.window={devicePixelRatio:1};
globalThis.Image=class{naturalWidth=64;naturalHeight=64;constructor(){pendingImages.push(this);}};
globalThis.document={createElement:()=>{const c={width:0,height:0,getContext:()=>({drawImage(){}})};canvases.push(c);return c;}};
globalThis.cancelAnimationFrame=()=>{};
const module=new Module(import.meta.filename);module.filename=import.meta.filename;module.paths=Module._nodeModulePaths(import.meta.dirname);module._compile(result.outputFiles[0].text,import.meta.filename);
const {clearCanvasEffects,canvasEffectResources,prepareCanvasImpactResources,retainCanvasImpactHull}=module.exports;
const probe={read:()=>({...canvasEffectResources(),textures:canvasEffectResources().textureEntries}),stop:()=>{clearCanvasEffects();const s=canvasEffectResources();return Object.fromEntries(['activeDrawFrame','registeredEffects','sourceImages','textureEntries','cacheBytes','surfaceBytes'].map(k=>[k,s[k]]));}};
const first=prepareCanvasImpactResources('blob:cancelled',62.5);const rejected=assert.rejects(first,/Stale/);
probe.stop();for(const image of pendingImages.splice(0))image.onload();await rejected;await new Promise(resolve=>setImmediate(resolve));
assert.equal(probe.read().imageBytes,0);assert.equal(probe.read().textureBytes,0);assert.equal(probe.read().textures,0);assert.equal(probe.read().sourceImages,0);assert.equal(canvases.length,0,'stale preparation cannot allocate a texture canvas');
const second=prepareCanvasImpactResources('blob:ready',62.5);for(const image of pendingImages.splice(0))image.onload();await second;
assert.equal(probe.read().sourceImages,1);assert.equal(probe.read().textures,2);assert.ok(probe.read().imageBytes>0);assert.ok(probe.read().textureBytes>0);
const cleanup=probe.stop();assert.deepEqual(cleanup,{activeDrawFrame:false,registeredEffects:0,sourceImages:0,textureEntries:0,cacheBytes:0,surfaceBytes:0});
assert.ok(canvases.every(c=>c.width===0&&c.height===0));
// New blocks introduce new painted hull URLs. The retained cache must admit
// them without becoming permanently full after its first eight hulls.
const prepare=async url=>{const next=prepareCanvasImpactResources(url,62.5);for(const image of pendingImages.splice(0))image.onload();return next;};
const release=retainCanvasImpactHull('blob:active');
const [activeHull]=await prepare('blob:active');
for(let block=0;block<24;block++){
  await prepare(`blob:block-${block}`);
  assert.ok(probe.read().sourceImages<=8,'decoded hull cache stays bounded across blocks');
  assert.equal((await prepare('blob:active'))[0],activeHull,'mounted explosion keeps its decoded hull');
}
assert.ok(probe.read().hullEvictions>0);release();
probe.stop();
const releases=[];
for(let i=0;i<8;i++){const url=`blob:pinned-${i}`;releases.push(retainCanvasImpactHull(url));await prepare(url);}
await assert.rejects(prepare('blob:later'),/Active hull image cache limit/,'all actively used hulls retain original-display fallback');
assert.equal(probe.read().sourceImages,8);
for(const drop of releases)drop();
await prepare('blob:later');assert.equal(probe.read().sourceImages,2,'released effects leave only two spare hulls; capacity fallback remains retryable');
probe.stop();
// A temporary SVG decode failure must not poison the same texture key for the
// rest of the game. Its successful sibling may stay cached and be reused.
const failing=prepareCanvasImpactResources('blob:retry',62.5),failed=assert.rejects(failing,/Effect texture unavailable/);
const batch=pendingImages.splice(0);batch[0].onload();batch[1].onerror();batch[2].onload();await failed;
assert.equal(probe.read().textures,1,'only the successful texture stays cached');
await prepare('blob:retry');assert.equal(probe.read().textures,2,'same texture can prepare after transient failure');
probe.stop();
// Keep two warm fire/smoke pairs only after every effect has released its hull.
// Pending and mounted consumers protect their textures even across new sizes.
const keep=retainCanvasImpactHull('blob:texture-live');
const liveCanvases=[];
for(const size of [40,50,60,70]){
  const p=prepareCanvasImpactResources('blob:texture-live',size);
  for(const img of pendingImages.splice(0))img.onload();
  const [,fire,smoke]=await p;liveCanvases.push(fire.canvas,smoke.canvas);
}
assert.equal(probe.read().textures,8,'a preparing/mounted consumer protects every texture');
assert.ok(liveCanvases.every(c=>c.width>0));
keep();keep();
assert.equal(probe.read().textures,4,'last release trims to two recent texture pairs');
assert.ok(liveCanvases.slice(0,4).every(c=>c.width===0&&c.height===0),'retired backing stores are explicitly released');
assert.ok(liveCanvases.slice(4).every(c=>c.width>0),'recent pairs remain warm');
assert.equal(probe.read().retainedHullUsers,0,'release is idempotent');
probe.stop();
console.log(JSON.stringify({passed:true,checks:['abort during pending hull/SVG decoding','stale preparation cannot refill cleared caches','completed texture backing stores released','draw scheduler/registrations/caches cleared','24 changing hulls reuse eight retained slots','active hull stays decoded during eviction','capacity fallback recovers after active users release','transient texture decode failure can retry']}));
