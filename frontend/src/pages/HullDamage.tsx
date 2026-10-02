import { memo } from "react";
import type { HullFire } from "./hullFires";

type Props = { sites?: readonly HullFire[]; hit?: { id?: number; x: number; y: number }; maskImage: string; mirrored?: boolean };

// Small masked ember sites cool independently. Damage never grows them into
// a whole-hull overlay; stable keys preserve cooling across game renders.
const HullDamage = memo(({ sites = [], hit, maskImage, mirrored = false }: Props) => {
  if (!sites.length && !hit) return null;
  const embers = hit && !sites.some(site => site.id === hit.id) ? [...sites, { id: hit.id ?? -1, x: hit.x, y: hit.y }] : sites;
  const position = (site: Pick<HullFire, "x" | "y">) => ({ left: `${mirrored ? 100 - site.x : site.x}%`, top: `${mirrored ? 100 - site.y : site.y}%` });
  return <>
    <div className="hull-heat-layer" style={{ maskImage, WebkitMaskImage: maskImage }} aria-hidden="true">
      {embers.map(site => <i key={site.id} className="hull-hotspot" style={position(site)} />)}
    </div>
    {hit && <i key={hit.id} className="hull-mini-explosion" style={position(hit)} aria-hidden="true"><span /><span /><span /></i>}
  </>;
});
export default HullDamage;
