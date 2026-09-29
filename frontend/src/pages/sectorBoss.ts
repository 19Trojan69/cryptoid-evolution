import { levelDifficulty } from "./levelDifficulty.ts";
import { sectionInSector, sectorForSection } from "./sectorManager.ts";
import { bossForLevel, type BossConfig } from "./bossManifest.ts";

export const BOSS_ENTRY_MS = 1_800;
// Three recorded warning signals end before the boss becomes visible.
export const BOSS_WARNING_MS = 4_900;
export const BOSS_FIRE_INTERVAL_MS = 2_500;

export type SectorBoss = { x: number; y: number; startY: number; radius: number; width: number; height: number; config: BossConfig; volley: number; health: number; maxHealth: number; elapsed: number; fireElapsed: number; lastDamageAt: number; hit?: { x: number; y: number }; hullFires?: { id: number; x: number; y: number }[] };

export const createSectorBoss = (sector: number, width: number, visibleTop = 0, fieldHeight = 700): SectorBoss => {
  const config = bossForLevel(sector);
  if (!config) throw new Error(`No boss is assigned to level ${sector}`);
  const health = levelDifficulty(sector).bossHealth;
  const shipWidth = Math.min(width * config.widthScale, width - 24, fieldHeight * .29 * config.aspectRatio);
  const shipHeight = shipWidth / config.aspectRatio * config.heightScale;
  const radius = shipWidth / 2;
  const startY = visibleTop ? visibleTop + shipHeight / 2 + 12 : -shipHeight;
  return { x: width / 2, y: startY, startY, radius, width: shipWidth, height: shipHeight, config, volley: 0, health, maxHealth: health, elapsed: 0, fireElapsed: 0, lastDamageAt: -Infinity };
};

export const moveSectorBoss = (boss: SectorBoss, delta: number, width: number, height: number): SectorBoss => {
  const elapsed = boss.elapsed + delta;
  const entry = Math.min(1, elapsed / BOSS_ENTRY_MS);
  const freeX = Math.max(0, (width - boss.width) / 2 - 12);
  const targetX = width / 2 + Math.min(freeX, width * .07) * Math.sin(Math.max(0, elapsed - BOSS_ENTRY_MS) * .00075);
  const restingY = Math.max(height * .19, boss.startY, boss.height / 2 + 12);
  const critical = Math.max(0, Math.min(1, (0.2 - boss.health / boss.maxHealth) / 0.2));
  const descent = critical * critical * (3 - 2 * critical);
  const targetY = Math.min(restingY + Math.min(height * .04, 32) * descent, height * .49 - boss.height / 2);
  return {
    ...boss,
    x: Math.max(boss.radius + 12, Math.min(width - boss.radius - 12, targetX)),
    y: entry < 1
      ? boss.startY + (restingY - boss.startY) * (entry * entry * (3 - 2 * entry))
      : boss.y + (targetY - boss.y) * (1 - Math.exp(-delta / 900)),
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

// Nine sectors of three rounds, then the tenth sector is the boss alone.
export const nextAfterClear = (round: number, encounter: ClearEncounter, level = 1) => {
  if (encounter === "normal") return round >= 3 ? bossForLevel(level + 1) ? "boss" : "section" : "round";
  if (encounter === "boss-clear") return "bonus";
  return "section";
};

export const advanceAfterClear = (section: number, encounter: ClearEncounter) => {
  const next = nextAfterClear(sectionInSector(section), encounter, sectorForSection(section));
  // Skip all three normal rounds of each boss sector. Section 30 is the
  // virtual slot for boss 10, section 60 for boss 20, and so on.
  const nextSection = next === "boss" ? sectorForSection(section + 1) * 3 : next === "round" || next === "section" ? section + 1 : section;
  return {
    encounter: next === "boss" ? "boss-intro" : next === "bonus" ? "bonus" : "normal",
    section: nextSection,
    sector: sectorForSection(nextSection),
    resetChain: next === "section" && encounter === "bonus",
  } as const;
};
