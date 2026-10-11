import type { PlayerSkinId } from './shipFleet.ts';
import { stageWeaponLevel, type ShipStage } from './shipEvolution.ts';
import { fireInterval, makeVolley, volleyOffsets } from './playerCombat.ts';

export type HullRole = 'balanced' | 'power' | 'rapid';
type HullAttributes = { damageBonus: number; fireRateBonus: number; role: HullRole };

// Stable hull IDs preserve existing ownership. Paint and duplicate purchases
// do not multiply bonuses. Later hulls advance total firepower gradually while
// retaining a distinct balance between shot strength and firing cadence.
export const hullAttributes = {
  'grey-scout':     { damageBonus: 0,  fireRateBonus: 0,  role: 'balanced' },
  'nova-wing':      { damageBonus: 4,  fireRateBonus: 2,  role: 'balanced' },
  'solar-lance':    { damageBonus: 9,  fireRateBonus: 1,  role: 'power' },
  'dark-delta':     { damageBonus: 4,  fireRateBonus: 7,  role: 'rapid' },
  'gold-streak':    { damageBonus: 7,  fireRateBonus: 6,  role: 'balanced' },
  'iron-guard':     { damageBonus: 15, fireRateBonus: 1,  role: 'power' },
  'vector':         { damageBonus: 7,  fireRateBonus: 10, role: 'rapid' },
  'verdant':        { damageBonus: 10, fireRateBonus: 9,  role: 'balanced' },
  'storm-wing':     { damageBonus: 12, fireRateBonus: 9,  role: 'balanced' },
  'red-comet':      { damageBonus: 8,  fireRateBonus: 15, role: 'rapid' },
  'twin-core':      { damageBonus: 15, fireRateBonus: 11, role: 'balanced' },
  'orbit-arc':      { damageBonus: 12, fireRateBonus: 16, role: 'rapid' },
  'night-guard':    { damageBonus: 18, fireRateBonus: 12, role: 'balanced' },
  'striker':        { damageBonus: 24, fireRateBonus: 9,  role: 'power' },
  'cargo-hawk':     { damageBonus: 28, fireRateBonus: 7,  role: 'power' },
  'ring-flare':     { damageBonus: 21, fireRateBonus: 15, role: 'balanced' },
  'sky-breaker':    { damageBonus: 30, fireRateBonus: 9,  role: 'power' },
  'olive-fortress': { damageBonus: 33, fireRateBonus: 8,  role: 'power' },
  'pi-vanguard':    { damageBonus: 28, fireRateBonus: 14, role: 'balanced' },
  'core-carrier':   { damageBonus: 34, fireRateBonus: 10, role: 'power' },
} as const satisfies Record<PlayerSkinId, HullAttributes>;

export const attributesForHull = (id: string): HullAttributes =>
  Object.hasOwn(hullAttributes, id) ? hullAttributes[id as PlayerSkinId] : hullAttributes['grey-scout'];

export const shipFireInterval = (id: string, level: number, rapidFireMs: number) =>
  fireInterval(level, rapidFireMs) / (1 + attributesForHull(id).fireRateBonus / 100);

export const makeShipVolley = (id: string, stage: ShipStage, level: number, x: number, y: number, overdrive: boolean, nextId: () => number) => {
  const multiplier = 1 + attributesForHull(id).damageBonus / 100;
  return makeVolley(stageWeaponLevel(stage, level), x, y, overdrive, nextId, stage === 3)
    .map(shot => ({ ...shot, damage: Math.round(shot.damage * multiplier * 1e6) / 1e6 }));
};

// Shop comparisons use the same damage, cadence and permanent stage bonuses
// as combat, with no temporary weapon or power-up active.
export const shipBaseFirepower = (id: string, stage: ShipStage) => {
  const level = stageWeaponLevel(stage, 1);
  const damage = (stage === 3 ? 2 : 1) * (1 + attributesForHull(id).damageBonus / 100);
  return damage * volleyOffsets(level).length * 1000 / shipFireInterval(id, level, 0);
};
