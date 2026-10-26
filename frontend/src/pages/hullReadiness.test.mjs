import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { hullSourcePlan, preparedHullPlan } from './hullSourcePlan.ts';
import { enemyAppearance } from './shipFleet.ts';
import { shipEvolutionAsset } from './shipEvolution.ts';
const {build,transformSync}=createRequire(import.meta.url)('esbuild');

async function fixture() {
  const built=await build({entryPoints:['src/pages/paintedShip.ts'],bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',plugins:[{name:'readiness-host',setup(b){
    b.onLoad({filter:/paintedShip\.ts$/},a=>({contents:fs.readFileSync(a.path,'utf8')+'\nexport {cache,visualCenters};',loader:'ts'}));
    b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'host'}));
    b.onLoad({filter:/.*/,namespace:'host'},()=>({contents:'export const useState=globalThis.__hooks.useState,useEffect=globalThis.__hooks.useEffect;',loader:'js'}));
  }}]});
  let state,updates=0;const effects=[],images=[];
  const hooks={useState(initial){if(state===undefined)state=typeof initial==='function'?initial():initial;return [state,value=>{state=value;updates++;}];},useEffect(fn){effects.push(fn);}};
  class Image {constructor(){images.push(this);}set src(value){this.url=value;}naturalWidth=2;naturalHeight=2;}
  const scope={__hooks:hooks,Image,console,Uint8ClampedArray,window:{localStorage:{getItem:()=>null},location:{hostname:'localhost'}},document:{createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(240*240*4)})})})},exports:{},module:{exports:{}}};
  scope.module.exports=scope.exports;vm.runInNewContext(built.outputFiles[0].text,scope);
  return {api:scope.module.exports,effects,images,updates:()=>updates,state:()=>state};
}

test('cold source never marks flames ready before its actual image finishes',async()=>{
  const f=await fixture(),url='/ships/evolution/ship_01_stage_1.png';
  assert.equal(f.api.useHullSourceReady(url),false);
  f.effects.pop()();assert.equal(f.images.length,1);assert.equal(f.updates(),0);
  f.images[0].onload();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.api.useHullSourceReady(url),true);assert.equal(f.images.length,1);
  assert.equal(f.api.useHullSourceReady('/ships/evolution/ship_02_stage_1.png'),false,'previous ship readiness cannot release new ship flames');
});

test('unmounted readiness consumer receives no late state update',async()=>{
  const f=await fixture();f.api.useHullSourceReady('/ship.png');
  const cleanup=f.effects.pop()();cleanup();f.images[0].onload();
  await new Promise(resolve=>setImmediate(resolve));assert.equal(f.updates(),0);
});
test('decoded prepared hull does not wait for an evicted raw source or hide its flames',async()=>{
  const f=await fixture();f.api.cache.set('0:1:gold','blob:already-decoded');
  assert.equal(f.api.usePreparedHullReady(0,'gold',1),true);
  f.effects.pop()();assert.equal(f.images.length,0,'prepared hull must not reload raw source to release flames');
});

test('source warming is deduplicated, capped at seven and does not wait or paint variants',async()=>{
  const f=await fixture(),urls=Array.from({length:20},(_,i)=>`/ship-${i}.png`);
  assert.equal(f.api.preloadHullSources([...urls,urls[0]]),undefined);
  assert.equal(f.images.length,7);f.api.preloadHullSources(urls);assert.equal(f.images.length,7);
  for(const image of f.images)image.onload();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.api.useHullSourceReady(urls[0]),true,'warmed source is ready on the first component render');
  assert.equal(f.api.paintedShipResourceStats().painted,0);
});

test('bounded source plan covers actual next normal group, bosses and bonuses',()=>{
  for(let sector=1;sector<=500;sector++)for(const encounter of ['normal','boss-intro','bonus']) {
    const urls=hullSourcePlan(sector,encounter,6,1);assert.ok(urls.length<=7);
    if(encounter==='normal')for(let index=0;index<6;index++)assert.ok(urls.includes(shipEvolutionAsset(enemyAppearance(sector,6+index).sprite,1)));
  }
});

test('flame guard is restricted to unloaded hull siblings, not ships or the field',()=>{
  const css=fs.readFileSync('src/pages/hullArrival.css','utf8');
  assert.ok(css.includes('.material-hull[data-hull-ready="false"] ~ .exhaust'));
  assert.ok(css.includes('.material-hull[data-hull-ready="false"] ~ .player-engine'));
  assert.ok(css.includes('.sector-boss[data-hull-ready="false"] > .boss-engine-flame'));
  assert.equal((css.match(/visibility: hidden/g)||[]).length,1);
  assert.ok(!css.includes('display:')&&!css.includes('animation:'));
});
test('full preparation covers current/next groups and post-boss bonus transition without campaign-wide loading',()=>{
  for(let sector=1;sector<=500;sector++) {
    for(const encounter of ['normal','boss-fight','bonus'])for(const group of [0,1]) {
      const plan=preparedHullPlan(sector,encounter,6,1,group,2);
      assert.ok(plan.length<=12);assert.ok(plan.every(hull=>Number.isInteger(hull.sprite)&&typeof hull.color==='string'));
      if(encounter==='normal')for(let index=0;index<6;index++) {
        const expected=enemyAppearance(sector,6+index);
        assert.ok(plan.some(hull=>hull.sprite===expected.sprite&&hull.color===expected.color));
      }
      if(encounter==='bonus'&&group===1&&sector<500) {
        const expected=enemyAppearance(sector+1,0);
        assert.ok(plan.some(hull=>hull.sprite===expected.sprite&&hull.color===expected.color));
      }
    }
  }
});


