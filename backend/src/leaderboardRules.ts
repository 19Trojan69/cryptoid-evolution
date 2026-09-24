export const TOP_LIMIT = 100;

// A server-started run bounds obvious fabricated submissions. Gameplay still
// executes in the browser; this is not a full authoritative anti-cheat system.
export const validRunScore = (score: unknown, startedAt: number, now: number) =>
  Number.isSafeInteger(score) && typeof score === "number" && score >= 0 &&
  Number.isFinite(startedAt) && now >= startedAt && now - startedAt <= 8 * 60 * 60 * 1000 &&
  (score === 0 || now - startedAt >= 5_000) &&
  score <= 300 + Math.floor((now - startedAt) / 1000) * 80;
