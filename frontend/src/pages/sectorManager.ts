export const SECTIONS_PER_SECTOR = 3;
export const SECTION_INTRO_MS = 2_200;
export const SECTION_CLEAR_MS = 2_400;
export const ENTRY_GAP_MS = 520;

const sectorNames = ["GENESIS BELT", "CRYSTAL CHAIN", "MEME NEBULA", "DARK LEDGER", "MAINNET CORE", "QUANTUM VAULT"] as const;

export type SectorPhase = "SECTOR_INTRO" | "ENTRY" | "FORMATION" | "ATTACK_CYCLE" | "REFORM" | "SECTOR_CLEAR";

export const sectorName = (number: number) => {
  const index = Math.max(0, number - 1);
  const pass = Math.floor(index / sectorNames.length);
  return `${sectorNames[index % sectorNames.length]}${pass > 0 ? ` ${pass + 1}` : ""}`;
};

export const sectorForSection = (section: number) => Math.floor((Math.max(1, section) - 1) / SECTIONS_PER_SECTOR) + 1;
export const sectionInSector = (section: number) => (Math.max(1, section) - 1) % SECTIONS_PER_SECTOR + 1;

export const formationLayout = (section: number, width: number, height: number) => {
  const columns = width < 760 ? 3 : 5;
  const rows = width < 760 ? 2 : 3;
  return Array.from({ length: columns * rows }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    // Alternate arrival order within each row; the final positions remain a stable grid.
    const arrivalColumn = row % 2 ? columns - 1 - column : column;
    const x = width * (columns === 3 ? .17 + arrivalColumn * .33 : .15 + arrivalColumn * .175);
    const y = height * (rows === 2 ? .21 + row * .18 : .16) + (rows === 3 ? row * Math.max(100, height * .12) : 0);
    return { index, x, y, row, column: arrivalColumn, entrySide: (row + column + section) % 2 === 0 ? 1 : -1 };
  });
};

export const sectionPhase = ({ introMs, spawned, total, alive, ready, returning, attacking }: {
  introMs: number; spawned: number; total: number; alive: number; ready: number; returning: boolean; attacking: boolean;
}): SectorPhase => {
  if (introMs < SECTION_INTRO_MS) return "SECTOR_INTRO";
  if (spawned === total && alive === 0) return "SECTOR_CLEAR";
  if (spawned < total || ready < alive) return "ENTRY";
  if (returning) return "REFORM";
  return attacking ? "ATTACK_CYCLE" : "FORMATION";
};
