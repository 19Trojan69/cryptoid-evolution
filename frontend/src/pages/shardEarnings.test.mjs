import { test } from "node:test";
import assert from "node:assert/strict";
import { balanceAfterMission, BONUS_TARGET_SHARD_REWARD, BOSS_SHARD_REWARD, creditDefeat, creditReward } from "./shardEarnings.ts";
import { chooseCryptoid } from "./cryptoidRoster.ts";

test("the first six mixed-size Cryptoids pay 22 Shards, not six", () => {
  const run = { shards: 0, destroyed: 0 };
  for (let index = 0; index < 6; index++) creditDefeat(run, chooseCryptoid(1, index).reward);
  assert.deepEqual(run, { shards: 22, destroyed: 6 });
});

test("weighted defeats and each bonus target update the running Shards immediately", () => {
  const run = { shards: 0, destroyed: 0 };
  for (const reward of [2, 4, 8, BONUS_TARGET_SHARD_REWARD]) creditDefeat(run, reward);
  assert.deepEqual(run, { shards: 15, destroyed: 4 });
  creditDefeat(run, BOSS_SHARD_REWARD);
  assert.deepEqual(run, { shards: 31, destroyed: 5 });
});

test("completion rewards are added once and mission saving matches the HUD", () => {
  const run = { shards: 44, destroyed: 12 };
  for (let index = 0; index < 11; index++) creditDefeat(run, BONUS_TARGET_SHARD_REWARD);
  assert.equal(run.shards, 55);
  creditReward(run, 7);
  creditReward(run, 3);
  assert.equal(run.shards, 65);
  assert.equal(balanceAfterMission(175, run), 240);
  assert.equal(run.destroyed, 23);
});
