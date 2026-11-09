import type { GalaxyMiniGame } from './galaxyData';

export type ArcadeLabels = {
  playable: string; rating: string; votes: string; ownRating: string; rate: string;
  signIn: string; ratingError: string; noRating: string; scoring: string; lastScore: string;
  bestScore: string; noScore: string; localNote: string; medalGoals: string;
};
export type ArcadeStation = GalaxyMiniGame & {
  description: string; scoring: string; rulesVersion: string; medalLabel: string;
  medalGoals: [number, number, number];
};
export type PublicArcade = { stations: ArcadeStation[]; labels: ArcadeLabels };
type StorageReader = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Launch = { run: string; level: number; rules: string; owner: string | null };
export type ArcadeRecord = { last: number; best: number; medal: number };
const launchKey = 'cryptoid_testnet_arcade_run';
const recordKey = (level: number, rules: string, owner: string | null) =>
  `cryptoid_testnet_arcade_score:${JSON.stringify([level, rules, owner])}`;
const validScore = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0;

export function readArcadeRecord(game: Pick<ArcadeStation, 'level' | 'rulesVersion'>, owner: string | null, storage?: Pick<Storage, 'getItem'>): ArcadeRecord | null {
  try {
    const record = JSON.parse((storage ?? window.localStorage).getItem(recordKey(game.level, game.rulesVersion, owner)) ?? 'null');
    if (record && validScore(record.last) && validScore(record.best) && record.best >= record.last
      && validScore(record.medal) && record.medal <= 3) return record;
  } catch { /* The mission report still shows the score when device storage is unavailable. */ }
  return null;
}

export function markArcadeLaunch(storage: StorageReader, game: ArcadeStation, owner: string | null, run: string) {
  const launch: Launch = { run, level: game.level, rules: game.rulesVersion, owner };
  storage.setItem(launchKey, JSON.stringify(launch));
}

export function claimArcadeResult(hash: string, session: StorageReader, storage: StorageReader): number | null {
  try {
    const launch: Launch | null = JSON.parse(session.getItem(launchKey) ?? 'null');
    const result = new URLSearchParams(hash.replace(/^#/, ''));
    if (!launch || result.get('arcade-run') !== launch.run || result.get('station') !== String(launch.level)
      || !/^[a-f0-9-]{36}$/.test(launch.run) || !/^[a-z0-9-]+$/.test(launch.rules)
      || !Number.isInteger(launch.level) || launch.level < 5 || launch.level > 200 || launch.level % 5 !== 0
      || !/^(0|[1-9]\d*)$/.test(result.get('score') ?? '') || !/^(0|[1-9]\d*)$/.test(result.get('best') ?? '')
      || !/^[0-3]$/.test(result.get('medal') ?? '')) return null;
    const last = Number(result.get('score'));
    const best = Number(result.get('best'));
    if (!validScore(last) || !validScore(best) || best < last) return null;
    const game = { level: launch.level, rulesVersion: launch.rules };
    const previous = readArcadeRecord(game, launch.owner, storage);
    const record = { last, best: Math.max(best, previous?.best ?? 0), medal: Math.max(Number(result.get('medal')), previous?.medal ?? 0) };
    storage.setItem(recordKey(launch.level, launch.rules, launch.owner), JSON.stringify(record));
    session.removeItem(launchKey);
    return launch.level;
  } catch { return null; }
}
