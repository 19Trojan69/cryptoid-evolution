import { PLAYER_RADIUS, type PlayerPosition } from "./playerCombat.ts";

export type EnemyShot = { id: number; x: number; y: number; vx: number; vy: number; radius: number };
export const MAX_ENEMY_SHOTS = 6;
export const enemyShotLimit = (width: number, elapsedMs: number) => width < 620 ? 3 : elapsedMs < 5 * 60_000 ? 4 : MAX_ENEMY_SHOTS;

// Lock a short, deliberately slow lead toward the player's position at firing time.
export const createEnemyShot = (id: number, x: number, y: number, player: PlayerPosition, width: number, height: number): EnemyShot | null => {
  if (x < 12 || x > width - 12 || y < 100 || y > height * .5) return null;
  const playerX = player.x * width;
  const playerY = player.y * height;
  const remaining = Math.max(1, playerY - y);
  return { id, x, y, vx: Math.max(-.085, Math.min(.085, (playerX - x) / remaining * .19)), vy: .19, radius: 5 };
};

export const advanceEnemyShot = (shot: EnemyShot, delta: number): EnemyShot => ({ ...shot, x: shot.x + shot.vx * delta, y: shot.y + shot.vy * delta });
export const enemyShotHitsPlayer = (shot: EnemyShot, player: PlayerPosition, width: number, height: number) =>
  Math.hypot(shot.x - player.x * width, shot.y - player.y * height) < PLAYER_RADIUS + shot.radius;
