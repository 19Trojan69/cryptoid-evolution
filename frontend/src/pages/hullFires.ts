export type HullFire = { id: number; x: number; y: number };
type FireSite = readonly [number, number];

// Each site was sampled from opaque areas of its ship in the 4-by-5 atlas.
// The atlas sprites rotate 180 degrees when drawn as enemy ships.
const atlasSites: readonly (readonly FireSite[])[] = [
  [[53, 56], [64, 63], [51, 69], [47, 64], [56, 54]],
  [[47, 59], [63, 60], [53, 70], [71, 70], [40, 70]],
  [[40, 53], [51, 60], [34, 64], [46, 71], [36, 80]],
  [[34, 56], [54, 57], [40, 67], [53, 70], [27, 67]],
  [[50, 53], [63, 56], [39, 58], [54, 65], [44, 58]],
  [[48, 43], [60, 48], [47, 56], [65, 60], [36, 61]],
  [[40, 50], [51, 56], [41, 64], [26, 60], [33, 58]],
  [[36, 47], [50, 47], [37, 60], [51, 60], [24, 60]],
  [[46, 40], [64, 41], [51, 51], [64, 54], [39, 51]],
  [[50, 40], [63, 47], [44, 51], [57, 59], [44, 50]],
  [[33, 39], [56, 40], [38, 50], [51, 53], [26, 50]],
  [[40, 36], [57, 31], [41, 49], [21, 41], [46, 49]],
  [[51, 26], [63, 31], [46, 37], [63, 44], [34, 43]],
  [[44, 33], [63, 34], [53, 43], [53, 23], [34, 41]],
  [[28, 23], [57, 26], [34, 34], [51, 37], [24, 43]],
  [[41, 26], [46, 38], [37, 48], [50, 51], [40, 41]],
  [[44, 24], [66, 24], [54, 33], [67, 37], [41, 37]],
  [[46, 20], [61, 21], [47, 33], [61, 34], [34, 37]],
  [[33, 21], [54, 23], [38, 33], [51, 36], [27, 39]],
  [[34, 16], [51, 17], [36, 29], [54, 30], [27, 39]],
];

export const spriteFireSites = atlasSites.map(sites => sites.map(([x, y]) => [100 - x, 100 - y] as const));

// Boss coordinates are in its 124 px game element, before the 14 px art inset.
export const bossFireSites: readonly FireSite[] = [
  [35, 12], [65, 12], [50, 22], [28, 33], [72, 33], [40, 49],
  [60, 49], [50, 62], [42, 72], [58, 72], [50, 83],
];

export const hullFireAtImpact = (
  shot: { id: number; x: number; y: number },
  target: { x: number; y: number },
  size: number,
  sites: readonly FireSite[],
  fires: readonly HullFire[] = [],
  rotation = 0,
  offset = { x: 0, y: 0 },
): HullFire => {
  const angle = rotation * Math.PI / 180;
  const dx = shot.x - target.x + offset.x;
  const dy = shot.y - target.y + offset.y;
  const x = 50 + (dx * Math.cos(angle) + dy * Math.sin(angle)) / size * 100;
  const y = 50 + (-dx * Math.sin(angle) + dy * Math.cos(angle)) / size * 100;
  // Use the nearest still unlit part of the painted hull, never empty sprite space.
  const available = sites.filter(([sx, sy]) => !fires.some(fire => fire.x === sx && fire.y === sy));
  const [fireX, fireY] = (available.length ? available : sites).reduce((closest, site) =>
    (site[0] - x) ** 2 + (site[1] - y) ** 2 < (closest[0] - x) ** 2 + (closest[1] - y) ** 2 ? site : closest,
  );
  return { id: shot.id, x: fireX, y: fireY };
};
