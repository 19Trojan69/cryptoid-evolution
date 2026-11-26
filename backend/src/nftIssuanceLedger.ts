import { createHash, randomUUID } from "node:crypto";
import type { ClientSession, Collection, MongoClient } from "mongodb";

// Preparation only. Nothing imports or initializes this module in the server,
// and it contains no issuer, route, chain request, timer or release capability.
const hash = (...values: unknown[]) => createHash("sha256").update(JSON.stringify(values)).digest("hex");
const digest = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const identifier = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9:._-]{1,256}$/.test(value);
const validDate = (value: unknown): value is Date => value instanceof Date && Number.isFinite(value.getTime());

export class NftLedgerError extends Error {
  constructor(public readonly code: string) { super(code); this.name = "NftLedgerError"; }
}
const fail = (code: string): never => { throw new NftLedgerError(code); };

export type NftLedgerPublication = {
  metadataUri: string;
  metadataSha256: string;
};
export type NftLedgerCatalog = {
  appId: string;
  network: "Pi Network";
  catalogHash: string;
  // A reviewed, server-loaded snapshot, never a browser payload. This module
  // does not invent caps or final publication records.
  cards: readonly { id: string; maxSupply: number; publication?: NftLedgerPublication }[];
};

export type NftVerifiedAcquisition = {
  appId: string;
  network: "Pi Network";
  catalogHash: string;
  cardId: string;
  uid: string;
  recipient: string;
  sourceKind: "payment" | "gameplay" | "shards" | "starter";
  // Globally stable within this app/network/source kind. A payment uses its
  // verified payment ID; an earned entitlement uses a persisted server ID.
  sourceId: string;
  evidenceSha256: string;
};

export type NftIssuanceClaim = NftVerifiedAcquisition & {
  _id: string;
  seriesId: string;
  serial: number;
  fingerprint: string;
  issuanceKey: string;
  state: "reserved" | "pending" | "confirmed";
  reservedAt: Date;
  pendingAt?: Date;
  submissionId?: string;
  confirmedAt?: Date;
  transactionId?: string;
  assetId?: string;
  confirmationEvidenceSha256?: string;
  metadataUri?: string;
  metadataSha256?: string;
};

type Series = {
  _id: string;
  network: "Pi Network";
  appId: string;
  cardId: string;
  catalogHash: string;
  maxSupply: number;
  publicationFingerprint: string;
  allocated: number;
  confirmed: number;
};

export type NftConfirmedIssuance = {
  status: "confirmed";
  network: "Pi Network";
  appId: string;
  cardId: string;
  issuanceKey: string;
  submissionId: string;
  recipient: string;
  transactionId: string;
  assetId: string;
  metadataUri: string;
  metadataSha256: string;
  evidenceSha256: string;
  confirmedAt: Date;
};

export type NftLedgerDependencies = {
  // Trusted future server integration: resolve from authoritative records using
  // this session, recheck eligibility/payment provenance and wallet binding.
  // Do not perform network calls or side effects: Mongo may retry the callback.
  resolveAcquisition: (reference: string, session: ClientSession) => Promise<NftVerifiedAcquisition | null>;
  // A future authorized chain adapter must independently verify issuance,
  // recipient and the exact reviewed publication. It is absent by default.
  // No caller-provided receipt object can mark a claim confirmed.
  verifyIssuance?: (claim: Readonly<NftIssuanceClaim>, publication: Readonly<NftLedgerPublication>) => Promise<NftConfirmedIssuance | null>;
};

const transactionOptions = {
  readConcern: { level: "snapshot" as const },
  writeConcern: { w: "majority" as const },
  readPreference: "primary" as const,
};

