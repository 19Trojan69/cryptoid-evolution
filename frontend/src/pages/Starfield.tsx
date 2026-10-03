import { memo, useMemo, type CSSProperties } from "react";
import type { PlayerPosition } from "./playerCombat";

type Star = { x: number; y: number; radius: number; color: string; opacity: number; glint: boolean };

const makeRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const starColors = ["#e9f5ff", "#afe8ff", "#c9d3ff", "#f6dfb9", "#f6a7bf", "#ace9d3"];
const twinkleColors = ["#9cecff", "#ffd496", "#c8b0ff", "#ffaabb", "#9cf4d1", "#a9caff", "#ffe8b3"];

const makeStars = (columns: number, rows: number, seed: number, nearby: boolean): Star[] => {
  const random = makeRandom(seed);
  // One point per loose cell spreads the background across the whole view.
  return Array.from({ length: columns * rows }, (_, index) => ({
    x: ((index % columns) + .08 + random() * .84) * 1000 / columns,
    y: (Math.floor(index / columns) + .08 + random() * .84) * 800 / rows,
    radius: nearby ? .9 + random() * 1.4 : .35 + random() * .85,
    color: starColors[Math.floor(random() * starColors.length)],
    opacity: nearby ? .55 + random() * .38 : .25 + random() * .55,
    glint: nearby && index % 11 === 3,
  }));
};

const makeTwinkles = (seed: number) => {
  const random = makeRandom(seed);
  const bands = [0, 1, 2, 3, 4, 5, 6];
  for (let index = bands.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [bands[index], bands[other]] = [bands[other], bands[index]];
  }
  return bands.map((band, index) => ({
    left: `${(index + .18 + random() * .64) * 100 / bands.length}%`,
    top: `${(band + .18 + random() * .64) * 100 / bands.length}%`,
    width: `${1.3 + random() * 1.9}px`,
    height: `${1.3 + random() * 1.9}px`,
    color: twinkleColors[Math.floor(random() * twinkleColors.length)],
    animationDuration: `${8 + Math.floor(random() * 7)}s`,
    animationDelay: `${-Math.floor(random() * 13)}s`,
  }));
};

const Starfield = ({ sector, player, paused, showNebula = false, showTwinkles = false }: { sector: number; player: PlayerPosition; paused: boolean; showNebula?: boolean; showTwinkles?: boolean }) => {
  const style = {
    "--star-parallax-x": `${(player.x - .5) * -14}px`,
    "--star-parallax-y": `${(player.y - .8) * -10}px`,
  } as CSSProperties;
  const palette = ((sector - 1) % 6) + 1;
  const stars = useMemo(() => {
    const seed = Math.imul(sector, 0x9e3779b1) >>> 0;
    return {
      distant: makeStars(15, 10, seed ^ 0x5f1e2d, false),
      nearby: makeStars(13, 5, seed ^ 0xc291a7, true),
      twinkles: makeTwinkles(seed ^ 0xa710fee),
      cloud: (() => {
        const random = makeRandom(seed ^ 0xb055c10d);
        return {
          left: `${12 + random() * 25}%`,
          top: `${43 + random() * 8}%`,
          width: `${54 + random() * 7}%`,
          height: `${24 + random() * 4}%`,
        };
      })(),
    };
  }, [sector]);
  return <div className={`starfield starfield-sector-${palette}${paused ? " starfield-paused" : ""}`} style={style} aria-hidden="true">
    {showNebula && <div className="nebula-field"><span className="nebula-cloud" style={stars.cloud} /></div>}
    <div className="milky-band" />
    {showTwinkles && <div className="level-twinkles">{stars.twinkles.map((star, index) => <i key={index} style={star} />)}</div>}
    <svg className="starfield-stars starfield-distant" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice">
      {stars.distant.map((star, index) => <circle key={index} cx={star.x} cy={star.y} r={star.radius} fill={star.color} opacity={star.opacity} />)}
    </svg>
    <svg className="starfield-stars starfield-nearby" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice">
      {stars.nearby.map((star, index) => <g key={index} opacity={star.opacity}>
        {star.glint && <>
          <circle cx={star.x} cy={star.y} r={star.radius * 5} fill={star.color} opacity=".08" />
          <circle cx={star.x} cy={star.y} r={star.radius * 2.5} fill={star.color} opacity=".12" />
          <path d={`M${star.x - star.radius * 4} ${star.y}h${star.radius * 8} M${star.x} ${star.y - star.radius * 4}v${star.radius * 8}`} fill="none" stroke={star.color} strokeWidth=".4" opacity=".42" />
        </>}
        <circle cx={star.x} cy={star.y} r={star.radius} fill={star.color} />
      </g>)}
    </svg>
    <i className="shooting-star shooting-star-one"><span /></i>
    <i className="shooting-star shooting-star-two"><span /></i>
    <i className="shooting-star shooting-star-three"><span /></i>
    <i className="shooting-star shooting-star-four"><span /></i>
  </div>;
};

export default memo(Starfield, (previous, next) => previous.sector === next.sector && previous.paused === next.paused && previous.showNebula === next.showNebula && previous.showTwinkles === next.showTwinkles && (typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches || previous.player === next.player));
