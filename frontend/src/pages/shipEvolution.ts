export type ShipStage = 1 | 2 | 3;

export const shipEvolutionAsset = (index: number, stage: ShipStage) =>
  `/ships/evolution/ship_${String(index + 1).padStart(2, "0")}_stage_${stage}.png`;

// A stage-three purchase is only usable alongside its stage-two prerequisite.
export const ownedShipStage = (index: number, owned: readonly string[] = []): ShipStage => {
  const prefix = `ship_${String(index + 1).padStart(2, "0")}_stage_`;
  if (!owned.includes(`${prefix}2`)) return 1;
  return owned.includes(`${prefix}3`) ? 3 : 2;
};
