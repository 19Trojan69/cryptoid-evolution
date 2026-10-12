export function activateBossExplosion<T extends { kind: string; startedAt: number; finalDelayMs?: number }>(effect: T, now: number): T {
  const delay = effect.finalDelayMs ?? 0;
  if (effect.kind !== 'boss-explosion' || delay <= 0 || now < effect.startedAt + delay) return effect;
  // Keep the original simulation timeline. Pauses shift startedAt in the game loop.
  return { ...effect, startedAt: effect.startedAt + delay, finalDelayMs: 0 };
}
export const bossExplosionReady = (effect: { kind: string; finalDelayMs?: number }) =>
  effect.kind !== 'boss-explosion' || (effect.finalDelayMs ?? 0) <= 0;

