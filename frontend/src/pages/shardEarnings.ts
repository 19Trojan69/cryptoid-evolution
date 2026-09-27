// The HUD and the balance saved at mission end use the same earned-Shards total.
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
