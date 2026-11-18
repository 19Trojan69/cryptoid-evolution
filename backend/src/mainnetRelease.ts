import type { Request, Router } from "express";
import { rewardNetwork } from "./rewardNetwork";

const releaseId = "mainnet-release:v1";

export type MainnetReadiness = {
  ready: boolean;
  checks: { id: "database" | "piPayments" | "walletCheckout" | "nftIssuance" | "nftMetadata"; ready: boolean }[];
};

export function inspectMainnetReadiness(req: Request): MainnetReadiness {
  const checks: MainnetReadiness["checks"] = [
    { id: "database", ready: Boolean(req.app.locals.adminCollection && req.app.locals.orderCollection && req.app.locals.userCollection) },
    { id: "piPayments", ready: Boolean(process.env.PI_API_KEY?.trim()) },
    { id: "walletCheckout", ready: false },
    // The current application prepares artwork and eligibility. Actual issuance
    // and immutable metadata must be integrated before either check can pass.
    { id: "nftIssuance", ready: false },
    { id: "nftMetadata", ready: false },
  ];
  return { ready: checks.every(check => check.ready), checks };
}

type ReleaseState = { released: boolean; revision: number };

export async function readMainnetRelease(req: Request, readiness = inspectMainnetReadiness(req)) {
  const collection = req.app.locals.adminCollection;
  if (!collection) throw new Error("release_database_unavailable");
  const saved = await collection.findOne({ _id: releaseId });
  if (saved && (typeof saved.released !== "boolean" || !Number.isSafeInteger(saved.revision) || saved.revision < 0)) {
    throw new Error("invalid_release_state");
  }
  const state: ReleaseState = saved ?? { released: false, revision: 0 };
  return {
    enabled: state.released && readiness.ready,
    released: state.released,
    revision: state.revision,
    ready: readiness.ready,
    checks: readiness.checks,
  };
}

export async function mainnetPurchasesReleased(req: Request): Promise<boolean> {
  try {
    if (rewardNetwork(req) !== "mainnet") return false;
    return (await readMainnetRelease(req)).enabled;
  }
  catch { return false; }
}

// The parent Admin router performs a fresh verified-owner check on every route.
export function mountMainnetRelease(router: Router, inspect = inspectMainnetReadiness) {
  router.get("/mainnet-release", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (rewardNetwork(req) !== "mainnet") return res.status(403).json({ error: "mainnet_admin_required" });
    try { return res.json(await readMainnetRelease(req, inspect(req))); }
    catch { return res.status(503).json({ error: "mainnet_release_unavailable" }); }
  });

  router.post("/mainnet-release", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (rewardNetwork(req) !== "mainnet") return res.status(403).json({ error: "mainnet_admin_required" });
    const { action, revision } = req.body ?? {};
    if (!["release", "hold"].includes(action) || !Number.isSafeInteger(revision) || revision < 0) {
      return res.status(400).json({ error: "invalid_release_change" });
    }
    try {
      const readiness = inspect(req);
      const current = await readMainnetRelease(req, readiness);
      if (action === "release" && !readiness.ready) {
        return res.status(409).json({ error: "mainnet_not_ready", ...current });
      }
      const released = action === "release";
      if (current.released === released) return res.json(current);
      if (current.revision !== revision) return res.status(409).json({ error: "release_changed", ...current });
      const collection = req.app.locals.adminCollection;
      try {
        await collection.updateOne({ _id: releaseId }, {
          $setOnInsert: { released: false, revision: 0 },
        }, { upsert: true });
      } catch (error: any) { if (error?.code !== 11000) throw error; }
      const result = await collection.updateOne({ _id: releaseId, revision }, {
        $set: {
          released,
          revision: revision + 1,
          updatedAt: new Date(),
          updatedBy: req.session.currentUser!.uid,
        },
      });
      if (result.matchedCount !== 1) {
        return res.status(409).json({ error: "release_changed", ...await readMainnetRelease(req, inspect(req)) });
      }
      return res.json(await readMainnetRelease(req, inspect(req)));
    } catch { return res.status(503).json({ error: "mainnet_release_unavailable" }); }
  });
}
