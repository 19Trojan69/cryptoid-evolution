import type { PlayerSave } from './playerSave';

export const TOP_LIMIT = 100;

// A server-started run bounds obvious fabricated submissions. Gameplay still
// executes in the browser; this is not a full authoritative anti-cheat system.
export const validRunScore = (score: unknown, startedAt: number, now: number) =>
  Number.isSafeInteger(score) && typeof score === "number" && score >= 0 &&
  Number.isFinite(startedAt) && now >= startedAt && now - startedAt <= 8 * 60 * 60 * 1000 &&
  (score === 0 || now - startedAt >= 5_000) &&
  score <= 300 + Math.floor((now - startedAt) / 1000) * 80;

export function validResumedBonusScore(score: number, run: { id: string; startedAt: number; scoreBase?: number }, player: PlayerSave | undefined, now: number) {
  const start = player?.lastStart;
  const base = run.scoreBase ?? 0;
  const earned = score - base;
  if (!Number.isSafeInteger(score) || !Number.isSafeInteger(earned) || earned < 0
    || player?.activeRunId !== run.id || start?.runMeta?.id !== run.id || start.startPhase !== 'bonus'
    || !Number.isInteger(start.startSector) || start.startSector < 10 || start.startSector > 500
    || start.startSector % 10 !== 0 || start.checkpoint?.score !== base) return false;
  const hits = start.combat?.state?.bonusHits ?? 0;
  if (!Number.isInteger(hits) || hits < 0 || hits > 12) return false;
  const remaining = 12 - hits;
  // One allowance per resumed bonus, anchored to the server's starting save.
  // It covers remaining targets, possible doubles and the completion award.
  const bonus = remaining * 150 + Math.ceil(remaining / 2) * 50 + 3_000;
  return validRunScore(Math.max(0, earned - bonus), run.startedAt, now);
}
