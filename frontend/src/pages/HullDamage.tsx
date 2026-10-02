import { memo, type CSSProperties } from "react";
import type { HullFire } from "./hullFires";

type Props = { sites?: readonly HullFire[]; hit?: { id?: number; x: number; y: number }; damage: number; maskImage: string; mirrored?: boolean };

// One masked heat field per damaged hull. Impact bursts restart only for a new
// shot, not for each game render; no extra particle loop or timers are needed.
const HullDamage = memo(({ sites = [], hit, damage, maskImage, mirrored = false }: Props) => {
  if (!sites.length && !hit) return null;
  const heat = Math.max(0, Math.min(1, damage));
  const position = (site: Pick<HullFire, "x" | "y">) => ({ left: `${mirrored ? 100 - site.x : site.x}%`, top: `${mirrored ? 100 - site.y : site.y}%` });
  return <>
    {!!sites.length && <div className="hull-heat-layer" style={{ maskImage, WebkitMaskImage: maskImage, "--hull-heat": heat, "--hotspot-size": `${15 + heat * 32}%` } as CSSProperties} aria-hidden="true">
      <i className="hull-heat-spread" />
      {sites.map(site => <i key={site.id} className="hull-hotspot" style={position(site)} />)}
    </div>}
    {hit && <i key={hit.id} className="hull-mini-explosion" style={position(hit)} aria-hidden="true"><span /><span /><span /></i>}
  </>;
});
export default HullDamage;
