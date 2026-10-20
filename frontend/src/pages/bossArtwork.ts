import { createSectorBoss } from './sectorBoss';
import { preloadBossWeapons } from './bossWeaponTextures';
import { disposeBossWeapons, drawBossWeapons, weaponCanvasSize } from './bossWeaponRenderer';

/** One source of truth for cards and PNGs: current game hull + current mounted weapons.
 * Crop empty padding and near-transparent encoding specks only; preserve hull and weapons.
 */
const cache = new Map<string, Promise<HTMLCanvasElement>>();
// Cache eviction must not start a second copy of an unfinished preparation.
// Settled tasks live only in the existing bounded cache.
const pending = new Map<string, Promise<HTMLCanvasElement>>();
export const loadCardImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error(`Card asset unavailable: ${src}`));
  image.src = src;
});
export function loadBossArtwork(id: number, resolution = 1200): Promise<HTMLCanvasElement> {
  if (!Number.isInteger(id) || id < 1 || id > 50) return Promise.reject(new Error('Invalid boss id'));
  const pixels = Math.max(256, Math.min(2400, Math.round(resolution)));
  const key = `${id}:${pixels}`;
  const found = pending.get(key) ?? cache.get(key);
  if (found) return found;
  const task = (async () => {
    const boss = createSectorBoss(id * 10, 768, 0, 1200);
    const [hull, texture] = await Promise.all([loadCardImage(boss.config.image), preloadBossWeapons(boss.config)]);
    const size = weaponCanvasSize(boss);
    const scale = pixels / Math.max(size.width, size.height);
    const guns = document.createElement('canvas');
    let combined: HTMLCanvasElement | undefined, result: HTMLCanvasElement | undefined;
    let retained = false;
    try {
    guns.width = Math.ceil(size.width * scale); guns.height = Math.ceil(size.height * scale);
    if (!drawBossWeapons(guns, boss, texture, true)) throw new Error('Canvas unavailable');
    combined = document.createElement('canvas');
    combined.width = guns.width; combined.height = guns.height;
    const context = combined.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas unavailable');
    context.drawImage(hull, size.padX / size.width * combined.width, size.padY / size.height * combined.height,
      boss.width / size.width * combined.width, boss.height / size.height * combined.height);
    context.drawImage(guns, 0, 0);
    const { data } = context.getImageData(0, 0, combined.width, combined.height);
    let left = combined.width, top = combined.height, right = -1, bottom = -1;
    for (let y = 0; y < combined.height; y++) for (let x = 0; x < combined.width; x++) {
      if (data[(y * combined.width + x) * 4 + 3] >= 5) {
        left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
    if (right < left || bottom < top) throw new Error('Empty boss artwork');
    const width = right - left + 1, height = bottom - top + 1;
    const margin = Math.max(8, Math.ceil(Math.max(width, height) * .035));
    result = document.createElement('canvas');
    result.width = width + margin * 2; result.height = height + margin * 2;
    const output = result.getContext('2d');
    if (!output) throw new Error('Canvas unavailable');
    output.drawImage(combined, left, top, width, height, margin, margin, width, height);
    result.dataset.bossId = String(id);
    result.dataset.turretCount = String(boss.turrets.length);
    result.dataset.hullSource = boss.config.image;
    result.dataset.weaponSource = boss.config.weaponImage;
    retained = true;
    return result;
    } finally {
      disposeBossWeapons(guns);
      if (combined) combined.width = combined.height = 0;
      if (result && !retained) result.width = result.height = 0;
    }
  })();
  pending.set(key, task);
  cache.set(key, task);
  // Bound retained canvases on mobile. Mounted views retain their own small copy.
  while (cache.size > 8) cache.delete(cache.keys().next().value!);
  void task.then(
    () => { if (pending.get(key) === task) pending.delete(key); },
    () => {
      if (pending.get(key) === task) pending.delete(key);
      if (cache.get(key) === task) cache.delete(key);
    },
  );
  return task;
}
