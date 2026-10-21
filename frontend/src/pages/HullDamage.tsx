import { memo, type CSSProperties } from "react";
import { hullImpactProfile, type HullFire } from "./hullFires";

type Props = { sites?: readonly HullFire[]; hit?: { id?: number; x: number; y: number; impactPower?: number }; maskImage: string; mirrored?: boolean; bossDamage?: number };

// Alpha-masked damage stays local. Boss embers use stable static marks;
// other ships retain their cooling/reheating animation.
const HullDamage = memo(({ sites = [], hit, maskImage, mirrored = false, bossDamage }: Props) => {
  if (!sites.length && !hit) return null;
  const boss = bossDamage !== undefined;
  const position = (site: Pick<HullFire, "x" | "y">) => ({ left: `${mirrored ? 100 - site.x : site.x}%`, top: `${mirrored ? 100 - site.y : site.y}%` });
  const appearance = (id: number, power?: number) => {
    const profile = hullImpactProfile(id, power);
    return { "--impact-angle": `${profile.angle}deg`, "--impact-aspect": profile.aspect, "--ember-width": `${(boss ? 4.2 : 8) * profile.size}%`, "--ember-max": `${(boss ? 24 : 18) * profile.size}px`, "--burst-width": `${(boss ? 6 : 13) * profile.size}%`, "--burst-max": `${(boss ? 42 : 28) * profile.size}px`, "--cooling": `${profile.cooling}s`, "--flicker": `${profile.flicker}s`, "--flicker-delay": `${profile.delay}s`, borderRadius: profile.shape } as CSSProperties;
  };
  const burst = hit && hullImpactProfile(hit.id ?? 0, hit.impactPower);
  return <>
    <div className={`hull-heat-layer${boss ? ' boss-static-heat' : ''}`} style={{ maskImage, WebkitMaskImage: maskImage }} aria-hidden="true">
      {sites.map(site => <i key={boss ? site.id : `${site.id}:${site.revision ?? 0}`} className="hull-hotspot" style={{ ...position(site), ...appearance(boss ? site.id : site.revision ?? site.id, boss ? undefined : site.impactPower) }}><b /></i>)}
    </div>
    {hit && burst && <i key={hit.id} className="hull-mini-explosion" style={{ ...position(hit), ...appearance(hit.id ?? 0, hit.impactPower) }} aria-hidden="true">{burst.sparks.map((spark, index) => <span key={index} style={{ "--spark-x": `${spark.x}px`, "--spark-y": `${spark.y}px`, animationDuration: `${spark.duration}s` } as CSSProperties} />)}</i>}
  </>;
});
export default HullDamage;
