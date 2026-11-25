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

export type UsageCounters = { visits: number; activeSeconds: number; gameSeconds: number };

// These are sums of client-reported contributions, not sessions or people.
// Derive only facts retained by the existing hourly counters: never join accounts
// or infer individual histories from hours with activity.
export function usageEvidence(rows: readonly UsageCounters[]) {
  const totals = rows.reduce((sum, row) => ({
    pageOpenings: sum.pageOpenings + row.visits,
    estimatedActiveSeconds: sum.estimatedActiveSeconds + row.activeSeconds,
    estimatedUnpausedGameSeconds: sum.estimatedUnpausedGameSeconds + row.gameSeconds,
  }), { pageOpenings: 0, estimatedActiveSeconds: 0, estimatedUnpausedGameSeconds: 0 });
  return {
    totals,
    unpausedShareOfActiveSeconds: totals.estimatedActiveSeconds > 0
      ? totals.estimatedUnpausedGameSeconds / totals.estimatedActiveSeconds
      : null,
    uniquePlayers: { available: false, value: null, reason: "aggregate_counters_without_identifiers" },
    retentionRate: { available: false, value: null, reason: "aggregate_counters_without_return_history" },
    source: "anonymous_client_reports",
    durations: "estimated",
  } as const;
}
