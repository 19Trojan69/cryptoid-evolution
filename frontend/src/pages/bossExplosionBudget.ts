// Conservative RGBA compositing estimate, not a browser-memory measurement.
// A clipped fragment may still allocate a full-hull backing surface.
export const BOSS_IMPACT_RASTER_BUDGET = 48 * 1024 * 1024;
export function bossExplosionBudget(hullWidth: number, hullHeight: number, requestedDiameter: number,
  viewportWidth: number, viewportHeight: number, pixelRatio = 1, reduced = false) {
  const finite = (value: number, fallback: number) => Number.isFinite(value) && value > 0 ? value : fallback;
  const width = finite(viewportWidth, 390), height = finite(viewportHeight, 700);
  const ratio = Math.max(1, finite(pixelRatio, 1));
  const bytesPerPixel = 4 * ratio * ratio;
  const fragmentBytes = finite(hullWidth, width) * finite(hullHeight, height / 3) * bytesPerPixel;
  // Fire and smoke have expanded bounds. Reserve only half of the budget for them.
  const maximumDiameter = Math.sqrt(BOSS_IMPACT_RASTER_BUDGET / 2 / (2 * 1.44 ** 2 * bytesPerPixel));
  const diameter = Math.min(finite(requestedDiameter, 240), width * 1.3, height * .85, 800, maximumDiameter);
  const blastBytes = 2 * (diameter * 1.44) ** 2 * bytesPerPixel;
  const bounded = reduced || width <= 700 || ratio > 1.5;
  const maximumFragments = reduced ? 4 : bounded ? 8 : 16;
  const fragments = [16, 8, 4, 0].find(count => count <= maximumFragments && blastBytes + count * fragmentBytes <= BOSS_IMPACT_RASTER_BUDGET) ?? 0;
  return { diameter, fragments, fireSites: bounded ? 4 : 8, bounded,
    estimatedRasterBytes: blastBytes + fragments * fragmentBytes };
}

export function activateBossExplosion<T extends { kind: string; startedAt: number; finalDelayMs?: number }>(effect: T, now: number): T {
  const delay = effect.finalDelayMs ?? 0;
  if (effect.kind !== 'boss-explosion' || delay <= 0 || now < effect.startedAt + delay) return effect;
  // Keep the original simulation timeline. Pauses shift startedAt in the game loop.
  return { ...effect, startedAt: effect.startedAt + delay, finalDelayMs: 0 };
}
export const bossExplosionReady = (effect: { kind: string; finalDelayMs?: number }) =>
  effect.kind !== 'boss-explosion' || (effect.finalDelayMs ?? 0) <= 0;
