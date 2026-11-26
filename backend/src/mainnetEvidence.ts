import { createHash } from "node:crypto";
import axios from "axios";
import type { Request } from "express";
import { findOffer } from "./hangarCatalog";
import { chargePayment } from "./chargePurchase";

export const MAINNET_EVIDENCE_ID = "mainnet-readiness-evidence:v1";
export type CapabilityCheck = { id: string; ready: boolean; reason: string };
const check = (id: string, ready: boolean, reason: string): CapabilityCheck => ({ id, ready, reason });
const publicKey = (value: unknown): value is string => typeof value === "string" && /^G[A-Z2-7]{55}$/.test(value);
const digest = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const officialEvidence = (value: any, status: "approved" | "connected" = "approved") => {
  if (value?.status !== status || !digest(value?.evidenceSha256)) return false;
  try {
    const url = new URL(value.sourceUrl);
    return url.protocol === "https:" && !url.username && !url.password && !url.port &&
      ["develop.pi", "developers.minepi.com", "minepi.com"].includes(url.hostname);
  } catch { return false; }
};

// Read-only evidence. There is deliberately no public endpoint to create these
// records, approve a wallet or claim that the Core Team approved this app.
// An owner-reviewed portal evidence record is distinct from a Pi API probe.
export async function inspectCheckoutEvidence(req: Request): Promise<CapabilityCheck[]> {
  const deployment = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const networkConfigured = process.env.CRYPTOID_APP_NETWORK === "mainnet" &&
    (!deployment || ["cryptoid-evolution.vercel.app", "www.cryptoid-evolution.app", "cryptoid-evolution.app"].includes(deployment));
  const appId = process.env.PI_MAINNET_APP_ID?.trim();
  const key = process.env.PI_MAINNET_API_KEY?.trim();
  const wallet = process.env.PI_MAINNET_WALLET_ADDRESS?.trim();
  const revision = process.env.VERCEL_GIT_COMMIT_SHA || process.env.CRYPTOID_CODE_REVISION;
  const owner = process.env.ADMIN_PI_UID?.trim();
  const checks = [
    check("appNetwork", Boolean(networkConfigured && appId), "mainnet_app_configuration_required"),
    check("piPayments", Boolean(key), "scoped_mainnet_key_required"),
    check("walletConnection", false, "approved_wallet_evidence_required"),
    check("walletCheckout", false, "verified_mainnet_checkout_required"),
    check("externalPiApproval", false, "reviewed_pi_approval_evidence_required"),
  ];
  for (const item of checks) if (item.ready) item.reason = "configured";
  const collection = req.app.locals.adminCollection;
  if (!networkConfigured || !key || !collection || !owner || !appId || !publicKey(wallet) || !revision || !/^[a-f0-9]{40}$/.test(revision)) return checks;
  const evidence = await collection.findOne({ _id: MAINNET_EVIDENCE_ID });
  const reviewed = Date.parse(evidence?.reviewedAt), expires = Date.parse(evidence?.validUntil);
  const now = Date.now();
  const bound = evidence?.schemaVersion === 1 && evidence?.network === "Pi Network" && evidence?.appId === appId &&
    evidence?.walletAddress === wallet && evidence?.codeRevision === revision && evidence?.reviewedBy === owner &&
    digest(evidence?.keyFingerprint) && key && evidence.keyFingerprint === createHash("sha256").update(key).digest("hex") &&
    Number.isFinite(reviewed) && reviewed <= now && Number.isFinite(expires) && expires > now &&
    expires > reviewed && expires - reviewed <= 90 * 86400_000;
  if (!bound) return checks;
  // Approval to use an incoming wallet is not proof it was connected to this
  // app. Require a separate reviewed connection artifact for the same bound
  // configuration. Neither value is inferred from a key or a successful probe.
  const connection = evidence.walletConnection;
  const connected = officialEvidence(connection, "connected") && connection.appId === appId &&
    connection.network === "Pi Network" && connection.walletAddress === wallet && connection.codeRevision === revision;
  checks[2] = check("walletConnection", officialEvidence(evidence.walletApproval) && connected, "approved_wallet_evidence_required");
  checks[4] = check("externalPiApproval", officialEvidence(evidence.appApproval), "reviewed_pi_approval_evidence_required");
  for (const item of [checks[2], checks[4]]) if (item.ready) item.reason = "reviewed_evidence";
  if (!checks[0].ready || !checks[1].ready || !checks[2].ready || !checks[4].ready ||
      typeof evidence.checkoutPaymentId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(evidence.checkoutPaymentId)) return checks;
  // A historical receipt only proves a payment exists. Separately require the
  // retained operator acceptance of the actual current-revision U2A flow. This
  // is reviewed evidence, never inferred from an SDK key or a successful GET.
  const acceptance = evidence.checkoutAcceptance;
  const acceptedAt = Date.parse(acceptance?.verifiedAt);
  if (acceptance?.kind !== "end_to_end_u2a" || acceptance.codeRevision !== revision ||
      acceptance.paymentId !== evidence.checkoutPaymentId || acceptance.reviewedBy !== owner ||
      !digest(acceptance.evidenceSha256) || !Number.isFinite(acceptedAt) || acceptedAt > reviewed) return checks;
  const orders = req.app.locals.orderCollection;
  if (!orders) return checks;
  const order = await orders.findOne({ pi_payment_id: evidence.checkoutPaymentId, payment_network: "Pi Network", paid: true, cancelled: { $ne: true } });
  const offer = order && findOffer(order.product_id);
  const approvedAt = new Date(order?.approved_at).getTime(), completedAt = new Date(order?.completed_at).getTime();
  if (!offer || !order.user || !order.txid || !order.approved_at || !order.completed_at ||
      !Number.isFinite(approvedAt) || !Number.isFinite(completedAt) || completedAt < approvedAt || completedAt > now ||
      acceptedAt < completedAt || order.to_address !== wallet) return checks;
  try {
    // No /approve or /complete calls: this only checks an existing receipt.
    const { data: payment } = await axios.get(`https://api.minepi.com/v2/payments/${encodeURIComponent(order.pi_payment_id)}`, {
      headers: { Authorization: `Key ${key}` }, timeout: 4000, maxRedirects: 0,
    });
    const purchase = chargePayment(offer, payment?.metadata);
    const verified = payment?.identifier === order.pi_payment_id && payment.network === "Pi Network" &&
      payment.user_uid === order.user && payment.direction === "user_to_app" && payment.to_address === wallet &&
      payment.metadata?.productId === offer.id && purchase && purchase.quantity === (order.quantity ?? 1) &&
      (payment.metadata?.weaponModel === 2 ? 2 : 1) === (order.weapon_model ?? 1) && payment.metadata?.powerModel === order.power_model &&
      payment.amount === purchase.amount && payment.amount === order.payment_amount_pi &&
      payment.status?.developer_approved === true && payment.status?.developer_completed === true &&
      payment.status?.transaction_verified === true && !payment.status?.cancelled && !payment.status?.user_cancelled &&
      payment.transaction?.txid === order.txid && /^[a-f0-9]{64}$/i.test(order.txid);
    checks[3] = check("walletCheckout", Boolean(verified), verified ? "verified_existing_receipt" : "mainnet_checkout_evidence_mismatch");
  } catch { checks[3].reason = "mainnet_checkout_verification_unavailable"; }
  return checks;
}
