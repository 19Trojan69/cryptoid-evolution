// Official component vs candidate, native raster + existing hook host.
// This verifies pixels/lifecycle, never physical Safari/GPU performance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {Host} from './canvasHookHost.mjs';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=new URL('../',import.meta.url).pathname,official='51e59c3373a8dd4ba4985d5a9559acdcf2d6755a';
const beforeSource=execFileSync('git',['show',`${official}:frontend/src/pages/BossWeaponsView.tsx`],{cwd:root,encoding:'utf8'});
assert.equal(fs.readFileSync(root+'src/pages/bossWeaponRenderer.ts','utf8'),
  execFileSync('git',['show',`${official}:frontend/src/pages/bossWeaponRenderer.ts`],{cwd:root,encoding:'utf8'}));
const hooks={ref:(...a)=>globalThis.__hookHost.ref(...a),state:(...a)=>globalThis.__hookHost.state(...a),
  effect:(...a)=>globalThis.__hookHost.effect(false,...a),layout:(...a)=>globalThis.__hookHost.effect(true,...a)};
async function runtime(source){
  const bundle=await build({absWorkingDir:root,stdin:{contents:
    "export {default} from './src/pages/BossWeaponsView';export {createSectorBoss,moveSectorBoss} from './src/pages/sectorBoss';export {retainOwnerResourceTiming} from './src/pages/performanceDiagnostics';export {renderWorkStats} from './src/pages/renderWork';",
    resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',logLevel:'silent',plugins:[{name:'timing-boss-host',setup(b){
      b.onLoad({filter:/\/BossWeaponsView\.tsx$/},()=>({loader:'tsx',contents:source}));
      b.onResolve({filter:/^react(?:\/jsx-runtime)?$/},a=>({path:a.path,namespace:'hooks'}));
      b.onLoad({filter:/.*/,namespace:'hooks'},a=>({loader:'js',contents:a.path.endsWith('jsx-runtime')?
        'export const Fragment="fragment";export const jsx=(type,props)=>({type,props});export const jsxs=jsx;':
        'export const memo=fn=>fn;export const useRef=(...a)=>globalThis.__hooks.ref(...a);export const useState=(...a)=>globalThis.__hooks.state(...a);export const useEffect=(...a)=>globalThis.__hooks.effect(...a);export const useLayoutEffect=(...a)=>globalThis.__hooks.layout(...a);'}));
      b.onResolve({filter:/\/bossWeaponTextures$/},()=>({path:'texture',namespace:'texture'}));
      b.onLoad({filter:/.*/,namespace:'texture'},()=>({loader:'js',contents:'export const preloadBossWeapons=()=>Promise.resolve(globalThis.__texture);'}));
    }}]});
  const owned=[];let clock=1;
  const canvas=()=>{
    const c=createCanvas(1,1),ctx=c.getContext('2d');let width=1,height=1;
    const listeners=new Map();
    const element={get width(){return width;},set width(v){width=v;c.width=Math.max(1,v);},get height(){return height;},set height(v){height=v;c.height=Math.max(1,v);},
      getContext:()=>ctx,addEventListener:(k,fn)=>listeners.set(k,fn),removeEventListener:k=>listeners.delete(k),
      pixels:()=>Buffer.from(ctx.getImageData(0,0,width,height).data),listeners};
    const proxy=new Proxy(ctx,{get(target,key){if(key==='drawImage')return(image,...a)=>target.drawImage(image.__native??image,...a);
      const value=target[key];return typeof value==='function'?value.bind(target):value;},set(target,key,value){target[key]=value;return true;}});
    element.getContext=()=>proxy;element.__native=c;owned.push(element);return element;
  };
  const scope={__hooks:hooks,__texture:null,exports:{},module:{exports:{}},performance:{now:()=>clock+=0.01},window:{devicePixelRatio:1},document:{createElement:canvas}};
  scope.module.exports=scope.exports;vm.runInNewContext(bundle.outputFiles[0].text,scope);
  return {api:scope.module.exports,scope,canvas,owned};
}
const before=await runtime(beforeSource),after=await runtime(fs.readFileSync(root+'src/pages/BossWeaponsView.tsx','utf8'));
const release=after.api.retainOwnerResourceTiming(Infinity);
let comparisons=0,cases=0;
for(let id=1;id<=50;id++){
  const base=before.api.moveSectorBoss(before.api.createSectorBoss(id*10,430,96,825),10000,430,825);
  const atlas=await loadImage(fs.readFileSync(root+'public'+base.config.weaponImage));
  for(const dpr of [1,3]){
    before.scope.__texture=after.scope.__texture=atlas;before.scope.window.devicePixelRatio=after.scope.window.devicePixelRatio=dpr;
    const a=new Host(before.api.default,{boss:base},before.canvas()),b=new Host(after.api.default,{boss:base},after.canvas());
    a.render();b.render();a.passive();b.passive();await new Promise(resolve=>setImmediate(resolve));a.render();b.render();
    const compare=()=>{assert.equal(b.canvas.width,a.canvas.width);assert.equal(b.canvas.height,a.canvas.height);
      assert.ok(b.canvas.pixels().equals(a.canvas.pixels()),`exact boss RGBA ${id}/${dpr}/${comparisons}`);comparisons++;};
    compare();
    const hot={...base,weaponClock:10050,turrets:base.turrets.map((t,i)=>({...t,a:0.2+i*.1,health:t.maxHealth*.4,lastFired:10000,firedBarrels:[0]}))};
    for(const boss of [hot,{...hot,turrets:hot.turrets.map((t,i)=>({...t,health:i===0?0:t.health}))},
      {...hot,turrets:hot.turrets.map(t=>({...t,health:0}))}]){
      for(const h of [a,b]){h.props={boss};h.dirty=true;h.render();}compare();
    }
    const count=after.api.renderWorkStats().bossPaints;
    for(let frame=0;frame<10;frame++)for(const h of [a,b]){h.props={boss:{...h.props.boss,weaponClock:11000+frame*33}};h.dirty=true;h.render();}
    assert.equal(after.api.renderWorkStats().bossPaints,count,'destroyed guns keep their static pixels without drawing');compare();
    a.unmount();b.unmount();assert.equal(a.canvas.width,0);assert.equal(b.canvas.width,0);assert.equal(b.canvas.listeners.size,0);
    for(const c of [...before.owned,...after.owned])assert.equal(c.width*c.height,0);
    before.owned.length=after.owned.length=0;cases++;
  }
}
assert.equal(after.api.renderWorkStats().bossPaints,400);release();
console.log(JSON.stringify({passed:true,official,bosses:50,DPR:[1,3],cases,exactPixelComparisons:comparisons,
  measuredDrawCalls:after.api.renderWorkStats().bossPaints,limits:'Native Canvas and controlled hook host. No React scheduler, browser paint/GPU, iPhone FPS or native-memory measurement.'}));
