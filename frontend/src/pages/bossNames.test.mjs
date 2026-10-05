import test from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_NAMES, bossName } from './bossNames.ts';
test('all fifty bosses have unique stable short callsigns',()=>{
  assert.equal(BOSS_NAMES.length,50);
  assert.equal(new Set(BOSS_NAMES).size,50);
  BOSS_NAMES.forEach((name,i)=>{ assert.match(name,/^[A-Za-z]{5,12}$/); assert.equal(bossName(i+1),name); });
});
