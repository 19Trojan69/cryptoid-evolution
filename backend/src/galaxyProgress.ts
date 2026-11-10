import type { RewardProgress } from "./rewardRules";

const stage = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= 500 ? value : 1;
export type GalaxyProgress = { currentLevel: number; completedLevel: number; bossWins: Readonly<Record<number, number>> };
export const emptyGalaxyProgress = (): GalaxyProgress => ({ currentLevel: 1, completedLevel: 0, bossWins: {} });

/** Derived read model only. highestSector is the next reached stage, not completion. */
export function galaxyProgress(rewards: RewardProgress, highestSector = 1): GalaxyProgress {
  let completed = Math.max(stage(highestSector) - 1, stage(rewards.highestLevel) - 1);
  for (const [chapter, blocks] of Object.entries(rewards.linkedBlocks)) {
    const id = Number(chapter);
    if (Number.isInteger(id) && id >= 1 && id <= 50 && Number.isInteger(blocks) && blocks >= 1 && blocks <= 9) completed = Math.max(completed, (id - 1) * 10 + blocks);
  }
  const wins: Record<number, number> = {};
  for (const [boss, count] of Object.entries(rewards.bossWins)) {
    const id = Number(boss);
    if (Number.isInteger(id) && id >= 1 && id <= 50 && Number.isSafeInteger(count) && count > 0) {
      wins[id] = count;
      completed = Math.max(completed, id * 10);
    }
  }
  completed = Math.min(500, completed);
  return { completedLevel: completed, currentLevel: Math.min(500, completed + 1), bossWins: wins };
}
