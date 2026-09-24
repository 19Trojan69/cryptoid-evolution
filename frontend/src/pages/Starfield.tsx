import { memo, type CSSProperties } from "react";
import type { PlayerPosition } from "./playerCombat";

type Star = { x: number; y: number; radius: number; color: string; opacity: number };

const makeStars = (count: number, seed: number, nearby: boolean): Star[] => {
  let state = seed;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    x: random() * 1000,
    y: random() * 800,
    radius: nearby ? 0.9 + random() * 1.4 : 0.35 + random() * 0.85,
    color: ["#e9f5ff", "#afe8ff", "#c9d3ff", "#f6dfb9"][Math.floor(random() * 4)],
    opacity: nearby ? 0.55 + random() * 0.38 : 0.25 + random() * 0.55,
  }));
};

const distant = makeStars(150, 0x5f1e2d, false);
const nearby = makeStars(65, 0xc291a7, true);

const Starfield = ({ sector, player, paused }: { sector: number; player: PlayerPosition; paused: boolean }) => {
  const style = {
    "--star-parallax-x": `${(player.x - .5) * -14}px`,
    "--star-parallax-y": `${(player.y - .8) * -10}px`,
  } as CSSProperties;
  const palette = ((sector - 1) % 6) + 1;
  return <div className={`starfield starfield-sector-${palette}${paused ? " starfield-paused" : ""}`} style={style} aria-hidden="true">
    <div className="milky-band" />
    <svg className="starfield-stars starfield-distant" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice">
      {distant.map((star, index) => <circle key={index} cx={star.x} cy={star.y} r={star.radius} fill={star.color} opacity={star.opacity} />)}
    </svg>
    <svg className="starfield-stars starfield-nearby" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice">
      {nearby.map((star, index) => <circle key={index} cx={star.x} cy={star.y} r={star.radius} fill={star.color} opacity={star.opacity} />)}
    </svg>
    <i className="shooting-star shooting-star-one"><span /></i>
    <i className="shooting-star shooting-star-two"><span /></i>
    <i className="shooting-star shooting-star-three"><span /></i>
    <i className="shooting-star shooting-star-four"><span /></i>
  </div>;
};

export default memo(Starfield);
