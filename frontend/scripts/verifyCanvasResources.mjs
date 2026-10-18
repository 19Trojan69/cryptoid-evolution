// Actual candidate module, mocked browser allocation/decoding. This verifies
// abort-during-preparation and completed-resource release, not pixel rendering.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import Module from 'node:module';
const css=fs.readFileSync(new URL('../src/index.css',import.meta.url),'utf8');
const art=Object.fromEntries(['fire','smoke'].map((kind,i)=>{
  const line=css.split('\n').find(l=>l.includes(`.impact-effect.explosion::${i?'after':'before'},`)&&l.includes('{ position: absolute; z-index: 0;'));
  return [kind,Object.fromEntries([...line.slice(line.indexOf('{')+1,line.lastIndexOf('}')).matchAll(/([\w-]+):\s*([^;]+);/g)].map(m=>[m[1],m[2]]))];
}));
const result=await build({entryPoints:[new URL('./deviceReplay/CanvasImpact.tsx',import.meta.url).pathname],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',define:{__CRYPTOID_EXPLOSION_ART__:JSON.stringify(art),'process.env.NODE_ENV':'"production"'},plugins:[{name:'mock-hook',setup(b){b.onResolve({filter:/\/paintedShip$/},()=>({path:'hull-hook',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const usePaintedShipStyle=()=>({});',loader:'js'}));}}]});
const pendingImages=[],canvases=[];
globalThis.window={devicePixelRatio:1};
globalThis.Image=class{naturalWidth=64;naturalHeight=64;constructor(){pendingImages.push(this);}};
globalThis.document={createElement:()=>{const c={width:0,height:0,getContext:()=>({drawImage(){}})};canvases.push(c);return c;}};
globalThis.cancelAnimationFrame=()=>{};
const module=new Module(import.meta.filename);module.filename=import.meta.filename;module.paths=Module._nodeModulePaths(import.meta.dirname);module._compile(result.outputFiles[0].text,import.meta.filename);
const {createCanvasPresentation,prepareCanvasImpactResources}=module.exports;
const probe=createCanvasPresentation();
const first=prepareCanvasImpactResources('blob:cancelled',62.5);const rejected=assert.rejects(first,/Stale/);
probe.stop();for(const image of pendingImages.splice(0))image.onload();await rejected;await new Promise(resolve=>setImmediate(resolve));
assert.equal(probe.read().imageBytes,0);assert.equal(probe.read().textureBytes,0);assert.equal(probe.read().textures,0);assert.equal(probe.read().sourceImages,0);assert.equal(canvases.length,0,'stale preparation cannot allocate a texture canvas');
const second=prepareCanvasImpactResources('blob:ready',62.5);for(const image of pendingImages.splice(0))image.onload();await second;
assert.equal(probe.read().sourceImages,1);assert.equal(probe.read().textures,2);assert.ok(probe.read().imageBytes>0);assert.ok(probe.read().textureBytes>0);
const cleanup=probe.stop();assert.deepEqual(cleanup,{activeDrawFrame:false,registeredEffects:0,sourceImages:0,textureEntries:0,cacheBytes:0,surfaceBytes:0});
assert.ok(canvases.every(c=>c.width===0&&c.height===0));
console.log(JSON.stringify({passed:true,checks:['abort during pending hull/SVG decoding','stale preparation cannot refill cleared caches','completed texture backing stores released','draw scheduler/registrations/caches cleared']}));
