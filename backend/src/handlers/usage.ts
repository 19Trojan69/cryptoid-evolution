import type { RequestHandler } from "express";
import { usageIncrement } from "../usageStats";

// A coarse per-process budget, without IP-based or visitor-based rate keys.
let minute = 0, requests = 0;
export const collectUsage: RequestHandler = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const origin = req.get("origin");
  const permitted = new Set([process.env.FRONTEND_URL, "https://cryptoid-evolution.vercel.app", "https://cryptoid-evolution-testnet.vercel.app", "https://cryptoidevo3025.pinet.com", `${req.protocol}://${req.get("host")}`]);
  if (!origin || !permitted.has(origin)) return res.sendStatus(403);
  const current = Math.floor(Date.now() / 60_000);
  if (minute !== current) { minute = current; requests = 0; }
  if (++requests > 600) return res.sendStatus(429);
  const increment = usageIncrement(req.body, new Date(), req.get("x-cryptoid-app-network") === "testnet" ? "testnet" : "mainnet");
  if (!increment) return res.sendStatus(400);
  const collection = req.app.locals.usageCollection;
  if (!collection) return res.sendStatus(503);
  try {
    const update = { $setOnInsert: increment.fixed, $inc: increment.counters };
    try { await collection.updateOne({ _id: increment.id }, update, { upsert: true }); }
    catch (error: unknown) {
      if ((error as { code?: number }).code !== 11000) throw error;
      await collection.updateOne({ _id: increment.id }, { $inc: increment.counters });
    }
    return res.sendStatus(204);
  } catch { return res.sendStatus(503); }
};
