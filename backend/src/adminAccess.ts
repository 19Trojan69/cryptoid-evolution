import { createHash } from "node:crypto";
import type { Request, RequestHandler } from "express";

const ownerUsername = "19Trojan69";
// Pi UIDs are specific to each Pi app. Keep separate bindings if two app keys
// happen to use the same MongoDB database.
const testnetRequest = (req: Request) => String(req.headers?.["x-cryptoid-app-network"] || "").toLowerCase() === "testnet";
const configuredUid = (req: Request) => (testnetRequest(req) ? process.env.ADMIN_PI_TESTNET_UID : process.env.ADMIN_PI_UID)?.trim();
const bindingIdFor = (req: Request) => {
  const key = testnetRequest(req)
    ? process.env.PI_TESTNET_API_KEY || `testnet:${process.env.PI_API_KEY || "default-app"}`
    : process.env.PI_API_KEY || "default-app";
  return `pi-owner:${createHash("sha256").update(key).digest("hex")}`;
};

// The Pi UID comes from the verified /v2/me response, never from a browser claim.
export const isAdminUid = (uid: string | undefined): boolean =>
  Boolean(uid && process.env.ADMIN_PI_UID?.trim() && uid === process.env.ADMIN_PI_UID.trim());

export const canAdmin = async (req: Request): Promise<boolean> => {
  const uid = req.session.currentUser?.uid;
  if (!uid) return false;
  // An explicit UID overrides the automatic first-login binding.
  const pinned = configuredUid(req);
  if (pinned) return uid === pinned;
  const collection = req.app.locals.adminCollection;
  if (!collection) return false;

  try {
    const bindingId = bindingIdFor(req);
    if (req.session.currentUser?.username === ownerUsername) {
      try {
        await collection.updateOne({ _id: bindingId }, { $setOnInsert: { uid, boundAt: new Date() } }, { upsert: true });
      } catch (error: any) {
        // A concurrent first sign-in can win the unique _id race. Read its UID.
        if (error?.code !== 11000) throw error;
      }
    }
    const binding = await collection.findOne({ _id: bindingId });
    const allowed = binding?.uid === uid;
    req.session.adminUid = allowed ? uid : null;
    return allowed;
  } catch (error) {
    console.error("Could not check Pi owner binding", error);
    req.session.adminUid = null;
    req.session.adminMode = false;
    return false;
  }
};

export const isAdminMode = (req: Request): boolean =>
  req.session.adminMode === true && Boolean(req.session.currentUser?.uid && (
    configuredUid(req)
      ? req.session.currentUser.uid === configuredUid(req)
      : req.session.adminUid === req.session.currentUser.uid
  ));

// Pi Browser proxies can lose the cookie between requests. The browser's test
// intent restores no privileges by itself: the verified owner is checked again.
export const restoreAdminPreview: RequestHandler = async (req, res, next) => {
  if (req.headers?.["x-cryptoid-admin-test"] !== "1") return next();
  if (!req.session.currentUser) return res.status(401).json({ error: "not_authenticated" });
  if (!await canAdmin(req)) return res.status(403).json({ error: "not_authorized" });
  req.session.adminMode = true;
  req.session.adminUid = req.session.currentUser.uid;
  return next();
};
