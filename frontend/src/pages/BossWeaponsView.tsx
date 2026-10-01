import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BossConfig } from './bossManifest';
import type { SectorBoss } from './sectorBoss';
import { drawBossWeapons, weaponCanvasSize } from './bossWeaponRenderer';

const textures=new Map<string,Promise<HTMLImageElement>>();
export const preloadBossWeapons=(config:BossConfig)=>{
 let found=textures.get(config.weaponImage);if(found)return found;
 found=new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Boss weapon texture failed'));image.src=config.weaponImage;});
 textures.set(config.weaponImage,found);while(textures.size>2)textures.delete(textures.keys().next().value!);
 void found.catch(()=>{if(textures.get(config.weaponImage)===found)textures.delete(config.weaponImage);});return found;
};
export default memo(function BossWeaponsView({boss,frozen=false}:{boss:SectorBoss;frozen?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),[texture,setTexture]=useState<{id:number;image:HTMLImageElement}|null>(null);
 useEffect(()=>{let alive=true;void preloadBossWeapons(boss.config).then(image=>{if(alive)setTexture({id:boss.config.id,image});},()=>{});return()=>{alive=false;};},[boss.config]);
 const ready=texture?.id===boss.config.id;
 useLayoutEffect(()=>{const c=canvas.current;if(!c||!ready)return;const size=weaponCanvasSize(boss),dpr=Math.min(2,window.devicePixelRatio||1);const w=Math.ceil(size.width*dpr),h=Math.ceil(size.height*dpr);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}drawBossWeapons(c,boss,texture.image,frozen);},[boss,frozen,ready,texture]);
 return <>{!ready&&<img className="boss-weapons-loading" src={boss.config.wreckImage} alt="" draggable={false}/>}<canvas ref={canvas} className="boss-weapons-canvas" hidden={!ready} aria-hidden="true"/></>;
});
