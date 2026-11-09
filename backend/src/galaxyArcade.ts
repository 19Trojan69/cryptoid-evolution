import { createDecipheriv } from "node:crypto";
import { gunzipSync } from "node:zlib";
import type { Request, Response } from "express";
import { galaxyArcadeNames } from "./galaxyArcadePayload";

const stations = galaxyArcadeNames.map((name, index) => ({ level: (index + 1) * 5, name }));
const arcadePolicy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:";

async function stationDocument(index: number, key: string) {
  const { galaxyArcadePayload } = await import("./galaxyArcadePayload");
  const payload = Buffer.from(galaxyArcadePayload, "base64");
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), payload.subarray(0, 12));
  decipher.setAuthTag(payload.subarray(12, 28));
  const html = gunzipSync(Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()])).toString("utf8");
  const game = Math.floor(index / 5) + 1;
  const variant = index % 5 + 1;
  return html
    .replace("<head>", `<head><meta http-equiv="Content-Security-Policy" content="${arcadePolicy}">`)
    .replace("</body></html>", `<script>CE.app.showDetail(${game}).then(() => CE.app.intro(${variant}));</script></body></html>`);
}

export async function serveGalaxyArcade(
  req: Pick<Request, "method" | "headers">,
  res: Pick<Response, "setHeader" | "status" | "json">,
  level: string | undefined,
  key: string | undefined,
  ownerEndpoint: URL,
) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!key || !/^[0-9a-f]{64}$/i.test(key)) return res.status(404).json({ error: "not_found" });
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  const authorization = req.headers.authorization;
  if (typeof authorization !== "string" || !/^Bearer\s+\S+$/i.test(authorization)) {
    return res.status(401).json({ error: "not_authenticated" });
  }

  try {
    // Use the existing Testnet owner binding. Browser flags and stale cookies
    // are deliberately excluded from this request.
    const session = await fetch(ownerEndpoint, {
      headers: { authorization, "x-cryptoid-app-network": "testnet" },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if ([401, 403, 410].includes(session.status)) return res.status(session.status).json({ error: "not_authorized" });
    if (!session.ok) return res.status(503).json({ error: "minigame_unavailable" });
    const { user, canAdmin } = await session.json() as { user?: { uid?: string }; canAdmin?: boolean };
    if (!user?.uid || canAdmin !== true) return res.status(403).json({ error: "not_authorized" });

    if (level === undefined) return res.json({ stations });
    const index = stations.findIndex(station => String(station.level) === level);
    if (index === -1) return res.status(404).json({ error: "not_found" });
    return res.json({ html: await stationDocument(index, key) });
  } catch {
    return res.status(503).json({ error: "minigame_unavailable" });
  }
}
