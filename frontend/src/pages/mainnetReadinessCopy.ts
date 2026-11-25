// Only reviewed, non-sensitive explanations are displayed. Unknown server codes
// must not expose raw provider errors or imply that a capability is verified.
export type ReadinessCheck = { id: string; ready: boolean; reason?: string };

export const readinessLabels: Record<string, string> = {
  database: "Datenbank und Kontospeicherung",
  appNetwork: "Mainnet-App und Netzwerk",
  piPayments: "Serverseitiger Mainnet-Schlüssel",
  walletConnection: "Genehmigte App-Wallet verbunden",
  walletCheckout: "Verifizierter Mainnet-Kaufablauf",
  externalPiApproval: "Erforderliche Pi-Freigaben",
  nftIssuance: "Nachweisbarer NFT-Ausgabeweg",
  nftMetadata: "Veröffentlichte NFT-Metadaten",
};

export const readinessReasons: Record<string, string> = {
  storage_available: "Kontospeicherung ist verfügbar.",
  storage_unavailable: "Kontospeicherung ist nicht verfügbar.",
  mainnet_app_configuration_required: "Mainnet-App und Netzwerk müssen serverseitig zugeordnet sein.",
  scoped_mainnet_key_required: "Ein eigener serverseitiger Mainnet-Schlüssel ist erforderlich.",
  approved_wallet_evidence_required: "Die genehmigte und verbundene App-Wallet muss belegt werden.",
  verified_mainnet_checkout_required: "Ein passender abgeschlossener Mainnet-Kauf muss verifiziert werden.",
  reviewed_pi_approval_evidence_required: "Die erforderlichen Pi-Freigaben müssen mit gültigen Nachweisen belegt werden.",
  configured: "Serverseitig konfiguriert; kein Zahlungsnachweis.",
  reviewed_evidence: "Passender Nachweis geprüft.",
  verified_existing_receipt: "Vorhandene Zahlung serverseitig verifiziert.",
  mainnet_checkout_evidence_mismatch: "Der Zahlungsnachweis passt nicht zur aktuellen Konfiguration.",
  mainnet_checkout_verification_unavailable: "Der Zahlungsnachweis kann derzeit nicht verifiziert werden.",
  pi_nft_issuance_not_established: "Ein unterstützter und autorisierter Pi-NFT-Ausgabeweg ist noch nicht belegt.",
  final_nft_publications_unavailable: "Endgültige öffentlich erreichbare NFT-Bilder und Metadaten sind noch nicht belegt.",
};

export const readinessLabel = (id: string) => readinessLabels[id] ?? "Nachweis fehlt oder ist nicht prüfbar.";
export const readinessReason = (check: ReadinessCheck) => readinessReasons[check.reason ?? ""] ?? "Nachweis fehlt oder ist nicht prüfbar.";
