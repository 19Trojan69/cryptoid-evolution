// Actual effect module under controlled RAF clocks; no browser/GPU/thermal claim.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import Module from 'node:module';
import {build} from 'esbuild';
import {Host} from './canvasHookHost.mjs';

const root=new URL('../',import.meta.url).pathname;
const baseline=process.env.CRYPTOID_CANVAS_CADENCE_BASE||'171cb5c4507a1530a9bbb080d61805be0da545f7';
const originalBefore=execFileSync('git',['show',`${baseline}:frontend/src/pages/CanvasEffects.tsx`],{cwd:root,encoding:'utf8'});
const before=process.env.CRYPTOID_CANVAS_CADENCE_NORMAL_SCALE==='1'
  ?originalBefore.replace('const dpr=()=>window.devicePixelRatio||1;','const dpr=()=>Math.min(1.5,window.devicePixelRatio||1);'):originalBefore;
const after=readFileSync(root+'src/pages/CanvasEffects.tsx','utf8');
const drawing=source=>source.slice(source.indexOf('export function drawImpact('),source.indexOf('\nconst records='));
assert.equal(drawing(after),drawing(before),'drawing, artwork and animation interpolation stay unchanged');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function compile(source){
  const bundle=await build({absWorkingDir:root,stdin:{contents:source,resolveDir:root+'src/pages',loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'cadence-host',setup(b){
    b.onResolve({filter:/^react(?:\/jsx-runtime)?$/},a=>({path:a.path,namespace:'hooks'}));
    b.onLoad({filter:/.*/,namespace:'hooks'},a=>({loader:'js',contents:a.path.endsWith('jsx-runtime')?
      'export const Fragment="fragment";export const jsx=(type,props)=>({type,props});export const jsxs=jsx;':
      'export const createContext=value=>({value,Provider:"provider"});export const useContext=context=>globalThis.__availability??context.value;export const useState=(...a)=>globalThis.__hookHost.state(...a);export const useRef=(...a)=>globalThis.__hookHost.ref(...a);export const useMemo=(...a)=>globalThis.__hookHost.memo(...a);export const useEffect=(...a)=>globalThis.__hookHost.effect(false,...a);export const useLayoutEffect=(...a)=>globalThis.__hookHost.effect(true,...a);export default {Children:{toArray:value=>value?Array.isArray(value)?value:[value]:[]}};'}));
    b.onResolve({filter:/\/paintedShip$/},()=>({path:'hull',namespace:'paint'}));
    b.onLoad({filter:/.*/,namespace:'paint'},()=>({loader:'js',contents:'export const usePaintedShipStyle=()=>({backgroundImage:"url(blob:hull)"});'}));
  }}]});
  const mod=new Module(import.meta.filename);mod.paths=Module._nodeModulePaths(import.meta.dirname);mod._compile(bundle.outputFiles[0].text,import.meta.filename);return mod.exports;
}
const original={type:'original'};
const debris={props:{children:[{props:{style:{clipPath:'polygon(0% 0%,100% 0%,100% 100%,0% 100%)',transformOrigin:'50% 50%','--fragment-x':'-70px','--fragment-y':'80px','--fragment-spin':'120deg','--fragment-delay':'0ms'}}}]}};
async function host(source){
  const runtime=await compile(source),frames=new Map(),timers=new Map(),images=[];
  let clock=100,paused=false,serial=0;
  const normalize=value=>value?.canvas?['texture',value.width,value.height]:value?.hull?['hull',value.naturalWidth,value.naturalHeight]:value;
  const makeCanvas=()=>{
    const commands=[],listeners=new Map();
    const ctx=new Proxy({}, {get:(_target,key)=>(...args)=>commands.push([key,...args.map(normalize)]),set:(_target,key,value)=>{commands.push(['set',key,value]);return true;}});
    return {canvas:true,width:0,height:0,style:{},commands,listeners,context:ctx,
      parentElement:{clientWidth:430,clientHeight:825,closest:()=>({getAttribute:()=>String(paused)})},
      getContext(){return this.context;},addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
  };
  globalThis.performance={now:()=>clock};
  globalThis.window={devicePixelRatio:3,setTimeout(fn,delay){const id=++serial;timers.set(id,{fn,at:clock+delay});return id;},clearTimeout:id=>timers.delete(id)};
  globalThis.document={createElement:makeCanvas};
  globalThis.Image=class{hull=true;naturalWidth=282;naturalHeight=282;constructor(){images.push(this);}};
  globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  globalThis.requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;};
  globalThis.cancelAnimationFrame=id=>frames.delete(id);
  const prep=runtime.prepareCanvasImpactResources('blob:hull',62.5);
  for(const image of images.splice(0))image.onload?.();await prep;
  const surface=makeCanvas(),owner=new Host(runtime.CanvasEffectLayer,{enabled:true,children:null},surface);
  globalThis.__availability=owner.render().props.value;owner.passive();globalThis.__availability=owner.render().props.value;
  const views=new Set();
  const mount=(id=1,fragmentDelay=0)=>{
    const effect={id,kind:'explosion',x:215,y:240,debrisSize:50,sprite:0,debrisColor:'steel'};
    const delayedDebris={...debris,props:{children:debris.props.children.map(piece=>({...piece,props:{style:{...piece.props.style,'--fragment-delay':`${fragmentDelay}ms`}}}))}};
    const view=new Host(runtime.CanvasImpact,{effect,debris:delayedDebris,original});view.render();views.add(view);return view;
  };
  const tick=at=>{
    clock=at;surface.commands.length=0;
    const before=runtime.canvasEffectResources().draws;
    for(const [id,fn] of [...frames]){frames.delete(id);fn(clock);}
    assert.ok(frames.size<=1,'the limiter never forks the RAF chain');
    const draws=runtime.canvasEffectResources().draws-before;
    return {draws,commands:draws?hash(surface.commands):null};
  };
  const unmount=view=>{view.unmount();views.delete(view);};
  const close=()=>{for(const view of views)view.unmount();owner.unmount();assert.equal(frames.size,0);assert.equal(timers.size,0);assert.equal(runtime.canvasEffectResources().registeredEffects,0);};
  return {runtime,surface,owner,mount,tick,unmount,close,frames,timers,setPaused:value=>{paused=value;},setClock:value=>{clock=value;}};
}
async function capture(source,times,{pauseAt=Infinity,resumeAt=Infinity,remount=false}={}){
  const h=await host(source);const view=h.mount();const frames=[];
  for(const at of times){
    h.setPaused(at>=pauseAt&&at<resumeAt);
    if(remount){view.props={...view.props,effect:{...view.props.effect}};view.dirty=true;view.render();}
    const result=h.tick(at);if(result.draws)frames.push({at,hash:result.commands});
  }
  h.close();return frames;
}
const matchFrames=(control,candidate)=>{
  const expected=new Map(control.map(frame=>[frame.at,frame.hash]));
  for(const frame of candidate)assert.equal(frame.hash,expected.get(frame.at),'each drawn frame retains the original wall-clock geometry and alpha');
};
const rates=[];
for(const hz of [30,59.94,60,90,120,144,240]){
  const times=Array.from({length:Math.ceil(hz*2)},(_,i)=>100+i*1000/hz).filter(t=>t<2100-0.001);
  const control=await capture(before,times),candidate=await capture(after,times);matchFrames(control,candidate);
  assert.equal(control.length,candidate.length,'visible drawing retains the current official frame cadence');
  assert.ok(candidate.length<=120,'at most 120 paint slots in two seconds');
  if(hz<=60)assert.equal(candidate.length,control.length,'ordinary 30/60 Hz drawing is retained');
  else assert.equal(candidate.length,120,'high-refresh drawing uses all 60 Hz paint slots');
  rates.push({rafHz:hz,seconds:2,before:control.length,after:candidate.length});
}
// Rounded/jittery browser timestamps must not accidentally halve ordinary 60 Hz.
const rounded=Array.from({length:120},(_,i)=>100+Math.round(i*1000/60));
const roundedControl=await capture(before,rounded),roundedCandidate=await capture(after,rounded);
matchFrames(roundedControl,roundedCandidate);assert.equal(roundedCandidate.length,120);
for(const quantize of [Math.floor,Math.ceil]){
  const times=Array.from({length:120},(_,i)=>100+quantize(i*1000/60));
  const control=await capture(before,times),candidate=await capture(after,times);
  matchFrames(control,candidate);assert.equal(candidate.length,120,'1 ms timestamp quantization retains 60 Hz');
}
const jitter=Array.from({length:120},(_,i)=>100+i*1000/60+Math.sin(i*1.7)*0.6);
const jitterControl=await capture(before,jitter),jitterCandidate=await capture(after,jitter);
matchFrames(jitterControl,jitterCandidate);assert.equal(jitterCandidate.length,120,'ordinary sub-millisecond RAF jitter retains 60 Hz');
const pauseTimes=Array.from({length:300},(_,i)=>100+i*1000/120);
const pause={pauseAt:600,resumeAt:1600};
const pauseControl=await capture(before,pauseTimes,pause),pauseCandidate=await capture(after,pauseTimes,pause);
matchFrames(pauseControl,pauseCandidate);
assert.ok(!pauseCandidate.some(frame=>frame.at>=600&&frame.at<1600));
assert.equal(pauseCandidate.find(frame=>frame.at>=1600).at,pauseTimes.find(at=>at>=1600),'resume paints on its first callback');
const churnTimes=Array.from({length:240},(_,i)=>100+i*1000/120);
const churnControl=await capture(before,churnTimes,{remount:true}),churnCandidate=await capture(after,churnTimes,{remount:true});
matchFrames(churnControl,churnCandidate);assert.equal(churnCandidate.length,120,'React effect re-registration cannot reset the paint budget');
const longGap=[100,108,117,125,2100,2108,2117];
const gapControl=await capture(before,longGap),gapCandidate=await capture(after,longGap);matchFrames(gapControl,gapCandidate);
assert.ok(gapCandidate.some(frame=>frame.at===2100),'a missed deadline draws the current age once, without replaying old frames');
const h=await host(after),view=h.mount();
h.tick(100);assert.equal(h.tick(108).draws,0);h.unmount(view);assert.equal(h.frames.size,0);
h.setClock(500);const next=h.mount(2);assert.equal(h.tick(500).draws,1,'a later burst paints immediately');
h.tick(508);h.surface.listeners.get('contextlost')();
assert.equal(h.frames.size,0);assert.equal(h.runtime.canvasEffectResources().cacheBytes,0);
h.unmount(next);h.close();
const remounted=await host(after);remounted.mount(3);assert.equal(remounted.tick(100).draws,1,'a new layer has no deadline from the old layer');remounted.close();
const sleeping=await host(after),spent=sleeping.mount(4);
assert.equal(sleeping.tick(100).draws,1);
assert.equal(sleeping.tick(2210).draws,1,'last visible fragments retain their original drawing');
sleeping.tick(2230);
assert.equal(sleeping.frames.size,0,'the frame chain sleeps after the last visible fragment');
assert.ok(sleeping.surface.commands.some(command=>command[0]==='clearRect'),'clear the final image before sleeping');
assert.equal(sleeping.runtime.canvasEffectResources().registeredEffects,1,'keep the existing owner lifetime and bounds');
const sleepingDimensions=[sleeping.surface.width,sleeping.surface.height];
sleeping.tick(2300);assert.equal(sleeping.surface.commands.length,0,'no blank redraw while an expired record is still mounted');
assert.deepEqual([sleeping.surface.width,sleeping.surface.height],sleepingDimensions);
const awakened=sleeping.mount(5);assert.equal(sleeping.tick(2300).draws,1,'a new burst wakes the existing frame chain');
sleeping.setPaused(true);sleeping.tick(2350);sleeping.tick(10000);assert.equal(sleeping.surface.commands.length,0);
sleeping.setPaused(false);assert.equal(sleeping.tick(10020).draws,1,'the awakened burst still respects pause time');
sleeping.unmount(spent);sleeping.unmount(awakened);sleeping.close();
const delayed=await host(after);delayed.mount(6,44);
assert.equal(delayed.tick(2260).draws,1,'a fragment with the maximum authored delay remains visible at age 2160 ms');
delayed.tick(2280);assert.equal(delayed.frames.size,0,'sleep only after the delayed final fragment ends');
assert.ok(delayed.surface.commands.some(command=>command[0]==='clearRect'));delayed.close();
console.log(JSON.stringify({passed:true,baseline,rates,rounded60Hz:{before:roundedControl.length,after:roundedCandidate.length},completedCanvasSleeps:true,checks:['identical drawing/interpolation source','current official frame cadence retained','30/59.94/60 Hz retained','90/120/144/240 Hz use 60 paint slots per second','rounded 60 Hz timestamps','wall-clock drawing commands at every selected frame','pause clock and first resume frame','React re-registration preserves paint budget','long gap skips catch-up drawing','idle cancels RAF; later burst draws immediately','context loss clears the scheduler/cache','unmount/remount resets deadline','last visible fragment is drawn and final image cleared once','expired mounted records do not keep a blank draw loop running','bounds and owner lifetime remain intact while sleeping','new bursts wake the same chain and retain pause handling'],limits:'Controlled callback clocks and drawing commands, not physical iPhone temperature, GPU load or proof of the Whitescreen cause.'},null,2));
