import { MAX_DIFFICULTY_LEVEL } from '../../frontend/src/pages/levelDifficulty.ts';
import { campaignLevel, sectorInChapter } from '../../frontend/src/pages/sectorManager.ts';
import { bossForLevel } from '../../frontend/src/pages/bossManifest.ts';

/** Map existing internal stage IDs without renaming visible levels or saves. */
export function campaignSection(stage: number) {
  if (!Number.isInteger(stage) || stage < 1 || stage > MAX_DIFFICULTY_LEVEL)
    throw new RangeError('Invalid campaign stage');
  const boss = bossForLevel(stage);
  return Object.freeze({ stage, level: campaignLevel(stage), block: sectorInChapter(stage),
    kind: boss ? 'boss' as const : 'normal' as const, bossId: boss?.id ?? null });
}

export const campaign = Object.freeze(Array.from({ length: MAX_DIFFICULTY_LEVEL }, (_, index) => campaignSection(index + 1)));
