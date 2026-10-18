import test from 'node:test';
import assert from 'node:assert/strict';
import {createEffectWorkload,WORKLOAD_PHASES} from './effectWorkload.mjs';

test('cause isolation restores full presentation and measures exactly the intended paths',()=>{
  let time=0;const workload=createEffectWorkload({document:{querySelectorAll:()=>Array(3)},now:()=>time});
  for(const mode of WORKLOAD_PHASES){
    workload.start(mode);assert.equal(workload.allowImage('explosion'),mode.explosionImages);
    assert.equal(workload.allowImage('shatter'),mode.explosionImages);
    for(const other of ['shield','boss-explosion','turret-hit'])assert.equal(workload.allowImage(other),true);
    assert.equal(workload.allowAudio(),mode.explosionAudio);
    const r=workload.read();assert.equal(r.allowedAudioCalls,mode.explosionAudio?1:0);
    assert.equal(r.omittedAudioCalls,mode.explosionAudio?0:1);
    for(let i=0;i<30;i++){time+=1000;workload.sample();}
    assert.equal(workload.read().samples.length,4);
  }
  workload.start(WORKLOAD_PHASES[2]);workload.stop();
  assert.equal(workload.allowImage('explosion'),true);assert.equal(workload.allowAudio(),true);
});
