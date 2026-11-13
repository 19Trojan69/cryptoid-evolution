import type { ShipStage } from './shipEvolution.ts';
import { playerSkins, RELEASED_STANDARD_SHIPS, shipSaveNetwork } from './shipFleet.ts';

// Release policy is independent of ownership. Only the owner catalog opens the higher stages.
export const RELEASED_BOSS_CARDS = 3;
export const bossCardAvailable = (id: number, ownerTestnet = false) => Number.isInteger(id) && id >= 1 && id <= (ownerTestnet === true ? 50 : RELEASED_BOSS_CARDS);
export const shipCardAvailable = (sprite: number, stage: ShipStage, ownerTestnet = false) =>
  (ownerTestnet === true ? [1, 2, 3].includes(stage) : stage === 1) && Number.isInteger(sprite) && sprite >= 0 &&
  sprite < (ownerTestnet === true || shipSaveNetwork === 'testnet' ? playerSkins.length : RELEASED_STANDARD_SHIPS);
