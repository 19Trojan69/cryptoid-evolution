// During Testnet testing only weapon shots may be bought, and only with Test-Pi.
// Keep this check on the server: hiding a button cannot restrict Pi payments.
export const testPiPurchaseAllowed = (offer: { kind: string } | undefined, network: unknown) =>
  offer?.kind === "weapon" && network === "Pi Testnet";
