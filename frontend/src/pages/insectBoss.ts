import { bossWeapons, type BossGunConfig } from './bossWeapons.ts';
import type { BossConfig } from './bossManifest.ts';
import type { EnemyShot } from './enemyFire.ts';
import type { SectorBoss } from './sectorBoss.ts';
import { PLAYER_RADIUS, PLAYER_CONTACT_RADIUS } from './playerCombat.ts';

/** Explicitly opt-in at creation. Nothing in the published campaign or cards is replaced. */
export const INSECT_REFERENCE_LEVEL = 60;
export const INSECT_SHOT_LIMIT = 3;
export const INSECT_LIFETIME_MS = 8_000;
export const INSECT_LOCK_MS = 240;
export const INSECT_WARNING_MS = 700;
export const MINIMUM_ESCAPE_GAP = 112;
export const ESCAPE_CENTER_WIDTH = MINIMUM_ESCAPE_GAP - 2 * PLAYER_RADIUS;

export type InsectCombat = {
  generation: 'insect-v2'; name: string; nextAttackAt: number; lane: 'left' | 'right';
  phrase: number; telegraphGun: number; warningStarted: number; visibleTop: number;
};

// Fifty missions of the separate game; future slots are a schedule, not released bosses. Individual art and encounter
// validation are required before any later slot can be enabled.
const names = [
  'Viridian Harvester','Caustic Vespid','Obsidian Carapace','Crimson Ovipositor','Ionic Mantis',
  'Violet Broodlord','Cyan Stinger','Ember Myriapod','Noxious Elytron','Rift Weaver',
  'Basilisk Drone','Acid Monarch','Plasma Cicada','Venom Ravager','Neon Chrysalid',
  'Onyx Locust','Toxic Arachne','Amber Scythe','Void Vespula','Scarlet Mandible',
  'Spectral Scarabaeus','Feral Damselfly','Radiant Centurion','Magma Termite','Abyssal Spinner',
  'Corrosive Archon','Electric Cicatrix','Sable Hornwing','Infernal Chrysalis','Ultraviolet Reaper',
  'Ion Centipede','Malachite Empress','Solar Mothership','Cryonic Widowmaker','Scorch Pincer',
  'Fuchsia Warlord','Nightglass Scarab','Virulent Dragonwing','Cobalt Harrier','Ashen Devourer',
  'Quantum Silkfang','Sulfur Tyrant','Nebula Swarmheart','Antimatter Talon','Eclipse Broodqueen',
  'Viridian Archfiend','Helix Venator','Chitin Revenant','Tachyon Broodforge','Apex Contagion',
] as const;
export const insectBossSchedule = names.map((name, index) => ({ level: 10 + index * 10, mission: index + 1, name, status: index === 0 ? 'reference' : 'design-pending' }));

/** Bounded proposal for later designs; only level 60 is currently instantiated. */
export function insectDifficulty(level: number) {
  const p = Math.max(0, Math.min(1, (Number.isFinite(level) ? level - 60 : 0) / 440));
  return { hullHP: 280 + Math.round(p * 140), turretBudget: 48 + p * 72,
    cadenceMs: 1050 - p * 250, projectileScale: 1 + p * .25,
    trackingScale: 1.08 + p * .17, coreInterval: 2550 - p * 450,
    coreSpeed: .165 + p * .04, maxShots: INSECT_SHOT_LIMIT,
    warningMs: INSECT_WARNING_MS, escapeGap: MINIMUM_ESCAPE_GAP };
}

// Reuse one existing mechanical cannon atlas; sprite geometry is scaled together
// with its muzzle/collision geometry. The hull itself is entirely new artwork.
const source = bossWeapons[0][0];
const gun = (key: string, kind: BossGunConfig['kind'], x: number, y: number, factor: number, caliber: number, interval: number, color: string, rows = 1): BossGunConfig & {renderScale:number} => ({
  ...source, key, name: key, kind, sourceX: x, sourceY: y, caliber, interval,
  base: x < 768 ? -.22 : .22, turnSpeed: kind === 'heavy' ? 1.35 : 1.9,
  radius: source.radius * factor, halfWidth: source.halfWidth * factor,
  back: source.back * factor, muzzle: source.muzzle * factor,
  sprite: { ...source.sprite, width: source.sprite.width, height: source.sprite.height },
  // renderScale preserves source atlas coordinates while sizing the whole gun.
  renderScale: factor, recoil: source.recoil * factor,
  visualShotWidth: caliber < 10 ? 6 : caliber < 20 ? 9 : 13,
  barrels: [0], rows, shotColor: color,
});
export const insectReferenceGuns: readonly (BossGunConfig & {renderScale:number})[] = [
  gun('Scythe left', 'pulse', 280, 390, 1.05, 8, 1.8, '#caff32', 2),
  gun('Scythe right', 'pulse', 1380, 390, 1.05, 8, 1.8, '#caff32', 2),
  gun('Acid furnace', 'plasma', 600, 390, 1.3, 16, 2.3, '#79ff35'),
  gun('Siege mandible', 'heavy', 1070, 390, 1.5, 24, 2.9, '#ff9638'),
];

