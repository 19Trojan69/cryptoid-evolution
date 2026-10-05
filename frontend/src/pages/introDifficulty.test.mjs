import test from 'node:test';
import assert from 'node:assert/strict';
import { introRelief, introGroupBreathingMs } from './introDifficulty.ts';
import { levelDifficulty } from './levelDifficulty.ts';
import { attackPressure, attackSlots } from './attackPressure.ts';
import { createEnemyShot } from './enemyFire.ts';
import { blockFlights } from './blockFlights.ts';

test('the first visible level allows only one attacker, including its returning flight',()=>{
  for(let stage=1;stage<=10;stage++){
    assert.equal(attackPressure(stage).cap,1);
    assert.equal(attackSlots(stage,1,6),0);
    assert.equal(attackSlots(stage,0,6),1);
  }
  assert.equal(attackPressure(11).cap,2);
  assert.equal(attackPressure(31).cap,3);
});
test('five visible levels ease smoothly into the unchanged later campaign',()=>{
  const player={x:.5,y:.85};let previous=Infinity;
  for(let stage=1;stage<=51;stage++){
    assert.ok(introRelief(stage)<=previous);previous=introRelief(stage);
    const shot=createEnemyShot(1,150,150,player,390,844,stage);
    assert.ok(shot);assert.ok(Math.hypot(shot.vx,shot.vy)>=.19*.65-1e-12);
  }
  const slow=createEnemyShot(1,150,150,player,390,844,1),normal=createEnemyShot(1,150,150,player,390,844,51);
  assert.ok(Math.abs(Math.hypot(slow.vx,slow.vy)/Math.hypot(normal.vx,normal.vy)-.65)<1e-12);
  for(const stage of [51,101,500]){
    const d=levelDifficulty(stage);assert.equal(introRelief(stage),0);assert.equal(introGroupBreathingMs(stage),0);
    assert.equal(d.attackCooldownMs,650-Math.sqrt(d.progress)*350);
    assert.equal(d.attackPaceScale,1-Math.sqrt(d.progress)*.32);
    assert.deepEqual(createEnemyShot(1,150,150,player,390,844,stage),createEnemyShot(1,150,150,player,390,844));
  }
  assert.ok(introGroupBreathingMs(9)>500);
  assert.equal(levelDifficulty(1).bossHealth,252);
});
test('all nine blocks and their six-ship groups remain intact',()=>{
  for(let level=1;level<=5;level++){
    for(let block=1;block<=9;block++)assert.ok(blockFlights((level-1)*10+block).every(count=>count===6));
    assert.deepEqual(blockFlights(level*10),[]);
  }
});
