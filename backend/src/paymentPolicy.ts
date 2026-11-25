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

// Mainnet keeps the existing all-capabilities release policy, including NFT
// delivery for ships. A browser value can only change presentation; the server
// separately evaluates its persisted operator release and actual readiness.
export const piPurchaseAllowed = (
  offer: { id?: string; kind: string } | undefined,
  network: "Pi Network" | "Pi Testnet",
  options: { ownerTestnet?: boolean; mainnetReleased?: boolean } = {},
) => network === "Pi Testnet"
  ? testPiPurchaseAllowed(offer, network, options.ownerTestnet)
  : options.mainnetReleased === true && Boolean(offer && ["weapon", "power", "armor", "ship_upgrade"].includes(offer.kind));
