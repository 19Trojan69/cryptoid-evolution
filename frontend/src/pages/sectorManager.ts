export const SECTOR_DURATION_MS = 300_000;
export const SECTOR_INTRO_MS = 5_000;
export const SECTOR_CLEAR_MS = 10_000;

const sectorNames = ["GENESIS BELT", "CRYSTAL CHAIN", "MEME NEBULA", "DARK LEDGER", "MAINNET CORE", "QUANTUM VAULT"] as const;

export type SectorPhase = "SECTOR_INTRO" | "ENTRY" | "FORMATION" | "ATTACK_CYCLE" | "REFORM" | "FINAL_ATTACK" | "SECTOR_CLEAR";

export const sectorName = (number: number) => {
  const index = Math.max(0, number - 1);
  const pass = Math.floor(index / sectorNames.length);
  return `${sectorNames[index % sectorNames.length]}${pass > 0 ? ` ${pass + 1}` : ""}`;
};

export const sectorAt = (elapsedMs: number, returning = false) => {
  const elapsed = Math.max(0, elapsedMs);
  const number = Math.floor(elapsed / SECTOR_DURATION_MS) + 1;
  const sectorElapsed = elapsed % SECTOR_DURATION_MS;
  let phase: SectorPhase;
  if (sectorElapsed < SECTOR_INTRO_MS) phase = "SECTOR_INTRO";
  else if (sectorElapsed < 20_000) phase = "ENTRY";
  else if (sectorElapsed < 30_000) phase = "FORMATION";
  else if (sectorElapsed >= SECTOR_DURATION_MS - SECTOR_CLEAR_MS) phase = "SECTOR_CLEAR";
  else if (sectorElapsed >= 260_000) phase = "FINAL_ATTACK";
  else phase = returning ? "REFORM" : "ATTACK_CYCLE";
  return { number, name: sectorName(number), phase };
};
