export type PlayerPosition = { x: number; y: number };
export type PlayerShot = { id: number; x: number; y: number; speedX: number; damage: number; empowered: boolean };

export const PLAYER_SPEED_PX_MS = 0.68;
export const PURCHASED_WEAPON_DURATION_MS = 5 * 60_000;
export const PICKUP_WEAPON_DURATION_MS = 20_000;
export const PLAYER_RADIUS = 19;
// Ship-to-ship contact follows the visible hull; projectile hits keep the smaller player hitbox.
export const PLAYER_CONTACT_RADIUS = 27;
export const SHOT_SPEED_PX_MS = 0.64;
export const FIRE_INTERVAL_MS = 320;
export const MAX_PLAYER_SHOTS = 28;
export const MAX_WEAPON_LEVEL = 5;
export const fireInterval = (level: number, rapidFireMs: number) => (level >= 3 || rapidFireMs > 0 ? 220 : FIRE_INTERVAL_MS);
export const volleyOffsets = (level: number) => level >= 4 ? [-13, 0, 13] : level >= 2 ? [-8, 8] : [0];
export const makeVolley = (level: number, x: number, y: number, overdrive: boolean, nextId: () => number): PlayerShot[] =>
  volleyOffsets(level).map((offset, index, offsets) => ({ id: nextId(), x: x + offset, y, speedX: offsets.length === 3 ? (index - 1) * 0.1 : 0, damage: level >= 5 || overdrive ? 2 : 1, empowered: level >= 5 || overdrive }));

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const activeWeaponLevel = (paidLevel: number, paidMs: number, pickupLevel: number, pickupMs: number, cap: number) =>
  Math.min(cap, Math.max(paidMs > 0 ? paidLevel : 1, pickupMs > 0 ? pickupLevel : 1));

export const placePlayer = (x: number, y: number, width: number, height: number): PlayerPosition => ({
  x: clamp(x / width, 30 / width, 1 - 30 / width),
  y: clamp(y / height, 0.5, Math.min(0.91, 1 - 36 / height)),
});

export const movePlayer = (position: PlayerPosition, horizontal: number, vertical: number, delta: number, width: number, height: number) => {
  const magnitude = Math.max(1, Math.hypot(horizontal, vertical));
  return placePlayer(position.x * width + horizontal / magnitude * PLAYER_SPEED_PX_MS * delta, position.y * height + vertical / magnitude * PLAYER_SPEED_PX_MS * delta, width, height);
};

export const advanceShot = (shot: PlayerShot, delta: number): PlayerShot => ({ ...shot, x: shot.x + shot.speedX * delta, y: shot.y - SHOT_SPEED_PX_MS * delta });

export const shotHitsEnemy = (shot: PlayerShot, enemy: { x: number; y: number; radius: number; cloaked: boolean }) =>
  !enemy.cloaked && Math.hypot(shot.x - enemy.x, shot.y - enemy.y) < enemy.radius * 0.7 + 5;

export const shipHitsEnemy = (player: PlayerPosition, width: number, height: number, enemy: { x: number; y: number; radius: number }) =>
  Math.hypot(player.x * width - enemy.x, player.y * height - enemy.y) < PLAYER_CONTACT_RADIUS + enemy.radius;

// Visible ships collide in entry, formation, attack and return. The game passes
// collidedThisAttack only during a dive so one run cannot deal repeated damage.
export const contactWithEnemy = (player: PlayerPosition, width: number, height: number, enemy: { x: number; y: number; radius: number }, visible: boolean, collidedThisAttack: boolean, cooldownMs: number) => {
  const connected = visible && !collidedThisAttack && shipHitsEnemy(player, width, height, enemy);
  return { connected, damage: connected && cooldownMs <= 0 ? 1 : 0 };
};
