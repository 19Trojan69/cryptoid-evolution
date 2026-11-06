import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createSectorBoss,moveSectorBoss,BOSS_ENTRY_MS} from '../../frontend/src/pages/sectorBoss.ts';
import {restoreReactorTargetChanges} from '../../frontend/scripts/reactorTargetReviewedChanges.mjs';
const root=new URL('../../',import.meta.url).pathname;
const require=createRequire(root+'frontend/package.json');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{build}=require('esbuild');
const BASE='d005c99b03dfdfe9433e300ac1add26a38a74eb9';
const prior=path=>execFileSync('git',['show',BASE+':'+path],{cwd:root,encoding:'utf8'});
async function component(baseline){
 const output=await build({absWorkingDir:root,entryPoints:['frontend/src/pages/BossReactorView.tsx'],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime'],logLevel:'silent',
  plugins:baseline?[{name:'prior-reactor',setup(b){b.onLoad({filter:/BossReactorView\.tsx$/},()=>({contents:prior('frontend/src/pages/BossReactorView.tsx'),loader:'tsx'}));}}]:[]});
 const module={exports:{}};Function('module','exports','require',output.outputFiles[0].text)(module,module.exports,require);return module.exports.default;
}
test('all 50 reactor artworks and door positions remain exact outside the explicitly requested shot flash',async()=>{
 const before=await component(true),after=await component(false);let cases=0;
 for(const [width,height] of [[320,568],[1366,768]])for(let id=1;id<=50;id++){
  const boss=moveSectorBoss(createSectorBoss(id*10,width,90,height),BOSS_ENTRY_MS,width,height);boss.turrets.forEach(g=>g.health=0);
  for(const state of [{elapsed:0,volley:0},{elapsed:450,volley:0},{elapsed:900,volley:0},{elapsed:180,volley:1},{elapsed:1000,volley:3}]){
   boss.core=state;assert.equal(renderToStaticMarkup(React.createElement(after,{boss})),renderToStaticMarkup(React.createElement(before,{boss})));cases++;
  }
 }
 assert.equal(cases,500);
});
test('each firing reactor flashes briefly in its actual projectile colour inside its own SVG',async()=>{
 const View=await component(false);let cases=0;
 for(let id=1;id<=50;id++)for(const [elapsed,opacity] of [[0,.32],[90,.16],[179,.32/180]]){
  const boss=createSectorBoss(id*10,390,90,760);boss.turrets.forEach(g=>g.health=0);boss.core={elapsed,volley:1,lastShotColor:'#22ff66'};
  const markup=renderToStaticMarkup(React.createElement(View,{boss}));
  assert.match(markup,/<svg[^>]*boss-special-weapon-firing/);
  const flash=markup.match(/<path class="boss-reactor-shot-flash"[^>]*>/)?.[0];assert.ok(flash);assert.match(flash,/fill="#22ff66"/);
  const actual=Number(flash.match(/opacity="([^"]+)"/)?.[1]);assert.ok(Math.abs(actual-opacity)<1e-9);
  assert.equal((markup.match(/boss-reactor-shot-flash/g)||[]).length,1);cases++;
 }
 assert.equal(cases,150);
});
test('real controller reactor firing keeps sound but never writes the whole-ship muzzle light',()=>{
 const source=readFileSync(root+'frontend/src/pages/GamePage.tsx','utf8');
 const line=source.match(/^\s*if \(pulses\.length\) \{[^\n]+\}/m)?.[0];assert.ok(line);assert.ok(!line.includes('bossMuzzleRef'));
 for(const count of [0,1,2,4]){
  const calls=[],bossMuzzleRef={current:17},soundRef={current:{playBossWeapon:(...args)=>calls.push(args)}};
  Function('pulses','soundRef','bossMuzzleRef','time',line)(Array(count).fill({}),soundRef,bossMuzzleRef,3000);
  assert.equal(bossMuzzleRef.current,17);assert.deepEqual(calls,count?[['pulse',8,count,0]]:[]);
 }
 assert.ok(source.includes('if (fired.events.length) bossMuzzleRef.current = time;'),'Other gun lighting retained');
 const css=readFileSync(root+'frontend/src/index.css','utf8');assert.match(css,/\.boss-special-weapon-firing \.boss-special-muzzle \{ fill:var\(--weapon-energy\); opacity:1; \}/);
});
test('source guard restores only the three exact authorised controller changes',()=>{
 const actual=readFileSync(root+'frontend/src/pages/GamePage.tsx','utf8'),before=prior('frontend/src/pages/GamePage.tsx');
 assert.equal(restoreReactorTargetChanges(actual),before);
 assert.notEqual(restoreReactorTargetChanges(actual+'\n// foreign change'),before);
 assert.equal(restoreReactorTargetChanges(before),before);
});
