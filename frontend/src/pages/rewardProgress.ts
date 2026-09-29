// Collectible gameplay progress. These awards have no Pi or cash value.
export const REWARD_PROGRESS_KEY = "cryptoid_reward_progress_v1";
export const BOSS_STICKER_COUNT = 50;
export const CHAIN_MILESTONES = [1, 3, 10, 25, 50] as const;

export type BonusMedal = "bronze" | "silver" | "gold";
export type RewardProgress = {
  bossWins: Record<number, number>;
  completedChains: number[];
  bonusMedals: Record<number, BonusMedal>;
  perfectBonuses: number;
};

export const emptyRewardProgress = (): RewardProgress => ({ bossWins: {}, completedChains: [], bonusMedals: {}, perfectBonuses: 0 });
const validLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= BOSS_STICKER_COUNT;
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
    const bonusMedals: Record<number, BonusMedal> = {};
    for (const [key, value] of Object.entries(stored.bonusMedals ?? {})) {
      const level = Number(key);
      if (validLevel(level) && (value === "bronze" || value === "silver" || value === "gold")) bonusMedals[level] = value;
    }
    return { bossWins, completedChains, bonusMedals, perfectBonuses: Number.isSafeInteger(stored.perfectBonuses) ? Math.max(0, Math.min(stored.perfectBonuses!, 100_000)) : 0 };
  } catch { return emptyRewardProgress(); }
};

export const rewardRank = (progress: RewardProgress) => {
  const wins = Object.keys(progress.bossWins).length;
  return wins >= 50 ? "Legend" : wins >= 25 ? "Veteran" : wins >= 10 ? "Commander" : wins >= 3 ? "Navigator" : wins >= 1 ? "Pilot" : "Rookie";
};

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
