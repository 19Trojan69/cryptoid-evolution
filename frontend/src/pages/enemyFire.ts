import { PLAYER_RADIUS, type PlayerPosition } from "./playerCombat.ts";
import { levelDifficulty } from "./levelDifficulty.ts";

export type BossProjectileKind = "bolt" | "orb" | "lance" | "split" | "pulse" | "double" | "burst" | "heavy" | "rapid";
export type EnemyShot = { id: number; x: number; y: number; vx: number; vy: number; radius: number; bossKind?: BossProjectileKind };
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
export const createEnemyShot = (id: number, x: number, y: number, player: PlayerPosition, width: number, height: number): EnemyShot | null => {
  if (x < 12 || x > width - 12 || y < 100 || y > height * .5) return null;
  const playerX = player.x * width;
  const playerY = player.y * height;
  const dx = playerX - x;
  const dy = Math.max(1, playerY - y);
  const distance = Math.hypot(dx, dy);
  const speed = .19;
  return { id, x, y, vx: dx / distance * speed, vy: dy / distance * speed, radius: 5 };
};

export const advanceEnemyShot = (shot: EnemyShot, delta: number): EnemyShot => ({ ...shot, x: shot.x + shot.vx * delta, y: shot.y + shot.vy * delta });
export const enemyShotHitsPlayer = (shot: EnemyShot, player: PlayerPosition, width: number, height: number) =>
  Math.hypot(shot.x - player.x * width, shot.y - player.y * height) < PLAYER_RADIUS + shot.radius;
