import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { useParentLifetimeForBossMini, restoreBossMiniInspection } from './miniCompletionControl.mjs';
import { bossMiniCompletionInspectionDisabled, diagnosticSceneName } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
const source=()=>readFileSync(process.env.CRYPTOID_FINISHED_EFFECT_TEST_SOURCE || new URL('../../frontend/src/pages/FinishedEffect.tsx',import.meta.url),'utf8');
function handler(text,setFinished) {
  const match=text.match(/const complete = (\(event: AnimationEvent<HTMLElement>\) => \{[\s\S]*?\n  \});\n  return /);
  assert.ok(match);return new Function('setFinished','return ('+match[1].replace('(event: AnimationEvent<HTMLElement>)','(event)')+');')(setFinished);
}
test('real completion callback skips only boss minis; full component reverses, other effects retain native inspection and finished removal',()=>{
  const s=source(),changed=useParentLifetimeForBossMini(s);assert.equal(restoreBossMiniInspection(changed),s);
  assert.equal(changed.slice(changed.indexOf('  return finished')),s.slice(s.indexOf('  return finished')));
  assert.throws(()=>useParentLifetimeForBossMini(s.replace('useState(false)','useState(true)')));
  for(const [text,mini,boss,expected] of [[s,true,true,1],[changed,true,true,0],[changed,true,false,1],[changed,false,true,1],[changed,false,false,1]]) {
    let calls=0,removed=0;const node={classList:{contains:()=>mini},closest:()=>boss?{}:null,getAnimations:options=>{assert.deepEqual(options,{subtree:true});calls++;return [{playState:'finished'}];}};
    handler(text,flag=>{assert.equal(flag,true);removed++;})({currentTarget:node});assert.equal(calls,expected);assert.equal(removed,expected);
  }
  let removed=0;handler(changed,()=>removed++)({currentTarget:{classList:{contains:()=>false},closest:()=>null,getAnimations:()=>[{playState:'running'}]}});assert.equal(removed,0);
});
test('mini inspection omission requires every static-hotspot-off gate and has a distinct scene; default preserves prior condition',()=>{
  const env={CRYPTOID_FLAT_SCENE:'1',CRYPTOID_FLAT_BACKGROUND:'1',CRYPTOID_ORIGINAL_BOSS:'1',CRYPTOID_BOSS_WEAPON_CANVAS_OFF:'1',CRYPTOID_BOSS_MASK_LAYERS_OFF:'0',CRYPTOID_BOSS_REFLECTION_CONTROL:'0',CRYPTOID_BOSS_HEAT_CONTROL:'1',CRYPTOID_BOSS_HEAT_ON:'1',CRYPTOID_BOSS_HEAT_UNMASKED:'1',CRYPTOID_UNMASKED_HEAT_REFLECTION:'0',CRYPTOID_BOSS_HEAT_FLAT_FILL:'1',CRYPTOID_BOSS_STATIC_HOTSPOTS_OFF:'1',CRYPTOID_BOSS_MINI_INSPECTION_OFF:'1'};
  const old={...process.env};try {
    Object.assign(process.env,env);assert.equal(bossMiniCompletionInspectionDisabled(),true);assert.ok(diagnosticSceneName().endsWith('-no-static-hotspots-no-mini-inspection'));
    for(const [k,v] of Object.entries(env)){process.env[k]=v==='1'?'0':'1';assert.equal(bossMiniCompletionInspectionDisabled(),false,k);process.env[k]=v;}
    process.env.CRYPTOID_BOSS_MINI_INSPECTION_OFF='0';assert.ok(diagnosticSceneName().endsWith('-flat-fill-no-static-hotspots'));
  } finally {for(const k of Object.keys(env)){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}}
});
