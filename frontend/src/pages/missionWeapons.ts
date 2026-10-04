import { hangarCatalog } from '../../../backend/src/hangarCatalog.ts';
import { isTestnetWeaponPurchaseEnabled } from '../../../backend/src/paymentPolicy.ts';

/** Reconcile confirmed ownership, never refill a spent or partially used timer. */
export function addMissionWeapons(unlocked: number[], timers: number[], owned: string[], testnet: boolean) {
  const levels = [...unlocked];
  const remaining = [...timers];
  for (const offer of hangarCatalog) {
    if (offer.kind !== 'weapon' || !owned.includes(offer.id) || (testnet && !isTestnetWeaponPurchaseEnabled(offer))) continue;
    if (!levels.includes(offer.level)) {
      levels.push(offer.level);
      remaining[offer.level] = -1;
    }
  }
  return { unlockedWeapons: levels.sort((a, b) => a - b), weaponTimers: remaining };
}
