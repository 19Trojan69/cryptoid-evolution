// Run earnings remain separate from the wallet so existing checkpoint delta-crediting is unchanged.
import { levelDifficulty } from "./levelDifficulty.ts";

export const BOSS_SHARD_REWARD = 16;
export const BONUS_TARGET_SHARD_REWARD = 1;

// Difficulty rises across 500 levels. Rewards rise more slowly so progression
// remains meaningful without multiplying the in-game currency uncontrollably.
export const scaledShardReward = (base: number, level: number) =>
  Math.round(base * (1 + levelDifficulty(level).progress * .5));

export const scaledEnemyPoints = (base: number, level: number, extraHealth: number) =>
  Math.round(base * (1 + levelDifficulty(level).progress * .75) + extraHealth * 4);

export const bossShardReward = (level: number) => scaledShardReward(BOSS_SHARD_REWARD, level);
export const bossPoints = (level: number) => scaledEnemyPoints(2_100, level, 0);

export type ShardRun = { shards: number; destroyed: number };

export const creditDefeat = (run: ShardRun, reward: number) => {
  run.shards += reward;
  run.destroyed += 1;
};

export const creditReward = (run: ShardRun, reward: number) => {
  run.shards += reward;
};

export const balanceAfterMission = (balance: number, run: ShardRun) => balance + run.shards;

// A resumed snapshot has already been credited to the wallet. Do not add it twice.
export const missionShardBase = (balance: number, creditedRunShards = 0) => balance - creditedRunShards;
export const missionShardTotal = (base: number, earned: number) => Math.max(0, base + earned);
export const uncreditedGuestShards = (earned: number, credited: number) => Math.max(0, earned - credited);
