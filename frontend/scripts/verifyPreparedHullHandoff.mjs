// Actual React effects and ResourceCache, with synthetic painting. Native pixel
// preparation/release is independently exercised by verifyPaintedShipLifetime.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { ResourceCache } from '../src/pages/resourceCache.ts';
import { preparedHullPlan } from '../src/pages/hullSourcePlan.ts';
const root = new URL('../', import.meta.url).pathname;
const qa = createRequire(path.join(process.env.CRYPTOID_SCENE_QA || '/tmp/cryptoid-boss-effect-qa', 'package.json'));
const React = qa('react'), Renderer = qa('react-test-renderer');
assert.equal(React.version, createRequire(import.meta.url)('react').version);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const key = h => `${h.sprite}:${h.stage ?? 1}:${h.color}`;
const unique = plan => [...new Map(plan.map(h=>[key(h),h])).values()].slice(0,12);
const oldEffect = `  useEffect(() => {
    preloadHullSources(hullSourcePlan(game.sector, game.encounter, hullOffset, hullWave));
    const prepared = retainPreparedHulls(preparedHullPlan(game.sector, game.encounter, hullOffset, hullWave, hullBonusGroup, hullRules));
    return prepared.release;
  }, [game.sector, game.encounter, hullOffset, hullWave, hullBonusGroup, hullRules]);`;
