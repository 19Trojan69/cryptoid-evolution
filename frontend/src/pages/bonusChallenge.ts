import { playerColors, type PlayerColorId } from "./shipFleet.ts";

export const BONUS_TARGET_COUNT = 12;
export const BONUS_FLIGHT_MS = 3_600;
const bonusEntryGaps = [720, 1_120, 640, 1_340, 860, 980] as const;

export const bonusEntryGap = (index: number) => bonusEntryGaps[Math.max(0, index) % bonusEntryGaps.length];

export type BonusTarget = { id: number; index: number; elapsed: number; x: number; y: number; radius: number; sprite: number; color: PlayerColorId };

export const isBonusSection = (section: number) => section > 0 && section % 3 === 0;

export const bonusPosition = (index: number, elapsed: number, width: number, height: number) => {
  const progress = Math.min(1, elapsed / BONUS_FLIGHT_MS);
  const direction = index % 2 === 0 ? 1 : -1;
  const lane = Math.floor(index / 2) % 3;
  const pattern = Math.floor(index / 2) % 5;
  const envelope = Math.sin(Math.PI * progress);
  const baseX = direction === 1 ? -25 + (width + 50) * progress : width + 25 - (width + 50) * progress;
  const baseY = height * (.22 + lane * .065);
  let x = baseX;
  let y = baseY;

  if (pattern === 0) {
    y += height * .13 * envelope;
  } else if (pattern === 1) {
    // A horizontal figure eight. Opposing pairs cross at its centre.
    x += direction * width * .055 * Math.sin(4 * Math.PI * progress) * envelope;
    y += height * .105 * Math.sin(2 * Math.PI * progress) * envelope;
  } else if (pattern === 2) {
    // A broad loop that remains inside the readable upper playfield.
    x += direction * width * .09 * Math.sin(2 * Math.PI * progress) * envelope;
    y += height * .065 * (1 - Math.cos(2 * Math.PI * progress));
  } else if (pattern === 3) {
    // Two compact spiral turns while the group travels across the screen.
    x += direction * width * .075 * Math.cos(4 * Math.PI * progress) * envelope;
    y += height * .095 * Math.sin(4 * Math.PI * progress) * envelope;
  } else {
    x += direction * width * .05 * Math.sin(3 * Math.PI * progress) * envelope;
    y += height * .085 * Math.sin(3 * Math.PI * progress) * envelope;
  }
  return { x, y };
};

// Every bonus round showcases twelve different purchasable hulls. The
// nineteen non-boss sprites rotate between sectors, while metallic paints
// vary independently so the flight doubles as a shop preview.
export const bonusShowcaseShip = (index: number, sector: number) => ({
  sprite: ((Math.max(1, sector) - 1) * 5 + index * 7) % 19,
  color: playerColors[(index + (Math.max(1, sector) - 1) * 3) % playerColors.length].id,
});

export const bonusReward = (hits: number) => {
  if (hits === BONUS_TARGET_COUNT) return { label: "PERFECT CRYPTO HUNT", points: 2_000, shards: 12, powerUps: ["shield"] as const };
  if (hits >= 9) return { label: "GOLD NETWORK", points: 1_000, shards: 7, powerUps: [] as const };
  if (hits >= 5) return { label: "NETWORK LINK", points: 500, shards: 4, powerUps: ["shield"] as const };
  return { label: "CHALLENGE COMPLETE", points: 0, shards: hits > 0 ? 2 : 0, powerUps: [] as const };
};

export const bonusHeartReward = (hits: number, hearts: number) =>
  hits === BONUS_TARGET_COUNT && hearts < 3 ? 1 : 0;
