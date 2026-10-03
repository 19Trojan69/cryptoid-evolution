import { memo, type CSSProperties } from "react";
import { hullImpactProfile, type HullFire } from "./hullFires";

type Props = { sites?: readonly HullFire[]; hit?: { id?: number; x: number; y: number; impactPower?: number }; maskImage: string; mirrored?: boolean; bossDamage?: number };

// Local alpha-masked patches cool to tiny embers. Nearby hits reheat a patch;
// damage never scales all patches up to cover the ship's skin.
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
    <div className="hull-heat-layer" style={{ maskImage, WebkitMaskImage: maskImage }} aria-hidden="true">
      {sites.map(site => <i key={`${site.id}:${site.revision ?? 0}`} className="hull-hotspot" style={{ ...position(site), ...appearance(site.revision ?? site.id, site.impactPower) }}><b /></i>)}
    </div>
    {hit && burst && <i key={hit.id} className="hull-mini-explosion" style={{ ...position(hit), ...appearance(hit.id ?? 0, hit.impactPower) }} aria-hidden="true">{burst.sparks.map((spark, index) => <span key={index} style={{ "--spark-x": `${spark.x}px`, "--spark-y": `${spark.y}px`, animationDuration: `${spark.duration}s` } as CSSProperties} />)}</i>}
  </>;
});
export default HullDamage;
