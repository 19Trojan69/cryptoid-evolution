import { insectDifficulty, insectLayout, insectReferenceConfig, insectReferenceGuns, INSECT_REFERENCE_LEVEL, type InsectCombat } from './insectBoss.ts';
import type { BossGunConfig } from './bossWeapons.ts';
import type { BossCoreState } from './bossCore.ts';
import { createBossTurrets, type BossTurretState } from './bossTurrets.ts';
import { levelDifficulty } from "./levelDifficulty.ts";
import { SECTIONS_PER_SECTOR, sectionInSector, sectorForSection } from "./sectorManager.ts";
import { bossForLevel, type BossConfig } from "./bossManifest.ts";
import { bossSupportCapacity } from "./bossEscorts.ts";
import { advanceShipMotion, idleShipMotion, type ShipMotion } from "./shipRealism.ts";

export const BOSS_ENTRY_MS = 1_800;
// Three recorded warning signals end before the boss becomes visible.
export const BOSS_WARNING_MS = 4_900;
export const BOSS_FIRE_INTERVAL_MS = 2_500;

export type SectorBoss = { insect?:InsectCombat; weaponSlots?:readonly BossGunConfig[]; core?: BossCoreState; visualMotion?: ShipMotion; turrets:BossTurretState[]; weaponClock:number; turretCursor:number; x: number; y: number; startY: number; radius: number; width: number; height: number; config: BossConfig; volley: number; health: number; maxHealth: number; elapsed: number; fireElapsed: number; lastDamageAt: number; hit?: { id?: number; x: number; y: number; impactPower?: number }; hullFires?: { id: number; x: number; y: number; impactPower?: number; revision?: number }[] };

export const createSectorBoss = (sector: number, width: number, visibleTop = 0, fieldHeight = 700, insectPreview = false): SectorBoss => {
  const config = bossForLevel(sector);
  if (!config) throw new Error(`No boss is assigned to level ${sector}`);
  if (insectPreview && sector === INSECT_REFERENCE_LEVEL) {
    const layout = insectLayout(width, fieldHeight, visibleTop);
    const custom = insectReferenceConfig(config), difficulty = insectDifficulty(sector);
    return {config:custom,weaponSlots:insectReferenceGuns,
      insect:{generation:'insect-v2',name:'Viridian Harvester',nextAttackAt:1100,lane:'left',phrase:0,telegraphGun:-1,warningStarted:0,visibleTop},
      turrets:createBossTurrets(config.id,insectReferenceGuns,difficulty.turretBudget),
      weaponClock:0,turretCursor:0,x:width/2,y:layout.centerY-14,startY:layout.centerY-14,
      radius:layout.width/2,width:layout.width,height:layout.height,volley:0,
      health:difficulty.hullHP,maxHealth:difficulty.hullHP,elapsed:0,fireElapsed:0,lastDamageAt:-Infinity};
  }
  const health = levelDifficulty(sector).bossHealth;
  // Leave a narrow but safe docking lane below later bosses, including on
  // shorter desktop viewports with a tall HUD.
  const escortHeightCap = bossSupportCapacity(sector) > 0
    ? Math.max(fieldHeight * .14, fieldHeight * .5 - visibleTop - Math.min(fieldHeight * .04, 32) - 87)
    : fieldHeight * .29;
  const shipWidth = Math.min(width * config.widthScale, width - 24, fieldHeight * .29 * config.aspectRatio, escortHeightCap / config.heightScale * config.aspectRatio);
  const shipHeight = shipWidth / config.aspectRatio * config.heightScale;
  const radius = shipWidth / 2;
  const startY = visibleTop ? visibleTop + shipHeight / 2 + 12 : -shipHeight;
  return { turrets:createBossTurrets(config.id),weaponClock:0,turretCursor:0,x: width / 2, y: startY, startY, radius, width: shipWidth, height: shipHeight, config, volley: 0, health, maxHealth: health, elapsed: 0, fireElapsed: 0, lastDamageAt: -Infinity };
};

