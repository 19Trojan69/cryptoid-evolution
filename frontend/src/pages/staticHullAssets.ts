import { paintedHullBytes, paintedHullColors, paintedHullCount, paintedHullRevision } from '../generated/paintedHullManifest.ts';
import type { PlayerColorId } from './shipFleet.ts';
import type { ShipStage } from './shipEvolution.ts';

// Content-addressed, ordinary image URLs can be reused across cache eviction,
// route remounts and level changes. No game-time Canvas/PNG/Blob allocation.
export function staticHullAsset(sprite: number, color: PlayerColorId, stage: ShipStage) {
  const colorIndex = paintedHullColors.indexOf(color);
  if (!Number.isInteger(sprite) || sprite < 0 || sprite >= paintedHullCount
    || !Number.isInteger(stage) || stage < 1 || stage > 3 || colorIndex < 0) return undefined;
  const bytes = paintedHullBytes[(sprite * 3 + stage - 1) * paintedHullColors.length + colorIndex];
  if (!Number.isFinite(bytes) || bytes <= 0) return undefined;
  return {
    url: `/ships/painted/${paintedHullRevision}/ship_${String(sprite + 1).padStart(2, '0')}_stage_${stage}_${color}.png`,
    bytes,
  };
}
