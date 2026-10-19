import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { hullSourcePlan, preparedHullPlan } from './hullSourcePlan.ts';
import { enemyAppearance } from './shipFleet.ts';
import { shipEvolutionAsset } from './shipEvolution.ts';
const {build}=createRequire(import.meta.url)('esbuild');

async function fixture() {
  const built=await build({entryPoints:['src/pages/paintedShip.ts'],bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',plugins:[{name:'readiness-host',setup(b){
    b.onLoad({filter:/paintedShip\.ts$/},a=>({contents:fs.readFileSync(a.path,'utf8')+'\nexport {cache};',loader:'ts'}));
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

test('source warming deduplicates seven requests, limits native loads to three and does not paint variants',async()=>{
  const f=await fixture(),urls=Array.from({length:20},(_,i)=>`/ship-${i}.png`);
  assert.equal(f.api.preloadHullSources([...urls,urls[0]]),undefined);
  assert.equal(f.images.length,2);assert.equal(f.api.paintedShipResourceStats().sourceQueued,5);
  assert.equal(f.api.paintedShipResourceStats().sources,7);
  f.api.preloadHullSources(urls);assert.equal(f.images.length,2);assert.equal(f.api.paintedShipResourceStats().sourceQueued,5);
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
