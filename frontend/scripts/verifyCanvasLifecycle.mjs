// Execute the actual component/resource module with a small hook host and
// mocked browser allocations. This is not a Safari/GPU or pixel test.
import assert from 'node:assert/strict';
import Module from 'node:module';
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
const images=[],canvases=[],frames=new Map();let nextFrame=0;
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
globalThis.window={devicePixelRatio:3};
globalThis.Image=class{naturalWidth=282;naturalHeight=282;constructor(){images.push(this);}};
globalThis.document={createElement:makeCanvas};
const observers=[];
globalThis.ResizeObserver=class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){}};
globalThis.requestAnimationFrame=callback=>{frames.set(++nextFrame,callback);return nextFrame;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
const mod=new Module(import.meta.filename);mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(import.meta.dirname);mod._compile(bundle.outputFiles[0].text,import.meta.filename);
const runtime=mod.exports;
const equalDeps=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
class Host{
  slots=[];index=0;dirty=true;layouts=[];effects=[];output=null;
  constructor(component,props,canvas=null){this.component=component;this.props=props;this.canvas=canvas;}
  state(initial){const i=this.index++;if(!this.slots[i])this.slots[i]={value:typeof initial==='function'?initial():initial};return [this.slots[i].value,value=>{const next=typeof value==='function'?value(this.slots[i].value):value;if(!Object.is(next,this.slots[i].value)){this.slots[i].value=next;this.dirty=true;}}];}
  ref(value){const i=this.index++;return this.slots[i]??(this.slots[i]={current:value===null&&this.canvas?this.canvas:value});}
  memo(fn,deps){const i=this.index++;if(!equalDeps(this.slots[i]?.deps,deps))this.slots[i]={value:fn(),deps};return this.slots[i].value;}
  effect(layout,fn,deps){const i=this.index++,old=this.slots[i];if(equalDeps(old?.deps,deps))return;this.slots[i]={deps,cleanup:old?.cleanup};(layout?this.layouts:this.effects).push(()=>{this.slots[i].cleanup?.();this.slots[i].cleanup=fn();});}
  render(){for(let guard=0;this.dirty;guard++){assert.ok(guard<20,'hooks settle');this.dirty=false;this.index=0;globalThis.__hookHost=this;this.output=this.component(this.props);for(const run of this.layouts.splice(0))run();}return this.output;}
  passive(){for(const run of this.effects.splice(0))run();}
  unmount(){for(const slot of this.slots)slot?.cleanup?.();}
}
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
let warmImpacts=0;
for(let i=0;i<2000;i++){
  const next=new Host(runtime.CanvasImpact,{effect:{...effect,id:i+10},debris:null,original});
  const before=s.writes;next.render();next.passive();await flush();next.render();
  assert.equal(s.writes-before,2,'repeated warm impacts retain one registration');
  next.unmount();warmImpacts++;
}
assert.equal(runtime.canvasEffectResources().sourceImages,1);
assert.equal(runtime.canvasEffectResources().textureEntries,2);
assert.equal(runtime.canvasEffectResources().registeredEffects,0);
const active=new Host(runtime.CanvasImpact,{effect:{...effect,id:3000},debris:null,original});
active.render();active.passive();await flush();active.render();

// Context loss must release this optional layer and retain the original DOM,
// rather than leaving an active effect registered on an unavailable surface.
assert.ok(s.listeners.has('contextlost'));
s.listeners.get('contextlost')();
globalThis.__availability=owner.render().props.value;active.dirty=true;
assert.equal(active.render().props.children,original);
assert.equal(runtime.canvasEffectResources().registeredEffects,0);
assert.equal(runtime.canvasEffectResources().cacheBytes,0);
assert.equal(runtime.canvasEffectResources().activeDrawFrame,false);
observers.at(-1).callback();
assert.equal(owner.render().props.value.enabled,false,'resize must not re-enable a failed surface');
active.unmount();owner.unmount();
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
console.log(JSON.stringify({passed:true,warmImpacts,warmSurfaceDimensionWrites:{initial,afterPreparation:afterWarm},checks:['warm assets retain registration and surface','2000 warm impacts keep fixed cache counts','context loss releases caches/scheduler','original DOM fallback survives context loss or null context','resize cannot revive released textures','context listener and backing stores released'],limits:'Actual component with hook/allocation host; no WebKit pixel, memory-pressure or complete-campaign proof.'}));
