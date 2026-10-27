export type ShipStage = 1 | 2 | 3;

// Elite requires its matching Advanced purchase. Sprite IDs preserve hull identity.
export const ownedShipStage = (index: number, owned: readonly string[] = []): ShipStage => {
  const prefix = `ship_${String(index + 1).padStart(2, "0")}_stage_`;
  if (!owned.includes(`${prefix}2`)) return 1;
  return owned.includes(`${prefix}3`) ? 3 : 2;
};

// An explicit selection can use any owned stage. Legacy saves keep their prior
// highest-owned behavior until the player confirms a selection.
export function selectedShipStage(sprite: number, owned: readonly string[] = [], selected?: unknown): ShipStage {
  const maximum = ownedShipStage(sprite, owned);
  return selected === 1 || selected === 2 || selected === 3 ? Math.min(selected, maximum) as ShipStage : maximum;
}
