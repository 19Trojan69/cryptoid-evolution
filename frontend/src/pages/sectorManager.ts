// One encounter per visible block. The tenth slot is the boss and bonus.
export const SECTIONS_PER_SECTOR = 1;
export const SECTION_INTRO_MS = 3_200;
export const SECTION_CLEAR_MS = 8_500;
export const ENTRY_GAP_MS = 220;
export const FORMATION_SETTLE_MS = 450;
export const FIRST_ATTACK_DELAY_MS = 750;

const sectorNames = ["GENESIS BELT", "CRYSTAL CHAIN", "MEME NEBULA", "DARK LEDGER", "MAINNET CORE", "QUANTUM VAULT"] as const;

export type SectorPhase = "SECTOR_INTRO" | "ENTRY" | "FORMATION" | "ATTACK_CYCLE" | "REFORM" | "SECTOR_CLEAR";

// Each named region contains ten levels and closes with its boss and bonus.
export const sectorChapter = (level: number) => Math.floor((Math.max(1, level) - 1) / 10);
export const campaignLevel = (sector: number) => sectorChapter(sector) + 1;
export const sectorInChapter = (sector: number) => (Math.max(1, sector) - 1) % 10 + 1;

// Later campaign levels add one separate reinforcement flight to blocks 7–9.
// It docks in the same raster so the phone playfield never becomes overcrowded.
export const reinforcementCount = (sector: number) => {
  const level = campaignLevel(sector);
  const block = sectorInChapter(sector);
  return level >= 10 && block >= 7 && block <= 9 ? Math.min(6, 4 + Math.floor((level - 10) / 10)) : 0;
};

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

// The first coordinate anchors the largest ship on the horizontal centerline.
// Each block has a recognisable resting silhouette, repeated in the next level.
export const BLOCK_FORMATION_NAMES = ["Ranks", "V", "W", "Ring", "Wave", "X", "A", "Columns", "Diamond"] as const;
const blockFormations: readonly (readonly (readonly [number, number])[])[] = [
  [[0, -.7], [0, .7], [-1, -.7], [1, -.7], [-1, .7], [1, .7]], // two ranks
  [[0, .95], [0, -.95], [-1, -.95], [1, -.95], [-.7, -.05], [.7, -.05]], // V
  [[0, .7], [0, -.8], [-1, -.95], [1, -.95], [-1, .9], [1, .9]], // W
  [[0, -.3], [0, 1], [-1, 0], [1, 0], [-.65, -1.1], [.65, -1.1]], // ring
  [[0, .05], [0, -1.05], [-1, -.85], [1, -.65], [-1, .65], [1, .85]], // wave
  [[0, 0], [0, -1.25], [-1, -1], [1, -1], [-1, 1], [1, 1]], // X
  [[0, .2], [0, -1.1], [-1, -.1], [1, -.1], [-1, 1], [1, 1]], // A
  [[0, 0], [0, 1.05], [-1, -1], [1, -1], [-1, 0], [1, 0]], // side-by-side columns
  [[0, 0], [0, -1.1], [-1, -.3], [1, -.3], [-.85, .95], [.85, .95]], // diamond
];

// Four ships keep the central leader, an end point and a matched pair;
// five ships keep the leader and two matched pairs. Never paint unused targets.
export const formationSlotsForCount = <T>(slots: T[], count: number): T[] => {
  if (count === 4) return [slots[0], slots[1], slots[2], slots[3]];
  if (count === 5) return [slots[0], slots[2], slots[3], slots[4], slots[5]];
  return slots.slice(0, count);
};

export const formationLayout = (section: number, width: number, height: number, sector = sectorForSection(section)) => {
  const variant = (sectorInChapter(sector) - 1) % 9;
  const shape = blockFormations[variant];
  const mobile = width < 760;
  const xUnit = mobile ? Math.min(118, (width - 104) / 2) : Math.min(250, width * .25);
  const yUnit = mobile ? Math.min(90, height * .13) : Math.min(125, height * .16);
  const centerY = height * .31;
  return shape.map(([px, py], index) => ({
    index, x: width / 2 + px * xUnit, y: centerY + py * yUnit,
    anchor: index === 0,
    row: Math.floor(index / 3), column: index % 3,
    entrySide: (index + section) % 2 === 0 ? 1 : -1,
  }));
};

export const arrangeFormationBySize = <T extends { index: number; x: number; y: number; anchor?: boolean }>(slots: T[], sizes: number[]) => {
  if (slots.length !== sizes.length) return slots;
  const centerX = slots.reduce((sum, slot) => sum + slot.x, 0) / Math.max(1, slots.length);
  const centerY = slots.reduce((sum, slot) => sum + slot.y, 0) / Math.max(1, slots.length);
  const centralSlots = [...slots].sort((a, b) =>
    Number(!!b.anchor) - Number(!!a.anchor)
    || Math.abs(a.x - centerX) - Math.abs(b.x - centerX)
    || Math.abs(a.y - centerY) - Math.abs(b.y - centerY)
    || a.index - b.index);
  const enemiesBySize = sizes.map((size, index) => ({ size, index }))
    .sort((a, b) => b.size - a.size || a.index - b.index);
  const arranged = Array<T>(slots.length);
  enemiesBySize.forEach((enemy, rank) => { arranged[enemy.index] = centralSlots[rank]; });
  return arranged;
};

// Move the whole formation together, including its ships' actual destinations.
// Include the target's lock pulse and a gap for the label below the cockpit HUD.
export const formationBelowHud = <T extends { y: number }>(slots: T[], radii: number[], width: number, hudBottom: number): T[] => {
  if (width <= 700 || slots.length === 0) return slots;
  const top = Math.min(...slots.map((slot, index) => slot.y - ((radii[index] + 4) * 1.35 + 12)));
  const offset = Math.max(0, hudBottom + 28 - top);
  return offset === 0 ? slots : slots.map(slot => ({ ...slot, y: slot.y + offset }));
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