export function insectReferenceConfig(base: BossConfig): BossConfig {
  return { ...base, image: '/ships/bosses/insect/viridian-harvester.webp',
    wreckImage: '/ships/bosses/insect/viridian-harvester.webp',
    weaponImage: '/ships/bosses/evolved/boss-01-guns.webp',
    sourceWidth: 1659, sourceHeight: 948, aspectRatio: 1659/948, widthScale: .76, heightScale: 1,
    engineAnchors: [[.40,.12],[.60,.12]],
    weaponAnchors: insectReferenceGuns.map(g => [g.sourceX / 1659, g.sourceY / 948] as const),
    fireSites: [[20,40],[38,48],[50,55],[62,48],[80,40]], explosionScale: .95 };
}

/** Full rendered gun reach, not merely the rectangular hull, is capped above
 * the unchanged y=.5 player limit, with an additional contact-radius gap. */
export function insectLayout(width: number, height: number, visibleTop: number) {
  const clearance = PLAYER_CONTACT_RADIUS + 24;
  const top = Math.max(12, visibleTop + 12);
  const ceiling = height * .5 - clearance;
  const maxHeight = Math.max(20, ceiling - top - 14);
  const bossWidth = Math.max(20, Math.min(width * .76, width - 2 * 36, maxHeight * (1659/948) / 1.2, height * .22 * (1659/948)));
  const bossHeight = bossWidth / (1659/948);
  return { width: bossWidth, height: bossHeight, top, bottomLimit: ceiling,
    centerY: Math.min(top + bossHeight / 2 + 8, ceiling - bossHeight * .7),
    playerTop: height * .5, playerBottom: Math.min(height * .91, height - 36),
    escapeGap: MINIMUM_ESCAPE_GAP };
}

export const insectShotRadius = (caliber: number) => caliber < 10 ? 6 : caliber < 20 ? 9 : caliber < 28 ? 13 : 16;

/** Reserve a full-height escape corridor (112px physical width, 66px of
 * valid player-center positions plus the existing 46px player hitbox). for the entire live volley. A lane is
 * selected only after the preceding volley has left, never underneath a shot.
 * Test the swept solid body, with player's hitbox and touch margin included. */
export function insectShotAdmitted(boss: SectorBoss, shot: EnemyShot, width: number, height: number) {
  if (!boss.insect || shot.vy <= .02) return false;
  const gap = Math.min(ESCAPE_CENTER_WIDTH, width - 60);
  const edge = boss.insect.lane === 'left' ? 30 : width - 30 - gap;
  const pad = PLAYER_RADIUS + (shot.collisionRadius ?? shot.radius) + 10;
  const t0 = Math.max(0, (height * .5 - shot.y - pad) / shot.vy);
  const t1 = Math.min(INSECT_LIFETIME_MS, (height + pad - shot.y) / shot.vy);
  if (t1 < t0) return false;
  const x0 = shot.x + shot.vx * t0, x1 = shot.x + shot.vx * t1;
  return Math.max(x0, x1) + pad < edge || Math.min(x0, x1) - pad > edge + gap;
}

export function chooseInsectLane(boss: SectorBoss, playerX: number, liveShots: readonly EnemyShot[]) {
  if (boss.insect && !liveShots.some(s => s.projectileType?.startsWith('insect-'))) {
    boss.insect.lane = playerX >= .5 ? 'left' : 'right';
  }
}

export function insectProjectile(shot: EnemyShot, caliber: number, core = false): EnemyShot {
  const radius = insectShotRadius(core ? 30 : caliber);
  return { ...shot, projectileType: core ? 'insect-reactor' : `insect-${shot.weaponKind}`,
    faction: 'enemy', damage: 1, ageMs: 0, lifetimeMs: INSECT_LIFETIME_MS,
    radius, renderRadius: radius, collisionRadius: radius * .8, weaponWidth: radius * 2 };
}
