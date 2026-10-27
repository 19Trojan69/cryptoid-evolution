import { playerSkins, testnetStandardHullAvailable, type PlayerSkinId } from './shipFleet.ts';

// Purchase availability is separate from the artwork catalogue and ownership.
export const standardHullAvailable = (id: PlayerSkinId, ownerTestnet = false) =>
  ownerTestnet === true ? playerSkins.some(skin => skin.id === id) : testnetStandardHullAvailable(id);
