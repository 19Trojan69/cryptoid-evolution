import type { GalaxyMiniGame } from './galaxyData';
import type { ArcadeStickerLabels } from '../../../backend/src/galaxyArcadeStickerCopy';
import { arcadeLaunchKey, arcadeRankIds, arcadeRunId } from '../../../backend/src/galaxyArcadeStickerSchema.ts';
export { arcadeStickerAlbumName } from '../../../backend/src/galaxyArcadeStickerSchema.ts';

export const retroMiniGamesName = 'Retro Mini Games';
export const retroMiniGameName = 'Retro Mini Game';

export type ArcadeLabels = {
  playable: string; rating: string; votes: string; ownRating: string; rate: string;
  signIn: string; ratingError: string; noRating: string; scoring: string; lastScore: string;
  bestScore: string; noScore: string; localNote: string; stickers: ArcadeStickerLabels;
};
export type ArcadeStation = GalaxyMiniGame & {
  description: string; scoring: string; rulesVersion: string; medalLabel: string;
  medalGoals: [number, number, number, number, number, number];
};
export type PublicArcade = { owner: string | null; levels: number[]; stations: ArcadeStation[]; labels: ArcadeLabels };
type StorageReader = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Launch = { run: string; level: number; rules: string; owner: string | null };
export type ArcadeRecord = { last: number; best: number; rank: number };
const recordKey = (level: number, rules: string, owner: string | null) =>
  `cryptoid_testnet_arcade_score:${JSON.stringify([level, rules, owner])}`;
const validScore = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0;
const validRank = (value: unknown): value is number => validScore(value) && value <= arcadeRankIds.length;

export const isPublicArcadeLevel = (level: number) =>
  Number.isInteger(level) && level >= 5 && level <= 200 && level % 5 === 0;

export function readArcadeRecord(game: Pick<ArcadeStation, 'level' | 'rulesVersion'>, owner: string | null, storage?: Pick<Storage, 'getItem'>): ArcadeRecord | null {
  try {
    const record = JSON.parse((storage ?? window.localStorage).getItem(recordKey(game.level, game.rulesVersion, owner)) ?? 'null');
    if (record && validScore(record.last) && validScore(record.best) && record.best >= record.last) {
      // Scores predate the six ranks. A legacy medal never represents an earned sticker.
      return { last: record.last, best: record.best, rank: validRank(record.rank) ? record.rank : 0 };
    }
  } catch { /* The mission report still shows the score when device storage is unavailable. */ }
  return null;
}

export function markArcadeLaunch(storage: StorageReader, game: ArcadeStation, owner: string | null, run: string) {
  const launch: Launch = { run, level: game.level, rules: game.rulesVersion, owner };
  storage.setItem(arcadeLaunchKey, JSON.stringify(launch));
}

export function claimArcadeResult(hash: string, session: StorageReader, storage: StorageReader): number | null {
  try {
    const launch: Launch | null = JSON.parse(session.getItem(arcadeLaunchKey) ?? 'null');
    const result = new URLSearchParams(hash.replace(/^#/, ''));
    const rankText = result.get('rank');
    const rank = rankText === null && /^[0-3]$/.test(result.get('medal') ?? '') ? 0
      : rankText !== null && /^\d$/.test(rankText) ? Number(rankText) : NaN;
    if (!launch || result.get('arcade-run') !== launch.run || result.get('station') !== String(launch.level)
      || !arcadeRunId.test(launch.run) || !/^[a-z0-9-]+$/.test(launch.rules)
      || !isPublicArcadeLevel(launch.level)
      || !/^(0|[1-9]\d*)$/.test(result.get('score') ?? '') || !/^(0|[1-9]\d*)$/.test(result.get('best') ?? '')
      || !validRank(rank)) return null;
    const last = Number(result.get('score'));
    const best = Number(result.get('best'));
    if (!validScore(last) || !validScore(best) || best < last) return null;
    const game = { level: launch.level, rulesVersion: launch.rules };
    const previous = readArcadeRecord(game, launch.owner, storage);
    const record = { last, best: Math.max(best, previous?.best ?? 0), rank: Math.max(rank, previous?.rank ?? 0) };
    storage.setItem(recordKey(launch.level, launch.rules, launch.owner), JSON.stringify(record));
    session.removeItem(arcadeLaunchKey);
    return launch.level;
  } catch { return null; }
}
