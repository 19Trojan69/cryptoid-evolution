export const browserKinds = ["pi", "external", "unknown"] as const;
export type BrowserKind = typeof browserKinds[number];
export const RETENTION_DAYS = 90;

// Reject, rather than accidentally store, identifiers or additional fields.
export function usageIncrement(body: unknown, now = new Date(), network = "mainnet") {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  if (Object.keys(b).some(key => !["browser", "kind", "seconds", "playing"].includes(key))) return null;
  if (!browserKinds.includes(b.browser as BrowserKind)) return null;
  const visit = b.kind === "visit";
  if (!visit && b.kind !== "active") return null;
  if (visit && (b.seconds !== undefined || b.playing !== undefined)) return null;
  if (!visit && (!Number.isInteger(b.seconds) || Number(b.seconds) < 1 || Number(b.seconds) > 30 || typeof b.playing !== "boolean")) return null;
  const hour = new Date(now); hour.setUTCMinutes(0, 0, 0);
  const seconds = visit ? 0 : Number(b.seconds);
  return {
    id: `${network}:${hour.toISOString()}:${b.browser}`,
    fixed: { hour, network, browser: b.browser, expiresAt: new Date(hour.getTime() + RETENTION_DAYS * 86_400_000) },
    counters: { visits: visit ? 1 : 0, activeSeconds: seconds, gameSeconds: b.playing === true ? seconds : 0 },
  };
}
