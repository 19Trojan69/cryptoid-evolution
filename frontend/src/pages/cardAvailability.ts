import type { ShipStage } from './shipEvolution.ts';

// Release policy, independent of ownership and hostname. Mainnet content stays
// prepared but must be deliberately released; old test awards cannot bypass it.
export const RELEASED_BOSS_CARDS = 3;
export const RELEASED_STANDARD_SHIPS = 10;
export const bossCardAvailable = (id: number, ownerTestnet = false) => Number.isInteger(id) && id >= 1 && id <= (ownerTestnet === true ? 50 : RELEASED_BOSS_CARDS);
export const shipCardAvailable = (sprite: number, stage: ShipStage, ownerTestnet = false) =>
  (ownerTestnet === true ? [1, 2, 3].includes(stage) : stage === 1) && Number.isInteger(sprite) && sprite >= 0 && sprite < (ownerTestnet === true ? 20 : RELEASED_STANDARD_SHIPS);
