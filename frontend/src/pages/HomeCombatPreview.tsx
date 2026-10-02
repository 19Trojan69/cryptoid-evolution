import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import PaintedShip from "./PaintedShip";
import { allPlayerColors, playerColors, playerSkins, shipNozzleStyles, type PlayerColorId } from "./shipFleet";
import type { ShipStage } from "./shipEvolution";
import { explosionDiameter, fragmentFlight } from "./shipRealism";

const DURATION = 14, SHOT_COUNT = 24;
type Point = { x: number; y: number };
const route: Point[] = [{ x: -.15, y: .78 }, { x: .12, y: .62 }, { x: .46, y: .32 }, { x: .83, y: .19 }, { x: .96, y: .47 }, { x: .72, y: .69 }, { x: .36, y: .52 }, { x: .13, y: .26 }, { x: -.2, y: .1 }];
// Catmull-Rom keeps both position and velocity continuous through turns.
function flight(t: number, cross = false): Point {
  if (cross) return { x: 1.2 - t / 11 * 1.4, y: .68 - Math.sin(t / 11 * Math.PI) * .38 };
  const u = Math.max(0, Math.min(1, t / 12)) * (route.length - 1), i = Math.min(route.length - 2, Math.floor(u)), f = u - i;
  const a = route[Math.max(0, i - 1)], b = route[i], c = route[i + 1], d = route[Math.min(route.length - 1, i + 2)];
  const axis = (key: "x" | "y") => .5 * (2 * b[key] + (-a[key] + c[key]) * f + (2 * a[key] - 5 * b[key] + 4 * c[key] - d[key]) * f * f + (-a[key] + 3 * b[key] - 3 * c[key] + d[key]) * f * f * f);
  return { x: axis("x"), y: axis("y") };
}
type Burst = { x: number; y: number; size: number; angle: number; id: number };
type Shot = { x: number; y: number; vx: number; vy: number; age: number; lethal: boolean; enemy: boolean };

