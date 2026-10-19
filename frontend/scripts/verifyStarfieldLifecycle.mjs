// Run the actual background components with controlled browser lifecycle APIs.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Module from 'node:module';
import {build} from 'esbuild';
import {Host} from './canvasHookHost.mjs';
const root=new URL('../',import.meta.url).pathname;
const timers=new Map(),listeners=new Map(),observers=new Set();let serial=0,reduced=false;
const add=(type,fn)=>{if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);};
const remove=(type,fn)=>listeners.get(type)?.delete(fn);
const dispatch=type=>{for(const fn of listeners.get(type)??[])fn();};
globalThis.document={hidden:false,documentElement:{dataset:{}},addEventListener:add,removeEventListener:remove};
globalThis.window={setTimeout(fn){timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id),matchMedia:()=>({get matches(){return reduced;},addEventListener:(name,fn)=>add('motion:'+name,fn),removeEventListener:(name,fn)=>remove('motion:'+name,fn)})};
globalThis.MutationObserver=class{constructor(fn){this.fn=fn;}observe(){observers.add(this);}disconnect(){observers.delete(this);}};
const source=readFileSync(root+'src/pages/Starfield.tsx','utf8');
const result=await build({absWorkingDir:root,stdin:{contents:source+'\nexport {StarFlare};',resolveDir:root+'src/pages',loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',plugins:[{name:'starfield-hooks',setup(b){
 b.onResolve({filter:/^react(?:\/jsx-runtime)?$/},a=>({path:a.path,namespace:'hooks'}));
 b.onLoad({filter:/.*/,namespace:'hooks'},a=>({loader:'js',contents:a.path.endsWith('jsx-runtime')?'export const jsx=(type,props)=>({type,props});export const jsxs=jsx;export const Fragment="fragment";':'export const memo=(fn,compare)=>{fn.compare=compare;return fn;};export const useMemo=(...a)=>globalThis.__hookHost.memo(...a);export const useState=(...a)=>globalThis.__hookHost.state(...a);export const useEffect=(...a)=>globalThis.__hookHost.effect(false,...a);'}));
}}]});
const mod=new Module(import.meta.filename);mod.paths=Module._nodeModulePaths(import.meta.dirname);mod._compile(result.outputFiles[0].text,import.meta.filename);
const {default:Starfield,StarFlare}=mod.exports;
const elements=value=>!value?[]:Array.isArray(value)?value.flatMap(elements):typeof value==='object'?[value,...elements(value.props?.children)]:[];
for(let sector=1;sector<=50;sector++){
 const props={sector,player:{x:.5,y:.8},paused:false};
 const view=new Host(Starfield,{...props,ambientEvents:false}),quiet=elements(view.render());
 assert.equal(quiet.filter(e=>e.type===StarFlare).length,0,'disabled flare is unmounted, not merely invisible');
 assert.equal(quiet.filter(e=>e.props?.className?.includes('shooting-star')).length,0);
 assert.equal(timers.size,0);
 view.props=props;view.dirty=true;
 const original=elements(view.render()),flareElement=original.find(e=>e.type===StarFlare);
 assert.ok(flareElement);assert.equal(original.filter(e=>e.props?.className==='shooting-star shooting-star-one').length,1);
 assert.equal(Starfield.compare(props,{...props,ambientEvents:false}),false,'memo notices the comparison switch');
 const flare=new Host(StarFlare,flareElement.props);flare.render();flare.passive();
 for(let cycle=0;cycle<40;cycle++){
  assert.equal(timers.size,1,'one outstanding timer, across all flare generations');
  const [id,fn]=timers.entries().next().value;timers.delete(id);fn();flare.render();flare.passive();
  assert.ok(elements(flare.output).length<=1,'at most one flare node');
 }
 document.hidden=true;dispatch('visibilitychange');flare.render();assert.equal(timers.size,0);
 document.hidden=false;dispatch('visibilitychange');flare.render();assert.equal(timers.size,1);
 reduced=true;dispatch('motion:change');flare.render();assert.equal(timers.size,0);
 reduced=false;dispatch('motion:change');flare.render();assert.equal(timers.size,1);
 document.documentElement.dataset.motion='reduced';for(const observer of observers)observer.fn();flare.render();assert.equal(timers.size,0);
 delete document.documentElement.dataset.motion;
 flare.unmount();view.unmount();assert.equal(timers.size,0);assert.equal(observers.size,0);assert.equal([...listeners.values()].reduce((n,s)=>n+s.size,0),0);
 const paused=new Host(Starfield,{...props,paused:true});assert.equal(elements(paused.render()).some(e=>e.type===StarFlare),false);paused.unmount();
}
console.log(JSON.stringify({passed:true,sectors:50,flareCallbacks:2000,checks:['quiet mode creates neither flare nor meteor','one flare/timer bound','hidden/reduced motion stops timer','pause removes flare','memo switch invalidates','all listeners/observers/timers cleaned on unmount'],limits:'Controlled component lifecycle host, not WebKit GPU/process measurement.'}));
