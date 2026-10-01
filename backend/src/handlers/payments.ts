import { Router } from "express";
import { platformAPIClientForRequest } from "../services/platformAPIClient";
import { findOffer, shipUpgradePrerequisite } from "../hangarCatalog";
import "../types/session";
import { isAdminMode } from "../adminAccess";
import { testPiPurchaseAllowed } from "../paymentPolicy";
import { paymentSnapshot } from "../paymentRecords";
import { readPaymentReceipt } from "../paymentReceipt";

const identifier = (value: unknown) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : null;
const fetchPayment = async (req: any, id: string) => (await platformAPIClientForRequest(req).get(`/v2/payments/${id}`)).data;


const safeDiagnosticText = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  return value
    .replace(/Key\s+[A-Za-z0-9._-]+/gi, "Key [redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .slice(0, 180);
};

const paymentFailureDiagnostic = (error: any) => {
  if (error instanceof Error && error.message === "PI_TESTNET_API_KEY is not configured") {
    return { code: "testnet_api_key_missing" };
  }

  const status = Number(error?.response?.status);
  const data = error?.response?.data;
  const piCode = safeDiagnosticText(
    typeof data?.error === "string" ? data.error :
    typeof data?.code === "string" ? data.code :
    undefined
  );
  const piMessage = safeDiagnosticText(
    typeof data?.message === "string" ? data.message :
    typeof data === "string" ? data :
    undefined
  );

  return {
    code: status ? "pi_api_error" : "server_error",
    ...(status ? { piStatus: status } : {}),
    ...(piCode ? { piCode } : {}),
    ...(piMessage ? { piMessage } : {}),
  };
};