export function createPreparedNftIssuanceLedger(
  client: MongoClient,
  databaseName: string,
  catalog: NftLedgerCatalog,
  dependencies: NftLedgerDependencies,
) {
  if (!identifier(databaseName) || !identifier(catalog?.appId) || catalog.network !== "Pi Network" || !digest(catalog.catalogHash) ||
      !Array.isArray(catalog.cards) || catalog.cards.length === 0 || typeof dependencies?.resolveAcquisition !== "function") {
    return fail("nft_ledger_configuration_invalid");
  }
  // Copy configuration so a caller cannot mutate a cap/publication after review.
  const appId = catalog.appId;
  const network = catalog.network;
  const catalogHash = catalog.catalogHash;
  const cards = new Map<string, { id: string; maxSupply: number; publication?: NftLedgerPublication }>();
  for (const card of catalog.cards) {
    if (!identifier(card.id) || !Number.isSafeInteger(card.maxSupply) || card.maxSupply <= 0 || cards.has(card.id)) {
      return fail("nft_ledger_catalog_invalid");
    }
    const publication = card.publication ? { ...card.publication } : undefined;
    if (publication && (!digest(publication.metadataSha256) || !publicMetadataUri(publication.metadataUri))) {
      return fail("nft_ledger_publication_invalid");
    }
    cards.set(card.id, { id: card.id, maxSupply: card.maxSupply, publication });
  }
  const resolveAcquisition = dependencies.resolveAcquisition;
  const verifyIssuance = dependencies.verifyIssuance;
  const db = client.db(databaseName);
  const series: Collection<Series> = db.collection("nft_issuance_series_v1");
  const claims: Collection<NftIssuanceClaim> = db.collection("nft_issuance_claims_v1");
  let initialized = false;
  const seriesId = (cardId: string) => hash("series-v1", network, appId, cardId);

  async function transaction<T>(callback: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = client.startSession();
    try {
      const result = await session.withTransaction(() => callback(session), transactionOptions);
      return result as T;
    } finally { await session.endSession(); }
  }

  async function requireClaim(id: string, session: ClientSession) {
    if (!digest(id)) return fail("nft_claim_invalid");
    const claim = await claims.findOne({ _id: id, appId, network, catalogHash }, { session });
    if (!claim) return fail("nft_claim_missing");
    return claim;
  }

  return {
    // Explicit maintenance operation, never run at import/server startup.
    // Transaction or index failures are fatal; there is no standalone fallback.
    async initializeStorage() {
      initialized = false;
      await transaction(async session => {
        await series.findOne({ _id: "__transaction_preflight__" }, { session, projection: { _id: 1 } });
      });
      await claims.createIndex({ network: 1, appId: 1, sourceKind: 1, sourceId: 1 }, { unique: true, name: "nft_entitlement_once" });
      await claims.createIndex({ issuanceKey: 1 }, { unique: true, name: "nft_issuance_key_once" });
      await claims.createIndex({ network: 1, assetId: 1 }, {
        unique: true, name: "nft_confirmed_asset_once", partialFilterExpression: { state: "confirmed" },
      });
      for (const card of cards.values()) {
        const id = seriesId(card.id);
        const publicationFingerprint = hash(card.publication ?? null);
        // _id and the exact immutable policy in the upsert filter reject a cap
        // or catalog rewrite; no $set can replace an existing policy/counter.
        try {
          await series.updateOne({ _id: id, network, appId, cardId: card.id, catalogHash, maxSupply: card.maxSupply, publicationFingerprint }, {
            $setOnInsert: { _id: id, network, appId, cardId: card.id, catalogHash, maxSupply: card.maxSupply, publicationFingerprint, allocated: 0, confirmed: 0 },
          }, { upsert: true, writeConcern: { w: "majority" } });
        } catch (error) {
          if ((error as { code?: number })?.code === 11000) return fail("nft_series_policy_conflict");
          throw error;
        }
      }
      initialized = true;
    },

    async reserve(acquisitionReference: string): Promise<NftIssuanceClaim> {
      if (!initialized) return fail("nft_ledger_not_initialized");
      if (!identifier(acquisitionReference)) return fail("nft_acquisition_reference_invalid");
      return transaction(async session => {
        const proof = await resolveAcquisition(acquisitionReference, session);
        if (!proof || proof.network !== network || proof.appId !== appId || proof.catalogHash !== catalogHash ||
            !identifier(proof.cardId) || !cards.has(proof.cardId) || !identifier(proof.uid) || !identifier(proof.recipient) ||
            !["payment", "gameplay", "shards", "starter"].includes(proof.sourceKind) || !identifier(proof.sourceId) ||
            !digest(proof.evidenceSha256)) return fail("nft_acquisition_unverified");
        const id = hash("claim-v1", network, appId, proof.sourceKind, proof.sourceId);
        const fingerprint = hash(proof.appId, proof.network, proof.catalogHash, proof.cardId, proof.uid,
          proof.recipient, proof.sourceKind, proof.sourceId, proof.evidenceSha256);
        const previous = await claims.findOne({ _id: id }, { session });
        if (previous) {
          if (previous.fingerprint !== fingerprint) return fail("nft_entitlement_conflict");
          return previous;
        }
        const card = cards.get(proof.cardId)!;
        const allocation = await series.findOneAndUpdate({
          _id: seriesId(card.id), network, appId, cardId: card.id, catalogHash, maxSupply: card.maxSupply,
          publicationFingerprint: hash(card.publication ?? null),
          allocated: { $gte: 0, $lt: card.maxSupply },
        }, { $inc: { allocated: 1 } }, { session, returnDocument: "after" });
        if (!allocation) return fail("nft_supply_unavailable");
        if (!Number.isSafeInteger(allocation.allocated) || allocation.allocated <= 0 || allocation.allocated > card.maxSupply ||
            !Number.isSafeInteger(allocation.confirmed) || allocation.confirmed < 0 || allocation.confirmed >= allocation.allocated) {
          return fail("nft_supply_state_conflict");
        }
        const claim: NftIssuanceClaim = {
          appId, network, catalogHash, cardId: proof.cardId, uid: proof.uid, recipient: proof.recipient,
          sourceKind: proof.sourceKind, sourceId: proof.sourceId, evidenceSha256: proof.evidenceSha256,
          _id: id, seriesId: allocation._id, serial: allocation.allocated, fingerprint,
          issuanceKey: hash("issuance-v1", id), state: "reserved", reservedAt: new Date(),
        };
        await claims.insertOne(claim, { session });
        return claim;
      });
    },

    // Write pending BEFORE a future issuer is contacted. Exactly one caller
    // claims this bookkeeping work; this grants no operator/release permission.
    // If a worker crashes, never reset to reserved:
    // reconcile the existing issuanceKey through the authorized adapter first.
    async beginSubmission(id: string): Promise<{ claim: NftIssuanceClaim; dispatchClaimed: boolean }> {
      if (!initialized) return fail("nft_ledger_not_initialized");
      if (!verifyIssuance) return fail("nft_chain_verifier_unavailable");
      const submissionId = randomUUID();
      return transaction(async session => {
        const claim = await requireClaim(id, session);
        if (!cards.get(claim.cardId)?.publication) return fail("nft_publication_unverified");
        if (claim.state !== "reserved") return { claim, dispatchClaimed: false };
        const pendingAt = new Date();
        const result = await claims.updateOne({ _id: id, state: "reserved" }, {
          $set: { state: "pending", pendingAt, submissionId },
        }, { session });
        if (result.modifiedCount !== 1) return fail("nft_claim_state_conflict");
        return { claim: { ...claim, state: "pending", pendingAt, submissionId }, dispatchClaimed: true };
      });
    },

    async reconcile(id: string): Promise<NftIssuanceClaim> {
      if (!initialized) return fail("nft_ledger_not_initialized");
      if (!verifyIssuance) return fail("nft_chain_verifier_unavailable");
      const snapshot = await transaction(session => requireClaim(id, session));
      if (snapshot.state === "reserved") return fail("nft_claim_not_pending");
      const publication = cards.get(snapshot.cardId)?.publication;
      if (!publication) return fail("nft_publication_unverified");
      // External verification occurs outside a retryable DB transaction. An
      // outage or unknown result leaves pending capacity reserved indefinitely.
      const confirmation = await verifyIssuance(Object.freeze({ ...snapshot }), Object.freeze({ ...publication }));
      if (!confirmation) return snapshot;
      if (confirmation.status !== "confirmed" || confirmation.network !== network || confirmation.appId !== appId ||
          confirmation.cardId !== snapshot.cardId || confirmation.issuanceKey !== snapshot.issuanceKey ||
          confirmation.submissionId !== snapshot.submissionId || confirmation.recipient !== snapshot.recipient ||
          confirmation.metadataUri !== publication.metadataUri || confirmation.metadataSha256 !== publication.metadataSha256 ||
          !digest(confirmation.transactionId) || !identifier(confirmation.assetId) || !digest(confirmation.evidenceSha256) ||
          !validDate(confirmation.confirmedAt) || confirmation.confirmedAt.getTime() > Date.now() ||
          !snapshot.pendingAt || confirmation.confirmedAt.getTime() < snapshot.pendingAt.getTime()) {
        return fail("nft_chain_confirmation_mismatch");
      }
      return transaction(async session => {
        const current = await requireClaim(id, session);
        if (current.state === "confirmed") {
          if (current.transactionId !== confirmation.transactionId || current.assetId !== confirmation.assetId ||
              current.metadataUri !== confirmation.metadataUri || current.metadataSha256 !== confirmation.metadataSha256) {
            return fail("nft_chain_confirmation_conflict");
          }
          return current;
        }
        if (current.state !== "pending" || current.submissionId !== snapshot.submissionId || current.fingerprint !== snapshot.fingerprint) {
          return fail("nft_claim_state_conflict");
        }
        const card = cards.get(current.cardId)!;
        if (current.seriesId !== seriesId(current.cardId)) return fail("nft_supply_state_conflict");
        const stock = await series.findOne({
          _id: current.seriesId, network, appId, cardId: current.cardId, catalogHash,
          maxSupply: card.maxSupply, publicationFingerprint: hash(card.publication ?? null),
        }, { session });
        if (!stock || !Number.isSafeInteger(stock.allocated) || stock.allocated <= 0 || stock.allocated > card.maxSupply ||
            !Number.isSafeInteger(stock.confirmed) || stock.confirmed < 0 || stock.confirmed >= stock.allocated ||
            !Number.isSafeInteger(current.serial) || current.serial <= 0 || current.serial > stock.allocated) {
          return fail("nft_supply_state_conflict");
        }
        const fields = {
          state: "confirmed" as const, confirmedAt: confirmation.confirmedAt,
          transactionId: confirmation.transactionId, assetId: confirmation.assetId,
          metadataUri: confirmation.metadataUri, metadataSha256: confirmation.metadataSha256,
          confirmationEvidenceSha256: confirmation.evidenceSha256,
        };
        await claims.updateOne({ _id: id, state: "pending", submissionId: current.submissionId }, { $set: fields }, { session });
        const counted = await series.updateOne({
          _id: current.seriesId, network, appId, cardId: current.cardId, catalogHash, maxSupply: card.maxSupply,
          publicationFingerprint: stock.publicationFingerprint, confirmed: stock.confirmed, allocated: stock.allocated,
        }, { $inc: { confirmed: 1 } }, { session });
        if (counted.modifiedCount !== 1) return fail("nft_supply_state_conflict");
        return { ...current, ...fields };
      });
    },
  };
}

function publicMetadataUri(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash && !url.port &&
      !/(?:^|\.)(?:localhost|local|internal|test|example|invalid)$/i.test(url.hostname) &&
      !/^[\d.]+$/.test(url.hostname) && /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(url.hostname);
  } catch { return false; }
}
