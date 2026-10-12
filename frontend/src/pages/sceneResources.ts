import { preparePaintedShips, type ShipResource } from './paintedShip.ts';
import { ResourceCache } from './resourceCache';
import { preloadBossWeapons } from './bossWeaponTextures';
import type { BossConfig } from './bossManifest';
// Resolved entries retain only void, not decoded Image objects or Canvas surfaces.
const backgrounds=new ResourceCache<Promise<void>>(8,Infinity);
function imageReady(url:string):Promise<void>{
 const cached=backgrounds.get(url);if(cached)return cached;
 const ready=new Promise<void>((resolve,reject)=>{
  const image=new Image();
  let settled=false;
  const clean=()=>{clearTimeout(timer);image.onload=image.onerror=null;};
  const fail=(error:unknown)=>{if(settled)return;settled=true;clean();image.src='';reject(error);};
  const timer=setTimeout(()=>fail(new Error('Scene image timed out')),20_000);
  image.onload=async()=>{try{await image.decode?.();if(settled)return;settled=true;clean();resolve();}catch(error){fail(error);}};
  image.onerror=()=>fail(new Error('Scene image unavailable'));image.src=url;
 });backgrounds.set(url,ready);void ready.catch(()=>{if(backgrounds.get(url)===ready)backgrounds.delete(url);});return ready;
}
export function prepareSceneResources(ships:ShipResource[],boss?:BossConfig,upcoming:ShipResource[]=[]){
 const painted=preparePaintedShips(ships);
 const future=preparePaintedShips(upcoming);
 // A forecast never blocks ongoing combat or creates an unhandled rejection.
 void future.ready.catch(()=>{});
 return {release:()=>{painted.release();future.release();},ready:Promise.all([
  painted.ready,imageReady('/planets/earth.png'),
  ...(boss?[imageReady(boss.image),imageReady(boss.wreckImage),preloadBossWeapons(boss)]:[]),
 ])};
}
