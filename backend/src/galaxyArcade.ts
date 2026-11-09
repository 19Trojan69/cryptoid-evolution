import { createDecipheriv, createHash, createHmac, timingSafeEqual } from "node:crypto";
import { gunzipSync } from "node:zlib";
import type { Request, Response } from "express";
import { galaxyArcadeNames, galaxyArcadePayload } from "./galaxyArcadePayload";

const stations = galaxyArcadeNames.map((name, index) => ({ level: (index + 1) * 5, name }));
const arcadePolicy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:";
const previewCookie = "__Secure-cryptoid-arcade";
const hexDigest = /^[0-9a-f]{64}$/i;

const sameDigest = (value: string | undefined, expected: string) =>
  typeof value === "string" && hexDigest.test(value) && timingSafeEqual(Buffer.from(value, "hex"), Buffer.from(expected, "hex"));

function previewInvitation(config: string | undefined, key: string) {
  const match = /^([0-9a-f]{64}):(\d{13})$/.exec(config ?? "");
  if (!match) return undefined;
  const maxAge = Math.floor((Number(match[2]) - Date.now()) / 1000);
  if (maxAge <= 0) return undefined;
  const cookieKey = createHmac("sha256", Buffer.from(key, "hex")).update("cryptoid-arcade-preview-cookie-v1").digest();
  return { digest: match[1], maxAge, session: createHmac("sha256", cookieKey).update(match[0]).digest("hex") };
}

function stationDocument(index: number, key: string) {
  const payload = Buffer.from(galaxyArcadePayload, "base64");
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), payload.subarray(0, 12));
  decipher.setAuthTag(payload.subarray(12, 28));
  const html = gunzipSync(Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()])).toString("utf8");
  const game = Math.floor(index / 5) + 1;
  const variant = index % 5 + 1;
  return html
    .replace("<head>", `<head><meta http-equiv="Content-Security-Policy" content="${arcadePolicy}">`)
    // A frame queued before Start or Resume can carry an older timestamp.
    // Keep the round clock monotonic so the next frame uses the current baseline.
    .replace("previous=now;if(C.mode==='running'", "previous=Math.max(previous,now);if(C.mode==='running'")
    .replace("</body></html>", `<script>CE.app.showDetail(${game}).then(() => CE.app.intro(${variant}));</script></body></html>`);
}

export async function serveGalaxyArcade(
  req: Pick<Request, "method" | "headers">,
  res: Pick<Response, "setHeader" | "status" | "json">,
  level: string | undefined,
  key: string | undefined,
  ownerEndpoint: URL,
  invitationConfig?: string,
) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!key || !hexDigest.test(key)) return res.status(404).json({ error: "not_found" });
  const invitation = previewInvitation(invitationConfig, key);

  if (level === "access") {
    if (!invitation) return res.status(404).json({ error: "not_found" });
    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
    const header = req.headers["x-cryptoid-arcade-invitation"];
    const code = typeof header === "string" ? header.replace(/[\s-]/g, "").toUpperCase() : "";
    if (!/^[0-9A-F]{24}$/.test(code) || !sameDigest(createHash("sha256").update(code).digest("hex"), invitation.digest)) {
      return res.status(403).json({ error: "invalid_invitation" });
    }
    res.setHeader("Set-Cookie", `${previewCookie}=${invitation.session}; Max-Age=${invitation.maxAge}; Path=/api/admin/galaxy-minigames; HttpOnly; Secure; SameSite=Strict`);
    return res.json({ stations });
  }

  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  const cookie = req.headers.cookie?.split(";").map(part => part.trim()).find(part => part.startsWith(`${previewCookie}=`));
  const previewSession = invitation && sameDigest(cookie?.slice(previewCookie.length + 1), invitation.session);
  const accessHint = level === undefined && invitation ? { previewAccess: true } : {};

  try {
    if (!previewSession) {
      const authorization = req.headers.authorization;
      if (typeof authorization !== "string" || !/^Bearer\s+\S+$/i.test(authorization)) {
        return res.status(401).json({ error: "not_authenticated", ...accessHint });
      }
      // Use the existing Testnet owner binding for Pi sessions. Preview cookies
      // only grant arcade access and are never forwarded to the account service.
      const session = await fetch(ownerEndpoint, {
        headers: { authorization, "x-cryptoid-app-network": "testnet" },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if ([401, 403, 410].includes(session.status)) return res.status(session.status).json({ error: "not_authorized", ...accessHint });
      if (!session.ok) return res.status(503).json({ error: "minigame_unavailable" });
      const { user, canAdmin } = await session.json() as { user?: { uid?: string }; canAdmin?: boolean };
      if (!user?.uid || canAdmin !== true) return res.status(403).json({ error: "not_authorized", ...accessHint });
    }

    if (level === undefined) return res.json({ stations });
    const index = stations.findIndex(station => String(station.level) === level);
    if (index === -1) return res.status(404).json({ error: "not_found" });
    return res.json({ html: stationDocument(index, key) });
  } catch {
    return res.status(503).json({ error: "minigame_unavailable" });
  }
}
