// Native raster comparison of the actual component before/after surface reuse.
// Uses the runtime QA canvas only, not an app dependency or a WebKit substitute.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {deflateSync,inflateSync} from 'node:zlib';
import {createRequire} from 'node:module';
import Module from 'node:module';
import {build} from 'esbuild';
import {Host} from './canvasHookHost.mjs';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
const root=new URL('../',import.meta.url).pathname;
const base=process.env.CRYPTOID_CANVAS_PIXEL_BASE||'f24ca60cb87d9442edf683f04b34b73670b56f45';
const hull='/ships/evolution/ship_01_stage_1.png';
const sourceAt=ref=>ref?execFileSync('git',['show',`${ref}:frontend/src/pages/CanvasEffects.tsx`],{cwd:root,encoding:'utf8'}):readFileSync(root+'src/pages/CanvasEffects.tsx','utf8');
const beforeSource=sourceAt(base),afterSource=sourceAt(process.env.CRYPTOID_CANVAS_PIXEL_CANDIDATE_REF);
const drawing=source=>source.slice(source.indexOf('export function drawImpact('),source.indexOf('\nconst records='));
assert.equal(drawing(afterSource),drawing(beforeSource),'artwork drawing code is byte-for-byte unchanged');
const frames=new Map(),timers=new Map();let serial=0,clock=100;
const dimensionWrites=new WeakMap();
globalThis.performance={now:()=>clock};
globalThis.requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
globalThis.Image=class{
  native=null;onload=null;onerror=null;url='';
  get naturalWidth(){return this.native?.width??0;}
  get naturalHeight(){return this.native?.height??0;}
  get src(){return this.url;}
  set src(url){this.url=url;void(async()=>{
    const data=url.startsWith('blob:')?Buffer.from(await(await fetch(url)).arrayBuffer()):readFileSync(root+'public'+url);
    this.native=await loadImage(data);this.onload?.();
  })().catch(error=>this.onerror?.(error));}
};
const makeCanvas=()=>{
  const canvas=createCanvas(1,1);canvas.style={};
  dimensionWrites.set(canvas,0);
  for(const key of ['width','height']){
    const descriptor=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(canvas),key);
    Object.defineProperty(canvas,key,{get:()=>descriptor.get.call(canvas),set(value){dimensionWrites.set(canvas,dimensionWrites.get(canvas)+1);descriptor.set.call(canvas,value);}});
  }
  canvas.parentElement={clientWidth:430,clientHeight:825,closest:()=>({getAttribute:()=> 'false'})};
  canvas.addEventListener=canvas.removeEventListener=()=>{};
  const nativeContext=canvas.getContext('2d');
  const context=new Proxy(nativeContext,{get(target,key){
    if(key==='drawImage')return(image,...args)=>target.drawImage(image.native??image,...args);
    const value=target[key];return typeof value==='function'?value.bind(target):value;
  },set(target,key,value){target[key]=value;return true;}});
  canvas.getContext=()=>context;return canvas;
};
globalThis.document={createElement:makeCanvas};
async function compile(source){
  const bundle=await build({absWorkingDir:root,stdin:{contents:source,resolveDir:root+'/src/pages',loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',plugins:[{name:'native-component-host',setup(b){
    b.onResolve({filter:/^react(?:\/jsx-runtime)?$/},a=>({path:a.path,namespace:'hooks'}));
    b.onLoad({filter:/.*/,namespace:'hooks'},a=>({loader:'js',contents:a.path.endsWith('jsx-runtime')?
      'export const Fragment="fragment";export const jsx=(type,props)=>({type,props});export const jsxs=jsx;':
      'export const createContext=value=>({value,Provider:"provider"});export const useContext=context=>globalThis.__availability??context.value;export const useState=(...a)=>globalThis.__hookHost.state(...a);export const useRef=(...a)=>globalThis.__hookHost.ref(...a);export const useMemo=(...a)=>globalThis.__hookHost.memo(...a);export const useEffect=(...a)=>globalThis.__hookHost.effect(false,...a);export const useLayoutEffect=(...a)=>globalThis.__hookHost.effect(true,...a);export default {Children:{toArray:value=>value?Array.isArray(value)?value:[value]:[]}};'}));
    b.onResolve({filter:/\/paintedShip$/},()=>({path:'paint',namespace:'paint'}));
    b.onLoad({filter:/.*/,namespace:'paint'},()=>({loader:'js',contents:`export const usePaintedShipStyle=()=>({backgroundImage:"url(${hull})"});`}));
  }}]});
  const mod=new Module(import.meta.filename);mod.paths=Module._nodeModulePaths(import.meta.dirname);mod._compile(bundle.outputFiles[0].text,import.meta.filename);return mod.exports;
}
const baseline=await compile(beforeSource),candidate=await compile(afterSource);
const debris={props:{children:Array.from({length:4},(_,i)=>({props:{style:{
  clipPath:`polygon(${i%2*50}% ${Math.floor(i/2)*50}%, ${i%2*50+50}% ${Math.floor(i/2)*50}%, ${i%2*50+50}% ${Math.floor(i/2)*50+50}%, ${i%2*50}% ${Math.floor(i/2)*50+50}%)`,
  transformOrigin:`${i%2*50+25}% ${Math.floor(i/2)*50+25}%`,'--fragment-x':`${(i%2?1:-1)*85}px`,'--fragment-y':`${(i<2?-1:1)*95}px`,'--fragment-spin':`${(i%2?1:-1)*240}deg`,'--fragment-delay':`${i*7}ms`,
}}}))}};
async function capture(runtime,scale){
  frames.clear();timers.clear();
  globalThis.window={devicePixelRatio:scale,setTimeout(fn,delay){const id=++serial;timers.set(id,{fn,at:clock+delay});return id;},clearTimeout:id=>timers.delete(id)};
  const advance=ms=>{clock+=ms;for(const [id,timer] of [...timers])if(timer.at<=clock){timers.delete(id);timer.fn();}};
  await runtime.prepareCanvasImpactResources(hull,62.5);
  const surface=makeCanvas(),owner=new Host(runtime.CanvasEffectLayer,{enabled:true,children:null},surface);
  globalThis.__availability=owner.render().props.value;owner.passive();globalThis.__availability=owner.render().props.value;
  const pixels=[],field=createCanvas(Math.ceil(430*scale),Math.ceil(825*scale)),ctx=field.getContext('2d');
  const scenes=[
    [[215,240]],[[20,25]],[[410,800]],[[210,400]],[[25,790]],
    [[215,240]],[[215,240]],[[215.37,401.46]],
    [[20,25],[410,800]],[[410,25],[20,800]],[[215,240]],
  ];
  for(const [index,positions] of scenes.entries()){
    // Most bursts arrive before idle release; the last follows a real expiry.
    advance(index===scenes.length-1?2000:250);const start=clock;
    const views=positions.map(([x,y],i)=>new Host(runtime.CanvasImpact,{effect:{id:index*10+i+1,x,y,debrisSize:50,sprite:0,debrisColor:'steel'},debris,original:null}));
    for(const view of views){view.render();view.passive();}
    await new Promise(resolve=>setImmediate(resolve));for(const view of views)view.render();
    for(const age of [0,120,500,1000,1600]){
      clock=start+age;
      for(const [id,fn] of [...frames]){frames.delete(id);fn(clock);}
      ctx.clearRect(0,0,field.width,field.height);
      ctx.drawImage(surface,parseFloat(surface.style.left)*scale,parseFloat(surface.style.top)*scale,parseFloat(surface.style.width)*scale,parseFloat(surface.style.height)*scale);
      // Lossless compression keeps the QA footprint small at the original DPR.
      pixels.push(deflateSync(ctx.getImageData(0,0,field.width,field.height).data));
    }
    for(const view of views)view.unmount();
    assert.ok(surface.getContext('2d').getImageData(0,0,surface.width,surface.height).data.every(channel=>channel===0),'retained idle surface is completely transparent');
  }
  owner.unmount();assert.equal(frames.size,0);assert.equal(timers.size,0);return {pixels,writes:dimensionWrites.get(surface)};
}
let compared=0;const surfaceDimensionWrites=[];
for(const scale of [1,1.5,2,2.625,3]){
  const control=await capture(baseline,scale),reused=await capture(candidate,scale),before=control.pixels,after=reused.pixels;
  surfaceDimensionWrites.push({scale,baseline:control.writes,candidate:reused.writes});
  if(base==='51e59c3373a8dd4ba4985d5a9559acdcf2d6755a'||process.env.CRYPTOID_CANVAS_PIXEL_SAME_SURFACE_LIFETIME==='1')
    assert.equal(reused.writes,control.writes,'the official surface lifetime and dimension assignments are preserved');
  else assert.ok(reused.writes<control.writes,'the preserved raster fixture also avoids redundant surface dimension assignments');
  for(let i=0;i<before.length;i++){
    const expected=inflateSync(before[i]),actual=inflateSync(after[i]);
    if(!expected.equals(actual)){
      let changed=0,maxDelta=0,totalDelta=0;
      for(let p=0;p<expected.length;p++)if(expected[p]!==actual[p]){changed++;const delta=Math.abs(expected[p]-actual[p]);maxDelta=Math.max(maxDelta,delta);totalDelta+=delta;}
      console.log(JSON.stringify({scale,scene:i,changedChannels:changed,maxDelta,totalDelta}));
    }
    assert.ok(expected.equals(actual),`exact RGBA equality at DPR ${scale}, scene ${i}`);compared++;
  }
}
console.log(JSON.stringify({passed:true,baseline:base,exactPixelComparisons:compared,surfaceDimensionWrites,checks:['unchanged drawImpact source','real hull, fire, smoke and four fragments','centre, edges, fractional positions and concurrent impacts','retained idle surfaces are completely transparent','reused surfaces and idle-release expiry','five animation ages at DPR 1, 1.5, 2, 2.625 and 3','timers/frames released on unmount'],limits:'Native raster/hook host, not Safari/Pi Browser, iPhone GPU, physical memory or a whitescreen reproduction.'}));
