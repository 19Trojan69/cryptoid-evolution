import { memo, type CSSProperties } from "react";
import type { PlayerPosition } from "./playerCombat";

const SectorBackdrop = ({ sector, player, paused }: { sector: number; player: PlayerPosition; paused: boolean }) => {
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
    <div className={`space-scene space-scene-${palette}${paused ? " space-scene-paused" : ""}`} style={parallax} aria-hidden="true">
      <div className="space-haze" />
      <div className="space-orbit space-orbit-one" />
      <div className="space-orbit space-orbit-two" />
      {planetTypes.map((planet, index) => <div key={index} className={`space-world ${["space-world-distant", "space-world-secondary", "space-world-primary", "space-world-near"][index]} planet-${planet}`}><span className="space-world-surface" /></div>)}
    </div>
  );
};

export default memo(SectorBackdrop);
