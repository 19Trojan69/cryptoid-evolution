import { createHash } from "node:crypto";
import type { Request } from "express";

const ownerUsername = "19Trojan69";
// Pi UIDs are specific to each Pi app. Keep separate bindings if two app keys
// happen to use the same MongoDB database.
const bindingId = `pi-owner:${createHash("sha256").update(process.env.PI_API_KEY || "default-app").digest("hex")}`;

// The Pi UID comes from the verified /v2/me response, never from a browser claim.
export const isAdminUid = (uid: string | undefined): boolean =>
  Boolean(uid && process.env.ADMIN_PI_UID?.trim() && uid === process.env.ADMIN_PI_UID.trim());

export const canAdmin = async (req: Request): Promise<boolean> => {
  const uid = req.session.currentUser?.uid;
  if (!uid) return false;
  // An explicit UID overrides the automatic first-login binding.
  if (process.env.ADMIN_PI_UID?.trim()) return isAdminUid(uid);
  const collection = req.app.locals.adminCollection;
  if (!collection) return false;

  try {
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
    process.env.ADMIN_PI_UID?.trim()
      ? isAdminUid(req.session.currentUser.uid)
      : req.session.adminUid === req.session.currentUser.uid
  ));
