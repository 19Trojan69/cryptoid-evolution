import { memo } from "react";
import { usePaintedShipStyle } from "./paintedShip";
import type { PlayerColorId } from "./shipFleet";
import type { ShipStage } from "./shipEvolution";

const PaintedShip = ({ sprite, color, stage = 1, className }: { sprite: number; color: PlayerColorId; stage?: ShipStage; className?: string }) =>
  <i className={className} style={usePaintedShipStyle(sprite, color, stage)} aria-hidden="true" />;

export default memo(PaintedShip);
