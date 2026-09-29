import type { Request } from "express";

// The Pi UID comes from the verified /v2/me response, never from a browser claim.
export const isAdminUid = (uid: string | undefined): boolean =>
  Boolean(uid && process.env.ADMIN_PI_UID?.trim() && uid === process.env.ADMIN_PI_UID.trim());

export const isAdminMode = (req: Request): boolean =>
  isAdminUid(req.session.currentUser?.uid) && req.session.adminMode === true;