const oldHook = `import {useEffect} from 'react';
import {hullSourcePlan, preparedHullPlan} from './hullSourcePlan';
import {preloadHullSources, retainPreparedHulls} from './paintedShip';
export function usePreparedGameHulls(sector,encounter,hullOffset,hullWave,hullBonusGroup,hullRules){
const game={sector,encounter};
${oldEffect}
}`;
async function fixture(before = false) {
  const revoked=[], jobs=[], preloads=[];
  const cache = new ResourceCache(24,12*1024*1024,url=>revoked.push(url),6);
  let active=0, peak=0;
  const host = {
    preloadHullSources: urls => preloads.push(urls),
    retainPreparedHulls: plan => {
      const selected=unique(plan), releases=selected.map(h=>cache.retain(key(h)));
      active++;peak=Math.max(peak,active);
      for(const h of selected)if(!cache.get(key(h))){const url='blob:qa-'+jobs.length;jobs.push({h,url});cache.set(key(h),url,400000);}
      let released=false;
      return {settled:Promise.resolve(selected.map(()=>true)),release(){if(released)return;released=true;active--;releases.forEach(r=>r());}};
    }
  };
  const contents=before?oldHook:fs.readFileSync(root+'src/pages/usePreparedGameHulls.ts','utf8');
  const bundle=await build({stdin:{contents,resolveDir:root+'src/pages',loader:'ts'},bundle:true,write:false,
    platform:'node',format:'cjs',logLevel:'silent',plugins:[{name:'real-react-lifetime-host',setup(b){
      b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'host'}));
      b.onResolve({filter:/paintedShip$/},()=>({path:'painted',namespace:'host'}));
      b.onLoad({filter:/.*/,namespace:'host'},a=>({loader:'js',contents:a.path==='react'
        ?'export const {useEffect,useRef}=globalThis.__react;'
        :'export const {preloadHullSources,retainPreparedHulls}=globalThis.__host;'}));
    }}]});
  const context={__react:React,__host:host,module:{exports:{}},exports:{}};context.module.exports=context.exports;
  vm.runInNewContext(bundle.outputFiles[0].text,context);
  const hook=context.module.exports.usePreparedGameHulls;
  function Probe({args}){hook(...args);return React.createElement('div',{className:'same-scene'},'same pixels');}
  let renderer;
  return {cache,revoked,jobs,preloads,
    async mount(args,strict=false){await React.act(()=>{renderer=Renderer.create(strict?React.createElement(React.StrictMode,null,React.createElement(Probe,{args})):React.createElement(Probe,{args}));});},
    async update(args){await React.act(()=>{renderer.update(React.createElement(Probe,{args}));});},
    async unmount(){await React.act(()=>renderer.unmount());},
    touch(plan){return plan.map(h=>cache.get(key(h)));},
    tree(){return renderer.toJSON();},stats(){return {active,peak,pins:cache.retainCount,entries:cache.size,bytes:cache.bytes};}
  };
}
test('actual React level 18→19 reproduces six discarded prepaints; corrected hook preserves them',async()=>{
  const results=[];
  for(const before of [true,false]){
    const f=await fixture(before), oldPlan=preparedHullPlan(18,'normal',0,0,0,2),nextPlan=preparedHullPlan(19,'normal',0,0,0,2);
    await f.mount([18,'normal',0,0,0,2]);
    const future=f.touch(nextPlan.slice(0,6));assert.ok(future.every(Boolean));f.touch(oldPlan.slice(0,6));
    const painted=f.jobs.length,tree=f.tree();await f.update([19,'normal',0,0,0,2]);
    assert.deepEqual(f.tree(),tree);
    const actual={newJobs:f.jobs.length-painted,discarded:future.filter(url=>f.revoked.includes(url)).length};
    assert.deepEqual(actual,before?{newJobs:12,discarded:6}:{newJobs:6,discarded:0});
    if(!before)assert.deepEqual(f.touch(nextPlan.slice(0,6)),future);
    await f.unmount();assert.equal(f.stats().pins,0);assert.equal(f.stats().active,0);assert.ok(f.stats().entries<=6);
    results.push(actual);
  }
  console.log(JSON.stringify({level18to19:results}));
});
test('unchanged scene updates retain the same plan and introduce no new preparation',async()=>{
  const f=await fixture();await f.mount([18,'normal',0,0,0,2]);const count=f.jobs.length;
  for(let i=0;i<100;i++)await f.update([18,'normal',0,0,0,2]);
  assert.equal(f.jobs.length,count);assert.equal(f.preloads.length,1);assert.equal(f.stats().active,1);
  await f.unmount();assert.equal(f.stats().pins,0);
});
test('when next-level hulls are already most recent, both versions reuse them; savings are conditional',async()=>{
  for(const before of [true,false]){
    const f=await fixture(before);await f.mount([18,'normal',0,0,0,2]);const count=f.jobs.length;
    await f.update([19,'normal',0,0,0,2]);assert.equal(f.jobs.length-count,6);
    await f.unmount();assert.equal(f.stats().pins,0);
  }
});
test('unmount/StrictMode cleanup releases all preparation owners',async()=>{
  const f=await fixture();await f.mount([18,'normal',0,0,0,2],true);
  assert.equal(f.stats().active,1);await f.unmount();assert.equal(f.stats().active,0);assert.equal(f.stats().pins,0);
});
test('live mounted consumer remains pinned across plan replacement and final route cleanup',async()=>{
  const f=await fixture();await f.mount([18,'normal',0,0,0,2]);
  const live=preparedHullPlan(18,'normal',0,0,0,2)[0],release=f.cache.retain(key(live)),url=f.cache.get(key(live));
  for(let sector=19;sector<26;sector++)await f.update([sector,sector%10?'normal':'boss-fight',0,0,0,2]);
  assert.equal(f.cache.get(key(live)),url);assert.ok(!f.revoked.includes(url));
  await f.unmount();assert.equal(f.stats().pins,1);release();assert.equal(f.stats().pins,0);
});
test('500 sectors, reinforcement offsets, bosses and bonus changes leave bounded ownership',async()=>{
  const f=await fixture();await f.mount([1,'normal',0,0,0,2]);
  let changes=0;
  for(let sector=1;sector<=500;sector++){
    const plans=sector%10?[[sector,'normal',0,0,0,2],[sector,'normal',6,0,0,2]]
      :[[sector,'boss-intro',0,0,0,2],[sector,'boss-fight',0,1,0,2],[sector,'bonus',0,0,0,2],[sector,'bonus',0,0,1,2]];
    for(const args of plans){await f.update(args);changes++;assert.equal(f.stats().active,1);
      assert.ok(f.stats().pins<=12);assert.ok(f.stats().entries<=24);assert.ok(f.stats().bytes<=12*1024*1024);}
  }
  await f.unmount();assert.equal(f.stats().pins,0);assert.equal(f.stats().active,0);assert.ok(f.stats().entries<=6);
  console.log(JSON.stringify({planChanges:changes,peakSimultaneousOwners:f.stats().peak}));
});
test('whole GamePage matches the deployed source apart from the preparation hook substitution',()=>{
  const refs=['f85360ed464fb75944ada0c3f1d22776c4df31ca','4cd30ad0b6e7583fe3b4e8a31cc2d020b27a1a3c'];
  const ref=refs.find(ref=>{try{execFileSync('git',['cat-file','-e',ref+':frontend/src/pages/GamePage.tsx'],{cwd:root,stdio:'ignore'});return true;}catch{return false;}});
  assert.ok(ref);assert.equal(execFileSync('git',['rev-parse',ref+'^{tree}'],{cwd:root,encoding:'utf8'}).trim(),'2aac1e929e8992b9d93b5de0ffaf8675effc6f00');
  const original=execFileSync('git',['show',ref+':frontend/src/pages/GamePage.tsx'],{cwd:root,encoding:'utf8'});
  assert.ok(original.includes(oldEffect));
  const expected=original.replace('import { useShipVisualOffset, paintedShipResourceStats, preloadHullSources, retainPreparedHulls, useHullSourceReady } from "./paintedShip";',
    'import { useShipVisualOffset, paintedShipResourceStats, useHullSourceReady } from "./paintedShip";\nimport { usePreparedGameHulls } from \'./usePreparedGameHulls\';')
    .replace('import { hullSourcePlan, preparedHullPlan } from "./hullSourcePlan";\n','')
    .replace(oldEffect,'  usePreparedGameHulls(game.sector, game.encounter, hullOffset, hullWave, hullBonusGroup, hullRules);');
  assert.equal(fs.readFileSync(root+'src/pages/GamePage.tsx','utf8'),expected);
});
