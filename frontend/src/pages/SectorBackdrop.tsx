import { memo, type CSSProperties } from "react";
import type { PlayerPosition } from "./playerCombat";

const SectorBackdrop = ({ sector, player }: { sector: number; player: PlayerPosition }) => {
  const palette = ((sector - 1) % 6) + 1;
  const parallax = {
    "--parallax-x": `${(player.x - .5) * -24}px`,
    "--parallax-y": `${(player.y - .8) * -18}px`,
    "--parallax-far-x": `${(player.x - .5) * -8}px`,
    "--parallax-far-y": `${(player.y - .8) * -5}px`,
    "--parallax-near-x": `${(player.x - .5) * -40}px`,
    "--parallax-near-y": `${(player.y - .8) * -28}px`,
  } as CSSProperties;

  return (
    <div className={`space-scene space-scene-${palette}`} style={parallax} aria-hidden="true">
      <div className="space-haze" />
      <div className="space-orbit space-orbit-one" />
      <div className="space-orbit space-orbit-two" />
      <div className="space-world space-world-distant" />
      <div className="space-world space-world-secondary" />
      <div className="space-world space-world-primary" />
      <div className="space-world space-world-near" />
    </div>
  );
};

export default memo(SectorBackdrop);
