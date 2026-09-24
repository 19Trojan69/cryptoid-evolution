export const BONUS_TARGET_COUNT = 12;
export const BONUS_ENTRY_GAP_MS = 950;
export const BONUS_FLIGHT_MS = 3_600;

export type BonusTarget = { id: number; index: number; elapsed: number; x: number; y: number; radius: number };

export const isBonusSection = (section: number) => section > 0 && section % 3 === 0;

export const bonusPosition = (index: number, elapsed: number, width: number, height: number) => {
  const progress = Math.min(1, elapsed / BONUS_FLIGHT_MS);
  const direction = index % 2 === 0 ? 1 : -1;
  const x = direction === 1 ? -25 + (width + 50) * progress : width + 25 - (width + 50) * progress;
  const y = height * (.24 + (index % 3) * .065 + .12 * Math.sin(Math.PI * progress));
  return { x, y };
};

export const bonusReward = (hits: number) => {
  if (hits === BONUS_TARGET_COUNT) return { label: "PERFECT CRYPTO HUNT", points: 2_000, shards: 12, powerUps: ["repair", "shield"] as const };
  if (hits >= 9) return { label: "GOLD NETWORK", points: 1_000, shards: 7, powerUps: ["repair"] as const };
  if (hits >= 5) return { label: "NETWORK LINK", points: 500, shards: 4, powerUps: ["shield"] as const };
  return { label: "CHALLENGE COMPLETE", points: 0, shards: hits > 0 ? 2 : 0, powerUps: [] as const };
};
