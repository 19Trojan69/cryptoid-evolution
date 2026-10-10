import { bossManifest } from './bossManifest.ts';
import { bossName } from './bossNames.ts';
import { bossCardAvailable } from './cardAvailability.ts';
import type { RewardProgress } from './rewardProgress.ts';

/** Map-only names: never replace the campaign's sector or chapter definitions. */
export const galaxyRegions = [
  ['Genesis Sector', '#62c5ff'], ['Violet Expanse', '#c39bff'],
  ['Inferno Belt', '#ff9a67'], ['Frozen Frontier', '#8ad7ff'],
  ['Emerald Rift', '#52e5b2'], ['Golden Dominion', '#f2c16e'],
  ['Void Abyss', '#a98bf6'], ['Quantum Storm', '#83eaff'],
  ['Crimson Dominion', '#fa819d'], ['Final Singularity', '#ffd77c'],
] as const;

export type GalaxyStation = { level: number; x: number; y: number; mini: boolean; trade: boolean; boss: typeof bossManifest[number] | undefined; name?: string };
export const GALAXY_REGION_HEIGHT = 4894;
export const galaxyStations: readonly (readonly GalaxyStation[])[] = galaxyRegions.map((_, region) => {
  let cursor = 120;
  return Array.from({ length: 50 }, (_, index) => {
    const level = (region + 1) * 50 - index;
    const mini = level % 5 === 0, trade = level % 50 === 0;
    const height = (mini ? 148 : 76) + (trade ? 114 : 0);
    const y = cursor + height / 2;
    cursor += height;
    // Separate ports need a centred junction, with generous mobile hit targets.
    const x = mini ? 50 : 50 + Math.sin(level * .31) * 23;
    const boss = level % 10 === 0 ? bossManifest[level / 10 - 1] : undefined;
    return { level, x: Math.round(x * 100) / 100, y, mini, trade, boss, name: boss ? bossName(boss.id) : undefined };
  });
});

export const galaxyPoint = (level: number) => {
  const safe = Math.max(1, Math.min(500, Math.round(level)));
  const region = Math.floor((safe - 1) / 50);
  const station = galaxyStations[region][(region + 1) * 50 - safe];
  return { ...station, region, mapY: (9 - region) * GALAXY_REGION_HEIGHT + station.y };
};

export const galaxyRoute = (stations: readonly GalaxyStation[]) => {
  // SVG x is a percentage and y is in CSS pixels; control points follow each turn.
  const first = stations[0];
  let path = `M 50 0 C 50 70 ${first.x} ${first.y - 60} ${first.x} ${first.y}`;
  for (let index = 1; index < stations.length; index++) {
    const a = stations[index - 1], b = stations[index], middle = (a.y + b.y) / 2;
    path += ` C ${a.x} ${middle} ${b.x} ${middle} ${b.x} ${b.y}`;
  }
  const last = stations[stations.length - 1];
  return `${path} C ${last.x} ${last.y + 70} 50 ${GALAXY_REGION_HEIGHT - 70} 50 ${GALAXY_REGION_HEIGHT}`;
};

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

export const galaxyBossState = (progress: GalaxyProgress, id: number) => {
  const defeated = Number.isInteger(id) && id >= 1 && id <= 50 && (progress.bossWins[id] ?? 0) > 0;
  return { defeated, cardAvailable: defeated && bossCardAvailable(id) };
};

/** Future unlock eligibility, computed retroactively; never starts or rewards a game. */
export const eligibleMiniStations = (completedLevel: number) =>
  Array.from({ length: 100 }, (_, i) => (i + 1) * 5).filter(level => level <= completedLevel);
export const futureMiniGamePolicy = Object.freeze({ enabled: false, replayable: true, medalTiers: ['bronze', 'silver', 'gold'] as const, shardAwardsPerTier: 1 });

export type GalaxySelection = { kind: 'level' | 'mini' | 'boss' | 'trade'; level: number };
