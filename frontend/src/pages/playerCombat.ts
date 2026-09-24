export type PlayerPosition = { x: number; y: number };
export type PlayerShot = { id: number; x: number; y: number; speedX: number; damage: number; empowered: boolean };

export const PLAYER_SPEED_PX_MS = 0.34;
export const PLAYER_RADIUS = 19;
export const SHOT_SPEED_PX_MS = 0.64;
export const FIRE_INTERVAL_MS = 320;
export const MAX_PLAYER_SHOTS = 28;
export const MAX_WEAPON_LEVEL = 5;
export const fireInterval = (level: number, rapidFireMs: number) => (level >= 3 || rapidFireMs > 0 ? 220 : FIRE_INTERVAL_MS);
export const volleyOffsets = (level: number) => level >= 4 ? [-13, 0, 13] : level >= 2 ? [-8, 8] : [0];
export const makeVolley = (level: number, x: number, y: number, overdrive: boolean, nextId: () => number): PlayerShot[] =>
  volleyOffsets(level).map((offset, index, offsets) => ({ id: nextId(), x: x + offset, y, speedX: offsets.length === 3 ? (index - 1) * 0.1 : 0, damage: level >= 5 || overdrive ? 2 : 1, empowered: level >= 5 || overdrive }));

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const placePlayer = (x: number, y: number, width: number, height: number): PlayerPosition => ({
  x: clamp(x / width, 30 / width, 1 - 30 / width),
  y: clamp(y / height, 0.7, Math.min(0.91, 1 - 36 / height)),
});

export const movePlayer = (position: PlayerPosition, horizontal: number, vertical: number, delta: number, width: number, height: number) => {
  const magnitude = Math.max(1, Math.hypot(horizontal, vertical));
  return placePlayer(position.x * width + horizontal / magnitude * PLAYER_SPEED_PX_MS * delta, position.y * height + vertical / magnitude * PLAYER_SPEED_PX_MS * delta, width, height);
};

export const advanceShot = (shot: PlayerShot, delta: number): PlayerShot => ({ ...shot, x: shot.x + shot.speedX * delta, y: shot.y - SHOT_SPEED_PX_MS * delta });

export const shotHitsEnemy = (shot: PlayerShot, enemy: { x: number; y: number; radius: number; cloaked: boolean }) =>
  !enemy.cloaked && Math.hypot(shot.x - enemy.x, shot.y - enemy.y) < enemy.radius * 0.7 + 5;

export const shipHitsEnemy = (player: PlayerPosition, width: number, height: number, enemy: { x: number; y: number; radius: number }) =>
  Math.hypot(player.x * width - enemy.x, player.y * height - enemy.y) < PLAYER_RADIUS + enemy.radius * 0.65;

// A ship's attack can make physical contact only once, including a contact
// absorbed during the player's brief post-hit invulnerability window.
export const contactWithEnemy = (player: PlayerPosition, width: number, height: number, enemy: { x: number; y: number; radius: number }, attacking: boolean, collidedThisAttack: boolean, cooldownMs: number) => {
  const connected = attacking && !collidedThisAttack && shipHitsEnemy(player, width, height, enemy);
  return { connected, damage: connected && cooldownMs <= 0 ? 1 : 0 };
};
