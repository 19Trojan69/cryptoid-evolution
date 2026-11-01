import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { keepBossMiniAuthoredNativePlayback, restoreBossMiniPacing } from './miniStartControl.mjs';
import { bossMiniStartPacingDisabled, diagnosticSceneName } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
const source=()=>readFileSync(process.env.CRYPTOID_CSS_PACING_TEST_SOURCE || new URL('../../frontend/src/lib/cssFramePacing.ts',import.meta.url),'utf8');
function host(text) {
  const executable=stripTypeScriptTypes(text.replace(/^import .*\n/,'')).replace(/export /g,'');
  return new Function('ANIMATION_TARGET_HZ','nativeFrameEasing',executable+'\nreturn {startCssFramePacing,paceAnimation,cssFramePacingStats};')(60,()=>({original:'linear',paced:'steps(22, end)'}));
}
function scene(mini,boss) {
  let queries=0,updates=0;const events=new Map(),listeners=new Map();
  const target={isConnected:true,closest:s=>{assert.equal(s,'.sector-boss .hull-mini-explosion');return mini&&boss?{}:null;},getAnimations:()=>{queries++;return [animation];}};
  let easing='linear';
  const animation={playState:'running',effect:{target,getTiming:()=>({easing}),updateTiming:t=>{updates++;easing=t.easing;}},addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k)};
  const root={ownerDocument:{defaultView:{}},contains:()=>true,getAnimations:()=>[animation],addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k)};
  return {root,target,animation,events,listeners,count:()=>({queries,updates})};
}
test('real pacing module skips only boss-mini discovery and registration, including initial scan/direct registration and spark event targets',()=>{
  const original=source(),changed=keepBossMiniAuthoredNativePlayback(original);
  assert.equal(restoreBossMiniPacing(changed),original);assert.throws(()=>keepBossMiniAuthoredNativePlayback(original.replace('let stopped = false','let stopped = true')));
  for(const [text,mini,boss,skipped] of [[original,true,true,false],[changed,true,true,true],[changed,true,false,false],[changed,false,true,false],[changed,false,false,false]]) {
    const s=scene(mini,boss),h=host(text),stop=h.startCssFramePacing(s.root);
    h.paceAnimation(s.animation);
    for(const type of ['animationstart','transitionrun'])s.events.get(type)({target:s.target});
    assert.equal(s.count().queries,skipped?0:2);assert.equal(s.count().updates,skipped?0:1);
    assert.equal(h.cssFramePacingStats().active,skipped?0:1);assert.equal(s.listeners.size,skipped?0:2);
    stop();assert.equal(s.events.size,0);assert.equal(s.listeners.size,0);assert.equal(s.count().updates,skipped?0:2);
  }
});
test('mini start bypass requires completion-off and every preceding gate; distinct scene; defaults preserve existing source behavior',()=>{
  const env={CRYPTOID_FLAT_SCENE:'1',CRYPTOID_FLAT_BACKGROUND:'1',CRYPTOID_ORIGINAL_BOSS:'1',CRYPTOID_BOSS_WEAPON_CANVAS_OFF:'1',CRYPTOID_BOSS_MASK_LAYERS_OFF:'0',CRYPTOID_BOSS_REFLECTION_CONTROL:'0',CRYPTOID_BOSS_HEAT_CONTROL:'1',CRYPTOID_BOSS_HEAT_ON:'1',CRYPTOID_BOSS_HEAT_UNMASKED:'1',CRYPTOID_UNMASKED_HEAT_REFLECTION:'0',CRYPTOID_BOSS_HEAT_FLAT_FILL:'1',CRYPTOID_BOSS_STATIC_HOTSPOTS_OFF:'1',CRYPTOID_BOSS_MINI_INSPECTION_OFF:'1',CRYPTOID_BOSS_MINI_START_PACING_OFF:'1'};
  const old={...process.env};try {
    Object.assign(process.env,env);assert.equal(bossMiniStartPacingDisabled(),true);assert.ok(diagnosticSceneName().endsWith('-no-mini-inspection-no-mini-start-pacing'));
    for(const [k,v] of Object.entries(env)){process.env[k]=v==='1'?'0':'1';assert.equal(bossMiniStartPacingDisabled(),false,k);process.env[k]=v;}
    process.env.CRYPTOID_BOSS_MINI_START_PACING_OFF='0';assert.ok(diagnosticSceneName().endsWith('-no-mini-inspection'));
  }finally{for(const k of Object.keys(env)){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}}
});
