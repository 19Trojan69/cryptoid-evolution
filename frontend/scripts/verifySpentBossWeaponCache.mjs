// Actual component/renderer against the exact official baseline. Native CPU
// raster and controlled hooks, not browser/GPU memory or iPhone thermal proof.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {Host} from './canvasHookHost.mjs';

const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
const root=new URL('../',import.meta.url).pathname,base='171cb5c4507a1530a9bbb080d61805be0da545f7';
const old=file=>execFileSync('git',['show',`${base}:frontend/src/pages/${file}`],{cwd:root,encoding:'utf8'});
const renderer=fs.readFileSync(root+'src/pages/bossWeaponRenderer.ts','utf8');
assert.equal(renderer.slice(renderer.indexOf('export const drawBossWeapons=')),old('bossWeaponRenderer.ts').slice(old('bossWeaponRenderer.ts').indexOf('export const drawBossWeapons=')),'actual drawing function unchanged');
const hooks={ref:(...a)=>globalThis.__hookHost.ref(...a),state:(...a)=>globalThis.__hookHost.state(...a),
 effect:(...a)=>globalThis.__hookHost.effect(false,...a),layout:(...a)=>globalThis.__hookHost.effect(true,...a)};
async function runtime(before){
 const bundle=await build({absWorkingDir:root,stdin:{contents:"export {default} from './src/pages/BossWeaponsView';export {createSectorBoss} from './src/pages/sectorBoss';export {retainOwnerResourceTiming} from './src/pages/performanceDiagnostics';export {renderWorkStats} from './src/pages/renderWork';",resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',logLevel:'silent',plugins:[{name:'actual-components',setup(b){
  if(before)b.onLoad({filter:/\/(BossWeaponsView\.tsx|bossWeaponRenderer\.ts)$/},a=>({loader:a.path.endsWith('tsx')?'tsx':'ts',contents:old(a.path.split('/').at(-1))}));
  b.onResolve({filter:/^react(?:\/jsx-runtime)?$/},a=>({path:a.path,namespace:'hooks'}));
  b.onLoad({filter:/.*/,namespace:'hooks'},a=>({loader:'js',contents:a.path.endsWith('jsx-runtime')?'export const Fragment="fragment";export const jsx=(type,props)=>({type,props});export const jsxs=jsx;':'export const memo=fn=>fn;export const useRef=(...a)=>globalThis.__hooks.ref(...a);export const useState=(...a)=>globalThis.__hooks.state(...a);export const useEffect=(...a)=>globalThis.__hooks.effect(...a);export const useLayoutEffect=(...a)=>globalThis.__hooks.layout(...a);'}));
  b.onResolve({filter:/\/bossWeaponTextures$/},()=>({path:'texture',namespace:'texture'}));
  b.onLoad({filter:/.*/,namespace:'texture'},()=>({loader:'js',contents:'export const preloadBossWeapons=()=>Promise.resolve(globalThis.__texture);'}));
 }}]});
 const owned=[];
 const make=()=>{
  const native=createCanvas(1,1),ctx=native.getContext('2d'),listeners=new Map();let width=1,height=1;
  const c={native,listeners,get width(){return width;},set width(v){width=v;native.width=Math.max(1,v);},get height(){return height;},set height(v){height=v;native.height=Math.max(1,v);},
   addEventListener:(k,fn)=>listeners.set(k,fn),removeEventListener:k=>listeners.delete(k),pixels:()=>Buffer.from(ctx.getImageData(0,0,width,height).data)};
  const proxy=new Proxy(ctx,{get(t,k){if(k==='drawImage')return(image,...a)=>{assert.ok(image.width===undefined||image.width*image.height>0,'no draw from released source');return t.drawImage(image.native??image,...a);};const v=t[k];return typeof v==='function'?v.bind(t):v;},set(t,k,v){t[k]=v;return true;}});
  c.getContext=()=>c.denyContext?null:proxy;owned.push(c);return c;
 };
 let clock=100;const scope={__hooks:hooks,__texture:null,module:{exports:{}},exports:{},performance:{now:()=>clock+=.01},window:{devicePixelRatio:1},document:{createElement:make}};scope.exports=scope.module.exports;
 vm.runInNewContext(bundle.outputFiles[0].text,scope);
 return {scope,api:scope.module.exports,make,owned};
}
const before=await runtime(true),after=await runtime(false);
const release=after.api.retainOwnerResourceTiming(Infinity);
let comparisons=0,cases=0;const retained=[];
const mount=async(h,boss)=>{const view=new Host(h.api.default,{boss},h.make());view.render();view.passive();await new Promise(r=>setImmediate(r));view.render();return view;};
const update=(view,boss,frozen=false)=>{view.props={boss,frozen};view.dirty=true;view.render();};
const bytes=h=>h.owned.slice(1).reduce((n,c)=>n+c.width*c.height*4,0);
for(let id=1;id<=50;id++){
 const original=after.api.createSectorBoss(id*10,430,96,825);
 const atlas=await loadImage(fs.readFileSync(root+'public'+original.config.weaponImage));
 for(const width of [320,430,820])for(const dpr of [1,3]){
  before.scope.__texture=after.scope.__texture=atlas;before.scope.window.devicePixelRatio=after.scope.window.devicePixelRatio=dpr;
  const boss=after.api.createSectorBoss(id*10,width,96,825);
  const a=await mount(before,boss),b=await mount(after,boss);
  const compare=label=>{assert.equal(b.canvas.width,a.canvas.width);assert.equal(b.canvas.height,a.canvas.height);assert.ok(b.canvas.pixels().equals(a.canvas.pixels()),`${id}/${width}/${dpr}/${label}`);comparisons++;};
  compare('live');
  const hot={...boss,weaponClock:10050,turrets:boss.turrets.map((t,i)=>({...t,a:.2+i*.1,health:t.maxHealth*.4,lastFired:10000,firedBarrels:[0]}))};
  update(a,hot);update(b,hot);compare('hot');assert.equal(bytes(after),bytes(before));
  const partial={...hot,turrets:hot.turrets.map((t,i)=>({...t,health:i? t.health:0}))};
  update(a,partial);update(b,partial);compare('partial');assert.equal(bytes(after),bytes(before),'live source ownership unchanged');
  const dead={...hot,turrets:hot.turrets.map(t=>({...t,health:0}))};
  a.canvas.denyContext=b.canvas.denyContext=true;
  update(a,dead);update(b,dead);compare('failed final draw retains previous pixels');
  assert.equal(bytes(after),bytes(before),'sources must survive an unsuccessful final draw');
  a.canvas.denyContext=b.canvas.denyContext=false;
  update(a,{...dead});update(b,{...dead});
  compare('all destroyed');
  const baselineBytes=bytes(before);assert.equal(baselineBytes,a.canvas.width*a.canvas.height*4,'official retains one copied socket source');assert.equal(bytes(after),0,'candidate releases all offscreen sources');
  retained.push({boss:id,width,dpr,baselineBytes,candidateBytes:0});
  const paints=after.api.renderWorkStats().bossPaints,allocations=after.owned.length;
  for(let frame=0;frame<30;frame++){const next={...dead,x:dead.x+frame*.1,weaponClock:11000+frame*33};update(a,next);update(b,next);}
  compare('idle copied pixels');assert.equal(after.api.renderWorkStats().bossPaints,paints);assert.equal(after.owned.length,allocations,'no repeated allocation while dead');
  update(a,{...dead},true);update(b,{...dead},true);compare('fall retains pixels');assert.equal(after.api.renderWorkStats().bossPaints,paints);
  const resized={...dead,width:dead.width*.873,height:dead.height*.873};
  update(a,resized);update(b,resized);compare('resize rebuild');assert.equal(bytes(after),0);
  a.canvas.listeners.get('contextlost')();b.canvas.listeners.get('contextlost')();
  a.canvas.listeners.get('contextrestored')();b.canvas.listeners.get('contextrestored')();
  update(a,{...resized});update(b,{...resized});compare('context recovery rebuild');assert.equal(bytes(after),0);
  const restored={...hot,width:resized.width,height:resized.height};
  update(a,restored);update(b,restored);compare('restored live guns');assert.ok(bytes(after)>0,'restored live turrets regain required sources');
  const restoredDead={...restored,turrets:restored.turrets.map(t=>({...t,health:0}))};
  update(a,restoredDead);update(b,restoredDead);compare('destroy again');assert.equal(bytes(after),0);
  a.unmount();b.unmount();assert.equal(a.canvas.listeners.size+b.canvas.listeners.size,0);
  assert.ok([...before.owned,...after.owned].every(c=>c.width*c.height===0),'all ownership ends on unmount');before.owned.length=after.owned.length=0;cases++;
 }
}
release();
const report={passed:true,baseline:base,bosses:50,widths:[320,430,820],devicePixelRatios:[1,3],renderDensityCap:1.5,cases,exactPixelComparisons:comparisons,
 boss2Phone:retained.find(r=>r.boss===2&&r.width===430&&r.dpr===3),retiredSourceByteRange:[Math.min(...retained.map(r=>r.baselineBytes)),Math.max(...retained.map(r=>r.baselineBytes))],
 checks:['identical renderer drawing source','live and partial source ownership unchanged','zero offscreen backing dimensions after last turret','no blank repeated draws/allocations during open core','exact copied pixels through fall','resize/context recovery/live restoration rebuild on demand','complete unmount release'],
 limits:'Native CPU raster with actual component/renderer and controlled hook/API lifecycle. Nominal width*height*4 accounting is not measured WebKit/GPU/process memory or proof of iPhone heat, FPS or interruption improvement.'};
fs.writeFileSync(root+'../docs/spent-boss-weapon-cache-20261021/native-raster.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
