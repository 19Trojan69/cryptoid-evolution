import { enemyAppearance } from './shipFleet.ts';
import { shipEvolutionAsset } from './shipEvolution.ts';
import { bonusShowcaseShip } from './bonusChallenge.ts';
import { bossEscortRosterIndex } from './bossEscorts.ts';
import { bossForLevel } from './bossManifest.ts';

export function hullSourcePlan(sector: number, encounter: string, offset: number, wave: number) {
  const urls: string[] = [];
  if (encounter.startsWith('boss')) {
    const boss = bossForLevel(sector);
    if (boss) urls.push(boss.image);
  }
  for (let index = 0; index < 6; index++) {
    const sprite = encounter === 'bonus' ? bonusShowcaseShip(index, sector).sprite
      : enemyAppearance(sector, encounter.startsWith('boss') ? bossEscortRosterIndex(index, wave) : offset + index).sprite;
    urls.push(shipEvolutionAsset(sprite, 1));
  }
  return [...new Set(urls)];
}
