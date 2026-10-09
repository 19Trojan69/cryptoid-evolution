import type { BossConfig } from './bossManifest';

const textures = new Map<string, Promise<HTMLImageElement>>();
export const preloadBossWeapons = (config: BossConfig) => {
  let found = textures.get(config.weaponImage);
  if (found) return found;
  found = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Boss weapon texture failed'));
    image.src = config.weaponImage;
  });
  textures.set(config.weaponImage, found);
  while (textures.size > 2) textures.delete(textures.keys().next().value!);
  void found.catch(() => { if (textures.get(config.weaponImage) === found) textures.delete(config.weaponImage); });
  return found;
};
