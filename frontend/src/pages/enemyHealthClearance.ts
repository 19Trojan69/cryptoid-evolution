import type { CSSProperties } from 'react';
import { shipOverlayGeometry } from './shipOverlayGeometry.ts';
import { engineFlamePercent } from './shipRealism.ts';
import type { ShipStage } from './shipEvolution';

// A stable rear edge for the longest existing plume, independent of live thrust.
// Reuse static geometry; no image loads, pixel scans or frame-time preparation.
const offsets = Array.from({ length: 20 }, (_, sprite) => [1, 2, 3].map(stage => {
  const nozzles = shipOverlayGeometry(sprite, stage as ShipStage).nozzles;
  return { '--health-flame-tip': `${100 - Math.max(...nozzles.map(([, y]) => y)) - engineFlamePercent(1, 'boost')}%` } as CSSProperties;
}));

export const enemyHealthClearance = (sprite: number, stage: ShipStage = 1): CSSProperties =>
  offsets[sprite]?.[stage - 1] ?? offsets[0][0];
