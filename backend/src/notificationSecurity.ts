import { createHash } from "node:crypto";
import axios from "axios";
import type { Request } from "express";

export type NotificationNetwork = "mainnet" | "testnet";
export type NotificationContext = { network: NotificationNetwork; namespace: string; key: string };
export type VerifiedNotificationIdentity = { uid: string; namespace: string; scopes: string[]; validUntil: number };
export type AppNotification = { title: string; body: string; user_uid: string; subroute: string };

// Neither Host nor x-cryptoid-app-network is proof of the selected Pi app.
// Vercel supplies the project identity; standalone servers must set it explicitly.
export function notificationServerNetwork(environment: { VERCEL_PROJECT_PRODUCTION_URL?: string; VERCEL?: string; CRYPTOID_APP_NETWORK?: string } = process.env): NotificationNetwork | null {
  const project = environment.VERCEL_PROJECT_PRODUCTION_URL;
  if (project === "cryptoid-evolution-testnet.vercel.app") return "testnet";
  if (["cryptoid-evolution.vercel.app", "www.cryptoid-evolution.app", "cryptoid-evolution.app"].includes(project || "")) return "mainnet";
  if (environment.VERCEL) return null;
  return environment.CRYPTOID_APP_NETWORK === "mainnet" || environment.CRYPTOID_APP_NETWORK === "testnet"
    ? environment.CRYPTOID_APP_NETWORK : null;
}

export function notificationContext(req: Request): NotificationContext | null {
  const network = req.notificationNetwork ?? notificationServerNetwork();
  if (!network) return null;
  // PI_API_KEY historically served the Testnet proxy. Never silently treat it
  // as a Mainnet notification credential. Explicit network keys are required.
  const key = (network === "mainnet" ? process.env.PI_MAINNET_API_KEY : process.env.PI_TESTNET_API_KEY)?.trim();
  if (!key) return null;
  const namespace = createHash("sha256").update(`${network}:${key}`).digest("hex");
  return { network, namespace, key };
}

// Call only with the server-verified Pi /me response, never with authResult.user.
export function verifiedNotificationIdentity(me: any, context: NotificationContext | null): VerifiedNotificationIdentity | null {
  if (!context || typeof me?.uid !== "string" || !me.uid) return null;
  const credentials = me.credentials;
  const timestamp = credentials?.valid_until?.timestamp;
  const validUntil = typeof timestamp === "number" && Number.isFinite(timestamp)
    ? (timestamp < 1e12 ? timestamp * 1000 : timestamp)
    : Date.parse(credentials?.valid_until?.iso8601 || "");
  if (!Number.isFinite(validUntil) || validUntil <= Date.now() || !Array.isArray(credentials?.scopes)) return null;
  return {
    uid: me.uid, namespace: context.namespace, validUntil,
    scopes: credentials.scopes.filter((scope: unknown): scope is string => typeof scope === "string"),
  };
}

export function currentNotificationIdentity(user: any, context: NotificationContext, now = Date.now()): VerifiedNotificationIdentity | null {
  const identity = user?.notificationAuthByNetwork?.[context.network];
  return identity && typeof user?.uid === "string" && identity.uid === user.uid && identity.namespace === context.namespace
    && Number.isFinite(identity.validUntil) && identity.validUntil > now && Array.isArray(identity.scopes)
    ? identity : null;
}

const plainText = (value: unknown, max: number): value is string => typeof value === "string"
  && value.length > 0 && value.length <= max && value.trim() === value
  && !/[\u0000-\u001f\u007f<>]/.test(value);
const allowedRoutes = new Set(["/", "/galaxy", "/nfts", "/nft-bosses", "/nft-ships"]);

export function parseNotificationRequest(body: unknown): { requestId: string; notifications: AppNotification[]; digest: string } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some(key => !["requestId", "notifications"].includes(key))
    || typeof input.requestId !== "string" || !/^[a-zA-Z0-9_-]{16,80}$/.test(input.requestId)
    || !Array.isArray(input.notifications) || input.notifications.length < 1 || input.notifications.length > 50) return null;
  const notifications: AppNotification[] = [];
  const recipients = new Set<string>();
  for (const item of input.notifications) {
    if (!item || typeof item !== "object" || Array.isArray(item)
      || Object.keys(item).sort().join(",") !== "body,subroute,title,user_uid"
      || !plainText(item.title, 80) || !plainText(item.body, 500)
      || typeof item.user_uid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(item.user_uid)
      || recipients.has(item.user_uid) || !allowedRoutes.has(item.subroute)) return null;
    recipients.add(item.user_uid);
    notifications.push({ title: item.title, body: item.body, user_uid: item.user_uid, subroute: item.subroute });
  }
  notifications.sort((a, b) => a.user_uid.localeCompare(b.user_uid));
  return { requestId: input.requestId, notifications, digest: createHash("sha256").update(JSON.stringify(notifications)).digest("hex") };
}

export function notificationClient(context: NotificationContext) {
  return axios.create({ baseURL: "https://api.minepi.com", timeout: 15000, headers: { Authorization: `Key ${context.key}` } });
}

type Claim = { id: string; digest: string; at: number; recipients: string[] };
export async function claimNotificationDispatch(collection: any, context: NotificationContext, request: NonNullable<ReturnType<typeof parseNotificationRequest>>, now = Date.now()): Promise<"claimed" | "duplicate" | "limited"> {
  const _id = `notification-dispatch:${context.namespace}`;
  const recipients = request.notifications.map(item => createHash("sha256").update(`${context.namespace}:${item.user_uid}`).digest("hex"));
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await collection.findOne({ _id });
    if (current && (!Number.isSafeInteger(current.revision) || !Array.isArray(current.claims))) throw new Error("invalid_notification_dispatch_state");
    if (current?.claims.some((claim: Claim) => !claim || typeof claim.id !== "string" || typeof claim.digest !== "string"
      || !Number.isFinite(claim.at) || !Array.isArray(claim.recipients) || claim.recipients.some(uid => typeof uid !== "string")))
      throw new Error("invalid_notification_dispatch_state");
    const claims: Claim[] = (current?.claims ?? []).filter((claim: Claim) => claim.at > now - 86_400_000);
    // A claim is consumed before dispatch, even on timeout. An uncertain result
    // cannot safely be retried; do not exchange availability for duplicate sends.
    if (claims.some(claim => claim.id === request.requestId || claim.digest === request.digest)) return "duplicate";
    if (claims.length >= 120 || claims.filter(claim => claim.at > now - 60_000).length >= 10
      || recipients.some(uid => claims.filter(claim => claim.recipients.includes(uid)).length >= 12)) return "limited";
    claims.push({ id: request.requestId, digest: request.digest, at: now, recipients });
    const revision = current?.revision ?? 0;
    try {
      const result = await collection.updateOne({ _id, revision }, { $set: { revision: revision + 1, claims, expiresAt: new Date(now + 172_800_000) } }, { upsert: !current });
      if (result.matchedCount === 1 || result.upsertedCount === 1) return "claimed";
    } catch (error: any) { if (error?.code !== 11000) throw error; }
  }
  throw new Error("notification_dispatch_busy");
}
