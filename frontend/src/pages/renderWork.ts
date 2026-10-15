import { developerProbeEnabled } from './performanceDiagnostics';

// Developer-only cumulative numbers; no retained frames, elements or timers.
const work = { rockPaints: 0, rockPaintTotalMs: 0, rockPaintMaxMs: 0, blockchainRenders: 0 };
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
