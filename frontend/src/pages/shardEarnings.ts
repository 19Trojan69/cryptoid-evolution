// The HUD and the balance saved at mission end use the same earned-Shards total.
export const BOSS_SHARD_REWARD = 16;
export const BONUS_TARGET_SHARD_REWARD = 1;

export type ShardRun = { shards: number; destroyed: number };

export const creditDefeat = (run: ShardRun, reward: number) => {
  run.shards += reward;
  run.destroyed += 1;
};

export const creditReward = (run: ShardRun, reward: number) => {
  run.shards += reward;
};

export const balanceAfterMission = (balance: number, run: ShardRun) => balance + run.shards;
