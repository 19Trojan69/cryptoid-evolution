import type { BossConfig } from './bossManifest';
import { reportBossResource } from './bossResourceDiagnostics.ts';
import { ResourceCache } from './resourceCache.ts';

const textures = new ResourceCache<Promise<HTMLImageElement>>(2, Infinity);
const queued: {url:string;foreground:boolean;start:()=>void}[]=[];
let active=0;
const drain=()=>{
  while(active<2&&queued.length){
    const foreground=queued.findIndex(job=>job.foreground);
    if(foreground<0&&active>=1)break;
    const job=queued.splice(Math.max(0,foreground),1)[0];active++;job.start();
  }
};
export const preloadBossWeapons = (config: BossConfig, foreground=true) => {
  let found = textures.get(config.weaponImage);
  if (found) {
    const index=foreground?queued.findIndex(job=>job.url===config.weaponImage):-1;
    if(index>=0){queued[index].foreground=true;drain();}
    return found;
  }
  let resolveImage!:(image:HTMLImageElement)=>void,rejectImage!:(error:unknown)=>void;
  found = new Promise<HTMLImageElement>((resolve, reject) => {resolveImage=resolve;rejectImage=reject;});
  const current=found,release=textures.retain(config.weaponImage);
  textures.set(config.weaponImage,current);
  void current.then(release,()=>{release();if(textures.get(config.weaponImage)===current)textures.delete(config.weaponImage);});
  queued.push({url:config.weaponImage,foreground,start(){
    const loaded=new Promise<HTMLImageElement>((resolve,reject)=>{
      reportBossResource('boss-texture-start', { bossId: config.id });
      const image = new Image();
      image.onload = () => { image.onload=image.onerror=null;reportBossResource('boss-texture-ready', { bossId: config.id, bossTextureWidth: image.naturalWidth, bossTextureHeight: image.naturalHeight });resolve(image); };
      image.onerror = () => { image.onload=image.onerror=null;reportBossResource('boss-texture-error', { bossId: config.id });reject(new Error('Boss weapon texture failed')); };
      image.src = config.weaponImage;
    });
    void loaded.then(image=>{resolveImage(image);active--;drain();},error=>{rejectImage(error);active--;drain();});
  }});
  drain();return current;
};
