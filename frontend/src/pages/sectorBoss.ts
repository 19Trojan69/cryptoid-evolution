import { levelDifficulty } from "./levelDifficulty.ts";
import { sectionInSector, sectorForSection } from "./sectorManager.ts";

export const BOSS_ENTRY_MS = 1_800;
// Three recorded warning signals end before the boss becomes visible.
export const BOSS_WARNING_MS = 4_900;
export const BOSS_FIRE_INTERVAL_MS = 2_500;

export type SectorBoss = { x: number; y: number; startY: number; radius: number; health: number; maxHealth: number; elapsed: number; fireElapsed: number; lastDamageAt: number };

export const createSectorBoss = (sector: number, width: number, visibleTop = 0): SectorBoss => {
  const health = levelDifficulty(sector).bossHealth;
  const radius = 50;
  const startY = visibleTop ? visibleTop + radius + 8 : -60;
  return { x: width / 2, y: startY, startY, radius, health, maxHealth: health, elapsed: 0, fireElapsed: 0, lastDamageAt: -Infinity };
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

export const damageSectorBoss = (boss: SectorBoss, damage: number, time: number) => {
  if (time - boss.lastDamageAt < 180) return false;
  boss.lastDamageAt = time;
  boss.health = Math.max(0, boss.health - damage);
  return true;
};

export const bossVulnerable = (boss: SectorBoss) => boss.elapsed >= BOSS_ENTRY_MS;

export type ClearEncounter = "normal" | "boss-clear" | "bonus";

// Each sector is three combat rounds, then the boss, then the bonus challenge.
export const nextAfterClear = (round: number, encounter: ClearEncounter) => {
  if (encounter === "normal") return round >= 3 ? "boss" : "round";
  if (encounter === "boss-clear") return "bonus";
  return "section";
};

export const advanceAfterClear = (section: number, encounter: ClearEncounter) => {
  const next = nextAfterClear(sectionInSector(section), encounter);
  const nextSection = next === "round" || next === "section" ? section + 1 : section;
  return {
    encounter: next === "boss" ? "boss-intro" : next === "bonus" ? "bonus" : "normal",
    section: nextSection,
    sector: sectorForSection(nextSection),
    resetChain: next === "section",
  } as const;
};

export const encounterHudLabel = (round: number, encounter: "normal" | "boss-intro" | "boss-fight" | "boss-clear" | "bonus") =>
  encounter === "normal" ? `${round}/3` : encounter === "bonus" ? "BONUS" : "BOSS";
