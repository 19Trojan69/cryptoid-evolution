import { memo, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { PlayerPosition } from "./playerCombat";

type Star = { x: number; y: number; radius: number; color: string; opacity: number; glint: boolean };
type Flare = { x: number; y: number; color: string; strength: number; size: number; duration: number };

const makeRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const starColors = ["#e9f5ff", "#afe8ff", "#c9d3ff", "#f6dfb9", "#f6a7bf", "#ace9d3"];
const flareColors = ["#b9e8ff", "#e5eaff", "#ffdfb1", "#e0c9ff", "#ffd1ca", "#c5f5eb"];

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

const Starfield = ({ sector, player, paused, showNebula = false }: { sector: number; player: PlayerPosition; paused: boolean; showNebula?: boolean }) => {
  const [flare, setFlare] = useState<Flare | null>(null);
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
  useEffect(() => {
    if (paused) { setFlare(null); return; }
    let timer: number | undefined;
    let previous: Star | null = null;
    let previousColor = -1;
    const candidates = stars.distant.filter(star => star.x > 70 && star.x < 930 && star.y > 80 && star.y < 720);
    const motionAllowed = () => !document.hidden && document.documentElement.dataset.motion !== "reduced" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const schedule = () => {
      if (!motionAllowed()) return;
      timer = window.setTimeout(() => {
        const previousStar = previous;
        const spaced = previousStar ? candidates.filter(star => Math.hypot(star.x - previousStar.x, star.y - previousStar.y) >= 230) : candidates;
        const star = spaced[Math.floor(Math.random() * spaced.length)];
        previous = star;
        const duration = 440 + Math.round(Math.random() * 430);
        previousColor = (previousColor + 1 + Math.floor(Math.random() * (flareColors.length - 1))) % flareColors.length;
        setFlare({ x: star.x / 10, y: star.y / 8, color: flareColors[previousColor], strength: .45 + Math.random() * .5, size: .75 + Math.random() * .65, duration });
        timer = window.setTimeout(() => { setFlare(null); schedule(); }, duration);
      }, 1600 + Math.round(Math.random() * 3400));
    };
    const reset = () => { if (timer !== undefined) window.clearTimeout(timer); setFlare(null); schedule(); };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new MutationObserver(reset);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    document.addEventListener("visibilitychange", reset);
    motion.addEventListener("change", reset);
    schedule();
    return () => { if (timer !== undefined) window.clearTimeout(timer); observer.disconnect(); document.removeEventListener("visibilitychange", reset); motion.removeEventListener("change", reset); };
  }, [paused, stars.distant]);
  return <div className={`starfield starfield-sector-${palette}${paused ? " starfield-paused" : ""}`} style={style} aria-hidden="true">
    {showNebula && <div className="nebula-field"><span className="nebula-cloud" style={stars.cloud} /></div>}
    <div className="milky-band" />
    {flare && <i className="distant-star-flare" style={{ left: `${flare.x}%`, top: `${flare.y}%`, "--flare-color": flare.color, "--flare-strength": flare.strength, "--flare-size": flare.size, "--flare-duration": `${flare.duration}ms` } as CSSProperties} />}
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

export default memo(Starfield, (previous, next) => previous.sector === next.sector && previous.paused === next.paused && previous.showNebula === next.showNebula && (typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches || previous.player === next.player));
