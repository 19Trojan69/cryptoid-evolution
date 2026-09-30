// Collectible gameplay progress. These awards have no Pi or cash value.
export const BOSS_STICKER_COUNT = 50;
export const CHAIN_MILESTONES = [1, 3, 10, 25, 50] as const;

export type BonusMedal = "bronze" | "silver" | "gold";
export type RewardProgress = {
  bossWins: Record<number, number>;
  completedChains: number[];
  linkedBlocks: Record<number, number>;
  bonusMedals: Record<number, BonusMedal>;
  perfectBonuses: number;
  highestLevel: number;
};

export const emptyRewardProgress = (): RewardProgress => ({ bossWins: {}, completedChains: [], linkedBlocks: {}, bonusMedals: {}, perfectBonuses: 0, highestLevel: 1 });
const validLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= BOSS_STICKER_COUNT;
const validStage = (level: number) => Number.isInteger(level) && level >= 1 && level <= 500;
const medalValue = (medal: BonusMedal) => ({ bronze: 1, silver: 2, gold: 3 })[medal];

export const readRewardProgress = (raw: string | null): RewardProgress => {
  if (!raw) return emptyRewardProgress();
  try {
    const stored = JSON.parse(raw) as Partial<RewardProgress>;
    const bossWins: Record<number, number> = {};
    for (const [key, value] of Object.entries(stored.bossWins ?? {})) {
      const level = Number(key);
      if (validLevel(level) && Number.isSafeInteger(value) && value > 0) bossWins[level] = Math.min(value, 3);
    }
    const completedChains = Array.isArray(stored.completedChains)
      ? [...new Set(stored.completedChains.filter(validLevel))].sort((a, b) => a - b)
      : [];
    const linkedBlocks: Record<number, number> = {};
    for (const [key, value] of Object.entries(stored.linkedBlocks ?? {})) {
      const level = Number(key);
      if (validLevel(level) && Number.isSafeInteger(value) && value > 0) linkedBlocks[level] = Math.min(9, value);
    }
    for (const level of completedChains) linkedBlocks[level] = 9;
    const bonusMedals: Record<number, BonusMedal> = {};
    for (const [key, value] of Object.entries(stored.bonusMedals ?? {})) {
      const level = Number(key);
      if (validLevel(level) && (value === "bronze" || value === "silver" || value === "gold")) bonusMedals[level] = value;
    }
    return { bossWins, completedChains, linkedBlocks, bonusMedals, perfectBonuses: Number.isSafeInteger(stored.perfectBonuses) ? Math.max(0, Math.min(stored.perfectBonuses!, 100_000)) : 0, highestLevel: Number.isSafeInteger(stored.highestLevel) ? Math.max(1, Math.min(stored.highestLevel!, 500)) : 1 };
  } catch { return emptyRewardProgress(); }
};

export const rankTiers = [
  { level: 1, name: "Rookie", symbol: "◇" },
  { level: 11, name: "Pilot", symbol: "✦" },
  { level: 51, name: "Navigator", symbol: "✧" },
  { level: 101, name: "Lieutenant", symbol: "◆" },
  { level: 201, name: "Commander", symbol: "❖" },
  { level: 301, name: "Captain", symbol: "✪" },
  { level: 401, name: "Admiral", symbol: "✹" },
  { level: 500, name: "Legend", symbol: "★" },
] as const;
export const rankForLevel = (level: number) => [...rankTiers].reverse().find(tier => level >= tier.level) ?? rankTiers[0];
export const rewardRank = (progress: RewardProgress) => rankForLevel(progress.highestLevel).name;
export const reachLevel = (progress: RewardProgress, level: number) =>
  validStage(level) ? { ...progress, highestLevel: Math.max(progress.highestLevel, level) } : progress;

export const awardBossSticker = (progress: RewardProgress, bossId: number) => {
  if (!validLevel(bossId)) return { progress, newSticker: false, stars: 0 };
  const previous = progress.bossWins[bossId] ?? 0;
  return {
    progress: { ...progress, bossWins: { ...progress.bossWins, [bossId]: Math.min(3, previous + 1) } },
    newSticker: previous === 0,
    stars: Math.min(3, previous + 1),
  };
};

export const awardChain = (progress: RewardProgress, level: number) => {
  if (!validLevel(level) || progress.completedChains.includes(level)) return { progress, milestone: 0 };
  const completedChains = [...progress.completedChains, level].sort((a, b) => a - b);
  return { progress: { ...progress, completedChains }, milestone: CHAIN_MILESTONES.includes(completedChains.length as typeof CHAIN_MILESTONES[number]) ? completedChains.length : 0 };
};

export const awardBlock = (progress: RewardProgress, level: number, block: number) =>
  validLevel(level) && Number.isInteger(block) && block >= 1 && block <= 9
    ? { ...progress, linkedBlocks: { ...progress.linkedBlocks, [level]: Math.max(progress.linkedBlocks[level] ?? 0, block) } }
    : progress;

export const awardBonusMedal = (progress: RewardProgress, level: number, hits: number) => {
  if (!validLevel(level) || hits < 5 || hits > 12) return { progress, medal: null, improved: false };
  const medal: BonusMedal = hits === 12 ? "gold" : hits >= 9 ? "silver" : "bronze";
  const previous = progress.bonusMedals[level];
  return {
    progress: {
      ...progress,
      bonusMedals: medalValue(medal) > (previous ? medalValue(previous) : 0) ? { ...progress.bonusMedals, [level]: medal } : progress.bonusMedals,
      perfectBonuses: progress.perfectBonuses + (hits === 12 ? 1 : 0),
    },
    medal,
    improved: medalValue(medal) > (previous ? medalValue(previous) : 0),
  };
};
