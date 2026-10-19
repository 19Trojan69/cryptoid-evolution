import { memo, type ComponentProps } from "react";
import PaintedShip from "./PaintedShip";
import HullDamage from "./HullDamage";
import { shipNozzleStyles, type PlayerColorId } from "./shipFleet";
import { shipEvolutionAsset, type ShipStage } from "./shipEvolution";

type Props = {
  sprite: number;
  color: PlayerColorId;
  stage?: ShipStage;
  variant: "enemy" | "bonus" | "player";
  sites?: ComponentProps<typeof HullDamage>["sites"];
  hit?: ComponentProps<typeof HullDamage>["hit"];
};

// Position, bank, flame length and lighting still inherit the live CSS variables
// from the existing moving owner. Only unchanged React construction is skipped.
export default memo(function GameShipVisual({ sprite, color, stage = 1, variant, sites, hit }: Props) {
  const maskImage = `url('${shipEvolutionAsset(sprite, stage)}')`;
  const className = variant === "player" ? "player-engine" : "exhaust";
  return (
    <div className="ship-visual">
      <PaintedShip className="fleet-sprite" sprite={sprite} color={color} stage={stage} />
      {shipNozzleStyles(sprite).map((style, index) => (
        <span key={`${className}-${index}`} className={className} style={style} />
      ))}
      {variant !== "bonus" && (
        <i className="hull-reflection" style={{ maskImage, WebkitMaskImage: maskImage }} aria-hidden="true" />
      )}
      {variant === "player" && <i className="player-muzzle-flash" aria-hidden="true" />}
      {variant !== "bonus" && (
        <HullDamage sites={sites} hit={hit} maskImage={maskImage} mirrored={variant === "enemy"} />
      )}
    </div>
  );
});
