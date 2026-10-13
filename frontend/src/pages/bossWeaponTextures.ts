import type { BossConfig } from './bossManifest';

const textures = new Map<string, Promise<HTMLImageElement>>();
const decoded = new WeakSet<Promise<HTMLImageElement>>();
export const bossWeaponsReady = (config: BossConfig) => {
  const texture = textures.get(config.weaponImage);
  return !!texture && decoded.has(texture);
};
export const preloadBossWeapons = (config: BossConfig) => {
  let found = textures.get(config.weaponImage);
  if (found) return found;
  found = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    let settled=false;
    const clean=()=>{clearTimeout(timer);image.onload=image.onerror=null;};
    const fail=(error:unknown)=>{if(settled)return;settled=true;clean();image.src='';reject(error);};
    const timer=setTimeout(()=>fail(new Error('Boss weapon texture timed out')),20_000);
    image.onload = async () => {try{await image.decode?.();if(settled)return;settled=true;clean();resolve(image);}catch(error){fail(error);} };
    image.onerror = () => fail(new Error('Boss weapon texture failed'));
    image.src = config.weaponImage;
  });
  const current = found;
  void current.then(() => decoded.add(current), () => {});
  textures.set(config.weaponImage, found);
  while (textures.size > 2) textures.delete(textures.keys().next().value!);
  void found.catch(() => { if (textures.get(config.weaponImage) === found) textures.delete(config.weaponImage); });
  return found;
};
