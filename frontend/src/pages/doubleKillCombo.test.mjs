import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDoubleKillCombo, creditComboDefeat } from './doubleKillCombo.ts';
import { balanceAfterMission, uncreditedGuestShards } from './shardEarnings.ts';
const run = () => ({ score: 0, shards: 0, destroyed: 0, combo: createDoubleKillCombo() });
test('a pair within 500 ms credits score and Shards once, including mission balance', () => {
  const state = run();
  assert.equal(creditComboDefeat(state, 2, 100), false);
  assert.equal(creditComboDefeat(state, 16, 600), true);
  assert.equal(state.score, 50);
  assert.equal(state.shards, 23);
  assert.equal(state.destroyed, 2);
  assert.equal(balanceAfterMission(100, state), 123);
  assert.deepEqual(state.combo, { pendingAt: null, total: 1, level: 1, remainingMs: 1500 });
});
test('pairs do not overlap and a late defeat starts a fresh window', () => {
  const state = run();
  for (const time of [0, 0, 1]) creditComboDefeat(state, 1, time);
  assert.equal(state.combo.total, 1);
  creditComboDefeat(state, 1, 502);
  assert.equal(state.combo.total, 1);
  creditComboDefeat(state, 1, 503);
  assert.equal(state.combo.total, 2);
  assert.equal(state.shards, 15);
  assert.equal(state.score, 100);
});
test('pause/encounter reset breaks a pending pair, level reset retains mission totals', () => {
  const state = run();
  creditComboDefeat(state, 1, 0);
  state.combo.pendingAt = null;
  creditComboDefeat(state, 1, 100);
  assert.equal(state.combo.total, 0);
  creditComboDefeat(state, 1, 101);
  state.combo.level = 0;
  state.combo.pendingAt = null;
  assert.equal(state.combo.total, 1);
  assert.equal(state.combo.level, 0);
  assert.equal(run().combo.total, 0);
});

test('a resumed mission keeps its previously earned Shards and credits only new rewards', () => {
  const state = { score: 500, shards: 240, destroyed: 20, combo: {
    pendingAt: null, total: 10, level: 10, remainingMs: 0,
  } };
  const alreadyCredited = state.shards;
  creditComboDefeat(state, 2, 1000);
  creditComboDefeat(state, 2, 1200);
  assert.equal(state.shards, 249);
  assert.equal(state.score, 550);
  assert.equal(state.combo.total, 11);
  assert.equal(uncreditedGuestShards(state.shards, alreadyCredited), 9);
  assert.equal(uncreditedGuestShards(state.shards, state.shards), 0);
});
test('rapid bonus-target pairs use the same reduced reward without overlapping defeats', () => {
  const state = run();
  for (let target = 0; target < 12; target++) creditComboDefeat(state, 1, target * 100);
  assert.equal(state.combo.total, 6);
  assert.equal(state.destroyed, 12);
  assert.equal(state.shards, 42);
  assert.equal(balanceAfterMission(100, state), 142);
});
