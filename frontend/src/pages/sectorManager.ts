// One encounter per visible block. The tenth slot is the boss and bonus.
export const SECTIONS_PER_SECTOR = 1;
export const SECTION_INTRO_MS = 3_200;
export const SECTION_CLEAR_MS = 5_800;
export const ENTRY_GAP_MS = 220;
export const FORMATION_SETTLE_MS = 450;
export const FIRST_ATTACK_DELAY_MS = 750;

const sectorNames = ["GENESIS BELT", "CRYSTAL CHAIN", "MEME NEBULA", "DARK LEDGER", "MAINNET CORE", "QUANTUM VAULT"] as const;

export type SectorPhase = "SECTOR_INTRO" | "ENTRY" | "FORMATION" | "ATTACK_CYCLE" | "REFORM" | "SECTOR_CLEAR";

// Each named region contains ten levels and closes with its boss and bonus.
export const sectorChapter = (level: number) => Math.floor((Math.max(1, level) - 1) / 10);
export const campaignLevel = (sector: number) => sectorChapter(sector) + 1;
export const sectorInChapter = (sector: number) => (Math.max(1, sector) - 1) % 10 + 1;

export const sectorName = (number: number) => {
  const index = sectorChapter(number);
  const pass = Math.floor(index / sectorNames.length);
  return `${sectorNames[index % sectorNames.length]}${pass > 0 ? ` ${pass + 1}` : ""}`;
};

export const sectorForSection = (section: number) => Math.floor((Math.max(1, section) - 1) / SECTIONS_PER_SECTOR) + 1;
export const sectionInSector = (section: number) => (Math.max(1, section) - 1) % SECTIONS_PER_SECTOR + 1;

export const formationReady = ({ spawned, total, alive, ready }: {
  spawned: number; total: number; alive: number; ready: number;
}) => spawned === total && alive > 0 && ready === alive;

// The nine normal blocks use different *resting* layouts. Coordinates are
// authored as shapes, not offsets applied to the old three-by-two grid.
const mobileFormations = [
  [[-1, -.7], [0, -.7], [1, -.7], [-1, .7], [0, .7], [1, .7]], // ranks
  [[-1, -.9], [-.85, .42], [0, -.26], [0, 1], [.85, .42], [1, -.9]], // V
  [[-1, -.9], [-1, .48], [0, -.42], [0, .96], [1, -.9], [1, .48]], // W
  [[-1, 0], [-.5, -1], [.5, -1], [1, 0], [.5, 1], [-.5, 1]], // ring
  [[-1, -1], [-1, .45], [0, -.28], [0, 1], [1, -1], [1, .45]], // figure eight
  [[0, -1], [-1, -.72], [1, -.72], [-1, .72], [1, .72], [0, 1]], // diamond
  [[-1, 1], [-.85, -.42], [0, .26], [0, -1], [.85, -.42], [1, 1]], // inverted V
  [[-1, -.9], [-1, .48], [0, -.9], [0, .48], [1, -.9], [1, .48]], // paired columns
  [[-1, -.9], [-.85, .42], [0, -1], [0, .26], [.85, .42], [1, -.9]], // crown
] as const;

export const formationLayout = (section: number, width: number, height: number, sector = sectorForSection(section)) => {
  const variant = (sectorInChapter(sector) - 1) % 9;
  const shape = mobileFormations[variant];
  const mobile = width < 760;
  const columnBends = [
    [0, 0, 0, 0, 0], [0, 12, 24, 12, 0], [0, 22, 0, 22, 0],
    [18, 0, -18, 0, 18], [-15, 15, 0, 15, -15], [16, -10, -22, -10, 16],
    [24, 12, 0, 12, 24], [-18, 12, -18, 12, -18], [-20, 8, 24, 8, -20],
  ];
  const points: readonly (readonly [number, number])[] = mobile ? shape : Array.from({ length: 15 }, (_, index) => {
    const row = Math.floor(index / 5);
    const column = index % 5;
    return [column - 2, row - 1 + columnBends[variant][column] / 112] as const;
  });
  const xUnit = mobile ? Math.min(118, (width - 104) / 2) : Math.min(112, Math.max(102, width * .095));
  const yUnit = mobile ? Math.min(80, height * .115) : Math.min(112, Math.max(106, height * .135));
  const centerY = mobile ? height * .29 : height * .15 + yUnit;
  return points.map(([px, py], index) => ({
    index, x: width / 2 + px * xUnit, y: centerY + py * yUnit,
    row: Math.floor(index / (mobile ? 3 : 5)), column: index % (mobile ? 3 : 5),
    entrySide: (index + section) % 2 === 0 ? 1 : -1,
  }));
};

export const arrangeFormationBySize = <T extends { index: number; x: number; y: number }>(slots: T[], sizes: number[]) => {
  if (slots.length !== sizes.length) return slots;
  const centerX = slots.reduce((sum, slot) => sum + slot.x, 0) / Math.max(1, slots.length);
  const centerY = slots.reduce((sum, slot) => sum + slot.y, 0) / Math.max(1, slots.length);
  const centralSlots = [...slots].sort((a, b) =>
    Math.abs(a.x - centerX) - Math.abs(b.x - centerX)
    || Math.abs(a.y - centerY) - Math.abs(b.y - centerY)
    || a.index - b.index);
  const enemiesBySize = sizes.map((size, index) => ({ size, index }))
    .sort((a, b) => b.size - a.size || a.index - b.index);
  const arranged = Array<T>(slots.length);
  enemiesBySize.forEach((enemy, rank) => { arranged[enemy.index] = centralSlots[rank]; });
  return arranged;
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
