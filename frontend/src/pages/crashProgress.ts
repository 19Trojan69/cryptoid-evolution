// Progress through existing callbacks, not proof of browser paint/GPU output.
export const CRASH_WORK_STEPS = ['setup-and-boosts', 'transitions', 'spawn-and-attack-selection',
  'enemy-motion-and-fire', 'boss-motion-and-weapons', 'hostile-shots-and-damage',
  'powerups-and-rocks', 'player-shots-and-collisions', 'phase-save-and-paint'] as const;
export type CrashProgress = { frame?: number; completedFrames?: number; sceneRequests?: number; sceneCommits?: number;
  frameStartedAt?: number; frameEndedAt?: number; sceneRequestedAt?: number; renderStartedAt?: number;
  sceneCommittedAt?: number; workCompletedAt?: number; suspendedAt?: number; completedWork?: string };
export function cleanCrashProgress(input: unknown): CrashProgress | undefined {
  if (!input || typeof input !== 'object') return;
  const value = input as Record<string, unknown>, result: Record<string, number | string> = {};
  for (const key of ['frame', 'completedFrames', 'sceneRequests', 'sceneCommits', 'frameStartedAt', 'frameEndedAt',
    'sceneRequestedAt', 'renderStartedAt', 'sceneCommittedAt', 'workCompletedAt', 'suspendedAt']) {
    const number = value[key];
    if (typeof number === 'number' && Number.isFinite(number) && number >= 0 && number <= 1e15) result[key] = number;
  }
  if (CRASH_WORK_STEPS.some(step => step === value.completedWork)) result.completedWork = value.completedWork as string;
  return Object.keys(result).length ? result : undefined;
}
