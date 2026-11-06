import { memo, type CSSProperties } from "react";
import type { SectorBoss } from "./sectorBoss";
import { BOSS_ENTRY_MS } from "./sectorBoss";
import { engineFlamePercent } from "./shipRealism";
import BossWeaponsView from "./BossWeaponsView";
import BossReactorView from "./BossReactorView";
import BossHealthView from "./BossHealthView";
import HullDamage from "./HullDamage";
import FinishedEffect from "./FinishedEffect";
import { specialWeaponBox } from "./bossSpecialWeapon";
import { BOSS_REACTOR_BURST_MS } from "./bossDefeatTiming";

export type FallingBossHull = {
  id: number;
  x: number;
  y: number;
  bossShipWidth?: number;
  bossHeight?: number;
  bossImage?: string;
  bossModel?: SectorBoss;
  fallDistance?: number;
  fireSites?: readonly (readonly [number, number])[];
};
type Props = {
  boss: SectorBoss | null;
  fall?: FallingBossHull;
  ready: boolean;
  light: number;
  now: number;
  fallDurationMs: number;
  title: string;
};

// Keep the decoded hull and weapon canvas mounted across defeat. Only their
// owner class/style changes; CSS retains the existing descent and burst timing.
export default memo(function BossHullView({ boss, fall, ready, light, now, fallDurationMs, title }: Props) {
  const model = fall?.bossModel ?? boss;
  if (!model) return null;
  const reactorBox = fall ? specialWeaponBox(model) : null;
  const className = fall
    ? "boss-falling-hull"
    : `asteroid sector-boss${model.health <= model.maxHealth / 2 ? " boss-enraged" : ""}${model.health <= model.maxHealth * 0.25 ? " boss-critical" : ""}${now - model.lastDamageAt < 240 ? " boss-hit" : ""}`;
  const style = fall
    ? {
        left: fall.x,
        top: fall.y,
        width: fall.bossShipWidth,
        height: fall.bossHeight,
        "--boss-fall-distance": `${fall.fallDistance ?? 200}px`,
        "--boss-fall-quarter": `${(fall.fallDistance ?? 200) * 0.25}px`,
        "--boss-fall-half": `${(fall.fallDistance ?? 200) * 0.5}px`,
        "--boss-fall-three-quarters": `${(fall.fallDistance ?? 200) * 0.75}px`,
        "--boss-fall-duration": `${fallDurationMs - BOSS_REACTOR_BURST_MS}ms`,
        "--boss-reactor-burst-duration": `${BOSS_REACTOR_BURST_MS}ms`,
        animationDelay: `${BOSS_REACTOR_BURST_MS}ms`,
      }
    : {
        left: model.x,
        top: model.y,
        width: model.width,
        height: model.height,
        transform: "translate(-50%, -50%)",
        "--boss-image": `url('${model.config.image}')`,
        "--boss-thrust": `${6 + (model.height * engineFlamePercent(model.visualMotion?.thrust ?? 0, model.elapsed < BOSS_ENTRY_MS ? "launch" : "idle")) / 100}px`,
      };
  return (
    <div
      className={className}
      style={style as CSSProperties}
      data-hull-ready={fall ? undefined : ready}
      title={fall ? undefined : title}
      aria-hidden={fall ? "true" : undefined}
    >
      {!fall &&
        model.config.engineAnchors.map(([x, y], index) => (
          <i
            key={index}
            className="boss-engine-flame ship-thruster"
            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
            aria-hidden="true"
          />
        ))}
      <img
        key="hull"
        className={fall ? undefined : "boss-hull"}
        src={fall?.bossImage ?? model.config.image}
        alt=""
        draggable={false}
      />
      <BossWeaponsView key="weapons" boss={model} frozen={!!fall} />
      {!fall && (
        <>
          <BossReactorView boss={model} />
          <i
            className="hull-reflection"
            style={{
              maskImage: `url('${model.config.image}')`,
              WebkitMaskImage: `url('${model.config.image}')`,
              opacity: light,
            }}
            aria-hidden="true"
          />
          <HullDamage
            sites={model.hullFires}
            hit={model.hit}
            maskImage={`url('${model.config.image}')`}
            bossDamage={1 - model.health / model.maxHealth}
          />
          <BossHealthView boss={model} />
        </>
      )}
      {fall && (
        <>
          <FinishedEffect key={fall.id} tag="i" className="boss-reactor-destruction" style={{ left: reactorBox!.left, top: reactorBox!.top, width: reactorBox!.width, height: reactorBox!.height }} />
          <div className="boss-fall-bursts">
            {fall.fireSites?.map(([x, y], index) => (
              <i key={index} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${BOSS_REACTOR_BURST_MS + index * 300}ms` }} />
            ))}
          </div>
          <div className="boss-shedding">
            {fall.fireSites?.map(([x, y], index) => (
              <i
                key={index}
                style={
                  {
                    left: `${x}%`,
                    top: `${y}%`,
                    backgroundImage: `url('${fall.bossImage}')`,
                    backgroundPosition: `${x}% ${y}%`,
                    "--shed-x": `${(index % 2 ? 1 : -1) * (18 + index * 5)}px`,
                    "--shed-spin": `${(index % 2 ? -1 : 1) * (70 + index * 19)}deg`,
                    animationDelay: `${BOSS_REACTOR_BURST_MS + 350 + index * 430}ms`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
});
