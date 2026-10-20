import { resourceTimingEnabled as developerProbeEnabled } from './performanceDiagnostics';

// Diagnostic cumulative numbers; no retained frames, elements or timers.
const work = { rockPaints: 0, rockPaintTotalMs: 0, rockPaintMaxMs: 0, blockchainRenders: 0,
  effectPaints: 0, effectPaintTotalMs: 0, effectPaintMaxMs: 0,
  bossPaints: 0, bossPaintTotalMs: 0, bossPaintMaxMs: 0 };
export const beginRockPaint = () => developerProbeEnabled() ? performance.now() : undefined;
export const endRockPaint = (started: number | undefined) => {
  if (started === undefined) return;
  const elapsed = Math.max(0, performance.now() - started);
  work.rockPaints++;
  work.rockPaintTotalMs += elapsed;
  work.rockPaintMaxMs = Math.max(work.rockPaintMaxMs, elapsed);
};
export const recordBlockchainRender = () => { if (developerProbeEnabled()) work.blockchainRenders++; };
export const renderWorkStats = () => ({ ...work });
export const beginVisualPaint = () => developerProbeEnabled() ? performance.now() : undefined;
export const endVisualPaint = (kind: 'effect' | 'boss', started: number | undefined) => {
  if (started === undefined) return;
  const elapsed = Math.max(0, performance.now() - started);
  if (kind === 'effect') { work.effectPaints++; work.effectPaintTotalMs += elapsed; work.effectPaintMaxMs = Math.max(work.effectPaintMaxMs, elapsed); }
  else { work.bossPaints++; work.bossPaintTotalMs += elapsed; work.bossPaintMaxMs = Math.max(work.bossPaintMaxMs, elapsed); }
};