export const moveSectorBoss = (boss: SectorBoss, delta: number, width: number, height: number): SectorBoss => {
  const elapsed = boss.elapsed + delta;
  const entry = Math.min(1, elapsed / BOSS_ENTRY_MS);
  if (boss.insect) {
    const layout = insectLayout(width,height,boss.insect.visibleTop);
    const phase = Math.max(0,elapsed-BOSS_ENTRY_MS);
    const free = Math.max(0,(width-layout.width)/2-36);
    const x = width/2 + Math.min(free,width*.045)*Math.sin(phase*.00048);
    const y = Math.min(layout.centerY + Math.sin(phase*.00031)*5,
      layout.bottomLimit-layout.height*.7);
    return {...boss,width:layout.width,height:layout.height,radius:layout.width/2,x,
      y:entry < 1 ? boss.startY+(y-boss.startY)*entry : y,elapsed,
      fireElapsed:entry===1?boss.fireElapsed+delta:0,
      visualMotion:advanceShipMotion(boss.visualMotion??idleShipMotion(),x-boss.x,y-boss.y,delta)};
  }
  const freeX = Math.max(0, (width - boss.width) / 2 - 12);
  const targetX = width / 2 + Math.min(freeX, width * .07) * Math.sin(Math.max(0, elapsed - BOSS_ENTRY_MS) * .00075);
  const restingY = Math.max(height * .19, boss.startY, boss.height / 2 + 12);
  const critical = Math.max(0, Math.min(1, (0.2 - boss.health / boss.maxHealth) / 0.2));
  const descent = critical * critical * (3 - 2 * critical);
  // Reserve the docking lane even while a damaged boss slowly descends.
  const supportCeiling = height * .5 - boss.height / 2 - Math.min(height * .04, 32) - 73;
  const targetY = Math.min(restingY + Math.min(height * .04, 32) * descent, height * .49 - boss.height / 2, supportCeiling);
  const moved = {
    ...boss,
    x: Math.max(boss.radius + 12, Math.min(width - boss.radius - 12, targetX)),
    y: entry < 1
      ? boss.startY + (restingY - boss.startY) * (entry * entry * (3 - 2 * entry))
      : boss.y + (targetY - boss.y) * (1 - Math.exp(-delta / 900)),
    elapsed,
    fireElapsed: entry === 1 ? boss.fireElapsed + delta : 0,
  };
  return { ...moved, visualMotion: advanceShipMotion(boss.visualMotion ?? idleShipMotion(), moved.x - boss.x, moved.y - boss.y, delta) };
};

export const bossFireInterval = (boss: SectorBoss, level = 1) => {
  const levelReduction = levelDifficulty(level).progress * 420;
  return (boss.health <= boss.maxHealth / 2 ? 1_900 : BOSS_FIRE_INTERVAL_MS) - levelReduction;
};

export const bossHullExposed = (boss: SectorBoss) => boss.health > 0 && boss.turrets.length > 0 && boss.turrets.every(gun => gun.health <= 0);

export const damageSectorBoss = (boss: SectorBoss, damage: number, time: number) => {
  if (!bossVulnerable(boss) || !bossHullExposed(boss) || !Number.isFinite(damage) || damage <= 0) return false;
  // GamePage consumes each colliding projectile once. A shared 180ms gate
  // discarded the rest of twin/triple volleys, neutralizing their firepower
  // against the reactor. Every connected projectile now deals its damage.
  boss.lastDamageAt = time;
  // The exposed hull now needs half as many hits, including resumed encounters.
  boss.health = Math.max(0, boss.health - damage * 2);
  if (boss.health < 1e-9) boss.health = 0;
  return true;
};

export const bossVulnerable = (boss: SectorBoss) => boss.elapsed >= BOSS_ENTRY_MS;

export type ClearEncounter = "normal" | "boss-clear" | "bonus";

// Nine blocks, then the tenth encounter is the boss and bonus.
export const nextAfterClear = (round: number, encounter: ClearEncounter, level = 1) => {
  if (encounter === "normal") return round >= SECTIONS_PER_SECTOR ? bossForLevel(level + 1) ? "boss" : "section" : "round";
  if (encounter === "boss-clear") return "bonus";
  return "section";
};

export const advanceAfterClear = (section: number, encounter: ClearEncounter) => {
  const next = nextAfterClear(sectionInSector(section), encounter, sectorForSection(section));
  const nextSection = next === "boss" ? sectorForSection(section + 1) * SECTIONS_PER_SECTOR : next === "round" || next === "section" ? section + 1 : section;
  return {
    encounter: next === "boss" ? "boss-intro" : next === "bonus" ? "bonus" : "normal",
    section: nextSection,
    sector: sectorForSection(nextSection),
    resetChain: next === "section" && encounter === "bonus",
  } as const;
};
