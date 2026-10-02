export type HullFire = { id: number; x: number; y: number };
type FireSite = readonly [number, number];

// Keep each established heat site mounted and glowing until its ship is destroyed.
// Further impacts may add sites as damage rises, but never replace old sites.
export const addPersistentHullFire = (fires: readonly HullFire[] = [], next: HullFire, maxFires = 4): HullFire[] =>
  fires.length < maxFires && !fires.some(fire => fire.id === next.id || (fire.x === next.x && fire.y === next.y)) ? [...fires, next] : [...fires];

// More severe damage permits more distinct sites; rendering remains bounded.
export const hullFireLimit = (health: number, maxHealth: number, boss = false) => {
  const damage = Math.max(0, Math.min(1, 1 - health / Math.max(1, maxHealth)));
  return Math.ceil(1 + damage * (boss ? 7 : 3));
};

// Opaque pixels sampled across each ship's nose, wings, engines and center in
// the 4-by-5 atlas. The enemies rotate 180 degrees when rendered.
const atlasSites: readonly (readonly FireSite[])[] = [
  [[57, 42], [32, 69], [75, 65], [51, 49], [38, 62], [65, 62], [50, 77], [44, 69], [62, 72]],
  [[53, 35], [38, 52], [68, 54], [29, 69], [74, 65], [50, 48], [35, 62], [65, 63], [50, 78], [38, 73], [72, 74]],
  [[40, 39], [22, 62], [47, 50], [35, 62], [63, 64], [50, 78], [31, 76], [58, 72]],
  [[39, 43], [19, 60], [70, 63], [50, 48], [35, 62], [61, 62], [50, 78], [29, 76], [65, 71]],
  [[55, 29], [38, 43], [71, 43], [30, 65], [77, 63], [50, 48], [38, 60], [65, 62], [52, 76], [36, 72], [71, 73]],
  [[51, 27], [35, 47], [70, 47], [23, 59], [82, 58], [50, 48], [35, 62], [65, 62], [49, 76], [41, 69], [63, 77]],
  [[43, 28], [40, 38], [64, 54], [21, 58], [65, 63], [49, 48], [35, 62], [56, 62], [46, 74], [20, 74], [66, 73]],
  [[44, 29], [34, 38], [65, 41], [18, 58], [72, 59], [50, 48], [35, 62], [63, 62], [49, 75], [36, 75]],
  [[52, 21], [33, 44], [70, 40], [24, 57], [82, 57], [50, 48], [35, 57], [64, 62], [47, 68]],
  [[53, 19], [34, 42], [73, 40], [27, 56], [80, 56], [50, 48], [34, 62], [62, 62], [49, 65], [73, 62]],
  [[46, 21], [29, 38], [67, 41], [18, 57], [72, 54], [50, 48], [35, 62], [63, 58], [50, 68]],
  [[54, 22], [28, 36], [69, 39], [25, 56], [66, 49], [49, 48], [31, 63], [60, 58], [44, 68]],
  [[50, 18], [29, 38], [71, 38], [30, 49], [78, 50], [50, 48], [44, 57], [63, 58]],
  [[50, 18], [30, 38], [72, 38], [25, 46], [81, 47], [50, 48], [45, 56], [61, 56]],
  [[50, 18], [29, 38], [72, 38], [23, 52], [50, 48], [36, 59], [61, 52]],
  [[49, 18], [35, 42], [71, 38], [21, 50], [69, 47], [50, 48], [35, 58], [52, 58]],
  [[50, 18], [29, 38], [71, 38], [72, 56], [50, 43], [38, 58], [66, 49]],
  [[50, 18], [29, 38], [72, 38], [28, 48], [77, 49], [50, 48], [45, 59], [61, 60]],
  [[50, 18], [29, 38], [72, 38], [21, 47], [50, 48], [41, 59], [62, 46]],
  [[50, 18], [29, 38], [71, 38], [18, 49], [69, 49], [50, 48], [36, 60], [51, 57]],
];

export const spriteFireSites = atlasSites.map(sites => sites.map(([x, y]) => [100 - x, 100 - y] as const));

// Boss coordinates are in its 124 px game element, before the 14 px art inset.
export const bossFireSites: readonly FireSite[] = [
  [35, 7], [65, 7], [22, 19], [78, 19], [15, 32], [85, 32],
  [29, 42], [71, 42], [40, 49], [60, 49], [50, 60],
  [38, 70], [62, 70], [50, 82], [50, 90],
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
  // Keep successive fires apart, even when repeated shots hit the same spot.
  const available = sites.filter(([sx, sy]) => !fires.some(fire => fire.x === sx && fire.y === sy));
  const separated = available.filter(([sx, sy]) => fires.every(fire => (fire.x - sx) ** 2 + (fire.y - sy) ** 2 >= 22 ** 2));
  const [fireX, fireY] = (separated.length ? separated : available.length ? available : sites).reduce((closest, site) =>
    (site[0] - x) ** 2 + (site[1] - y) ** 2 < (closest[0] - x) ** 2 + (closest[1] - y) ** 2 ? site : closest,
  );
  return { id: shot.id, x: fireX, y: fireY };
};
