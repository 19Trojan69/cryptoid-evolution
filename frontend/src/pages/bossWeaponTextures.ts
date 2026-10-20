import type { BossConfig } from './bossManifest';
import { reportBossResource } from './bossResourceDiagnostics.ts';

const textures = new Map<string, Promise<HTMLImageElement>>();
// In-flight requests remain shared even when their cache entry is evicted.
const pending = new Map<string, Promise<HTMLImageElement>>();
export const preloadBossWeapons = (config: BossConfig) => {
  let found = pending.get(config.weaponImage) ?? textures.get(config.weaponImage);
  if (found) return found;
  found = new Promise<HTMLImageElement>((resolve, reject) => {
    reportBossResource('boss-texture-start', { bossId: config.id });
    const image = new Image();
    image.onload = () => { reportBossResource('boss-texture-ready', { bossId: config.id, bossTextureWidth: image.naturalWidth, bossTextureHeight: image.naturalHeight }); resolve(image); };
    image.onerror = () => { reportBossResource('boss-texture-error', { bossId: config.id }); reject(new Error('Boss weapon texture failed')); };
    image.src = config.weaponImage;
  });
  pending.set(config.weaponImage, found);
  textures.set(config.weaponImage, found);
  while (textures.size > 2) textures.delete(textures.keys().next().value!);
  void found.then(
    () => { if (pending.get(config.weaponImage) === found) pending.delete(config.weaponImage); },
    () => {
      if (pending.get(config.weaponImage) === found) pending.delete(config.weaponImage);
      if (textures.get(config.weaponImage) === found) textures.delete(config.weaponImage);
    },
  );
  return found;
};
