import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SectorBoss } from './sectorBoss';
import { drawBossWeapons, weaponCanvasSize, disposeBossWeapons } from './bossWeaponRenderer';
import { preloadBossWeapons } from './bossWeaponTextures';
import { reportBossResource } from './bossResourceDiagnostics';

export default memo(function BossWeaponsView({boss,frozen=false}:{boss:SectorBoss;frozen?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),[texture,setTexture]=useState<{id:number;image:HTMLImageElement}|null>(null);
 const drawn = useRef<number | null>(null);
 const staticDrawing=useRef<{config:SectorBoss['config'];width:number;height:number;pixelWidth:number;pixelHeight:number;image:HTMLImageElement}|null>(null);
 const [contextGeneration,setContextGeneration]=useState(0);
 useEffect(()=>{let alive=true;void preloadBossWeapons(boss.config).then(image=>{if(alive)setTexture({id:boss.config.id,image});},()=>{});return()=>{alive=false;};},[boss.config]);
 const ready=texture?.id===boss.config.id;
 useEffect(()=>{const current=canvas.current;if(!current)return;const invalidate=()=>{staticDrawing.current=null;};const restored=()=>{invalidate();disposeBossWeapons(current);setContextGeneration(value=>value+1);};current.addEventListener('contextlost',invalidate);current.addEventListener('contextrestored',restored);return()=>{current.removeEventListener('contextlost',invalidate);current.removeEventListener('contextrestored',restored);staticDrawing.current=null;};},[]);
 useEffect(() => { const current = canvas.current; return () => { if (current) { disposeBossWeapons(current); if(drawn.current!==null)reportBossResource('boss-canvas-release',{bossId:drawn.current}); } }; }, []);
 useLayoutEffect(()=>{
  const c=canvas.current;if(!c||!ready)return;
  const size=weaponCanvasSize(boss),dpr=Math.min(2,window.devicePixelRatio||1);
  const w=Math.ceil(size.width*dpr),h=Math.ceil(size.height*dpr);
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;staticDrawing.current=null;}
  const destroyed=boss.turrets.length>0&&boss.turrets.every(gun=>gun.health<=0);
  const previous=staticDrawing.current;
  // Destroyed guns have no recoil, heat, aim or muzzle animation. Their final
  // pixels move with the parent hull; reactor animation belongs to another view.
  if(destroyed&&previous&&previous.config===boss.config&&previous.width===boss.width&&previous.height===boss.height&&previous.pixelWidth===w&&previous.pixelHeight===h&&previous.image===texture.image)return;
  const painted=drawBossWeapons(c,boss,texture.image,frozen);
  staticDrawing.current=destroyed&&painted?{config:boss.config,width:boss.width,height:boss.height,pixelWidth:w,pixelHeight:h,image:texture.image}:null;
  if(painted&&drawn.current!==boss.config.id){drawn.current=boss.config.id;reportBossResource('boss-canvas-first-draw',{bossId:boss.config.id,bossCanvasWidth:c.width,bossCanvasHeight:c.height});}
 },[boss,frozen,ready,texture,contextGeneration]);
 return <>{!ready&&<img className="boss-weapons-loading" src={boss.config.wreckImage} alt="" draggable={false}/>}<canvas ref={canvas} className="boss-weapons-canvas" hidden={!ready} aria-hidden="true"/></>;
});
