export type PlayerPosition = { x: number; y: number };
export type PlayerShot = { id: number; x: number; y: number; speedX: number; damage: number; empowered: boolean; visualLevel?: number };

export const PLAYER_SPEED_PX_MS = 0.68;
export const PURCHASED_WEAPON_DURATION_MS = 60_000;
export const PICKUP_WEAPON_DURATION_MS = 20_000;
export const PLAYER_RADIUS = 23;
// Ship-to-ship contact follows the visible hull; projectile hits keep the smaller player hitbox.
export const PLAYER_CONTACT_RADIUS = 27;
// Keep the ship visible roughly one centimetre above its former thumb offset.
export const TOUCH_SHIP_OFFSET_PX = 68;
export const SHOT_SPEED_PX_MS = 0.64;
export const FIRE_INTERVAL_MS = 320;
export const MAX_PLAYER_SHOTS = 28;
export const MAX_WEAPON_LEVEL = 5;
export const fireInterval = (level: number, rapidFireMs: number) => (level >= 3 || rapidFireMs > 0 ? 220 : FIRE_INTERVAL_MS);
export const volleyOffsets = (level: number) => level >= 4 ? [-13, 0, 13] : level >= 2 ? [-8, 8] : [0];
export const makeVolley = (level: number, x: number, y: number, overdrive: boolean, nextId: () => number, laserHull = false): PlayerShot[] =>
  volleyOffsets(level).map((offset, index, offsets) => ({ id: nextId(), x: x + offset, y, speedX: offsets.length === 3 ? (index - 1) * 0.1 : 0, damage: level >= 5 || overdrive || laserHull ? 2 : 1, empowered: level >= 5 || overdrive || laserHull, visualLevel: level }));

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const activeWeaponLevel = (paidLevel: number, paidMs: number, pickupLevel: number, pickupMs: number, cap: number) => {
  const paid = paidMs > 0 ? paidLevel : 1;
  const pickup = pickupMs > 0 ? Math.min(cap, pickupLevel) : 1;
  return Math.max(paid, pickup);
};

export const placePlayer = (x: number, y: number, width: number, height: number): PlayerPosition => ({
  x: clamp(x / width, 30 / width, 1 - 30 / width),
  y: clamp(y / height, 0.5, Math.min(0.91, 1 - 36 / height)),
});

export const placePlayerFromPointer = (x: number, y: number, width: number, height: number, isTouch: boolean) =>
  placePlayer(x, y - (isTouch ? TOUCH_SHIP_OFFSET_PX : 0), width, height);

export const movePlayer = (position: PlayerPosition, horizontal: number, vertical: number, delta: number, width: number, height: number) => {
  const magnitude = Math.max(1, Math.hypot(horizontal, vertical));
  return placePlayer(position.x * width + horizontal / magnitude * PLAYER_SPEED_PX_MS * delta, position.y * height + vertical / magnitude * PLAYER_SPEED_PX_MS * delta, width, height);
};

export const advanceShot = (shot: PlayerShot, delta: number): PlayerShot => ({ ...shot, x: shot.x + shot.speedX * delta, y: shot.y - SHOT_SPEED_PX_MS * delta });

export const shotHitsEnemy = (shot: PlayerShot, enemy: { x: number; y: number; radius: number; cloaked: boolean }) =>
  !enemy.cloaked && Math.hypot(shot.x - enemy.x, shot.y - enemy.y) < enemy.radius * 0.7 + 5;

export const shipHitsEnemy = (player: PlayerPosition, width: number, height: number, enemy: { x: number; y: number; radius: number }) =>
  Math.hypot(player.x * width - enemy.x, player.y * height - enemy.y) < PLAYER_CONTACT_RADIUS + enemy.radius;

const partlyInField = (ship: { x: number; y: number; radius: number }, width: number, height: number) =>
  ship.x >= -ship.radius && ship.x <= width + ship.radius && ship.y >= -ship.radius && ship.y <= height + ship.radius;
export const enemyMotionVisible = (before: { x: number; y: number; radius: number }, after: { x: number; y: number; radius: number }, width: number, height: number) =>
  partlyInField(before, width, height) || partlyInField(after, width, height);

// Retain the latch only while the previous overlap continues. An enemy that
// passes below the player can make a fresh impact when it returns.
export const retainContactLatch = (latched: boolean, previousPlayer: PlayerPosition, width: number, height: number, previousEnemy: { x: number; y: number; radius: number }) =>
  latched && shipHitsEnemy(previousPlayer, width, height, previousEnemy);

const shipContactProgress = (player: PlayerPosition, width: number, height: number, from: { x: number; y: number }, to: { x: number; y: number }, previousPlayer: PlayerPosition) => {
  const startX = from.x - previousPlayer.x * width, startY = from.y - previousPlayer.y * height;
  const endX = to.x - player.x * width, endY = to.y - player.y * height;
  const dx = endX - startX, dy = endY - startY, travel = dx * dx + dy * dy;
  return travel ? Math.max(0, Math.min(1, -(startX * dx + startY * dy) / travel)) : 0;
};
export const shipContactPoint = (player: PlayerPosition, width: number, height: number, from: { x: number; y: number }, to: { x: number; y: number }, previousPlayer: PlayerPosition = player) => {
  const progress = shipContactProgress(player, width, height, from, to, previousPlayer);
  const relativeX = from.x - previousPlayer.x * width + ((to.x - player.x * width) - (from.x - previousPlayer.x * width)) * progress;
  const relativeY = from.y - previousPlayer.y * height + ((to.y - player.y * height) - (from.y - previousPlayer.y * height)) * progress;
  return { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress, distance: Math.hypot(relativeX, relativeY) };
};

export const shipCrossesPlayer = (player: PlayerPosition, width: number, height: number, from: { x: number; y: number }, to: { x: number; y: number; radius: number }, previousPlayer: PlayerPosition = player) => {
  const progress = shipContactProgress(player, width, height, from, to, previousPlayer);
  const relativeX = from.x - previousPlayer.x * width + ((to.x - player.x * width) - (from.x - previousPlayer.x * width)) * progress;
  const relativeY = from.y - previousPlayer.y * height + ((to.y - player.y * height) - (from.y - previousPlayer.y * height)) * progress;
  return Math.hypot(relativeX, relativeY) < PLAYER_CONTACT_RADIUS + to.radius;
};

// Visible ships collide in entry, formation, attack and return. A latched
// overlap and the protection cooldown each prevent repeated damage.
export const contactWithEnemy = (player: PlayerPosition, width: number, height: number, enemy: { x: number; y: number; radius: number }, visible: boolean, collidedThisAttack: boolean, cooldownMs: number, previous?: { x: number; y: number }, previousPlayer: PlayerPosition = player) => {
  const connected = visible && !collidedThisAttack && (previous ? shipCrossesPlayer(player, width, height, previous, enemy, previousPlayer) : shipHitsEnemy(player, width, height, enemy));
  return { connected, damage: connected && cooldownMs <= 0 ? 1 : 0 };
};

export const shipCollisionOutcome = (shieldActive: boolean, shieldCharges: number, shieldMs: number) => {
  const absorbedByShield = shieldActive && shieldCharges > 0 && shieldMs > 0;
  return { absorbedByShield, destroysEnemy: !absorbedByShield, destroysPlayerLife: !absorbedByShield };
};
