import type { ShipStage } from '../../../backend/src/shipLoadout.ts';
export type { ShipStage } from '../../../backend/src/shipLoadout.ts';
export { ownedShipStage, selectedShipStage } from '../../../backend/src/shipLoadout.ts';

// Keep old snapshots readable while retiring invisible stage hit protection.
export const projectileGuardForStage: (stage: ShipStage) => number = () => 0;
export const stageWeaponLevel = (stage: ShipStage, weaponLevel: number) => Math.max(stage >= 2 ? 2 : 1, weaponLevel);
export const stageDamageMultiplier = (stage: ShipStage) => [1, 1.15, 1.3][stage - 1];
export const stagePickupRadiusBonus = (stage: ShipStage) => [0, 10, 20][stage - 1];
export const powerUpPickupRadius = (stage: ShipStage) => 34 * (1 + stagePickupRadiusBonus(stage) / 100);

// Active shields are resolved separately by the existing damage controller.
// A legacy nonzero guard never absorbs a hit in the new stage balance.
export const projectileImpact: (guard: number, shielded: boolean) => { guard: number; damage: number; blockedByHull: boolean } = () =>
  ({ guard: 0, damage: 1, blockedByHull: false });

export const shipEvolutionAsset = (index: number, stage: ShipStage) =>
  `/ships/evolution/ship_${String(index + 1).padStart(2, "0")}_stage_${stage}.png`;
