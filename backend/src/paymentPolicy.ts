// During Testnet testing only the first two purchased weapon tiers are enabled.
// Triple and Plasma remain MAINNET READY; their higher tiers can still appear
// through collected in-game weapon upgrades.
const TESTNET_WEAPON_IDS = new Set(["weapon_twin", "weapon_rapid_twin"]);

export const isTestnetWeaponPurchaseEnabled = (offer: { id?: string; kind: string } | undefined) =>
  offer?.kind === "weapon" && typeof offer.id === "string" && TESTNET_WEAPON_IDS.has(offer.id);

export const testPiPurchaseAllowed = (offer: { id?: string; kind: string } | undefined, network: unknown) =>
  network === "Pi Testnet" && isTestnetWeaponPurchaseEnabled(offer);