test('warm next-stage variants avoid six redundant original-image jobs at Continue',async()=>{
 const f=await fixture(),plan=preparedHullPlan(61,'normal',0,0,0,2),urls=hullSourcePlan(61,'normal',0,0);
 for(const h of plan.slice(0,6))f.api.cache.set(`${h.sprite}:${h.stage??1}:${h.color}`,'/already-loaded.png');
 f.api.preloadHullSources(urls,plan);assert.equal(f.images.length,0);
});

test('missing, wrong-color and wrong-stage variants retain the original fallback preloads',async()=>{
 const f=await fixture(),plan=preparedHullPlan(61,'normal',0,0,0,2),urls=hullSourcePlan(61,'normal',0,0),first=plan[0];
 f.api.cache.set(`${first.sprite}:2:${first.color}`,'/other-stage.png');
 f.api.cache.set(`${first.sprite}:1:gold`,'/other-color.png');
 f.api.preloadHullSources(urls,plan);assert.equal(f.images.length,urls.length);
});

test('mixed readiness skips only matching prepared sources and always retains the boss source',async()=>{
 const f=await fixture(),plan=preparedHullPlan(61,'normal',0,0,0,2),urls=hullSourcePlan(61,'normal',0,0);
 for(const h of plan.slice(0,3))f.api.cache.set(`${h.sprite}:1:${h.color}`,'/ready.png');
 f.api.preloadHullSources(['/boss.png',...urls],plan);assert.equal(f.images.length,4);
 assert.equal(f.images[0].url,'/boss.png');
});

test('one pending color sharing a raw source preserves the bounded fallback load',async()=>{
 const f=await fixture();f.api.cache.set('1:1:silver','/ready.png');
 f.api.preloadHullSources([shipEvolutionAsset(1,1)],[{sprite:1,color:'silver'},{sprite:1,color:'gold'}]);
 assert.equal(f.images.length,1);
});


test('the actual preparation hook shares its exact plan and acquires incoming pins before retiring old pins',async()=>{
 const source=fs.readFileSync('src/pages/usePreparedGameHulls.ts','utf8').replace(/^import.*;$/gm,'');
 const code=transformSync(source,{loader:'ts',format:'cjs'}).code;
 const effects=[],ref={current:null},calls=[];let warmed,retained;
 const env={module:{exports:{}},useRef:()=>ref,useEffect:fn=>effects.push(fn),sessionDiagnostic(){},hullPreparationStep(){},preparedHullPlan,hullSourcePlan,
  preloadHullSources(urls,plan){warmed=plan;calls.push('sources');assert.deepEqual(urls,hullSourcePlan(61,'normal',0,0));},
  retainPreparedHulls(plan){retained=plan;calls.push('acquire');return{settled:Promise.resolve([]),release(){calls.push('release');}};},
 };
 const run=new Function('env','with(env){'+code+';return module.exports.usePreparedGameHulls;}')(env);
 run(61,'normal',0,0,0,2);effects[0]();assert.strictEqual(warmed,retained);assert.deepEqual(retained,preparedHullPlan(61,'normal',0,0,0,2));
 effects[0]();assert.deepEqual(calls,['sources','acquire','sources','acquire','release']);
 effects[1]()();assert.equal(calls.at(-1),'release');await Promise.resolve();
});

test('known visual center survives raw-source cleanup and avoids a reload on player remount',async()=>{
 const f=await fixture(),url=shipEvolutionAsset(3,2);
 f.api.visualCenters.set(url,{x:1.25,y:-2.5});
 const style=f.api.useShipVisualOffset(3,2);f.effects.pop()();
 assert.equal(style['--ship-visual-offset-x'],'1.25%');
 assert.equal(style['--ship-visual-offset-y'],'-2.5%');
 assert.equal(f.images.length,0);assert.equal(f.updates(),0);
});

test('a center for another stage never suppresses the required source load',async()=>{
 const f=await fixture();f.api.visualCenters.set(shipEvolutionAsset(3,1),{x:7,y:8});
 const style=f.api.useShipVisualOffset(3,2);f.effects.pop()();
 assert.equal(style['--ship-visual-offset-x'],'0%');assert.equal(f.images.length,1);
 assert.equal(f.images[0].url,shipEvolutionAsset(3,2));
 f.images[0].onload();await new Promise(resolve=>setImmediate(resolve));assert.equal(f.updates(),1);
});

test('unknown centers preserve source failure retry and ignore late unmounted callbacks',async()=>{
 const f=await fixture();f.api.useShipVisualOffset(3,2);
 let cleanup=f.effects.pop()();f.images[0].onerror();cleanup();
 await new Promise(resolve=>setImmediate(resolve));assert.equal(f.updates(),0);
 f.api.useShipVisualOffset(3,2);cleanup=f.effects.pop()();assert.equal(f.images.length,2);
 cleanup();f.images[1].onload();await new Promise(resolve=>setImmediate(resolve));assert.equal(f.updates(),0);
});
