export type ShipStage = 1 | 2 | 3;

export const projectileGuardForStage = (stage: ShipStage) => stage - 1;
export const stageWeaponLevel = (stage: ShipStage, weaponLevel: number) => Math.max(stage >= 2 ? 2 : 1, weaponLevel);

// Hull protection applies only to enemy projectiles, after an active shield.
// Direct contact is handled independently and remains fatal at every stage.
export const projectileImpact = (guard: number, shielded: boolean) =>
  shielded ? { guard, damage: 1, blockedByHull: false }
    : guard > 0 ? { guard: guard - 1, damage: 0, blockedByHull: true }
      : { guard: 0, damage: 1, blockedByHull: false };

export const shipEvolutionAsset = (index: number, stage: ShipStage) =>
  `/ships/evolution/ship_${String(index + 1).padStart(2, "0")}_stage_${stage}.png`;

// A stage-three purchase is only usable alongside its stage-two prerequisite.
export const ownedShipStage = (index: number, owned: readonly string[] = []): ShipStage => {
  const prefix = `ship_${String(index + 1).padStart(2, "0")}_stage_`;
  if (!owned.includes(`${prefix}2`)) return 1;
  return owned.includes(`${prefix}3`) ? 3 : 2;
};
