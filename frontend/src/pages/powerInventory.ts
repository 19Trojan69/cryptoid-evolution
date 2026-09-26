import type { PowerUpType } from "./powerUps";

export type PowerInventory = Record<PowerUpType, number>;
export const MAX_STORED_PER_TYPE = 3;

export const storePower = (inventory: PowerInventory, type: PowerUpType): PowerInventory => ({
  ...inventory, [type]: Math.min(MAX_STORED_PER_TYPE, inventory[type] + 1),
});

export const canActivatePower = (inventory: PowerInventory, type: PowerUpType, activeMs: number) =>
  inventory[type] > 0 && activeMs <= 0;

export const spendPower = (inventory: PowerInventory, type: PowerUpType): PowerInventory => ({
  ...inventory, [type]: Math.max(0, inventory[type] - 1),
});
