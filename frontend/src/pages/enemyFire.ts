import { segmentDistance } from './projectileCollision.ts';
import type { BossWeaponKind } from './bossWeapons.ts';
import { PLAYER_RADIUS, type PlayerPosition } from "./playerCombat.ts";
import { levelDifficulty } from "./levelDifficulty.ts";
import { introShotSpeed } from './introDifficulty.ts';
import type { CryptoidClass } from './cryptoidRoster.ts';

export type BossProjectileKind = "bolt" | "orb" | "lance" | "split" | "pulse" | "double" | "burst" | "heavy" | "rapid";
export type EnemyShot = { projectileType?:string;faction?:'enemy';damage?:number;ageMs?:number;lifetimeMs?:number;renderRadius?:number;collisionRadius?:number; id: number; x: number; y: number; vx: number; vy: number; radius: number; enemyClass?: CryptoidClass; bossKind?: BossProjectileKind; weaponKind?:BossWeaponKind; weaponColor?:string; weaponWidth?:number; sourceGun?:number; caliber?:number };
export type EnemyVolleyKind = 'single' | 'double' | 'burst';
export type EnemyFireProgress = { kind: EnemyVolleyKind; pulses: number; lastPulseMs: number | null };
export const ENEMY_BURST_GAP_MS = 260;
export const enemyProjectileProfiles: Record<CryptoidClass, { radius: number; speed: number; color: string }> = {
  light: { radius: 4, speed: 1, color: '#ffd18a' },
  medium: { radius: 5, speed: .96, color: '#ff9466' },
  heavy: { radius: 6, speed: .88, color: '#ff634c' },
  elite: { radius: 4, speed: 1.04, color: '#efacff' },
};

// Deterministic per attack, staggered by the formation index. No random
// projectile storms and no damage/health/cadence escalation alongside count.
export const enemyVolleyKind = (shipClass: CryptoidClass, stage: number, cycle: number): EnemyVolleyKind => {
  const level = levelDifficulty(stage).level;
  const turn = Math.max(0, Math.floor(cycle));
  if (shipClass === 'light' || level < 21) return 'single';
  if (shipClass === 'heavy') {
    if (level >= 301 && turn % 6 === 5) return 'burst';
    return turn % (level < 101 ? 4 : level < 251 ? 3 : 2) === 0 ? 'double' : 'single';
  }
  if (shipClass === 'elite' && level >= 51) {
    if (level >= 351 && turn % 8 === 7) return 'burst';
    return turn % (level < 151 ? 5 : 3) === 0 ? 'double' : 'single';
  }
  if (shipClass === 'medium' && level >= 101) return turn % (level < 251 ? 6 : 4) === 0 ? 'double' : 'single';
  return 'single';
};

export const enemyMuzzleOffsets = (barrels: number, radius: number) => barrels === 2 ? [-radius * .28, radius * .28] : [0];
// Low formation slots fire earlier in their warned dive, rather than missing
// their entire firing window or shooting inside the player's lower half.
export const enemyAttackFireTime = (duration: number, startY: number, height: number, radius: number) =>
  duration * Math.min(.28, Math.max(0, (height * .42 - startY) / Math.max(1, height - 75 + radius - startY)));

// Called by the combat tick. A sound event is returned only for projectiles
// actually spawned in that tick. Burst pulses cannot collapse after a stall.
export const advanceEnemyFire = ({ progress, elapsedMs, id, x, y, radius, shipClass, player, width, height, stage, available }: {
  progress: EnemyFireProgress; elapsedMs: number; id: number; x: number; y: number; radius: number;
  shipClass: CryptoidClass; player: PlayerPosition; width: number; height: number; stage: number; available: number;
}): { progress: EnemyFireProgress; complete: boolean; shots: EnemyShot[]; sound: 'single' | 'double' | null } => {
  const pulses = progress.kind === 'burst' ? 2 : 1;
  const empty = (complete = false) => ({ progress, complete, shots: [] as EnemyShot[], sound: null });
  if (progress.pulses >= pulses) return empty(true);
  if (elapsedMs < 0 || available < 1) return empty();
  if (progress.lastPulseMs !== null && elapsedMs - progress.lastPulseMs < ENEMY_BURST_GAP_MS) return empty();
  const base = createEnemyShot(id, x, y, player, width, height, stage);
  if (!base) return empty(y > height * .5); // No late shots in the player's flight area.
  const barrels = progress.kind === 'double' && available >= 2 ? 2 : 1;
  const profile = enemyProjectileProfiles[shipClass];
  const straight = progress.kind !== 'single';
  const speed = Math.hypot(base.vx, base.vy) * profile.speed;
  const shots = enemyMuzzleOffsets(barrels, radius).map((offset, index) => ({
    ...base, id: id + index, x: x + offset, radius: profile.radius, enemyClass: shipClass,
    vx: straight ? 0 : base.vx * profile.speed, vy: straight ? speed : base.vy * profile.speed,
  }));
  // Never put a wing muzzle outside the field; fall back to a central shot.
  if (shots.some(shot => shot.x < 12 || shot.x > width - 12)) return advanceEnemyFire({
    progress: { ...progress, kind: 'single' }, elapsedMs, id, x, y, radius, shipClass, player, width, height, stage, available: 1,
  });
  const next = { ...progress, pulses: progress.pulses + 1, lastPulseMs: elapsedMs };
  return { progress: next, complete: next.pulses >= pulses, shots, sound: barrels === 2 ? 'double' : 'single' };
};
const bossKinds: readonly BossProjectileKind[] = ["bolt", "orb", "lance", "split", "pulse"];
export const createBossShot = (id: number, x: number, y: number, player: PlayerPosition, width: number, height: number, volley: number, selectedKind?: BossProjectileKind): EnemyShot | null => {
  const shot = createEnemyShot(id, x, y, player, width, height);
  if (!shot) return null;
  const bossKind = selectedKind ?? bossKinds[Math.abs(volley) % bossKinds.length];
  const scale = bossKind === "orb" || bossKind === "heavy" ? 1.45 : bossKind === "lance" || bossKind === "rapid" ? .85 : bossKind === "pulse" ? 1.2 : 1;
  const speed = bossKind === "orb" || bossKind === "heavy" ? .72 : bossKind === "lance" || bossKind === "rapid" ? 1.28 : 1;
  return { ...shot, bossKind, radius: Math.max(5, Math.round(shot.radius * scale)), vx: shot.vx * speed, vy: shot.vy * speed };
};
export const MAX_ENEMY_SHOTS = 6;
export const enemyShotLimit = (width: number, elapsedMs: number, level = 1) => {
  const base = width < 620 ? 3 : elapsedMs < 5 * 60_000 ? 4 : MAX_ENEMY_SHOTS;
  const deviceLimit = width < 620 ? 5 : 8;
  return Math.min(deviceLimit, base + levelDifficulty(level).projectileBonus);
};

