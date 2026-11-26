import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { nftPreparationManifest } = require("../build/nftPreparation.js");
const { inspectNftReadiness, assertNftIssuanceAvailable } = require("../build/nftReadiness.js");
const { validateNftPublicationCandidate, confirmedNftPurchaseEvidence } = require("../build/nftPublication.js");
const { findOffer } = require("../build/hangarCatalog.js");
const { shipNftStatus, confirmedMainnetShipUpgrades, shipNftCatalog } = require("../build/shipNftEligibility.js");
const manifest = nftPreparationManifest();
const card = manifest.cards.find(card => card.id === "grey-scout-advanced");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const origin = "https://assets.cryptoid-evolution.app";

function publication() {
  // Artificial bytes model a separately reviewed original-art record for this
  // test only. No actual art approval, hash record or publication is created.
  const image = Uint8Array.from([1, 2, 3]);
  const imageSha256 = hash(image);
  const imageUri = `${origin}/nft/${imageSha256}/image.webp`;
  const metadata = JSON.stringify({ ...card.metadataDraft, image: imageUri });
  const metadataSha256 = hash(metadata);
  return {
    candidate: { id: card.id, catalogHash: manifest.catalogHash, version: "v1", artworkRevision: "original-v1", imageSha256, imageUri,
      metadataSha256, metadataUri: `${origin}/nft/${metadataSha256}/metadata.json` },
    content: { image, metadata },
    approved: { cardId: card.id, catalogHash: manifest.catalogHash, revision: "original-v1", kind: "original", imageSha256 },
  };
}

test("publication cannot certify caller-selected bytes without a separate original-art approval", () => {
  const p = publication();
  const result = validateNftPublicationCandidate(card, manifest.catalogHash, p.candidate, p.content, [origin]);
  assert.deepEqual(result, { valid: false, publishable: false, reason: "publication_original_art_unverified" });
  assert.equal(validateNftPublicationCandidate(card, manifest.catalogHash, {
    ...p.candidate, approvedArtwork: { cardId: card.id, catalogHash: manifest.catalogHash,
      revision: "original-v1", kind: "original", imageSha256: p.candidate.imageSha256 },
  }, p.content, [origin]).valid, false, "a claim inside the candidate is not a trusted approval");
});

test("every paid NFT has one stable product mapping without enabling new checkout offers", () => {
  const paid = manifest.cards.filter(card => card.price.currency === "Pi" && card.price.amount > 0);
  assert.equal(paid.length, 430);
  assert.equal(new Set(paid.map(card => card.productId)).size, 430);
  assert.equal(manifest.summary.unlinkedNftProducts, 0);
  for (const item of paid) {
    if (item.productState === "existing_ship_offer") {
      assert.equal(findOffer(item.productId).pricePi, item.price.amount);
    } else {
      assert.equal(item.productState, "prepared");
      assert.equal(findOffer(item.productId), undefined);
    }
  }
});

test("offline publication validates exact hashes and catalog metadata but cannot certify reachability or issuance", () => {
  const p = publication();
  const result = validateNftPublicationCandidate(card, manifest.catalogHash, p.candidate, p.content, [origin], p.approved);
  assert.deepEqual(result, { valid: true, publishable: false, reason: "public_reachability_and_issuance_unverified" });
  assert.equal(manifest.cards.every(card => card.metadataUri === null && card.metadataDraft.image === null), true);
  assert.equal(validateNftPublicationCandidate(card, "a".repeat(64), p.candidate, p.content, [origin], p.approved).valid, false);
  assert.equal(validateNftPublicationCandidate(card, manifest.catalogHash, { ...p.candidate, id: "other" }, p.content, [origin], p.approved).valid, false);
  assert.equal(validateNftPublicationCandidate(card, manifest.catalogHash, { ...p.candidate, version: undefined }, p.content, [origin], p.approved).valid, false);
  assert.equal(validateNftPublicationCandidate(card, manifest.catalogHash, null, p.content, [origin], p.approved).valid, false);
  assert.equal(validateNftPublicationCandidate(card, manifest.catalogHash, p.candidate, { ...p.content, image: Uint8Array.from([4]) }, [origin], p.approved).reason, "publication_content_mismatch");
  const changed = JSON.stringify({ ...JSON.parse(p.content.metadata), name: "Wrong design" });
  const changedHash = hash(changed);
  assert.equal(validateNftPublicationCandidate(card, manifest.catalogHash, { ...p.candidate, metadataSha256: changedHash, metadataUri: `${origin}/nft/${changedHash}/metadata.json` }, { ...p.content, metadata: changed }, [origin], p.approved).reason, "publication_metadata_mismatch");
});

