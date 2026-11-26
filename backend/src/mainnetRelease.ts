import type { Request, Router } from "express";
import { rewardNetwork } from "./rewardNetwork";
import { inspectCheckoutEvidence, type CapabilityCheck } from "./mainnetEvidence";
import { inspectNftReadiness } from "./nftReadiness";

const releaseId = "mainnet-release:v1";

export type MainnetReadiness = {
  ready: boolean;
  checks: CapabilityCheck[];
};

const unavailableReadiness = (): MainnetReadiness => ({
  ready: false,
  checks: [{ id: "readinessInspection", ready: false, reason: "readiness_inspection_unavailable" }],
});

// Reporting an inspection failure must not hide a readable operator release
// and revision: the owner still needs them to explicitly put the app on hold.
// This fallback never authorizes a release or marks a capability ready.
const inspectStatus = async (req: Request, inspect: (req: Request) => MainnetReadiness | Promise<MainnetReadiness>) => {
  try { return await inspect(req); }
  catch { return unavailableReadiness(); }
};

export async function inspectMainnetReadiness(req: Request): Promise<MainnetReadiness> {
  let database = false;
  const locals = req.app.locals;
  if (locals.adminCollection && locals.orderCollection && locals.userCollection && locals.databaseClient) {
    try { await locals.databaseClient.db().command({ ping: 1, maxTimeMS: 3000 }); database = true; }
    catch { /* A failed read-only probe keeps all new purchases locked. */ }
  }
  const nft = inspectNftReadiness(req);
  const checks: MainnetReadiness["checks"] = [
    { id: "database", ready: database, reason: database ? "storage_available" : "storage_unavailable" },
    ...await inspectCheckoutEvidence(req),
    { id: "nftIssuance", ...nft.issuance },
    { id: "nftMetadata", ...nft.metadata },
  ];
  return { ready: checks.every(check => check.ready), checks };
}

type ReleaseState = { released: boolean; revision: number };

export async function readMainnetRelease(req: Request, inspected: MainnetReadiness | Promise<MainnetReadiness> = inspectMainnetReadiness(req)) {
  const readiness = await inspected;
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
export function mountMainnetRelease(router: Router, inspect: (req: Request) => MainnetReadiness | Promise<MainnetReadiness> = inspectMainnetReadiness) {
  router.get("/mainnet-release", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (rewardNetwork(req) !== "mainnet") return res.status(403).json({ error: "mainnet_admin_required" });
    try { return res.json(await readMainnetRelease(req, inspectStatus(req, inspect))); }
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
      const inspectResponse = () => action === "hold" ? inspectStatus(req, inspect) : inspect(req);
      // A verified owner's explicit hold must reach the revision-protected
      // storage write before optional readiness services. Unavailable evidence
      // can never authorize release, but it must not prevent stopping purchases.
      const readiness = action === "hold" ? unavailableReadiness() : await inspectResponse();
      const current = await readMainnetRelease(req, readiness);
      if (action === "release" && !readiness.ready) {
        return res.status(409).json({ error: "mainnet_not_ready", ...current });
      }
      const released = action === "release";
      if (current.released === released) return res.json(action === "hold" ? await readMainnetRelease(req, inspectResponse()) : current);
      if (current.revision !== revision) return res.status(409).json({ error: "release_changed", ...(action === "hold" ? await readMainnetRelease(req, inspectResponse()) : current) });
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
        return res.status(409).json({ error: "release_changed", ...await readMainnetRelease(req, inspectResponse()) });
      }
      return res.json(await readMainnetRelease(req, inspectResponse()));
    } catch { return res.status(503).json({ error: "mainnet_release_unavailable" }); }
  });
}
