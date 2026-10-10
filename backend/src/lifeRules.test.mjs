import test from 'node:test';
import assert from 'node:assert/strict';
import { maxMissionHearts, bossHeartReward, cappedSnapshot } from './lifeRules.ts';

test('armor defines a bounded life maximum, including existing standalone Titanium', () => {
  assert.equal(maxMissionHearts(0),3);
  assert.equal(maxMissionHearts(1),4);
  assert.equal(maxMissionHearts(2),5);
  assert.equal(maxMissionHearts(3),6);
  assert.equal(maxMissionHearts(99),6);
  for (const invalid of [undefined, null, -1, 1.5, NaN, Infinity, '3']) assert.equal(maxMissionHearts(invalid),3);
});

test('boss hearts heal one or replace the heart with Shards, without exceeding the limit', () => {
  assert.deepEqual(bossHeartReward(1,6),{hearts:2,shards:0});
  assert.deepEqual(bossHeartReward(5,6),{hearts:6,shards:0});
  assert.deepEqual(bossHeartReward(6,6),{hearts:6,shards:5});
  assert.deepEqual(bossHeartReward(56,6),{hearts:6,shards:5});
});

test('legacy snapshot normalization preserves queued earnings and equipment without mutating the backup', () => {
  const original={hearts:56,score:300,shards:120,destroyed:20,weaponTimers:[0,0,4000,0,0,0],shieldMs:7000};
  for (const limit of [3,4,5,6]) {
    assert.deepEqual(cappedSnapshot(original,limit),{...original,hearts:limit});
    assert.equal(original.hearts,56);
    const damaged={...original,hearts:1};
    assert.equal(cappedSnapshot(damaged,limit),damaged);
  }
});
