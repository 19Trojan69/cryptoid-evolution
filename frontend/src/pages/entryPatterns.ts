// One arrival choreography per section. The nine patterns repeat in later sections.
export const ENTRY_PATTERNS = [
  "zigzag", "figureEight", "cross", "spiral", "pincer",
  "sweep", "cascade", "diamond", "doubleLoop",
] as const;

export type EntryPattern = typeof ENTRY_PATTERNS[number];

export const entryPatternForSection = (section: number): EntryPattern =>
  ENTRY_PATTERNS[(Math.max(1, section) - 1) % ENTRY_PATTERNS.length];

export const entryStartX = (pattern: EntryPattern, index: number, width: number, radius: number, side: number) => {
  const edge = radius + Math.max(1, width - radius * 2) * .08;
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
};

export const entryPosition = ({ pattern, progress, startX, startY, targetX, targetY, width, height, radius, side, index }: EntryPosition) => {
  const p = Math.max(0, Math.min(1, progress));
  if (p === 0) return { x: startX, y: startY };
  if (p === 1) return { x: targetX, y: targetY };

  const eased = p * p * (3 - 2 * p);
  // The flourish disappears smoothly at both ends, so every flight docks exactly.
  const flourish = Math.sin(Math.PI * p) ** 2;
  const baseX = startX + (targetX - startX) * eased;
  const baseY = startY + (targetY - startY) * eased;
  const phase = index % 2 ? Math.PI : 0;
  let dx = 0;
  let dy = 0;

  switch (pattern) {
    case "zigzag":
      dx = side * width * .27 * flourish * (2 / Math.PI) * Math.asin(Math.sin(6 * Math.PI * p));
      dy = height * .11 * flourish;
      break;
    case "figureEight":
      dx = side * width * .29 * flourish * Math.sin(2 * Math.PI * p);
      dy = height * .17 * flourish * Math.sin(4 * Math.PI * p);
      break;
    case "cross":
      // Opposing wings exchange sides, then return to their assigned slots.
      dx = side * width * .48 * flourish;
      dy = height * .13 * flourish;
      break;
    case "spiral":
      dx = width * .27 * flourish * Math.cos(4 * Math.PI * p + phase);
      dy = height * .16 * flourish * Math.sin(4 * Math.PI * p + phase);
      break;
    case "pincer":
      dx = (width / 2 - baseX) * .94 * flourish;
      dy = height * .19 * flourish * Math.sin(Math.PI * p);
      break;
    case "sweep":
      dx = width * .25 * flourish * Math.sin(Math.PI * p);
      dy = height * .17 * flourish * Math.sin(2 * Math.PI * p);
      break;
    case "cascade":
      dx = width * .19 * flourish * Math.sin(3 * Math.PI * p + index * .65);
      dy = height * .15 * flourish * Math.sin(2 * Math.PI * p + index * .7);
      break;
    case "diamond":
      dx = side * width * .3 * flourish * Math.sin(2 * Math.PI * p);
      dy = height * .18 * flourish * Math.abs(Math.sin(2 * Math.PI * p));
      break;
    case "doubleLoop":
      dx = side * width * .25 * flourish * Math.sin(4 * Math.PI * p);
      dy = height * .14 * flourish * (1 - Math.cos(4 * Math.PI * p));
      break;
  }

  return {
    x: Math.max(radius, Math.min(width - radius, baseX + dx)),
    y: Math.max(radius, Math.min(height * .62, baseY + dy)),
  };
};
