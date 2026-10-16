// Optional developer subscriber. No timers, DOM references, images or buffers.
export type BossResourceKind = 'boss-texture-start' | 'boss-texture-ready' | 'boss-texture-error' | 'boss-canvas-first-draw' | 'boss-canvas-release';
export type BossResourceDetails = { bossId: number; bossTextureWidth?: number; bossTextureHeight?: number; bossCanvasWidth?: number; bossCanvasHeight?: number };
let listener: ((kind: BossResourceKind, details: BossResourceDetails) => void) | undefined;
export function observeBossResources(next: NonNullable<typeof listener>) {
  listener = next;
  return () => { if (listener === next) listener = undefined; };
}
export function reportBossResource(kind: BossResourceKind, details: BossResourceDetails) {
  try { listener?.(kind, details); } catch { /* Diagnosis cannot change resource behavior. */ }
}
