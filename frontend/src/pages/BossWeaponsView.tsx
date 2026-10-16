import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SectorBoss } from './sectorBoss';
import { drawBossWeapons, weaponCanvasSize, disposeBossWeapons } from './bossWeaponRenderer';
import { preloadBossWeapons } from './bossWeaponTextures';
import { reportBossResource } from './bossResourceDiagnostics';

export default memo(function BossWeaponsView({boss,frozen=false}:{boss:SectorBoss;frozen?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),[texture,setTexture]=useState<{id:number;image:HTMLImageElement}|null>(null);
 const drawn = useRef<number | null>(null);
 useEffect(()=>{let alive=true;void preloadBossWeapons(boss.config).then(image=>{if(alive)setTexture({id:boss.config.id,image});},()=>{});return()=>{alive=false;};},[boss.config]);
 const ready=texture?.id===boss.config.id;
 useEffect(() => { const current = canvas.current; return () => { if (current) { disposeBossWeapons(current); if(drawn.current!==null)reportBossResource('boss-canvas-release',{bossId:drawn.current}); } }; }, []);
 useLayoutEffect(()=>{const c=canvas.current;if(!c||!ready)return;const size=weaponCanvasSize(boss),dpr=Math.min(2,window.devicePixelRatio||1);const w=Math.ceil(size.width*dpr),h=Math.ceil(size.height*dpr);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}drawBossWeapons(c,boss,texture.image,frozen);if(drawn.current!==boss.config.id){drawn.current=boss.config.id;reportBossResource('boss-canvas-first-draw',{bossId:boss.config.id,bossCanvasWidth:c.width,bossCanvasHeight:c.height});}},[boss,frozen,ready,texture]);
 return <>{!ready&&<img className="boss-weapons-loading" src={boss.config.wreckImage} alt="" draggable={false}/>}<canvas ref={canvas} className="boss-weapons-canvas" hidden={!ready} aria-hidden="true"/></>;
});
