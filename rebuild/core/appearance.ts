import type { PlayerColorId } from '../../frontend/src/pages/shipFleet.ts';

// Pure copy of the released lookup data. Importing shipFleet into the core
// would execute its browser-storage migration at module evaluation time.
const sprites = [1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19] as const;
const current: readonly PlayerColorId[] = ['silver', 'gold', 'anthracite', 'bronze', 'copper', 'metallic-blue', 'metallic-red', 'metallic-green', 'pink'];
const legacy: readonly PlayerColorId[] = ['grey', 'violet', 'cyan', 'rose', 'amber', 'ruby', 'scarlet', 'coral', 'orange', 'gold', 'lemon', 'lime', 'emerald', 'mint', 'teal', 'ice', 'azure', 'cobalt', 'indigo', 'magenta', 'pink', 'white'];
const all = [...current, ...legacy.filter(color => !current.includes(color))];
const palette = [...current, 'violet', 'cyan', 'orange'] as readonly PlayerColorId[];
export function enemyAppearance(stage: number, index: number) {
  const used = Array.from({ length: Math.min(index, palette.length) }, (_, i) => palette[((Math.max(1, stage) - 1) * 5 + i * 7) % palette.length]);
  const extras = all.filter(color => !used.includes(color));
  return { sprite: sprites[(((Math.max(1, stage) - 1) * 6 + index) * 7) % sprites.length],
    color: index < palette.length ? palette[((Math.max(1, stage) - 1) * 5 + index * 7) % palette.length] : extras[(index - palette.length) % extras.length] };
}
