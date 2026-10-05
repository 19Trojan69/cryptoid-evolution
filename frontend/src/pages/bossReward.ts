export type BossRewardState = { bossHeartCollected?: boolean };
export const BOSS_EXTRA_LIFE_MS = 2_800;
export const BOSS_HEART_POSITION = { x: .5, y: .58 };
export function collectBossHeart(state: BossRewardState & { hearts: number }, player: { x: number; y: number }, width: number, height: number) {
  if (state.bossHeartCollected || Math.hypot((player.x - BOSS_HEART_POSITION.x) * width, (player.y - BOSS_HEART_POSITION.y) * height) > 38) return false;
  state.bossHeartCollected = true;
  state.hearts += 1;
  return true;
}
