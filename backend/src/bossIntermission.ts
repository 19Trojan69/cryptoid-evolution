export const BOSS_INTERMISSION_MIN_MS = 10_000;
export type BossIntermission = { stage: number; createdAt: number };
export function bossIntermissionPending(value: unknown): value is BossIntermission {
  if (!value || typeof value !== 'object') return false;
  const v = value as BossIntermission;
  return Number.isInteger(v.stage) && v.stage >= 10 && v.stage <= 500 && v.stage % 10 === 0
    && Number.isSafeInteger(v.createdAt) && v.createdAt >= 0;
}
