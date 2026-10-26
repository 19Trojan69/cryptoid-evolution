// Presentation time only. No reward, run, combat or save mutation.
export const LEVEL_COMPLETION_QUIET_MS = 900;
export const LEVEL_COMPLETION_REVEAL_MS = 1_200;
export function advanceCompletionQuiet(quietMs: number, deltaMs: number, activeEffects: number) {
  return activeEffects > 0 ? 0 : Math.min(LEVEL_COMPLETION_QUIET_MS, quietMs + Math.max(0, deltaMs));
}