// Aim at the player's position when fired, then lock the direction so it remains dodgeable.
export const createEnemyShot = (id: number, x: number, y: number, player: PlayerPosition, width: number, height: number, stage = 500): EnemyShot | null => {
  if (x < 12 || x > width - 12 || y < 100 || y > height * .5) return null;
  const playerX = player.x * width;
  const playerY = player.y * height;
  const dx = playerX - x;
  const dy = Math.max(1, playerY - y);
  const distance = Math.hypot(dx, dy);
  const speed = .19 * introShotSpeed(stage);
  return { id, x, y, vx: dx / distance * speed, vy: dy / distance * speed, radius: 5 };
};

export const advanceEnemyShot = (shot: EnemyShot, delta: number): EnemyShot => ({ ...shot, x: shot.x + shot.vx * delta, y: shot.y + shot.vy * delta, ...(shot.lifetimeMs ? {ageMs:(shot.ageMs ?? 0)+delta} : {}) });
// Match the solid projectile body, excluding decorative glow and exhaust.
export const enemyShotBody = (shot: EnemyShot) => {
  if (shot.collisionRadius !== undefined) return {radius:shot.collisionRadius,extension:0,trailing:0};
  const radius = shot.weaponKind === 'laser' ? (shot.weaponWidth ?? shot.radius * 2) / 2 : shot.radius;
  if (shot.enemyClass === 'medium' || shot.enemyClass === 'heavy') return { radius, extension: 0, trailing: 0 };
  // Match the painted solid body along its direction of travel. Boss lances
  // and rapid shots are visibly longer than their circular spawn radius.
  const radial = shot.bossKind === 'orb' || shot.bossKind === 'heavy' || shot.bossKind === 'pulse';
  const halfLength = shot.weaponKind === 'laser' ? 12 : shot.weaponKind === 'rocket' ? shot.radius * 1.9 : shot.weaponKind ? shot.radius * 1.45
    : shot.bossKind === 'lance' ? 16 : shot.bossKind === 'rapid' ? 12.5
    : shot.bossKind === 'split' || shot.bossKind === 'double' ? 12
    : radial ? shot.radius : shot.bossKind === 'burst' ? 9.5 : 10;
  const extension = Math.max(0, halfLength - radius);
  // The ordinary/lance/rapid gradient is transparent at the trailing end.
  const trailing = shot.weaponKind === 'laser' ? Math.max(0, 5.3 - radius)
    : shot.weaponKind ? extension : shot.bossKind === 'lance' ? Math.max(0, 8.3 - radius)
    : shot.bossKind === 'rapid' ? Math.max(0, 6.5 - radius)
    : shot.bossKind === 'split' || shot.bossKind === 'double' || shot.bossKind === 'burst' ? extension : 0;
  return { radius, extension, trailing };
};
export const enemyShotHitsPlayer = (shot: EnemyShot, player: PlayerPosition, width: number, height: number, previousShot: EnemyShot = shot, previousPlayer: PlayerPosition = player) => {
  const body = enemyShotBody(shot), speed = Math.hypot(shot.vx, shot.vy);
  const direction = { x: speed ? shot.vx / speed : 0, y: speed ? shot.vy / speed : 1 };
  const from = { x: previousPlayer.x * width - previousShot.x, y: previousPlayer.y * height - previousShot.y };
  const to = { x: player.x * width - shot.x, y: player.y * height - shot.y };
  return segmentDistance(from, to,
    { x: -direction.x * body.trailing, y: -direction.y * body.trailing },
    { x: direction.x * body.extension, y: direction.y * body.extension }) < PLAYER_RADIUS + body.radius;
};
export const enemyShotOutsideField = (shot: EnemyShot, width: number, height: number) => {
  if (shot.lifetimeMs && (shot.ageMs ?? 0) >= shot.lifetimeMs) return true;
  const margin = Math.max(24, shot.radius * 2);
  return shot.y < -margin || shot.y > height + margin || shot.x < -margin || shot.x > width + margin;
};