export default function mountPaymentsEndpoints(router: Router) {
  router.post("/approve", async (req, res) => {
    if (isAdminMode(req)) return res.status(403).json({ error: "Switch to normal mode for real Pi purchases" });
    const uid = req.session.currentUser?.uid;
    const id = identifier(req.body?.paymentId);
    if (!uid) return res.status(401).json({ error: "session_missing", stage: "approval", message: "Pi session is missing on the payment server" });
    if (!id) return res.status(400).json({ error: "invalid_payment_id", stage: "approval", message: "Pi did not provide a valid payment id" });
    try {
      const payment = await fetchPayment(req, id);
      const offer = findOffer(payment.metadata?.productId);
      if (!offer || payment.identifier !== id || payment.user_uid !== uid || payment.direction !== "user_to_app" || payment.amount !== offer.pricePi || payment.status?.cancelled || payment.status?.user_cancelled) {
        return res.status(400).json({ error: "payment_catalog_mismatch", stage: "approval", message: "Payment data does not match the signed-in user or catalog" });
      }
      if (!testPiPurchaseAllowed(offer, payment.network)) return res.status(403).json({ error: "testnet_policy_rejected", stage: "approval", network: payment.network, message: "This payment is not an enabled Test-Pi weapon purchase" });
      const orders = req.app.locals.orderCollection;
      const existing = await orders.findOne({ pi_payment_id: id });
      if (existing && (existing.user !== uid || existing.product_id !== offer.id || existing.cancelled)) return res.status(409).json({ error: "payment_conflict", stage: "approval", message: "Payment is already assigned or cancelled" });
      if (!existing && (offer.kind === "armor" || offer.kind === "ship_upgrade") && await orders.findOne({ user: uid, product_id: offer.id, paid: true })) return res.status(409).json({ error: "already_owned", stage: "approval", message: "Permanent upgrade already owned" });
      const prerequisite = shipUpgradePrerequisite(offer);
      if (prerequisite && !await orders.findOne({ user: uid, product_id: prerequisite, paid: true })) return res.status(403).json({ error: "prerequisite_missing", stage: "approval", message: "Advanced stage required before Elite" });
       if (!existing) await orders.updateOne({ pi_payment_id: id }, { $setOnInsert: { pi_payment_id: id, product_id: offer.id, user: uid, paid: false, created_at: new Date() } }, { upsert: true });
      if (!payment.status?.developer_approved) await platformAPIClientForRequest(req).post(`/v2/payments/${id}/approve`);
      await orders.updateOne({ pi_payment_id: id, user: uid, paid: false }, { $set: { ...paymentSnapshot(payment, offer.name), approved_at: new Date() } });
      return res.json({ approved: true });
    } catch (error) {
      const diagnostic = paymentFailureDiagnostic(error);
      console.error("Payment approval failed", diagnostic);
      return res.status(502).json({ error: "payment_approval_failed", stage: "approval", diagnostic });
    }
  });

  const complete = async (req: any, res: any, id: string, suppliedTxid?: string) => {
    const uid = req.session.currentUser?.uid;
    if (!uid) return res.status(401).json({ error: "Sign in first" });
    try {
      const orders = req.app.locals.orderCollection;
      const order = await orders.findOne({ pi_payment_id: id, user: uid });
      if (!order || order.cancelled) return res.status(404).json({ error: "Approved order not found" });
      if (order.paid) return res.json({ completed: true });
      const payment = await fetchPayment(req, id);
      const offer = findOffer(order.product_id);
      const txid = payment.transaction?.txid;
      if (!testPiPurchaseAllowed(offer, payment.network)) return res.status(403).json({ error: "Only Test-Pi weapon payments are enabled" });
      if (!offer || payment.identifier !== id || payment.user_uid !== uid || payment.metadata?.productId !== offer.id || payment.direction !== "user_to_app" || payment.amount !== offer.pricePi || !payment.status?.developer_approved || payment.status?.cancelled || payment.status?.user_cancelled || !payment.status?.transaction_verified || !txid || (suppliedTxid && suppliedTxid !== txid)) {
        return res.status(400).json({ error: "Payment not verified" });
      }
      const prerequisite = shipUpgradePrerequisite(offer);
      if (prerequisite && !await orders.findOne({ user: uid, product_id: prerequisite, paid: true })) return res.status(403).json({ error: "Advanced stage required before Elite" });
      if (!payment.status?.developer_completed) await platformAPIClientForRequest(req).post(`/v2/payments/${id}/complete`, { txid });
      // Credit only after Pi has confirmed /complete (or reported already completed).
      const receipt = await readPaymentReceipt(payment);
      await orders.updateOne({ pi_payment_id: id, user: uid, paid: false, cancelled: { $ne: true } }, { $set: { paid: true, txid, completed_at: new Date(), ...paymentSnapshot(payment, offer.name), ...receipt } });
      return res.json({ completed: true });
    } catch (error) {
      console.error("Payment completion failed", error);
      return res.status(502).json({ error: "Payment could not be confirmed" });
    }
  };

  router.post("/complete", (req, res) => {
    const id = identifier(req.body?.paymentId);
    if (!id || typeof req.body?.txid !== "string") return res.status(400).json({ error: "Invalid payment" });
    return complete(req, res, id, req.body.txid);
  });
  router.post("/incomplete", (req, res) => {
    const id = identifier(req.body?.payment?.identifier);
    if (!id) return res.status(400).json({ error: "Invalid payment" });
    return complete(req, res, id);
  });
  router.post("/cancelled_payment", async (req, res) => {
    const uid = req.session.currentUser?.uid;
    const id = identifier(req.body?.paymentId);
    if (!uid) return res.status(401).json({ error: "Sign in first" });
    if (!id) return res.status(400).json({ error: "Invalid payment" });
    try {
      const payment = await fetchPayment(req, id);
      if (payment.user_uid !== uid || !payment.status?.user_cancelled && !payment.status?.cancelled) return res.status(400).json({ error: "Payment is not cancelled" });
      await req.app.locals.orderCollection.updateOne({ pi_payment_id: id, user: uid, paid: false }, { $set: { cancelled: true, cancelled_at: new Date() } });
      return res.json({ cancelled: true });
    } catch (error) { return res.status(502).json({ error: "Could not verify cancellation" }); }
  });
}
