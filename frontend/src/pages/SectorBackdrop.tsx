import { memo, type CSSProperties } from "react";
import type { PlayerPosition } from "./playerCombat";

const SectorBackdrop = ({ sector, player }: { sector: number; player: PlayerPosition }) => {
  const palette = ((sector - 1) % 6) + 1;
  const planetTypes = [
    ["ice", "desert", "earth", "gas"],
    ["rock", "ice", "crystal", "desert"],
    ["ice", "gas", "desert", "rock"],
    ["crystal", "desert", "volcanic", "ice"],
    ["rock", "ice", "ocean", "gas"],
    ["desert", "volcanic", "ice", "crystal"],
  ][palette - 1];
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
      <div className={`space-world space-world-distant planet-${planetTypes[0]}`} />
      <div className={`space-world space-world-secondary planet-${planetTypes[1]}`} />
      <div className={`space-world space-world-primary planet-${planetTypes[2]}`} />
      <div className={`space-world space-world-near planet-${planetTypes[3]}`} />
    </div>
  );
};

export default memo(SectorBackdrop);
