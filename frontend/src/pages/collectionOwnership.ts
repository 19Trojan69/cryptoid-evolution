import { readShipFleet, SHIP_FLEET_KEY, SHIP_OWNED_KEY, SHIP_COLORS_KEY, type ShipFleet } from './shipFleet.ts';
export const ownedCollectionHulls = (fleet: ShipFleet): string[] =>
  Object.entries(fleet).filter(([, variants]) => Object.values(variants || {}).some(count => typeof count === 'number' && Number.isFinite(count) && count > 0)).map(([id]) => id);
export function guestCollectionHulls(storage: Pick<Storage, 'getItem'>): string[] {
  return ownedCollectionHulls(readShipFleet(storage.getItem(SHIP_FLEET_KEY), storage.getItem(SHIP_OWNED_KEY), storage.getItem(SHIP_COLORS_KEY)));
}
