// One arrival choreography per normal sector; sectors 10, 20, ... are boss fights.
export const ENTRY_PATTERNS = [
  "zigzag", "figureEight", "cross", "spiral", "pincer",
  "sweep", "cascade", "diamond", "doubleLoop",
] as const;

export type EntryPattern = typeof ENTRY_PATTERNS[number];

export const entryPatternForSector = (sector: number): EntryPattern =>
  ENTRY_PATTERNS[(Math.max(1, sector) - 1) % 10 % ENTRY_PATTERNS.length];

export const entryStartX = (pattern: EntryPattern, index: number, width: number, radius: number, side: number, stage = 500, targetX = width / 2) => {
  const edge = radius + Math.max(1, width - radius * 2) * .08;
  if (stage >= 1 && stage <= 9) {
    const starts = [targetX, edge, width - edge,
      side === 1 ? edge : width - edge,
      targetX + (index % 2 ? 1 : -1) * width * .12,
      edge, side === 1 ? edge : width - edge,
      radius + (width - radius * 2) * (.18 + (index % 3) * .32),
      side === 1 ? edge : width - edge];
    return Math.max(radius, Math.min(width - radius, starts[Math.floor(stage) - 1]));
  }
  if (pattern === "sweep") return edge;
  if (pattern === "diamond") return width / 2 + (index % 2 ? 1 : -1) * Math.min(width * .1, 55);
  if (pattern === "cascade") return radius + (width - radius * 2) * (.18 + (index % 3) * .32);
  return side === 1 ? edge : width - edge;
};

type EntryPosition = {
  pattern: EntryPattern;
  progress: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  radius: number;
  side: number;
  index: number;
  stage?: number;
};

export const entryPosition = ({ progress, startX, startY, targetX, targetY, width, radius, side, index, stage = 500 }: EntryPosition) => {
  const p = Math.max(0, Math.min(1, progress));
  if (p === 0) return { x: startX, y: startY };
  if (p === 1) return { x: targetX, y: targetY };

  // A single cubic arc, with no oscillation or reversal. The changing
  // formation is visible after docking; arrival only carries each hull there.
  const intro = stage >= 1 && stage <= 9;
  const curve = stage === 1 ? 0 : side * Math.min(width * .09, 34) * (intro && stage <= 3 ? .45 : 1);
  const bias = stage === 1 ? 0 : (index % 3 - 1) * 5;
  const controlX1 = Math.max(radius, Math.min(width - radius, startX + curve + bias));
  const controlX2 = Math.max(radius, Math.min(width - radius, targetX - curve * .55));
  const controlY1 = startY + (targetY - startY) * .32;
  const controlY2 = startY + (targetY - startY) * .72;
  const inverse = 1 - p;
  let x = inverse ** 3 * startX + 3 * inverse ** 2 * p * controlX1
    + 3 * inverse * p ** 2 * controlX2 + p ** 3 * targetX;
  const y = inverse ** 3 * startY + 3 * inverse ** 2 * p * controlY1
    + 3 * inverse * p ** 2 * controlY2 + p ** 3 * targetY;
  // Introduce just one shallow S bend in block eight; later arrivals retain
  // their existing arc. All arrivals stay above the player's flight area.
  if (stage === 8) x += side * Math.min(18, width * .04) * Math.sin(2 * Math.PI * p) * Math.sin(Math.PI * p);
  return { x: Math.max(radius, Math.min(width - radius, x)), y };
};
