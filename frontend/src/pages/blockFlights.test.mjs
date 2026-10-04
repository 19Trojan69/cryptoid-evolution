import test from 'node:test';
import assert from 'node:assert/strict';
import { blockFlights, nextBlockFlight, blockFinished } from './blockFlights.ts';
import { enemyAppearance } from './shipFleet.ts';
import { advanceAfterClear } from './sectorBoss.ts';

test('finite progression across all 500 stages preserves boss and bonus order', () => {
  for (let stage = 1; stage <= 500; stage++) {
    const plan = blockFlights(stage);
    if (stage % 10 === 0) { assert.deepEqual(plan, []); continue; }
    assert.ok(plan.length >= 1 && plan.length <= 3);
    let total = 0;
    for (let group = 0; group < plan.length; group++) {
      for (let spawned = 0; spawned <= plan[group]; spawned++) {
        assert.equal(nextBlockFlight(stage, group, spawned, 1), null);
        assert.equal(blockFinished(stage, group, spawned, 1), false);
        if (spawned < plan[group]) assert.equal(nextBlockFlight(stage, group, spawned, 0), null);
      }
      total += plan[group];
      const next = nextBlockFlight(stage, group, plan[group], 0);
      if (group < plan.length - 1) assert.deepEqual(next, { group: group + 1, count: plan[group + 1], offset: total });
      else { assert.equal(next, null); assert.equal(blockFinished(stage, group, plan[group], 0), true); }
    }
    const looks = Array.from({ length: total }, (_, i) => enemyAppearance(stage, i));
    assert.equal(new Set(looks.map(e => e.sprite)).size, total, `stage ${stage}: unique hulls`);
    assert.equal(new Set(looks.map(e => e.color)).size, total, `stage ${stage}: unique paints`);
    assert.equal(advanceAfterClear(stage, 'normal').encounter, stage % 10 === 9 ? 'boss-intro' : 'normal');
  }
  for (const stage of [10, 40, 500]) {
    assert.equal(advanceAfterClear(stage, 'boss-clear').encounter, 'bonus');
    assert.equal(advanceAfterClear(stage, 'bonus').sector, stage + 1);
  }
});

test('one to nine extra groups ramp gradually while quieter blocks remain short', () => {
  for (const [start, expected] of [[1, 1], [11, 3], [31, 4], [51, 5], [101, 6], [151, 7], [251, 8], [351, 9], [491, 9]]) {
    const plans = Array.from({ length: 9 }, (_, block) => blockFlights(start + block));
    assert.equal(plans.reduce((sum, p) => sum + p.length - 1, 0), expected);
    assert.ok(plans.every(p => p.every(count => count <= 6)));
    for (const block of [0, 2, 4]) assert.equal(plans[block].length, 1);
  }
  assert.deepEqual(blockFlights(9), [6, 6]);
  assert.deepEqual(blockFlights(1), [6]);
});

test('legacy resumed missions keep their original reinforcement plan', () => {
  assert.deepEqual(blockFlights(9, 1), [6]);
  assert.deepEqual(blockFlights(97, 1), [6, 4]);
  assert.deepEqual(blockFlights(297, 1), [6, 6]);
});