export default function HomeCombatPreview({ defender, paused = false }: { defender: { sprite: number; color: PlayerColorId; stage: ShipStage }; paused?: boolean }) {
  const [scene, setScene] = useState(0), [burst, setBurst] = useState<Burst | null>(null);
  const root = useRef<HTMLDivElement>(null), ships = useRef<(HTMLSpanElement | null)[]>([]), bolts = useRef<(HTMLElement | null)[]>([]);
  const pauseRef = useRef(paused);
  const resumeRef = useRef<(() => void) | null>(null);
  useEffect(() => { pauseRef.current = paused; resumeRef.current?.(); }, [paused]);
  const actors = useMemo(() => {
    const skins = playerSkins.filter(skin => skin.sprite !== defender.sprite), colors = playerColors.filter(color => color.id !== defender.color);
    return [...[0, 1].map(i => ({ sprite: skins[(scene * 3 + i * 7) % skins.length].sprite, color: colors[(scene * 2 + i * 3) % colors.length].id, stage: ((scene + i) % 3 + 1) as ShipStage })), { sprite: defender.sprite, color: defender.color, stage: defender.stage }];
  }, [scene, defender.sprite, defender.color, defender.stage]);
  useEffect(() => {
    const element = root.current; if (!element) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let width = element.clientWidth, height = element.clientHeight, last = 0, frame = 0, clock = 0;
    let dead = false, volley = 0, enemyVolley = 0, nextSlot = 0;
    const shots: (Shot | null)[] = Array(SHOT_COUNT).fill(null), angles = [0, 0, 0], flashes = [0, 0, 0];
    const observer = new ResizeObserver(() => { width = element.clientWidth; height = element.clientHeight; }); observer.observe(element);
    const point = (t: number, actor: number) => { const p = flight(actor === 2 ? t - .72 : t, actor === 1); return { x: (scene % 2 ? 1 - p.x : p.x) * width, y: p.y * height }; };
    const fire = (actor: number, t: number, lethal: boolean) => {
      const from = point(t, actor), ahead = point(t + .04, actor);
      const facing = Math.atan2(ahead.y - from.y, ahead.x - from.x), size = ships.current[actor]?.clientWidth ?? 100;
      const start = { x: from.x + Math.cos(facing) * size * .35, y: from.y + Math.sin(facing) * size * .35 };
      const speed = Math.max(600, Math.min(1100, width * 1.5));
      let travel = .1, target = point(t + travel, actor === 1 ? 2 : 0);
      for (let step = 0; step < 6; step++) { target = point(t + travel, actor === 1 ? 2 : 0); travel = Math.hypot(target.x - start.x, target.y - start.y) / speed; }
      const aim = Math.atan2(target.y - start.y, target.x - start.x);
      for (const offset of [-5, 5]) shots[nextSlot++ % SHOT_COUNT] = { x: start.x - Math.sin(aim) * offset, y: start.y + Math.cos(aim) * offset, vx: Math.cos(aim) * speed, vy: Math.sin(aim) * speed, age: 0, lethal, enemy: actor === 1 };
      flashes[actor] = .12;
    };
    const tick = (now: number) => {
      const dt = last ? Math.min(.1, (now - last) / 1000) : 0; last = now;
      if (pauseRef.current || document.hidden) { frame = 0; return; }
      const reduced = media.matches || document.documentElement.dataset.motion === "reduced";
      if (!reduced) clock += dt;
      const t = reduced ? 4.2 : clock;
      element.dataset.flightTime = t.toFixed(2);
      if (t >= DURATION) { setBurst(null); setScene(value => value + 1); return; }
      const positions = [0, 1, 2].map(i => point(t, i));
      for (let i = 0; i < 3; i++) {
        const ship = ships.current[i]; if (!ship) continue;
        const p = positions[i], ahead = point(t + .04, i), angle = Math.atan2(ahead.y - p.y, ahead.x - p.x) * 180 / Math.PI + 90;
        const turn = ((angle - angles[i] + 540) % 360 - 180); angles[i] = angle;
        const bank = Math.max(-13, Math.min(13, turn * 7)), depth = .94 + .12 * Math.sin(t * .7 + i), speed = Math.hypot(ahead.x - p.x, ahead.y - p.y) / .04;
        ship.style.transform = `translate3d(${p.x}px,${p.y}px,0) translate(-50%,-50%) rotate(${angle}deg) scale(${depth})`;
        ship.style.opacity = i === 0 && dead ? "0" : "1";
        ship.style.setProperty("--flight-bank", `${reduced ? 0 : bank}deg`);
        ship.style.setProperty("--engine-strength", `${.7 + Math.min(.7, speed / 300)}`);
        flashes[i] = Math.max(0, flashes[i] - dt); ship.style.setProperty("--hull-light", `${reduced ? 0 : flashes[i] / .12 * .65}`);
      }
      if (!reduced) {
        if (!dead && t >= 2.1 + volley * 1.2 && volley < 5) { fire(2, t, volley === 4); volley++; }
        if (t >= 3 + enemyVolley * 1.4 && enemyVolley < 4) { fire(1, t, false); enemyVolley++; }
      }
      shots.forEach((shot, i) => {
        const node = bolts.current[i]; if (!node) return;
        if (!shot || reduced) { node.style.opacity = "0"; return; }
        const oldX = shot.x, oldY = shot.y;
        shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.age += dt;
        const target = positions[0], size = ships.current[0]?.clientWidth ?? 100;
        const oldTarget = point(t - dt, 0), rx = oldX - oldTarget.x, ry = oldY - oldTarget.y;
        const dx = shot.x - target.x - rx, dy = shot.y - target.y - ry;
        const along = Math.max(0, Math.min(1, -(rx * dx + ry * dy) / (dx * dx + dy * dy || 1)));
        if (!shot.enemy && !dead && Math.hypot(rx + along * dx, ry + along * dy) < size * .27) {
          flashes[0] = .12;
          if (shot.lethal) { dead = true; flashes[2] = .1; setBurst({ ...target, size, angle: angles[0], id: scene }); }
          shots[i] = null; node.style.opacity = "0"; return;
        }
        if (shot.age > 1.6 || shot.x < -60 || shot.y < -60 || shot.x > width + 60 || shot.y > height + 60) { shots[i] = null; node.style.opacity = "0"; return; }
        node.style.opacity = "1"; node.style.setProperty("--shot-color", shot.enemy ? "#ffc476" : "#79efff");
        node.style.transform = `translate3d(${shot.x}px,${shot.y}px,0) rotate(${Math.atan2(shot.vy, shot.vx) * 180 / Math.PI + 90}deg)`;
      });
      frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (!pauseRef.current && !document.hidden) frame = requestAnimationFrame(tick);
    };
    resumeRef.current = resume;
    document.addEventListener("visibilitychange", resume);
    resume();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", resume);
      if (resumeRef.current === resume) resumeRef.current = null;
    };
  }, [actors, scene]);
  return <div ref={root} className="home-combat-preview home-combat-cinematic" role="img" aria-label="Raumschiffe verfolgen sich durch den Weltraum, feuern und explodieren">
    {actors.map((actor, i) => <span key={`${scene}-${i}`} ref={node => { ships.current[i] = node; }} className={`home-cinematic-ship home-cinematic-ship-${i}`} style={{ "--combat-glow": allPlayerColors.find(color => color.id === actor.color)?.glow } as CSSProperties} aria-hidden="true">
      <span className="home-cinematic-body"><PaintedShip className="home-cinematic-underside" {...actor} />
        {shipNozzleStyles(actor.sprite).map((style, j) => <i key={j} className="home-combat-engine" style={style} />)}
        <PaintedShip className="home-combat-hull" {...actor} /><PaintedShip className="home-cinematic-reflection" {...actor} />
      </span>
    </span>)}
    {Array.from({ length: SHOT_COUNT }, (_, i) => <i key={i} ref={node => { bolts.current[i] = node; }} className="home-cinematic-shot" aria-hidden="true" />)}
    {burst && <div key={burst.id} className="impact-effect explosion home-cinematic-explosion" style={{ left: burst.x, top: burst.y, width: explosionDiameter(burst.size), height: explosionDiameter(burst.size), marginLeft: -explosionDiameter(burst.size) / 2, marginTop: -explosionDiameter(burst.size) / 2 }} aria-hidden="true"><span />
      {Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3, drift = fragmentFlight(Math.cos(a), Math.sin(a), 0, 0, burst.size, (i + 1) / 7); return <i key={i} className="home-cinematic-fragment" style={{ "--fragment-x": `${drift.x}px`, "--fragment-y": `${drift.y}px`, "--fragment-spin": `${drift.spin}deg`, "--fragment-angle": `${burst.angle}deg`, "--fragment-index": i } as CSSProperties}><PaintedShip {...actors[0]} /></i>; })}
    </div>}
  </div>;
}
