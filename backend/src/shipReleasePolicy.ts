// The free starter and two earned-Shard purchases form the public Testnet fleet.
// Ownership and the verified owner's expanded catalog are checked separately.
export const PUBLIC_TESTNET_STANDARD_SHIPS = ["grey-scout", "nova-wing", "solar-lance"] as const;

export const publicTestnetHullAvailable = (skin: unknown): boolean =>
  typeof skin === "string" && PUBLIC_TESTNET_STANDARD_SHIPS.some(id => id === skin);
