import { memo } from "react";
import { usePaintedShipStyle } from "./paintedShip";
import type { PlayerColorId } from "./shipFleet";

const PaintedShip = ({ sprite, color, className }: { sprite: number; color: PlayerColorId; className?: string }) =>
  <i className={className} style={usePaintedShipStyle(sprite, color)} aria-hidden="true" />;

export default memo(PaintedShip);
