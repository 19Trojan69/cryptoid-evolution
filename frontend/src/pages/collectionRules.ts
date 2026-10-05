import { ownedShipStage, type ShipStage } from './shipEvolution.ts';
export function playerCardUnlocked(id: string, sprite: number, stage: ShipStage, used: readonly string[], upgrades: readonly string[]): boolean {
  return stage === 1 ? used.includes(id) : ownedShipStage(sprite, upgrades) >= stage;
}
