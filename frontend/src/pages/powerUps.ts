export type PowerUpType = "shield" | "overdrive" | "weapon" | "rapid";
export type PowerUp = { id: number; type: PowerUpType; x: number; y: number };
export type PowerStatus = { hearts: number; shieldCharges: number; shieldMs?: number; overdriveMs: number; weaponLevel?: number; rapidFireMs?: number };
export type Threat = { x: number; y: number; radius: number };

export const POWER_UP_DURATION_MS = 20_000;
export const PURCHASED_POWER_UP_DURATION_MS = 60_000;
export const OVERDRIVE_DURATION_MS = POWER_UP_DURATION_MS;
export const RAPID_DURATION_MS = POWER_UP_DURATION_MS;
export const MAX_ACTIVE_POWER_UPS = 3;

export const powerUpNames: Record<PowerUpType, string> = {
  shield: "Shield", overdrive: "Overdrive", weapon: "Weapon Upgrade", rapid: "Rapid Fire",
};
export const powerUpSymbols: Record<PowerUpType, string> = {
  shield: "◇", overdrive: "ϟ", weapon: "↑", rapid: "»",
};

export const createPowerUpDrop = ({ id, x, y, width, height, threats, activeCount, chanceRoll, kindRoll, destroyed, dropsCreated }: {
  id: number; x: number; y: number; width: number; height: number;
  threats: Threat[]; activeCount: number; chanceRoll: number; kindRoll: number; destroyed: number; dropsCreated: number;
}): PowerUp | null => {
  if (activeCount >= MAX_ACTIVE_POWER_UPS || (chanceRoll >= 0.11 && !(dropsCreated === 0 && destroyed >= 3))) return null;
  // Drops begin where the enemy was defeated. Skip any location near immediate danger.
  if (x < 35 || x > width - 35 || y < 105 || y > height * 0.62) return null;
  if (threats.some(threat => Math.abs(threat.x - x) < threat.radius + 36 && threat.y >= y - 45 && threat.y <= y + 130)) return null;
  const type: PowerUpType = kindRoll < 0.3 ? "shield" : kindRoll < 0.57 ? "overdrive" : kindRoll < 0.79 ? "weapon" : "rapid";
  return { id, type, x, y };
};

export const movePowerUps = (drops: PowerUp[], delta: number, height: number) =>
  drops.map(drop => ({ ...drop, y: drop.y + delta * 0.052 })).filter(drop => drop.y < height - 36);

export const collectPowerUp = (status: PowerStatus, type: PowerUpType, durationMs = POWER_UP_DURATION_MS): PowerStatus => {
  if (type === "shield") return { ...status, shieldCharges: Math.min(2, status.shieldCharges + 1), shieldMs: durationMs };
  if (type === "weapon") return { ...status, weaponLevel: Math.min(5, (status.weaponLevel ?? 1) + 1) };
  if (type === "rapid") return { ...status, rapidFireMs: durationMs };
  return { ...status, overdriveMs: durationMs };
};

export const receiveImpacts = (status: PowerStatus, impacts: number): PowerStatus => {
  const absorbed = Math.min(status.shieldCharges, Math.max(0, impacts));
  return { ...status, shieldCharges: status.shieldCharges - absorbed, hearts: Math.max(0, status.hearts - (impacts - absorbed)) };
};

export const resolvePlayerDamage = <T extends PowerStatus>(status: T, impacts: number, shieldActive: boolean): T => {
  if (shieldActive) return receiveImpacts(status, impacts) as T;
  // An inactive shield stays in the inventory; it must never absorb an impact.
  return { ...receiveImpacts({ ...status, shieldCharges: 0 }, impacts), shieldCharges: status.shieldCharges } as T;
};
