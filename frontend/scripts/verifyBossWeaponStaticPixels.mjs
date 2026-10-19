// Exact native raster and actual-component lifecycle check. Not an iPhone test.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import Module from 'node:module';
import {build} from 'esbuild';
import {Host} from './canvasHookHost.mjs';
import {createSectorBoss} from '../src/pages/sectorBoss.ts';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
const root=new URL('../',import.meta.url).pathname;
const base='f5e8a47';
// With intentionally enlarged turret artwork, compare both components using
// that same current renderer. Exact equality remains mandatory in either mode.
const currentArt=process.argv.includes('--current-art');
const candidateRef=process.env.CRYPTOID_BOSS_PIXEL_CANDIDATE_REF;
const old=path=>execFileSync('git',['show',`${base}:frontend/src/pages/${path}`],{cwd:root,encoding:'utf8'});
const candidate=path=>candidateRef?execFileSync('git',['show',`${candidateRef}:frontend/src/pages/${path}`],{cwd:root,encoding:'utf8'}):readFileSync(root+'src/pages/'+path,'utf8');
const surfaces=[];
function makeCanvas(){
 const canvas=createCanvas(1,1),events=new Map();
 canvas.counts={clears:0,draws:0,writes:0};canvas.requested={width:1,height:1};canvas.contextMissing=false;
 for(const key of ['width','height']){
  const d=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(canvas),key);
  Object.defineProperty(canvas,key,{get:()=>d.get.call(canvas),set(value){canvas.counts.writes++;canvas.requested[key]=value;d.set.call(canvas,value);}});
 }
 canvas.addEventListener=(name,fn)=>{if(!events.has(name))events.set(name,new Set());events.get(name).add(fn);};
 canvas.removeEventListener=(name,fn)=>events.get(name)?.delete(fn);
 canvas.emit=name=>{for(const fn of events.get(name)??[])fn();};
 canvas.listenerCount=()=>[...events.values()].reduce((n,s)=>n+s.size,0);
 const native=canvas.getContext('2d');
 const context=new Proxy(native,{get(target,key){
  if(key==='clearRect')return(...args)=>{canvas.counts.clears++;return target.clearRect(...args);};
  if(key==='drawImage')return(...args)=>{canvas.counts.draws++;return target.drawImage(...args);};
  const value=target[key];return typeof value==='function'?value.bind(target):value;
 },set(target,key,value){target[key]=value;return true;}});
 canvas.getContext=()=>canvas.contextMissing?null:context;
 surfaces.push(canvas);return canvas;
}
globalThis.document={createElement:makeCanvas};
class WeaponHost extends Host{
 ref(value){const i=this.index++;return this.slots[i]??(this.slots[i]={current:i===0&&value===null?this.canvas:value});}
 frame(boss,frozen=false){this.props={boss,frozen};this.dirty=true;this.render();this.passive();}
}
async function compile(baseline){
 const source=baseline?old('BossWeaponsView.tsx'):candidate('BossWeaponsView.tsx');
 const result=await build({absWorkingDir:root,stdin:{contents:source,resolveDir:root+'src/pages',loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',plugins:[{name:'native-weapons-host',setup(b){
  b.onResolve({filter:/^react(?:\/jsx-runtime)?$/},a=>({path:a.path,namespace:'hooks'}));
  b.onLoad({filter:/.*/,namespace:'hooks'},a=>({loader:'js',contents:a.path.endsWith('jsx-runtime')?
   'export const Fragment="fragment";export const jsx=(type,props)=>({type,props});export const jsxs=jsx;':
   'export const memo=fn=>fn;export const useState=(...a)=>globalThis.__hookHost.state(...a);export const useRef=(...a)=>globalThis.__hookHost.ref(...a);export const useEffect=(...a)=>globalThis.__hookHost.effect(false,...a);export const useLayoutEffect=(...a)=>globalThis.__hookHost.effect(true,...a);'}));
  b.onResolve({filter:/\/bossWeaponTextures$/},()=>({path:'texture',namespace:'stub'}));
  b.onResolve({filter:/\/bossResourceDiagnostics$/},()=>({path:'diagnostics',namespace:'stub'}));
  b.onLoad({filter:/.*/,namespace:'stub'},a=>({loader:'js',contents:a.path==='texture'?'export const preloadBossWeapons=()=>Promise.resolve(globalThis.__bossImage);':'export const reportBossResource=()=>{};'}));
  if(baseline||candidateRef)b.onLoad({filter:/\/bossWeaponRenderer\.ts$/},()=>({loader:'ts',contents:baseline&&!currentArt?old('bossWeaponRenderer.ts'):candidate('bossWeaponRenderer.ts')}));
 }}]});
 const mod=new Module(import.meta.filename);mod.paths=Module._nodeModulePaths(import.meta.dirname);mod._compile(result.outputFiles[0].text,import.meta.filename);return mod.exports.default;
}
const before=await compile(true),after=await compile(false);
async function mount(component,boss){
 const canvas=makeCanvas(),host=new WeaponHost(component,{boss},canvas);
 host.render();host.passive();await Promise.resolve();host.render();host.passive();return host;
}
function pixels(host){const c=host.canvas;return Buffer.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data);}
let compared=0;const drawCounts=[];
for(const dpr of [1,1.5,2,2.625,3])for(let id=1;id<=50;id++){
 globalThis.window={devicePixelRatio:dpr};
 let boss=createSectorBoss(id*10,430,90,825);boss.elapsed=5000;boss.weaponClock=5000;
 globalThis.__bossImage=await loadImage(root+'public'+boss.config.weaponImage);
 const start=surfaces.length,a=await mount(before,boss),b=await mount(after,boss);
 const check=(label,frozen=false)=>{
  boss={...boss}; // GamePage supplies a new boss snapshot on scene commits.
  a.frame(boss,frozen);b.frame(boss,frozen);
  assert.deepEqual([a.canvas.width,a.canvas.height],[b.canvas.width,b.canvas.height]);
  const expected=pixels(a),actual=pixels(b);if(!expected.equals(actual)){let changed=0,max=0;for(let i=0;i<expected.length;i++)if(expected[i]!==actual[i]){changed++;max=Math.max(max,Math.abs(expected[i]-actual[i]));}console.error({id,dpr,label,changed,max,before:a.canvas.counts,after:b.canvas.counts});}assert.ok(expected.equals(actual),`exact RGBA boss ${id}, DPR ${dpr}, ${label}`);compared++;
 };
 check('live');
 boss={...boss,weaponClock:5020,turrets:boss.turrets.map((g,i)=>({...g,a:g.a+.13*i,health:g.health*.57,lastFired:5000,firedBarrels:[0]}))};check('heat recoil and flash');
 boss={...boss,turrets:boss.turrets.map((g,i)=>({...g,health:i?g.health:0}))};check('one destroyed');
 boss={...boss,turrets:boss.turrets.map(g=>({...g,health:0}))};check('last turret destroyed');
 const counts={...b.canvas.counts};
 for(let frame=0;frame<(id===2?2000:8);frame++){
  boss={...boss,x:boss.x+.001,y:boss.y+.001,weaponClock:boss.weaponClock+17};a.frame(boss);b.frame(boss);
 }
 assert.deepEqual(b.canvas.counts,counts,'no clears, draws or dimension assignments during static reactor phase');
 if(id===2)drawCounts.push({dpr,frames:2000,baselineClears:a.canvas.counts.clears,candidateClears:b.canvas.counts.clears});
 check('later reactor frames');check('frozen falling hull',true);
 boss={...boss,width:boss.width+.01,height:boss.height+.005};check('fractional logical resize');
 boss={...boss,width:boss.width*.91,height:boss.height*.91};check('surface resize');
 // A browser clears its visible canvas on context loss. Cached static pixels
 // must be invalidated even when pixel dimensions have not changed.
 const restoredPixels=pixels(b);
 for(const h of [a,b]){h.canvas.width=h.canvas.width;h.canvas.emit('contextlost');h.canvas.emit('contextrestored');}
 b.render();b.passive();
 assert.ok(pixels(b).equals(restoredPixels),'context restoration redraws even while boss props remain unchanged');
 check('context restored');
 boss={...boss,turrets:boss.turrets.map((g,i)=>({...g,health:i?0:g.maxHealth}))};check('live turret restored');
 boss={...boss,turrets:boss.turrets.map(g=>({...g,health:0}))};
 b.canvas.contextMissing=true;b.canvas.emit('contextlost');b.frame(boss);
 b.canvas.contextMissing=false;b.canvas.emit('contextrestored');check('null context retries');
 // A new config object/image must force a redraw, even with identical pixels.
 boss={...boss,config:{...boss.config}};check('new config identity');
 a.unmount();b.unmount();
 // napi-rs substitutes a default dimension for zero; check the actual browser
 // release assignments rather than interpreting that native-library fallback.
 for(const c of surfaces.slice(start))assert.deepEqual(c.requested,{width:0,height:0},'all visible/base/heat surfaces receive release assignments');
 assert.equal(b.canvas.listenerCount(),0,'context listeners removed');
 surfaces.length=start;globalThis.__bossImage=null;globalThis.gc?.();
}
console.log(JSON.stringify({passed:true,baselineComponent:base,artwork:currentArt?'same current renderer in both components':'baseline and candidate renderers',candidateRef:candidateRef??'working tree',exactPixelComparisons:compared,drawCounts,checks:['all 50 bosses, five DPRs','live, heat, flash, last turret and reactor phase','parent movement, frozen hull, logical/pixel resize','context loss, restoration, null-context retry, config identity','all canvas surfaces and context listeners released'],limits:'Native raster and actual hook component host; no physical iPhone/WebKit memory or crash verification.'}));
