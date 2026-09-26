import { levelDifficulty } from "./levelDifficulty.ts";

export const BOSS_ENTRY_MS = 1_800;
export const BOSS_FIRE_INTERVAL_MS = 2_500;

export type SectorBoss = { x: number; y: number; startY: number; radius: number; health: number; maxHealth: number; elapsed: number; fireElapsed: number };

export const createSectorBoss = (sector: number, width: number, visibleTop = 0): SectorBoss => {
  const health = levelDifficulty(sector).bossHealth;
  const radius = 50;
  const startY = visibleTop ? visibleTop + radius + 8 : -60;
  return { x: width / 2, y: startY, startY, radius, health, maxHealth: health, elapsed: 0, fireElapsed: 0 };
};

export const moveSectorBoss = (boss: SectorBoss, delta: number, width: number, height: number): SectorBoss => {
  const elapsed = boss.elapsed + delta;
  const entry = Math.min(1, elapsed / BOSS_ENTRY_MS);
  const targetX = width * (.5 + .2 * Math.sin(Math.max(0, elapsed - BOSS_ENTRY_MS) * .00075));
  const targetY = Math.max(height * .24, boss.startY);
  return {
    ...boss,
    x: Math.max(boss.radius, Math.min(width - boss.radius, targetX)),
    y: boss.startY + (targetY - boss.startY) * (entry * entry * (3 - 2 * entry)),
    elapsed,
    fireElapsed: entry === 1 ? boss.fireElapsed + delta : 0,
  };
};

export const bossFireInterval = (boss: SectorBoss, level = 1) => {
  const levelReduction = levelDifficulty(level).progress * 220;
  return (boss.health <= boss.maxHealth / 2 ? 1_900 : BOSS_FIRE_INTERVAL_MS) - levelReduction;
};

export const bossVulnerable = (boss: SectorBoss) => boss.elapsed >= BOSS_ENTRY_MS;

// The bonus is followed by a boss; the boss clear advances to the next sector.
export const nextAfterClear = (isBonus: boolean, bossActive: boolean) => isBonus && !bossActive ? "boss" : "section";
