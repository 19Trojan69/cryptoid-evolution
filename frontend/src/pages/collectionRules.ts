import { ownedShipStage, type ShipStage } from './shipEvolution.ts';
export function playerCardUnlocked(id: string, sprite: number, stage: ShipStage, owned: readonly string[], upgrades: readonly string[]): boolean {
  return owned.includes(id) && (stage === 1 || ownedShipStage(sprite, upgrades) >= stage);
}
