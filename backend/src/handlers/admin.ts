import { Router, type RequestHandler } from "express";
import { canAdmin, isAdminMode } from "../adminAccess";
import { hangarCatalog, findOffer } from "../hangarCatalog";
import {
  csvRow,
  paymentRecord,
  paymentRecordHeaders,
  paymentSnapshot,
  paymentView,
  ledgerFilter,
  type LedgerNetwork,
  type LedgerStatus,
} from "../paymentRecords";
import { readPaymentReceipt } from "../paymentReceipt";
import { platformAPIClientForRequest } from "../services/platformAPIClient";

const networks = ["all", "mainnet", "testnet", "unknown"] as const;
const statuses = ["all", "confirmed", "pending", "cancelled"] as const;
const identifier = (value: unknown) =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value)
    ? value
    : null;
const requireOwner: RequestHandler = async (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (!req.session.currentUser)
    return res.status(401).json({ error: "not_authenticated" });
  if (!(await canAdmin(req)))
    return res.status(403).json({ error: "not_authorized" });
  return next();
};

export default function mountAdminEndpoints(router: Router) {
  // Authenticate every admin route independently of the optional gameplay mode.
  router.use(requireOwner);

  router.get("/usage", async (req, res) => {
    const days = Number(req.query.days || 7);
    const network = String(req.query.network || "mainnet");
    if (![1, 7, 30, 90].includes(days) || !["all", "mainnet", "testnet"].includes(network))
      return res.status(400).json({ error: "invalid_filter" });
    const collection = req.app.locals.usageCollection;
    if (!collection) return res.status(503).json({ error: "database_unavailable" });
    const until = new Date();
    const since = new Date(until.getTime() - days * 86_400_000); since.setUTCMinutes(0, 0, 0);
    try {
      const filter = { hour: { $gte: since, $lte: until }, ...(network === "all" ? {} : { network }) };
      const rows = await collection.find(filter, { projection: { _id: 0, hour: 1, browser: 1, network: 1, visits: 1, activeSeconds: 1, gameSeconds: 1 } }).sort({ hour: -1 }).limit(13_000).toArray();
      return res.json({ since, until, days, rows, retentionDays: 90 });
    } catch { return res.status(503).json({ error: "statistics_unavailable" }); }
  });

  router.get("/status", (req, res) =>
    res.json({
      username: req.session.currentUser!.username,
      uid: req.session.currentUser!.uid,
      canAdmin: true,
      adminMode: isAdminMode(req),
      services: {
        database: Boolean(
          req.app.locals.orderCollection && req.app.locals.userCollection,
        ),
        mainnetPayments: Boolean(process.env.PI_API_KEY?.trim()),
        testnetPayments: Boolean(process.env.PI_TESTNET_API_KEY?.trim()),
      },
      game: { sections: 500, levels: 50, bosses: 50, ships: 20, stages: 3 },
    }),
  );

  router.post("/start", async (req, res) => {
    const {
      sector = 1,
      shipStage = 1,
      weaponLevel = 1,
      power = null,
      phase = "normal",
    } = req.body || {};
    if (
      !Number.isInteger(sector) ||
      sector < 1 ||
      sector > 500 ||
      !Number.isInteger(shipStage) ||
      shipStage < 1 ||
      shipStage > 3 ||
      !Number.isInteger(weaponLevel) ||
      weaponLevel < 1 ||
      weaponLevel > 5 ||
      !["normal", "boss", "bonus"].includes(phase) ||
      (phase === "normal" ? sector % 10 === 0 : sector % 10 !== 0)
    ) {
      return res.status(400).json({ error: "invalid_test_configuration" });
    }
    const powerOffer =
      power === null
        ? null
        : typeof power === "string"
          ? findOffer(power)
          : null;
    if (power !== null && powerOffer?.kind !== "power")
      return res.status(400).json({ error: "invalid_power" });
    req.session.adminMode = true;
    req.session.adminUid = req.session.currentUser!.uid;
    req.session.scoreRun = null;
    return res.json({
      armorBonus: 3,
      weaponLevel,
      unlockedWeaponLevels: [1, 2, 3, 4, 5],
      ownedShipUpgrades: hangarCatalog
        .filter((offer) => offer.kind === "ship_upgrade")
        .map((offer) => offer.id),
      powerUp: powerOffer?.kind === "power" ? powerOffer.powerUp : null,
      scoreRunId: null,
      startSector: sector,
      shipStage,
      startPhase: phase,
      adminPreview: true,
    });
  });

  router.get("/payments", async (req, res) => {
    const network = String(req.query.network || "mainnet") as LedgerNetwork;
    const status = String(req.query.status || "all") as LedgerStatus;
    const page = Number(req.query.page || 1);
    if (
      !networks.includes(network) ||
      !statuses.includes(status) ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > 100_000
    )
      return res.status(400).json({ error: "invalid_filter" });
    const orders = req.app.locals.orderCollection;
    if (!orders) return res.status(503).json({ error: "database_unavailable" });
    try {
      const filter = ledgerFilter(network, status);
      const confirmed = {
        $and: [{ $eq: ["$paid", true] }, { $ne: ["$cancelled", true] }],
      };
      const [rows, total, summary] = await Promise.all([
        orders
          .find(filter)
          .sort({ created_at: -1, pi_payment_id: -1 })
          .skip((page - 1) * 25)
          .limit(25)
          .toArray(),
        orders.countDocuments(filter),
        orders
          .aggregate([
            {
              $group: {
                _id: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$payment_network", "Pi Network"] },
                        then: "mainnet",
                      },
                      {
                        case: { $eq: ["$payment_network", "Pi Testnet"] },
                        then: "testnet",
                      },
                    ],
                    default: "unknown",
                  },
                },
                total: { $sum: 1 },
                confirmed: { $sum: { $cond: [confirmed, 1, 0] } },
                confirmedPi: {
                  $sum: {
                    $cond: [
                      {
                        $and: [confirmed, { $isNumber: "$payment_amount_pi" }],
                      },
                      "$payment_amount_pi",
                      0,
                    ],
                  },
                },
                missingAmounts: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          confirmed,
                          { $not: [{ $isNumber: "$payment_amount_pi" }] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ])
          .toArray(),
      ]);
      return res.json({
        payments: rows.map(paymentView),
        total,
        page,
        pageSize: 25,
        summary,
      });
    } catch {
      return res.status(503).json({ error: "ledger_unavailable" });
    }
  });

  router.get("/payments/export", async (req, res) => {
    const network = String(req.query.network || "mainnet") as LedgerNetwork;
    const status = String(req.query.status || "all") as LedgerStatus;
    if (!networks.includes(network) || !statuses.includes(status))
      return res.status(400).json({ error: "invalid_filter" });
    const orders = req.app.locals.orderCollection;
    if (!orders) return res.status(503).json({ error: "database_unavailable" });
    try {
      const cursor = orders
        .find(ledgerFilter(network, status))
        .sort({ created_at: 1, pi_payment_id: 1 });
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="cryptoid-pi-zahlungen-${network}-${status}.csv"`,
      );
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.write(`\uFEFF${csvRow(paymentRecordHeaders)}`);
      for await (const order of cursor) res.write(csvRow(paymentRecord(order)));
      res.end();
    } catch {
      if (!res.headersSent)
        return res.status(503).json({ error: "export_failed" });
      res.destroy(new Error("Export failed"));
    }
  });

  router.post("/payments/:id/refresh", async (req, res) => {
    const id = identifier(req.params.id);
    const network = req.body?.network;
    if (!id || !["mainnet", "testnet"].includes(network))
      return res.status(400).json({ error: "invalid_request" });
    const orders = req.app.locals.orderCollection;
    if (!orders) return res.status(503).json({ error: "database_unavailable" });
    try {
      const order = await orders.findOne({ pi_payment_id: id });
      if (!order) return res.status(404).json({ error: "payment_not_found" });
      const client = platformAPIClientForRequest({
        headers: { "x-cryptoid-app-network": network },
      });
      const { data: payment } = await client.get(`/v2/payments/${id}`);
      const offer = findOffer(order.product_id);
      if (
        payment.identifier !== id ||
        payment.user_uid !== order.user ||
        payment.direction !== "user_to_app" ||
        payment.metadata?.productId !== order.product_id ||
        !offer ||
        typeof payment.amount !== "number" ||
        !Number.isFinite(payment.amount) ||
        payment.amount < 0 ||
        payment.network !==
          (network === "testnet" ? "Pi Testnet" : "Pi Network") ||
        (order.paid &&
          (!payment.status?.developer_completed ||
            !payment.status?.transaction_verified ||
            payment.status?.cancelled ||
            payment.status?.user_cancelled ||
            (order.txid && order.txid !== payment.transaction?.txid)))
      ) {
        return res.status(409).json({ error: "payment_verification_mismatch" });
      }
      const receipt = await readPaymentReceipt(payment);
      // Backfill evidence only. This endpoint never completes or credits a purchase.
      const snapshot = { ...paymentSnapshot(payment, offer.name), ...receipt };
      await orders.updateOne({ pi_payment_id: id }, { $set: snapshot });
      return res.json({
        payment: paymentView({ ...order, ...snapshot }),
        receiptFound: Boolean(receipt.wallet_received_at),
      });
    } catch {
      return res
        .status(502)
        .json({ error: "payment_verification_unavailable" });
    }
  });

  router.post("/payments/:id/valuation", async (req, res) => {
    const id = identifier(req.params.id);
    const { eurPerPi, source, receiptNumber = "" } = req.body || {};
    if (
      !id ||
      typeof eurPerPi !== "number" ||
      !Number.isFinite(eurPerPi) ||
      eurPerPi <= 0 ||
      eurPerPi > 1_000_000 ||
      typeof source !== "string" ||
      !source.trim() ||
      source.length > 500 ||
      typeof receiptNumber !== "string" ||
      receiptNumber.length > 100
    )
      return res.status(400).json({ error: "invalid_valuation" });
    const orders = req.app.locals.orderCollection;
    if (!orders) return res.status(503).json({ error: "database_unavailable" });
    try {
      const order = await orders.findOne({
        pi_payment_id: id,
        paid: true,
        cancelled: { $ne: true },
        payment_network: "Pi Network",
      });
      if (
        !order ||
        !order.wallet_received_at ||
        !Number.isFinite(new Date(order.wallet_received_at).getTime()) ||
        typeof order.payment_amount_pi !== "number" ||
        !Number.isFinite(order.payment_amount_pi)
      ) {
        return res.status(409).json({ error: "verified_receipt_required" });
      }
      const valuation = {
        eurPerPi,
        eurAmount: Math.round(order.payment_amount_pi * eurPerPi * 100) / 100,
        source: source.trim(),
        at: order.wallet_received_at,
        receiptNumber: receiptNumber.trim(),
        recordedAt: new Date(),
        recordedBy: req.session.currentUser!.uid,
      };
      await orders.updateOne({ pi_payment_id: id }, { $set: { valuation } });
      return res.json({ payment: paymentView({ ...order, valuation }) });
    } catch {
      return res.status(503).json({ error: "valuation_unavailable" });
    }
  });
}
