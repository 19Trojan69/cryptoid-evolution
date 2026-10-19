// Execute the actual component/resource module with a small hook host and
// mocked browser allocations. This is not a Safari/GPU or pixel test.
import assert from 'node:assert/strict';
import Module from 'node:module';
import {Host} from './canvasHookHost.mjs';
import {build} from 'esbuild';

const root=new URL('../',import.meta.url).pathname;
const source=process.env.CRYPTOID_CANVAS_SOURCE||new URL('../src/pages/CanvasEffects.tsx',import.meta.url).pathname;
const bundle=await build({absWorkingDir:root,entryPoints:[source],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',plugins:[{name:'component-host',setup(b){
  b.onResolve({filter:/^react(?:\/jsx-runtime)?$/},args=>({path:args.path,namespace:'hooks'}));
  b.onLoad({filter:/.*/,namespace:'hooks'},args=>({loader:'js',contents:args.path.endsWith('jsx-runtime')?
    'export const Fragment="fragment";export const jsx=(type,props)=>({type,props});export const jsxs=jsx;':
    'export const createContext=value=>({value,Provider:"provider"});export const useContext=context=>globalThis.__availability??context.value;export const useState=(...a)=>globalThis.__hookHost.state(...a);export const useRef=(...a)=>globalThis.__hookHost.ref(...a);export const useMemo=(...a)=>globalThis.__hookHost.memo(...a);export const useEffect=(...a)=>globalThis.__hookHost.effect(false,...a);export const useLayoutEffect=(...a)=>globalThis.__hookHost.effect(true,...a);export default {Children:{toArray:value=>value?Array.isArray(value)?value:[value]:[]}};'}));
  b.onResolve({filter:/\/paintedShip$/},()=>({path:'painted-hook',namespace:'hull'}));
  b.onLoad({filter:/.*/,namespace:'hull'},()=>({loader:'js',contents:'export const usePaintedShipStyle=()=>({backgroundImage:"url(blob:hull)"});'}));
}}]});
const images=[],canvases=[],frames=new Map(),timers=new Map();let nextFrame=0,nextTimer=0,timerClock=0;
const context={drawImage(){},clearRect(){},setTransform(){}};
const makeCanvas=()=>{
  const listeners=new Map();let width=0,height=0,writes=0;
  const canvas={style:{},context,listeners,parentElement:{clientWidth:430,clientHeight:825,closest:()=>({getAttribute:()=> 'false'})},
    get width(){return width;},set width(value){width=value;writes++;},
    get height(){return height;},set height(value){height=value;writes++;},
    get writes(){return writes;},getContext(){return this.context;},
    addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
  canvases.push(canvas);return canvas;
};
globalThis.window={devicePixelRatio:3,setTimeout(callback,delay){const id=++nextTimer;timers.set(id,{callback,at:timerClock+delay});return id;},clearTimeout:id=>timers.delete(id)};
const advanceTimers=ms=>{timerClock+=ms;for(const [id,timer] of [...timers])if(timer.at<=timerClock){timers.delete(id);timer.callback();}};
globalThis.Image=class{naturalWidth=282;naturalHeight=282;constructor(){images.push(this);}};
globalThis.document={createElement:makeCanvas};
const observers=[];
globalThis.ResizeObserver=class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){}};
globalThis.requestAnimationFrame=callback=>{frames.set(++nextFrame,callback);return nextFrame;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
const mod=new Module(import.meta.filename);mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(import.meta.dirname);mod._compile(bundle.outputFiles[0].text,import.meta.filename);
const runtime=mod.exports;
const flush=async()=>{await new Promise(resolve=>setImmediate(resolve));};
const decode=()=>{for(const img of images.splice(0))img.onload?.();};
const effect={id:1,kind:'explosion',x:215,y:240,debrisSize:50,sprite:0,debrisColor:'steel'};
const original={type:'original'};

// Prewarm the real cache, then mount ONE explosion: no second registration
// or 1x1 -> full-size -> 1x1 -> full-size backing-store round trip is needed.
const prep=runtime.prepareCanvasImpactResources('blob:hull',62.5);decode();await prep;
const s=makeCanvas(),owner=new Host(runtime.CanvasEffectLayer,{enabled:true,children:null},s);
globalThis.__availability=owner.render().props.value;owner.passive();globalThis.__availability=owner.render().props.value;
const view=new Host(runtime.CanvasImpact,{effect,debris:null,original});
const before=s.writes;view.render();const initial=s.writes-before;
assert.equal(runtime.canvasEffectResources().registeredEffects,1);
view.passive();await flush();view.render();
const afterWarm=s.writes-before;
assert.equal(afterWarm,initial,'cached preparation must not remove/re-register an already visible explosion');
assert.equal(initial,2,'one surface growth, width and height assigned once');
view.unmount();
assert.ok(s.width>3&&s.height>3,'a brief idle gap must reuse the transparent backing store, not immediately shrink it');
let warmImpacts=0;
for(let i=0;i<2000;i++){
  const next=new Host(runtime.CanvasImpact,{effect:{...effect,id:i+10},debris:null,original});
  const before=s.writes;next.render();next.passive();await flush();next.render();
  assert.equal(s.writes-before,0,'same-size warm impacts reuse the existing backing store');
  next.unmount();advanceTimers(250);warmImpacts++;
}
assert.equal(runtime.canvasEffectResources().sourceImages,1);
assert.equal(runtime.canvasEffectResources().textureEntries,2);
assert.equal(runtime.canvasEffectResources().registeredEffects,0);
assert.equal(frames.size,0,'an idle reusable surface does not keep drawing');
assert.equal(timers.size,1,'only one bounded idle-release timer exists');
const burstWrites=s.writes;
for(let i=0;i<400;i++){
  const next=new Host(runtime.CanvasImpact,{effect:{...effect,id:i+2200,x:i%2?410:20,y:i%4<2?25:800},debris:null,original});
  next.render();next.passive();await flush();next.render();next.unmount();advanceTimers(250);
  assert.ok(runtime.canvasEffectResources().surfaceBytes<=430*825*3*3*4,'reused surface remains bounded by the playfield at original DPR');
}
const movingBurstWrites=s.writes-burstWrites;
assert.ok(movingBurstWrites<=800,'moving explosions need at most one width/height update per impact, with no idle shrink/grow cycle');
const retainedBytes=runtime.canvasEffectResources().surfaceBytes;
advanceTimers(1749);
assert.equal(runtime.canvasEffectResources().surfaceBytes,retainedBytes,'release is not early');
advanceTimers(1);
assert.equal(runtime.canvasEffectResources().surfaceBytes,36,'two seconds without effects return the idle surface to its original tiny size');
assert.equal(timers.size,0);
const active=new Host(runtime.CanvasImpact,{effect:{...effect,id:3000},debris:null,original});
active.render();active.passive();await flush();active.render();
active.unmount();assert.equal(timers.size,1);
const resumed=new Host(runtime.CanvasImpact,{effect:{...effect,id:3001},debris:null,original});
resumed.render();resumed.passive();await flush();resumed.render();
const resumedBytes=runtime.canvasEffectResources().surfaceBytes;
advanceTimers(2000);
assert.equal(timers.size,0,'a new burst cancels the prior deferred release');
assert.equal(runtime.canvasEffectResources().surfaceBytes,resumedBytes,'an expired prior idle deadline cannot shrink an active surface');
assert.equal(runtime.canvasEffectResources().registeredEffects,1);

// Context loss must release this optional layer and retain the original DOM,
// rather than leaving an active effect registered on an unavailable surface.
assert.ok(s.listeners.has('contextlost'));
s.listeners.get('contextlost')();
globalThis.__availability=owner.render().props.value;resumed.dirty=true;
assert.equal(resumed.render().props.children,original);
assert.equal(runtime.canvasEffectResources().registeredEffects,0);
assert.equal(runtime.canvasEffectResources().cacheBytes,0);
assert.equal(runtime.canvasEffectResources().activeDrawFrame,false);
observers.at(-1).callback();
assert.equal(owner.render().props.value.enabled,false,'resize must not re-enable a failed surface');
resumed.unmount();owner.unmount();
assert.equal(timers.size,0,'context loss/unmount cancel deferred release');
assert.equal(s.listeners.size,0,'context listener removed on unmount');
assert.ok(canvases.every(canvas=>canvas.width===0&&canvas.height===0));
// WebKit may return null before/without a contextlost event.
const lostSurface=makeCanvas(),lostOwner=new Host(runtime.CanvasEffectLayer,{enabled:true,children:null},lostSurface);
globalThis.__availability=lostOwner.render().props.value;lostOwner.passive();globalThis.__availability=lostOwner.render().props.value;
const missingContext=new Host(runtime.CanvasImpact,{effect,debris:null,original});
missingContext.render();missingContext.passive();decode();await flush();missingContext.render();
lostSurface.context=null;
for(const [id,callback] of [...frames]){frames.delete(id);callback(performance.now());}
globalThis.__availability=lostOwner.render().props.value;missingContext.dirty=true;
assert.equal(missingContext.render().props.children,original);
assert.equal(runtime.canvasEffectResources().activeDrawFrame,false);
missingContext.unmount();lostOwner.unmount();
assert.equal(timers.size,0);
for(const shutdown of ['contextloss','unmount']){
  const idleSurface=makeCanvas(),idleOwner=new Host(runtime.CanvasEffectLayer,{enabled:true,children:null},idleSurface);
  globalThis.__availability=idleOwner.render().props.value;idleOwner.passive();globalThis.__availability=idleOwner.render().props.value;
  const idleEffect=new Host(runtime.CanvasImpact,{effect,debris:null,original});
  idleEffect.render();idleEffect.passive();decode();await flush();idleEffect.render();idleEffect.unmount();
  assert.equal(timers.size,1,'a pending idle release exists before shutdown');
  if(shutdown==='contextloss')idleSurface.listeners.get('contextlost')();
  idleOwner.unmount();
  assert.equal(timers.size,0,shutdown+' cancels the pending idle release');
  assert.equal(frames.size,0);
  assert.equal(idleSurface.width,0);assert.equal(idleSurface.height,0);
  advanceTimers(2000);assert.equal(runtime.canvasEffectResources().surfaceBytes,0,'released surfaces cannot be revived by deferred cleanup');
}
console.log(JSON.stringify({passed:true,warmImpacts,movingBurstWrites,warmSurfaceDimensionWrites:{initial,afterPreparation:afterWarm,repeatedImpact:0},checks:['warm assets retain registration and surface','2000 warm impacts reuse the backing store','400 moving impacts preserve per-burst bounds without idle shrink/grow cycles','idle drawing stops immediately; backing store releases after two seconds','new burst cancels the previous idle deadline','context loss releases caches/scheduler/timers','original DOM fallback survives context loss or null context','resize cannot revive released textures','context loss and unmount cancel a pending idle release'],limits:'Actual component with hook/allocation host; no WebKit pixel, memory-pressure or complete-campaign proof.'}));
