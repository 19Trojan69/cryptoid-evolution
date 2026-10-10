export const BASE_MISSION_HEARTS = 3;
export const MAX_MISSION_HEARTS = 6;
export const BOSS_FULL_HEART_SHARDS = 5;

export const maxMissionHearts = (armorBonus: unknown) => BASE_MISSION_HEARTS + (
  typeof armorBonus === "number" && Number.isInteger(armorBonus)
    ? Math.max(0, Math.min(MAX_MISSION_HEARTS - BASE_MISSION_HEARTS, armorBonus))
    : 0
);

export const bossHeartReward = (hearts: number, maxHearts: number) => ({
  hearts: Math.min(maxHearts, hearts + 1),
  shards: hearts >= maxHearts ? BOSS_FULL_HEART_SHARDS : 0,
});

export const cappedSnapshot = <T extends { hearts: number }>(snapshot: T, maxHearts: number): T =>
  snapshot.hearts > maxHearts ? { ...snapshot, hearts: maxHearts } : snapshot;
