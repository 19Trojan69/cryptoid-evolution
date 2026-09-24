import { memo, type CSSProperties } from "react";
import type { PlayerPosition } from "./playerCombat";
import EarthGlobe from "./EarthGlobe";

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
      {planetTypes.map((planet, index) => <div key={index} className={`space-world ${["space-world-distant", "space-world-secondary", "space-world-primary", "space-world-near"][index]} planet-${planet}`}>
        {planet === "earth" ? <EarthGlobe paused={paused} /> : planet === "gas" ? <span className="saturn-illustration" /> : <span className="space-world-surface" />}
      </div>)}
    </div>
  );
};

export default memo(SectorBackdrop, (previous, next) => previous.sector === next.sector && previous.paused === next.paused && (typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches || previous.player === next.player));
