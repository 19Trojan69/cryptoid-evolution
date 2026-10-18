import test from 'node:test';
import assert from 'node:assert/strict';
import {createEffectLayersProbe,LAYER_PHASES,LAYER_CSS} from './effectLayers.mjs';

test('layer experiment isolates both paths, bounds observation and restores original behavior',()=>{
  let time=0,attribute;
  const probe=createEffectLayersProbe({now:()=>time,
    document:{documentElement:{setAttribute:(key,value)=>{assert.equal(key,'data-replay-fire-smoke');attribute=value;},removeAttribute:()=>{attribute=undefined;}},
      querySelectorAll:()=>Array.from({length:2},()=>({querySelectorAll:()=>Array(probe.allowDebris()?4:0)}))},
    getStyle:()=>({content:attribute==='off'?'none':'""'})});
  for(const mode of LAYER_PHASES){
    probe.start(mode);assert.equal(probe.allowDebris(),mode.debris);
    assert.equal(attribute,mode.fireSmoke?'on':'off');
    for(let i=0;i<30;i++){time+=1000;probe.sample();}
    const r=probe.read();assert.equal(r.samples.length,3);
    assert.ok(r.samples.every(s=>s.domExplosions===2&&s.domFragments===(mode.debris?8:0)));
    assert.ok(r.samples.every(s=>s.fireContent===(mode.fireSmoke?'""':'none')&&s.smokeContent===s.fireContent));
    assert.equal(r.maxSampleMs,0);
  }
  probe.start(LAYER_PHASES[3]);probe.stop();
  assert.equal(probe.allowDebris(),true);assert.equal(attribute,undefined);
  assert.equal(LAYER_PHASES.reduce((sum,p)=>sum+p.durationMs,8000),53000);
  assert.ok(LAYER_CSS.includes('content:none!important'));
});
