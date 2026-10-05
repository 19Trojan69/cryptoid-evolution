import test from 'node:test';
import assert from 'node:assert/strict';
import { attackPressure, attackSlots } from './attackPressure.ts';
import { levelDifficulty } from './levelDifficulty.ts';

test('pressure increases from the first blocks and every visible level', () => {
  for (let stage=2; stage<=500; stage++) {
    assert.ok(attackPressure(stage).intervalMs < attackPressure(stage-1).intervalMs);
    assert.ok(levelDifficulty(stage).attackCooldownMs < levelDifficulty(stage-1).attackCooldownMs);
  }
  assert.ok(levelDifficulty(11).attackPaceScale < .96);
  assert.ok(levelDifficulty(301).attackPaceScale < .76);
});

test('all stages cap active, preparing and returning attackers; quiet blocks do not overlap', () => {
  for (let stage=1; stage<=500; stage++) {
    const p=attackPressure(stage);
    assert.ok(p.intervalMs>=1700);
    for(let active=0;active<=6;active++) for(let ready=0;ready<=6;ready++) {
      const slots=attackSlots(stage,active,ready);
      assert.ok(slots>=0 && slots<=ready);
      if(slots>0) assert.ok(active+slots<=p.cap);
      if([1,3,5].includes((stage-1)%10+1) && active>0) assert.equal(slots,0);
    }
  }
  assert.equal(attackSlots(4,1,5),1);
  assert.equal(attackSlots(14,1,5),2);
  assert.equal(attackSlots(14,3,5),0);
});
