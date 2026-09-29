import { Router } from "express";
import platformAPIClient from "../services/platformAPIClient";
import { findOffer, shipUpgradePrerequisite } from "../hangarCatalog";
import "../types/session";
import { canAdmin, isAdminMode } from "../adminAccess";
import { csvRow, paymentRecord, paymentRecordHeaders, paymentSnapshot, piNetwork } from "../paymentRecords";

const identifier = (value: unknown) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : null;
const fetchPayment = async (id: string) => (await platformAPIClient.get(`/v2/payments/${id}`)).data;

export default function mountPaymentsEndpoints(router: Router) {
  router.post("/approve", async (req, res) => {
    if (isAdminMode(req)) return res.status(403).json({ error: "Switch to normal mode for real Pi purchases" });
    const uid = req.session.currentUser?.uid;
    const id = identifier(req.body?.paymentId);
    if (!uid) return res.status(401).json({ error: "Sign in first" });
    if (!id) return res.status(400).json({ error: "Invalid payment" });
    try {
      const payment = await fetchPayment(id);
      const offer = findOffer(payment.metadata?.productId);
      if (!offer || payment.identifier !== id || payment.user_uid !== uid || payment.direction !== "user_to_app" || payment.amount !== offer.pricePi || payment.status?.cancelled || payment.status?.user_cancelled) {
        return res.status(400).json({ error: "Payment does not match the signed-in user and catalog price" });
      }
      const orders = req.app.locals.orderCollection;
      const existing = await orders.findOne({ pi_payment_id: id });
      if (existing && (existing.user !== uid || existing.product_id !== offer.id || existing.cancelled)) return res.status(409).json({ error: "Payment already assigned or cancelled" });
      if (!existing && (offer.kind === "armor" || offer.kind === "ship_upgrade") && await orders.findOne({ user: uid, product_id: offer.id, paid: true })) return res.status(409).json({ error: "Permanent upgrade already owned" });
      const prerequisite = shipUpgradePrerequisite(offer);
      if (prerequisite && !await orders.findOne({ user: uid, product_id: prerequisite, paid: true })) return res.status(403).json({ error: "Advanced stage required before Elite" });
      if (!existing) await orders.updateOne({ pi_payment_id: id }, { $setOnInsert: { pi_payment_id: id, product_id: offer.id, user: uid, paid: false, created_at: new Date() } }, { upsert: true });
      if (!payment.status?.developer_approved) await platformAPIClient.post(`/v2/payments/${id}/approve`);
      await orders.updateOne({ pi_payment_id: id, user: uid, paid: false }, { $set: { ...paymentSnapshot(payment, offer.name), approved_at: new Date() } });
      return res.json({ approved: true });
    } catch (error) {
      console.error("Payment approval failed", error);
      return res.status(502).json({ error: "Payment could not be approved" });
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
      const payment = await fetchPayment(id);
      const offer = findOffer(order.product_id);
      const txid = payment.transaction?.txid;
      if (!offer || payment.identifier !== id || payment.user_uid !== uid || payment.metadata?.productId !== offer.id || payment.direction !== "user_to_app" || payment.amount !== offer.pricePi || !payment.status?.developer_approved || payment.status?.cancelled || payment.status?.user_cancelled || !payment.status?.transaction_verified || !txid || (suppliedTxid && suppliedTxid !== txid)) {
        return res.status(400).json({ error: "Payment not verified" });
      }
      const prerequisite = shipUpgradePrerequisite(offer);
      if (prerequisite && !await orders.findOne({ user: uid, product_id: prerequisite, paid: true })) return res.status(403).json({ error: "Advanced stage required before Elite" });
      if (!payment.status?.developer_completed) await platformAPIClient.post(`/v2/payments/${id}/complete`, { txid });
      // Credit only after Pi has confirmed /complete (or reported already completed).
      await orders.updateOne({ pi_payment_id: id, user: uid, paid: false, cancelled: { $ne: true } }, { $set: { paid: true, txid, completed_at: new Date(), ...paymentSnapshot(payment, offer.name) } });
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
      const payment = await fetchPayment(id);
      if (payment.user_uid !== uid || !payment.status?.user_cancelled && !payment.status?.cancelled) return res.status(400).json({ error: "Payment is not cancelled" });
      await req.app.locals.orderCollection.updateOne({ pi_payment_id: id, user: uid, paid: false }, { $set: { cancelled: true, cancelled_at: new Date() } });
      return res.json({ cancelled: true });
    } catch (error) { return res.status(502).json({ error: "Could not verify cancellation" }); }
  });

  // Owner-only ledger. The admin preview switch is not required: it only changes gameplay.
  router.get("/admin/export", async (req, res) => {
    if (!await canAdmin(req)) return res.status(req.session.currentUser ? 403 : 401).json({ error: "not_authorized" });
    const network = req.query.network;
    if (network !== "all" && network !== "mainnet" && network !== "testnet" && network !== "unknown") {
      return res.status(400).json({ error: "Invalid network filter" });
    }
    const orders = req.app.locals.orderCollection;
    if (!orders) return res.status(503).json({ error: "Database not ready" });
    try {
      const filter = network === "mainnet" ? { payment_network: "Pi Network" }
        : network === "testnet" ? { payment_network: "Pi Testnet" }
        : network === "unknown" ? { payment_network: { $nin: ["Pi Network", "Pi Testnet"] } }
        : {};
      const cursor = orders.find(filter).sort({ created_at: 1, pi_payment_id: 1 });
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="cryptoid-pi-zahlungen-${network}.csv"`);
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.write(`\uFEFF${csvRow(paymentRecordHeaders)}`);
      for await (const order of cursor) {
        const actual = piNetwork(order.payment_network);
        if (network === "mainnet" && actual !== "Pi Network" ||
            network === "testnet" && actual !== "Pi Testnet" ||
            network === "unknown" && actual !== "Ungeklärt") continue;
        res.write(csvRow(paymentRecord(order)));
      }
      res.end();
    } catch (error) {
      console.error("Payment ledger export failed", error);
      if (!res.headersSent) return res.status(500).json({ error: "Export failed" });
      res.destroy(error instanceof Error ? error : new Error("Export failed"));
    }
  });
}
