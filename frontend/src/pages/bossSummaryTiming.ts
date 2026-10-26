export const BOSS_SUMMARY_VISIBLE_MS = 10_000;
export type BossSummary = { stage: number; score: number; shards: number; destroyed: number; hearts: number; combos: number };
export function advanceSummaryVisibility(visibleMs: number, elapsedMs: number, visible: boolean) {
  return visible ? Math.min(BOSS_SUMMARY_VISIBLE_MS, visibleMs + Math.max(0, Math.min(1000, elapsedMs))) : visibleMs;
}
export const canContinueBossSummary = (visibleMs: number, prepared: boolean, saving: boolean, failed: boolean) =>
  visibleMs >= BOSS_SUMMARY_VISIBLE_MS && prepared && !saving && !failed;

// Unified level completion waits only for its confirmed save/effect barrier.
export const canContinueLevelCompletion = (prepared: boolean, saving: boolean, failed: boolean) =>
  prepared && !saving && !failed;