test("the trusted original-art record binds card, catalog, revision, kind and digest", () => {
  const p = publication();
  for (const change of [
    { cardId: "another-card" }, { catalogHash: "a".repeat(64) }, { revision: "another-revision" },
    { revision: "" }, { kind: "preview" }, { imageSha256: "b".repeat(64) }, { imageSha256: undefined },
  ]) {
    const result = validateNftPublicationCandidate(card, manifest.catalogHash, p.candidate, p.content, [origin], { ...p.approved, ...change });
    assert.equal(result.reason, "publication_original_art_unverified");
    assert.equal(result.valid, false);
    assert.equal(result.publishable, false);
  }
  const replacement = publication();
  replacement.content.image = Uint8Array.from([7, 8, 9]);
  replacement.candidate.imageSha256 = hash(replacement.content.image);
  replacement.candidate.imageUri = `${origin}/nft/${replacement.candidate.imageSha256}/image.webp`;
  replacement.content.metadata = JSON.stringify({ ...card.metadataDraft, image: replacement.candidate.imageUri });
  replacement.candidate.metadataSha256 = hash(replacement.content.metadata);
  replacement.candidate.metadataUri = `${origin}/nft/${replacement.candidate.metadataSha256}/metadata.json`;
  assert.equal(validateNftPublicationCandidate(card, manifest.catalogHash, replacement.candidate, replacement.content,
    [origin], p.approved).reason, "publication_original_art_unverified", "self-consistent replacement bytes cannot replace approved art");
  for (const content of [null, undefined, {}, { image: null, metadata: null }]) {
    assert.equal(validateNftPublicationCandidate(card, manifest.catalogHash, p.candidate, content, [origin], p.approved).reason,
      "publication_content_mismatch", "malformed content is rejected without throwing");
  }
});

test("preview, temporary, protected, unversioned and unauthorized references cannot become final metadata", () => {
  const p = publication();
  for (const imageUri of [
    `${origin}/admin/nft-collection/1`, `${origin}/api/preview/1`, `${origin}/image.webp`,
    `${p.candidate.imageUri}?token=private`, `${p.candidate.imageUri}#fragment`,
    p.candidate.imageUri.replace("https://", "http://"),
    p.candidate.imageUri.replace("assets.cryptoid-evolution.app", "localhost"),
    p.candidate.imageUri.replace("assets.cryptoid-evolution.app", "127.0.0.1"),
    p.candidate.imageUri.replace("assets.cryptoid-evolution.app", "unknown.invalid"),
    p.candidate.imageUri.replace("https://", "https://secret@"),
    `${origin}/nft/${p.candidate.imageSha256}/preview/image.webp`, "ipfs://invented-cid/image.webp",
  ]) {
    assert.equal(validateNftPublicationCandidate(card, manifest.catalogHash, { ...p.candidate, imageUri }, p.content, [origin], p.approved).valid, false, imageUri);
  }
  assert.equal(validateNftPublicationCandidate(card, manifest.catalogHash, p.candidate, p.content, [], p.approved).valid, false);
});

test("unverified flags, clients or wallets cannot activate the unavailable NFT adapter", async () => {
  const fake = { body: { nftReady: true }, headers: { "x-nft-ready": "1" }, app: { locals: { nftIssuance: { ready: true }, nftMetadata: { ready: true } } } };
  assert.equal(inspectNftReadiness(fake).issuance.ready, false);
  assert.equal(inspectNftReadiness(fake).metadata.ready, false);
  assert.throws(assertNftIssuanceAvailable, /pi_nft_issuance_not_established/);
  const attempts = await Promise.allSettled(Array.from({ length: 20 }, async () => assertNftIssuanceAvailable()));
  assert.equal(attempts.every(attempt => attempt.status === "rejected"), true);
});

const receipt = (extra = {}) => ({ user: "pilot", product_id: card.productId, paid: true,
  payment_network: "Pi Network", payment_amount_pi: card.price.amount,
  pi_payment_id: "payment_123", txid: "a".repeat(64), completed_at: new Date(), quantity: 1, ...extra });

test("purchase evidence is bound to one verified account, product, network, amount and completion", () => {
  const good = receipt();
  assert.deepEqual(confirmedNftPurchaseEvidence(card, "pilot", [good, good]), ["payment_123"]);
  for (const invalid of [
    { user: "other" }, { product_id: "nft_boss_01_holo" }, { paid: false }, { cancelled: true },
    { payment_network: "Pi Testnet" }, { payment_network: undefined }, { owner_testnet_catalog: true },
    { payment_amount_pi: 0.1 }, { quantity: 2 }, { txid: "local-import" }, { completed_at: "today" },
    { pi_payment_id: "" },
  ]) assert.deepEqual(confirmedNftPurchaseEvidence(card, "pilot", [receipt(invalid)]), []);
  assert.deepEqual(confirmedNftPurchaseEvidence(card, "pilot", [good, receipt({ product_id: "other" })]), []);
  assert.deepEqual(confirmedNftPurchaseEvidence(card, "", [good]), []);
  assert.deepEqual(confirmedMainnetShipUpgrades("pilot", [good, good]), [card.productId]);
  assert.deepEqual(confirmedMainnetShipUpgrades("pilot", [good, receipt({ product_id: "ship_01_stage_3" })]), []);
});

test("imported hulls need a recorded server acquisition and previews do not establish minted ownership", () => {
  const item = shipNftCatalog.find(card => card.id === "nova-wing-standard");
  const save = { fleet: { "nova-wing": { grey: 1 } }, legacyImported: true, standardShipAcquisitions: { "nova-wing": "browser-claim" } };
  assert.equal(shipNftStatus(item, save, []), "needs-hull-proof");
  save.standardShipAcquisitions["nova-wing"] = "2026-11-13T00:00:00.000Z";
  assert.equal(shipNftStatus(item, save, []), "eligible");
  assert.equal(shipNftStatus(item, { ...save, legacyImported: false, standardShipAcquisitions: undefined }, []), "eligible");
  assert.equal(manifest.issuance.blockchainOwnershipVerified, false);
});
