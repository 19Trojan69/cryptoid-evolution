/**
 * Pi's reviewed public SDK/Platform API documents authentication and payments,
 * but does not establish an authorized NFT issuance adapter for this app.
 * Do not turn environment booleans, a connected wallet or preview artwork into
 * proof that an NFT can be delivered. This module has no issuance side effects.
 *
 * Before replacing these blockers, integrate the documented, app-authorized Pi
 * adapter, transaction-safe supply/entitlement ledger and verified permanent
 * publications. An operator release must still be required by mainnetRelease.
 */
export function inspectNftReadiness(_request?: unknown) {
  return {
    issuance: { ready: false, reason: "pi_nft_issuance_not_established" },
    metadata: { ready: false, reason: "final_nft_publications_unavailable" },
  } as const;
}

export function assertNftIssuanceAvailable(): never {
  // There is intentionally no mint endpoint, guessed contract call, supply
  // reservation or payment fulfilment behind the preparation interface.
  throw new Error(inspectNftReadiness().issuance.reason);
}
