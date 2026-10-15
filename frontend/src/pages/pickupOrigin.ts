import { MAX_ACTIVE_POWER_UPS, type PowerUp, type PowerUpType } from "./powerUps.ts";

// The existing opening benefit may become due with elapsed time, but its
// carrier must be a defeated enemy. Never invent a position near the player.
export function openingKillPickup(
  state: {
    weaponLevel: number;
    rapidFireMs: number;
    overdriveMs: number;
    powerUpTypes: PowerUpType[];
    powerUps: { x: number; y: number }[];
    asteroids: { x: number; y: number; radius: number }[];
  },
  effectiveWeapon: number,
  enemy: { x: number; y: number },
  id: number,
  width: number,
  height: number,
  visibleTop: number
): PowerUp | null {
  if (
    state.powerUps.length >= MAX_ACTIVE_POWER_UPS ||
    enemy.x < 38 ||
    enemy.x > width - 38 ||
    enemy.y < Math.max(105, visibleTop + 35) ||
    enemy.y > height * 0.62
  )
    return null;
  if (
    state.asteroids.some(e => Math.hypot(e.x - enemy.x, e.y - enemy.y) < e.radius + 85) ||
    state.powerUps.some(p => Math.hypot(p.x - enemy.x, p.y - enemy.y) < 80)
  )
    return null;
  const choices: PowerUpType[] =
    effectiveWeapon < 5 && state.weaponLevel === effectiveWeapon
      ? ["weapon", "rapid", "overdrive"]
      : ["rapid", "overdrive"];
  const type = choices.find(
    kind =>
      !state.powerUpTypes.includes(kind) &&
      !(kind === "rapid" && state.rapidFireMs > 0) &&
      !(kind === "overdrive" && state.overdriveMs > 0)
  );
  return type ? { id, type, x: enemy.x, y: enemy.y } : null;
}
