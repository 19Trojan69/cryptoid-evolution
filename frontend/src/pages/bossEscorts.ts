import type { SectorBoss } from "./sectorBoss.ts";

// Bosses 1–5 fight alone. Escorts grow by one ship every nine bosses, capped
// at six active hulls on phones; the later half-health wave is smaller.
export const bossEscortCount = (level: number) => level < 60 ? 0 : Math.min(6, 2 + Math.floor((level - 60) / 90));
export const bossEscortReinforcements = (level: number) => level < 240 ? 0 : Math.max(2, Math.floor(bossEscortCount(level) / 2));
export const bossEscortAttackInterval = (level: number) => Math.max(1_050, 2_200 - Math.max(0, Math.min(1, (level - 60) / 440)) * 1_150);
export const bossEscortRosterIndex = (index: number, wave: number) => [0, 1, 5][index % 3] + Math.floor(index / 3) * 6 + wave * 18;

export const bossEscortSlots = (level: number, width: number, height: number, boss: Pick<SectorBoss, "x" | "y" | "height">, count: number) => {
  const radius = 18;
  // Keep a collision-radius gap above the highest possible player position.
  const upper = height * .5 - radius - 27 - 4;
  const lower = boss.y + boss.height / 2 + Math.min(height * .04, 32) + radius + 6;
  if (count <= 0 || upper < lower) return [];
  const twoRows = count >= 4 && upper - lower >= 62;
  const rowGap = twoRows ? 56 : 0;
  const centerY = Math.max(lower + rowGap / 2, Math.min(upper - rowGap / 2, height * .39));
  const topCount = twoRows ? Math.ceil(count / 2) : count;
  return Array.from({ length: count }, (_, index) => {
    const row = twoRows && index >= topCount ? 1 : 0;
    const column = row ? index - topCount : index;
    const rowCount = row ? count - topCount : topCount;
    const margin = radius + 12;
    const gap = rowCount > 1 ? Math.min(92, (width - 2 * margin) / (rowCount - 1)) : 0;
    const stagger = twoRows && row ? (level / 10) % 2 ? -7 : 7 : 0;
    return {
      index, x: Math.max(margin, Math.min(width - margin, width / 2 + (column - (rowCount - 1) / 2) * gap + stagger)),
      y: centerY + (row ? rowGap / 2 : -rowGap / 2),
      anchor: index === 0, row, column,
      entrySide: index % 2 === 0 ? 1 : -1,
    };
  });
};
