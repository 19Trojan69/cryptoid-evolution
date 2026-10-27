// During Testnet testing only the first two purchased weapon tiers are enabled.
// Triple and Plasma remain MAINNET READY; their higher tiers can still appear
// through collected in-game weapon upgrades.
const TESTNET_WEAPON_IDS = new Set(["weapon_twin", "weapon_rapid_twin"]);
const OWNER_TESTNET_WEAPON_IDS = new Set([...TESTNET_WEAPON_IDS, "weapon_triple", "weapon_plasma"]);

export const isTestnetWeaponPurchaseEnabled = (offer: { id?: string; kind: string } | undefined, ownerTestnet = false) =>
  offer?.kind === "weapon" && typeof offer.id === "string" &&
  (ownerTestnet === true ? OWNER_TESTNET_WEAPON_IDS : TESTNET_WEAPON_IDS).has(offer.id);

export const testPiPurchaseAllowed = (offer: { id?: string; kind: string } | undefined, network: unknown, ownerTestnet = false) =>
  network === "Pi Testnet" && Boolean(offer && (isTestnetWeaponPurchaseEnabled(offer, ownerTestnet) ||
    ownerTestnet === true && ["power", "armor", "ship_upgrade"].includes(offer.kind)));
