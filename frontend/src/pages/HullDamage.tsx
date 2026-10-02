import { memo, type CSSProperties } from "react";
import type { HullFire } from "./hullFires";

type Props = { sites?: readonly HullFire[]; hit?: { id?: number; x: number; y: number }; maskImage: string; mirrored?: boolean; bossDamage?: number };

// Masked ember sites settle into a visible glow until destruction. Boss damage
// enlarges only these bounded sites; stable keys preserve their cooling phase.
const HullDamage = memo(({ sites = [], hit, maskImage, mirrored = false, bossDamage }: Props) => {
  if (!sites.length && !hit) return null;
  const damage = bossDamage === undefined ? undefined : Math.max(0, Math.min(1, bossDamage));
  const position = (site: Pick<HullFire, "x" | "y">) => ({ left: `${mirrored ? 100 - site.x : site.x}%`, top: `${mirrored ? 100 - site.y : site.y}%` });
  return <>
    <div className="hull-heat-layer" style={{ maskImage, WebkitMaskImage: maskImage, ...(damage === undefined ? {} : { "--ember-width": `${10 + damage * 6}%`, "--ember-max": `${22 + damage * 26}px` }) } as CSSProperties} aria-hidden="true">
      {sites.map(site => <i key={site.id} className="hull-hotspot" style={position(site)} />)}
    </div>
    {hit && <i key={hit.id} className="hull-mini-explosion" style={position(hit)} aria-hidden="true"><span /><span /><span /></i>}
  </>;
});
export default HullDamage;
