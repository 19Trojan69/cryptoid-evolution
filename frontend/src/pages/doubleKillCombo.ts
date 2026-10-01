import { creditDefeat, creditReward } from './shardEarnings.ts';

export const DOUBLE_KILL_WINDOW_MS = 500;
export const DOUBLE_KILL_SCORE = 50;
export const DOUBLE_KILL_SHARDS = 20;
export type DoubleKillCombo = { pendingAt: number | null; total: number; level: number; remainingMs: number };
export const createDoubleKillCombo = (): DoubleKillCombo => ({ pendingAt: null, total: 0, level: 0, remainingMs: 0 });

// Consume disjoint pairs: three defeats award once, four award twice. Base
// rewards still count every destroyed ship exactly once, including bonus ships.
export const creditComboDefeat = (run: { score: number; shards: number; destroyed: number; combo: DoubleKillCombo }, reward: number, time: number) => {
  creditDefeat(run, reward);
  const combo = run.combo;
  const gap = combo.pendingAt === null ? Infinity : time - combo.pendingAt;
  if (gap >= 0 && gap <= DOUBLE_KILL_WINDOW_MS) {
    combo.pendingAt = null;
    combo.total++;
    combo.level++;
    combo.remainingMs = 1_500;
    run.score += DOUBLE_KILL_SCORE;
    creditReward(run, DOUBLE_KILL_SHARDS);
    return true;
  }
  combo.pendingAt = time;
  return false;
};
