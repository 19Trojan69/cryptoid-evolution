import { segmentDistance } from './projectileCollision.ts';
import type { BossWeaponKind } from './bossWeapons.ts';
import { PLAYER_RADIUS, type PlayerPosition } from "./playerCombat.ts";
import { levelDifficulty } from "./levelDifficulty.ts";
import { introShotSpeed } from './introDifficulty.ts';

export type BossProjectileKind = "bolt" | "orb" | "lance" | "split" | "pulse" | "double" | "burst" | "heavy" | "rapid";
export type EnemyShot = { id: number; x: number; y: number; vx: number; vy: number; radius: number; bossKind?: BossProjectileKind; weaponKind?:BossWeaponKind; weaponColor?:string; weaponWidth?:number; sourceGun?:number; caliber?:number };
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

export const advanceEnemyShot = (shot: EnemyShot, delta: number): EnemyShot => ({ ...shot, x: shot.x + shot.vx * delta, y: shot.y + shot.vy * delta });
// Match the solid projectile body, excluding decorative glow and exhaust.
export const enemyShotBody = (shot: EnemyShot) => {
  const radius = shot.weaponKind === 'laser' ? (shot.weaponWidth ?? shot.radius * 2) / 2 : shot.radius;
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
  const margin = Math.max(24, shot.radius * 2);
  return shot.y < -margin || shot.y > height + margin || shot.x < -margin || shot.x > width + margin;
};
