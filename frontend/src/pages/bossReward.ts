import { bossHeartReward } from '../../../backend/src/lifeRules.ts';
export type BossRewardState = { bossHeartCollected?: boolean; bossHeartShards?: number };
export const BOSS_EXTRA_LIFE_MS = 2_800;
export const BOSS_HEART_POSITION = { x: .5, y: .58 };
export function collectBossHeart(state: BossRewardState & { hearts: number; maxHearts: number; shards: number }, player: { x: number; y: number }, width: number, height: number, position = BOSS_HEART_POSITION) {
  if (state.bossHeartCollected || Math.hypot((player.x - position.x) * width, (player.y - position.y) * height) > 38) return false;
  state.bossHeartCollected = true;
  const reward = bossHeartReward(state.hearts, state.maxHearts);
  state.hearts = reward.hearts;
  state.shards += reward.shards;
  state.bossHeartShards = reward.shards;
  return true;
}
