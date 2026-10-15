import { enemyAppearance } from './shipFleet.ts';
import { shipEvolutionAsset } from './shipEvolution.ts';
import { bonusShowcaseShip } from './bonusChallenge.ts';
import { bossEscortRosterIndex } from './bossEscorts.ts';
import { bossForLevel } from './bossManifest.ts';
import { blockFlights } from './blockFlights.ts';
import type { PreparedHull } from './paintedShip';

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

export function preparedHullPlan(sector: number, encounter: string, offset: number,
  wave: number, bonusGroup: number, rulesVersion: number): PreparedHull[] {
  const result: PreparedHull[] = [];
  const normal = (stage: number, start: number) => {
    for (let index = 0; index < 6; index++) result.push(enemyAppearance(stage, start + index));
  };
  if (encounter === 'normal') {
    normal(sector, offset);
    const total = blockFlights(sector, rulesVersion).reduce((a, b) => a + b, 0);
    if (offset + 6 < total) normal(sector, offset + 6);
    else if (sector < 500 && (sector + 1) % 10 !== 0) normal(sector + 1, 0);
    else for (let index = 0; index < 6; index++) result.push(enemyAppearance(Math.min(500, sector + 1), bossEscortRosterIndex(index, 0)));
  } else if (encounter === 'bonus') {
    const start = Math.min(1, bonusGroup) * 6;
    for (let index = start; index < start + 6; index++) result.push(bonusShowcaseShip(index, sector));
    if (start === 0) for (let index = 6; index < 12; index++) result.push(bonusShowcaseShip(index, sector));
    else if (sector < 500) normal(sector + 1, 0);
  } else if (encounter.startsWith('boss')) {
    for (const group of [wave, wave + 1]) for (let index = 0; index < 6; index++)
      result.push(enemyAppearance(sector, bossEscortRosterIndex(index, group)));
  }
  return result;
}
