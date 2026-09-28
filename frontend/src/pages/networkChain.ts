// A fictional in-game network. These blocks and Shards are not on-chain assets.
import { scaledShardReward } from "./shardEarnings.ts";

export const BLOCKS_PER_CHAIN = 3;
export const CHAIN_SHARD_REWARD = 3;
export const STRONG_BONUS_SHARD_REWARD = 2;

export const appendSectionBlock = (completed: number, level = 1) => {
  const blocks = Math.min(BLOCKS_PER_CHAIN, Math.max(0, completed) + 1);
  const linked = completed < BLOCKS_PER_CHAIN && blocks === BLOCKS_PER_CHAIN;
  return { blocks, shards: linked ? scaledShardReward(CHAIN_SHARD_REWARD, level) : 0, linked };
};

// The bonus takes place after the boss; award its chain bonus only when it ends.
export const bonusChainReward = (blocks: number, bonusHits: number, level = 1) =>
  blocks === BLOCKS_PER_CHAIN && bonusHits >= 9 ? scaledShardReward(STRONG_BONUS_SHARD_REWARD, level) : 0;
