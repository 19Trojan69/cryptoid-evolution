export const MAX_GAME_STEP_MS = 34;
export const MAX_GAME_CATCHUP_MS = 1000;
export type PerformanceSample = { level: number; meanFrameMs: number; meanWorkMs: number; slowFrames: number; frames: number };

// Measurements cover whole RAF frames (including all simulation substeps).
// Four seconds of sustained pressure precede a downgrade; upgrades need thirty
// stable seconds. Screen width and temperature guesses never select a tier.
export function createPerformanceGovernor() {
  let level = 0, began = 0, lastChange = -10_000, pressured = 0, stable = 0;
  let frames = 0, frameTotal = 0, workTotal = 0, slow = 0;
  const resetWindow = (time: number) => { began = time; frames = frameTotal = workTotal = slow = 0; };
  return {
    get level() { return level; },
    get paintInterval() { return [1000 / 60, 1000 / 60, 1000 / 30, 50][level]; },
    reset(time = 0) { resetWindow(time); pressured = stable = 0; },
    observe(time: number, frameMs: number, workMs: number): PerformanceSample | null {
      if (!Number.isFinite(frameMs) || frameMs <= 0 || frameMs > MAX_GAME_CATCHUP_MS) { this.reset(time); return null; }
      if (!began) began = time;
      frames++; frameTotal += frameMs; workTotal += Math.max(0, workMs); if (frameMs > 34) slow++;
      const duration = time - began;
      if (duration < 2000) return null;
      const meanFrameMs = frameTotal / frames, meanWorkMs = workTotal / frames;
      const overloaded = meanFrameMs > 23 || meanWorkMs > 10 || slow / frames > .15;
      const healthy = meanFrameMs < 19 && meanWorkMs < 7 && slow / frames < .03;
      pressured = overloaded ? pressured + duration : 0;
      stable = healthy ? stable + duration : 0;
      if (pressured >= 4000 && time - lastChange >= 4000 && level < 3) {
        level++; lastChange = time; pressured = stable = 0;
      } else if (stable >= 30_000 && time - lastChange >= 30_000 && level > 0) {
        level--; lastChange = time; pressured = stable = 0;
      }
      const result = { level, meanFrameMs, meanWorkMs, slowFrames: slow, frames };
      resetWindow(time); return result;
    },
  };
}

// Keep existing <=34ms integration on normal frames. A slower render frame
// receives bounded substeps covering its entire elapsed time, never slow motion.
export function simulationFrameTimes(previous: number, time: number) {
  const gap = Math.max(0, time - previous);
  if (!previous || !gap) return [time];
  if (gap > MAX_GAME_CATCHUP_MS) return [];
  const count = Math.ceil(gap / MAX_GAME_STEP_MS);
  return Array.from({ length: count }, (_, index) => index === count - 1 ? time : previous + gap * (index + 1) / count);
}
