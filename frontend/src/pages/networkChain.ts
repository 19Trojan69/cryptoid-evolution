// A fictional in-game network. These blocks and Shards are not on-chain assets.
import { scaledShardReward } from "./shardEarnings.ts";

export const BLOCKS_PER_CHAIN = 3;
export const CHAIN_SHARD_REWARD = 3;
export const STRONG_BONUS_SHARD_REWARD = 2;

export const appendSectionBlock = (completed: number, bonusHits = 0, level = 1) => {
  const blocks = Math.min(BLOCKS_PER_CHAIN, Math.max(0, completed) + 1);
  const linked = completed < BLOCKS_PER_CHAIN && blocks === BLOCKS_PER_CHAIN;
  const extra = linked && bonusHits >= 9 ? STRONG_BONUS_SHARD_REWARD : 0;
  return { blocks, shards: linked ? scaledShardReward(CHAIN_SHARD_REWARD + extra, level) : 0, extra, linked };
};
