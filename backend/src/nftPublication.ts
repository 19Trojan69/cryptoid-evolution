import { createHash } from "node:crypto";
import type { PreparedNftCard } from "./nftPreparation";
import type { ShipNftOrder } from "./shipNftEligibility";

const digest = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const sha256 = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

export type NftPublicationCandidate = {
  id: string;
  catalogHash: string;
  version: string;
  metadataUri: string;
  imageUri: string;
  metadataSha256: string;
  imageSha256: string;
};

// Pure, offline checks for a future authorized publication pipeline. Only a
// public origin explicitly configured by the operator may be referenced. A
// content hash in the path plus byte verification prevents preview links,
// expiring query credentials and accidental references to a different image.
// This check cannot prove hosting durability or public reachability.
const versionedPublicUri = (value: unknown, hash: string, origins: readonly string[]) => {
  if (typeof value !== "string" || !sha256(hash)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash &&
      !url.port && origins.includes(url.origin) &&
      /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(url.hostname) &&
      !/(?:^|\.)(?:localhost|local|internal|test|example|invalid)$/i.test(url.hostname) &&
      !/^[\d.]+$/.test(url.hostname) &&
      !/%|\/\//.test(url.pathname) &&
      url.pathname.startsWith(`/nft/${hash}/`) &&
      !/(?:^|\/)(?:admin|api|preview|previews)(?:\/|$)/i.test(url.pathname);
  } catch { return false; }
};

export function validateNftPublicationCandidate(
  card: PreparedNftCard,
  catalogHash: string,
  rawCandidate: unknown,
  content: { image: Uint8Array; metadata: string },
  allowedOrigins: readonly string[],
) {
  const invalid = (reason: string) => ({ valid: false, reason, publishable: false as const });
  if (!rawCandidate || typeof rawCandidate !== "object" || Array.isArray(rawCandidate)) return invalid("publication_catalog_mismatch");
  const candidate = rawCandidate as NftPublicationCandidate;
  if (candidate.id !== card.id || !sha256(catalogHash) || candidate.catalogHash !== catalogHash ||
      typeof candidate.version !== "string" || !/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(candidate.version)) return invalid("publication_catalog_mismatch");
  if (!versionedPublicUri(candidate.imageUri, candidate.imageSha256, allowedOrigins) ||
      !versionedPublicUri(candidate.metadataUri, candidate.metadataSha256, allowedOrigins)) return invalid("publication_uri_invalid");
  if (!(content.image instanceof Uint8Array) || !content.image.byteLength || content.image.byteLength > 16_000_000 ||
      typeof content.metadata !== "string" || Buffer.byteLength(content.metadata) > 64_000 ||
      digest(content.image) !== candidate.imageSha256 || digest(content.metadata) !== candidate.metadataSha256) return invalid("publication_content_mismatch");
  try {
    const actual = JSON.parse(content.metadata);
    const expected = { ...card.metadataDraft, image: candidate.imageUri };
    if (!expected.description || actual.name !== expected.name || actual.description !== expected.description ||
        actual.image !== expected.image || actual.external_url !== expected.external_url ||
        JSON.stringify(actual.attributes) !== JSON.stringify(expected.attributes)) return invalid("publication_metadata_mismatch");
    // Reject external links/fields not in the reviewed metadata shape.
    if (Object.keys(actual).sort().join(",") !== Object.keys(expected).sort().join(",")) return invalid("publication_metadata_mismatch");
    return { valid: true, reason: "public_reachability_and_issuance_unverified", publishable: false as const };
  } catch { return invalid("publication_metadata_invalid"); }
}

// This is acquisition evidence only. It is never blockchain ownership and
// never consumes supply. The future issuance adapter must also check gameplay
// eligibility, confirmed receipt provenance and a transaction-safe unique claim.
export function confirmedNftPurchaseEvidence(card: PreparedNftCard, uid: string, orders: readonly ShipNftOrder[]) {
  if (!uid || !card.productId || card.price.currency !== "Pi" || !card.price.amount || card.price.amount <= 0) return [];
  const matches = orders.filter(order => order.user === uid && order.product_id === card.productId &&
    order.paid === true && !order.cancelled && order.payment_network === "Pi Network" && !order.owner_testnet_catalog &&
    order.payment_amount_pi === card.price.amount && (order.quantity === undefined || order.quantity === 1) &&
    typeof order.pi_payment_id === "string" && /^[a-z0-9_-]{1,100}$/i.test(order.pi_payment_id) &&
    typeof order.txid === "string" && /^[a-f0-9]{64}$/i.test(order.txid) &&
    order.completed_at instanceof Date && Number.isFinite(order.completed_at.getTime()));
  const ambiguous = new Set(orders.filter(order => order.product_id !== card.productId).map(order => order.pi_payment_id));
  return [...new Set(matches.filter(order => !ambiguous.has(order.pi_payment_id)).map(order => order.pi_payment_id))];
}
