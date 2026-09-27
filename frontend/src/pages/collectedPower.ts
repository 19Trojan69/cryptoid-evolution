import { activeWeaponLevel, PICKUP_WEAPON_DURATION_MS } from "./playerCombat.ts";
import { collectPowerUp, MAX_STACKED_POWER_MS, type PowerUpType } from "./powerUps.ts";

type PickupLoadout = {
  shieldCharges: number; shieldMs: number; shieldActive: boolean;
  weaponLevel: number; weaponCap: number; pickupWeaponLevel: number; pickupWeaponMs: number;
  paidWeaponLevel: number; paidWeaponMs: number; rapidFireMs: number; overdriveMs: number; hearts: number;
};

// Drops take effect at contact. Bought start equipment is still activated by its own button.
export const activateCollectedPower = <T extends PickupLoadout>(state: T, type: PowerUpType): T => {
  if (type === "weapon") {
    const pickupWeaponLevel = Math.min(5, state.weaponLevel + 1);
    const weaponCap = Math.max(state.weaponCap, pickupWeaponLevel);
    const pickupWeaponMs = Math.min(MAX_STACKED_POWER_MS, state.pickupWeaponMs + PICKUP_WEAPON_DURATION_MS);
    return { ...state, pickupWeaponLevel, pickupWeaponMs, weaponCap,
      weaponLevel: activeWeaponLevel(state.paidWeaponLevel, state.paidWeaponMs, pickupWeaponLevel, pickupWeaponMs, weaponCap) };
  }
  if (type === "shield") return { ...collectPowerUp(state, type), shieldActive: true } as T;
  return collectPowerUp(state, type) as T;
};
