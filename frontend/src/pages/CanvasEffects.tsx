import { requestGameFrame, cancelGameFrame } from '../lib/frameScheduler';
import React,{createContext,useContext,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {usePaintedShipStyle} from './paintedShip';
import {explosionDiameter} from './shipRealism';
import {FIRE_KEYS,SMOKE_KEYS,layerFrame,fragmentFrame,polygonPoints,layerSvg} from './normalEffectMath.mjs';
import {impactBounds,unionBounds,fieldBounds} from './normalEffectBounds.mjs';
import {beginVisualPaint,endVisualPaint} from './renderWork';

import {normalExplosionArt as art} from './normalEffectArtwork';
const images=new Map<string,Promise<HTMLImageElement>>();
const textures=new Map<string,Promise<any>>();
const readyImages=new Map<string,HTMLImageElement>(),readyTextures=new Map<string,any>();
const hullUsers=new Map<string,number>();
let imageBytes=0,textureBytes=0,failures:string[]=[],preparationCount=0,resourceGeneration=0,hullEvictions=0,hullLoads=0;
export function retainCanvasImpactHull(url:string){
  const generation=resourceGeneration;hullUsers.set(url,(hullUsers.get(url)??0)+1);
  return ()=>{if(generation!==resourceGeneration)return;const remaining=(hullUsers.get(url)??1)-1;if(remaining)hullUsers.set(url,remaining);else hullUsers.delete(url);};
}
function evictUnusedHull(){
  // Map insertion order is refreshed on use. Pending decoding and every mounted
  // effect (including frozen proofs) retain their hull until their own cleanup.
  for(const url of images.keys()){
    const hull=readyImages.get(url);if(!hull||hullUsers.has(url))continue;
    imageBytes-=hull.naturalWidth*hull.naturalHeight*4;
    readyImages.delete(url);images.delete(url);hullEvictions++;return true;
  }
  return false;
}
const image=(url:string)=>{
  let pending=images.get(url);if(pending){images.delete(url);images.set(url,pending);return pending;}
  if(images.size>=8&&!evictUnusedHull())return Promise.reject(new Error('Active hull image cache limit; retain original display'));
  const generation=resourceGeneration;
  pending=new Promise<HTMLImageElement>((resolve,reject)=>{
    const img=new Image();img.onload=()=>{
      img.onload=img.onerror=null;
      if(generation!==resourceGeneration){reject(new Error('Stale hull preparation cancelled'));return;}
      const bytes=img.naturalWidth*img.naturalHeight*4;
      while(imageBytes+bytes>32*1024*1024&&evictUnusedHull()){}
      if(imageBytes+bytes>32*1024*1024){reject(new Error('Hull image byte limit; retain original display'));return;}
      imageBytes+=bytes;hullLoads++;readyImages.set(url,img);resolve(img);
    };img.onerror=()=>{img.onload=img.onerror=null;reject(new Error('Hull image unavailable'));};img.src=url;
  }).catch(error=>{if(generation===resourceGeneration&&images.get(url)===pending)images.delete(url);throw error;});images.set(url,pending);return pending;
};
const texture=(kind:'fire'|'smoke',diameter:number,dpr:number)=>{
  const key=`${kind}:${diameter}:${dpr}`;let pending=textures.get(key);if(pending)return pending;
  if(textures.size>=16)return Promise.reject(new Error('Texture count limit; retain original display'));
  const generation=resourceGeneration;
  pending=(async()=>{
    const geometry=layerSvg(art[kind],diameter,dpr);
    if(textureBytes+geometry.pixels**2*4>16*1024*1024)throw new Error('Texture byte limit; retain original display');
    const bytes=geometry.pixels**2*4;textureBytes+=bytes;
    let retained=false;
    let canvas:HTMLCanvasElement|undefined;
    const url=URL.createObjectURL(new Blob([geometry.svg],{type:'image/svg+xml'}));
    try{
      const svg=new Image();await new Promise<void>((resolve,reject)=>{svg.onload=()=>{svg.onload=svg.onerror=null;resolve();};svg.onerror=()=>{svg.onload=svg.onerror=null;reject(new Error('Effect texture unavailable'));};svg.src=url;});
      if(generation!==resourceGeneration)throw new Error('Stale texture preparation cancelled');
      canvas=document.createElement('canvas');canvas.width=canvas.height=geometry.pixels;
      const context=canvas.getContext('2d');if(!context)throw new Error('Texture canvas unavailable');
      context.drawImage(svg,0,0);preparationCount++;
      const result={...geometry,canvas};readyTextures.set(key,result);retained=true;return result;
    }finally{URL.revokeObjectURL(url);if(!retained){if(canvas)canvas.width=canvas.height=0;if(generation===resourceGeneration)textureBytes-=bytes;}}
  })().catch(error=>{if(generation===resourceGeneration&&textures.get(key)===pending)textures.delete(key);throw error;});textures.set(key,pending);return pending;
};
const recordFailure=(error:any)=>{if(failures.length<8)failures.push(String(error?.message??error));};
const dpr=()=>window.devicePixelRatio||1;
const resources=(url:string,diameter:number)=>{
  const scale=dpr(),hull=readyImages.get(url),fire=readyTextures.get(`fire:${diameter}:${scale}`),smoke=readyTextures.get(`smoke:${diameter}:${scale}`);
  return hull&&fire&&smoke?{hull,fire,smoke,scale,generation:resourceGeneration}:null;
};
export const prepareCanvasImpactResources=(url:string,diameter:number)=>Promise.all([image(url),texture('fire',diameter,dpr()),texture('smoke',diameter,dpr())]);
function piecesFrom(debris:any) {
  return React.Children.toArray(debris?.props?.children).map((piece:any)=>{
    const style=piece.props.style;
    return {points:polygonPoints(style.clipPath),pivot:style.transformOrigin.split(' ').map((v:string)=>parseFloat(v)/100),
      x:parseFloat(style['--fragment-x']),y:parseFloat(style['--fragment-y']),spin:parseFloat(style['--fragment-spin'])*Math.PI/180,
      delay:parseFloat(style['--fragment-delay'])};
  });
}
export function drawImpact(ctx:CanvasRenderingContext2D,record:any,age:number) {
  const {effect,assets,pieces}=record,size=effect.debrisSize??58,diameter=explosionDiameter(size);
  ctx.save();ctx.translate(effect.x,effect.y);
  for(const [kind,keys,duration] of [['fire',FIRE_KEYS,880],['smoke',SMOKE_KEYS,1450]] as const){
    if(age>=duration)continue;
    const [alpha,x,y,sx,sy]=layerFrame(keys,age/duration),t=assets[kind];
    ctx.save();ctx.globalAlpha=alpha;ctx.translate(x*t.size,y*t.size);ctx.scale(sx,sy);
    ctx.drawImage(t.canvas,-t.size/2-t.pad,-t.size/2-t.pad,t.extent,t.extent);ctx.restore();
  }
  // Preserve full-resolution source hulls. The same original polygon is clipped
  // in the shared 2D context, after the original child rotation, on every draw.
  const rotation=((effect.target==='player'?0:180)+(effect.debrisRotation??0))*Math.PI/180;
  for(const piece of pieces){
    const frame=fragmentFrame(age,piece.delay);if(frame.alpha<=0)continue;
    const px=piece.pivot[0]*size,py=piece.pivot[1]*size;
    ctx.save();ctx.globalAlpha=frame.alpha;ctx.translate(-size/2+px+piece.x*frame.motion,-size/2+py+piece.y*frame.motion);
    ctx.rotate(piece.spin*frame.motion);ctx.scale(frame.scale,frame.scale);ctx.translate(-px,-py);
    ctx.beginPath();piece.points.forEach(([x,y]:number[],i:number)=>i?ctx.lineTo(x*size,y*size):ctx.moveTo(x*size,y*size));ctx.closePath();ctx.clip();
    ctx.translate(size/2,size/2);ctx.rotate(rotation);ctx.drawImage(assets.hull,-size/2,-size/2,size,size);ctx.restore();
  }
  ctx.restore();return diameter;
}

const records=new Map<number,any>();
let surface:HTMLCanvasElement|null=null,frameId=0,pausedAt=0,pauseTotal=0;
const EFFECT_PAINT_INTERVAL_MS=1000/60;
let nextPaintAt:number|null=null;
let fieldWidth=1,fieldHeight=1,grownBounds:any=null,surfaceBox={left:0,top:0,right:1,bottom:1},surfaceResizes=0,maxSurfaceBytes=0;
let draws=0,fragmentDraws=0;
let idleReleaseTimer:number|null=null;
const cancelSurfaceRelease=()=>{if(idleReleaseTimer!==null)window.clearTimeout(idleReleaseTimer);idleReleaseTimer=null;};
let disableSurface:(()=>void)|null=null;
function fitSurface(){
  if(!surface)return;
  if(records.size)cancelSurfaceRelease();
  for(const record of records.values())grownBounds=unionBounds(grownBounds,record.bounds);
  const box=fieldBounds(grownBounds,fieldWidth,fieldHeight);
  const width=box.right-box.left,height=box.bottom-box.top,scale=dpr(),pixelsX=Math.ceil(width*scale),pixelsY=Math.ceil(height*scale);
  if(surface.width!==pixelsX||surface.height!==pixelsY){
    if(surface.width!==pixelsX)surface.width=pixelsX;
    if(surface.height!==pixelsY)surface.height=pixelsY;
    surfaceResizes++;
  }
  surfaceBox=box;surface.style.left=`${box.left}px`;surface.style.top=`${box.top}px`;surface.style.width=`${width}px`;surface.style.height=`${height}px`;
  maxSurfaceBytes=Math.max(maxSurfaceBytes,pixelsX*pixelsY*4);
}
function frame(time:number){
  frameId=0;if(!surface||!records.size)return;
  const paused=surface.parentElement?.closest('.game-shell')?.getAttribute('data-effects-paused')==='true';
  if(paused){if(!pausedAt)pausedAt=time;frameId=requestGameFrame(frame);return;}
  if(pausedAt){pauseTotal+=time-pausedAt;pausedAt=0;nextPaintAt=null;}
  // Keep wall-clock animation ages, but avoid redrawing the same effects at
  // 90/120/144 Hz. Advance the deadline past missed slots without catch-up draws.
  // Preserve the deadline phase and allow 1 ms timestamp rounding so an
  // ordinary 60 Hz browser does not accidentally lose every third frame.
  if(nextPaintAt!==null&&time+1<nextPaintAt){frameId=requestGameFrame(frame);return;}
  const deadline=nextPaintAt??time;
  nextPaintAt=deadline+(Math.floor(Math.max(0,time-deadline)/EFFECT_PAINT_INTERVAL_MS)+1)*EFFECT_PAINT_INTERVAL_MS;
  const paintStarted=beginVisualPaint();
  try {
    const ctx=surface.getContext('2d');if(!ctx)throw new Error('Effect surface context unavailable');
    const scale=dpr();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,surface.width,surface.height);
    ctx.setTransform(scale,0,0,scale,-surfaceBox.left*scale,-surfaceBox.top*scale);
    for(const record of records.values()){drawImpact(ctx,record,Math.max(0,time-record.started-(pauseTotal-record.pauseStart)));draws++;fragmentDraws+=record.pieces.length;}
  } catch(error) { recordFailure(error); const disable=disableSurface;clearCanvasEffects();disable?.();return; }
  finally { endVisualPaint('effect',paintStarted); }
  frameId=requestGameFrame(frame);
}
const schedule=()=>{if(!frameId&&surface&&records.size)frameId=requestGameFrame(frame);};
const remove=(id:number)=>{
  if(!records.delete(id))return;
  if(!records.size&&surface){
    if(frameId)cancelGameFrame(frameId);frameId=0;
    const ctx=surface.getContext('2d');
    ctx?.setTransform(1,0,0,1,0,0);
    ctx?.clearRect(0,0,surface.width,surface.height);
    // Retain the transparent backing store, but reset logical bounds exactly as
    // before. Carrying an old origin into the next burst changes raster rounding.
    // The next burst resizes only if its own original bounds require it.
    grownBounds=null;
    cancelSurfaceRelease();
    idleReleaseTimer=window.setTimeout(()=>{
      idleReleaseTimer=null;
      if(!records.size&&surface){grownBounds=null;fitSurface();}
    },2000);
  }
};


/** One surface for the ordinary effects of one mounted game. Original DOM is
 * retained whenever Canvas or source preparation is unavailable. */
const CanvasAvailability=createContext({enabled:false,scale:1});

export function clearCanvasEffects(){
  resourceGeneration++;
  cancelSurfaceRelease();
  if(frameId)cancelGameFrame(frameId);
  frameId=0;records.clear();
  for(const t of readyTextures.values())t.canvas.width=t.canvas.height=0;
  if(surface)surface.width=surface.height=0;
  textures.clear();readyTextures.clear();images.clear();readyImages.clear();hullUsers.clear();
  imageBytes=textureBytes=preparationCount=hullLoads=hullEvictions=0;
  pausedAt=pauseTotal=0;nextPaintAt=null;grownBounds=null;draws=fragmentDraws=0;
}
// Bounded counters for resource verification; no global/browser debug API.
export function canvasEffectResources(){
  return {activeDrawFrame:!!frameId,registeredEffects:records.size,sourceImages:images.size,
    textureEntries:textures.size,cacheBytes:imageBytes+textureBytes,
    surfaceBytes:surface?surface.width*surface.height*4:0,imageBytes,textureBytes,
    hullLoads,hullEvictions,retainedHullUsers:hullUsers.size,draws,fragmentDraws,failures:[...failures]};
}

export function CanvasEffectLayer({children,enabled}:{children:React.ReactNode;enabled:boolean}){
  const ref=useRef<HTMLCanvasElement>(null);
  const [available,setAvailable]=useState({enabled:false,scale:dpr()});
  useLayoutEffect(()=>{
    if(!enabled)return;
    const canvas=ref.current!;
    if(!canvas.getContext('2d'))return;
    surface=canvas;failures=[];surfaceResizes=maxSurfaceBytes=0;
    let failed=false;
    disableSurface=()=>{failed=true;setAvailable(value=>({...value,enabled:false}));};
    const lost=()=>{
      if(failed)return;
      recordFailure(new Error('Effect surface context lost'));
      const disable=disableSurface;clearCanvasEffects();disable?.();
    };
    canvas.addEventListener('contextlost',lost);
    const resize=()=>{
      // A failed surface stays on the original display for this mounted game;
      // a viewport notification must not re-enable released texture canvases.
      if(failed)return;
      const parent=canvas.parentElement!;
      fieldWidth=parent.clientWidth;fieldHeight=parent.clientHeight;grownBounds=null;
      fitSurface();schedule();
      const scale=dpr();
      setAvailable(value=>value.enabled&&value.scale===scale?value:{enabled:true,scale});
    };
    resize();
    const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement!);
    return()=>{
      observer.disconnect();canvas.removeEventListener('contextlost',lost);clearCanvasEffects();
      if(surface===canvas)surface=null;
      disableSurface=null;
    };
  },[enabled]);
  return <CanvasAvailability.Provider value={available}>
    {enabled&&<canvas ref={ref} className="normal-effects-surface" aria-hidden="true" style={{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:2}}/>}
    {children}
  </CanvasAvailability.Provider>;
}

export function CanvasImpact({effect,debris,original}:{effect:any;debris:any;original:React.ReactNode}){
  const availability=useContext(CanvasAvailability);
  const style=usePaintedShipStyle(effect.sprite,effect.debrisColor,effect.shipStage??1);
  const url=String(style.backgroundImage).replace(/^url\(["']?|["']?\)$/g,'');
  const diameter=explosionDiameter(effect.debrisSize??58);
  const [loaded,setLoaded]=useState(()=>resources(url,diameter));
  const started=useRef(performance.now());
  const pauseStart=useRef(pauseTotal);
  const pieces=useMemo(()=>piecesFrom(debris),[debris]);
  useEffect(()=>{
    if(!availability.enabled)return;
    let active=true;const release=retainCanvasImpactHull(url);
    const generation=resourceGeneration;
    void prepareCanvasImpactResources(url,diameter).then(([hull,fire,smoke])=>{
      if(active&&generation===resourceGeneration)setLoaded(previous=>
        previous?.hull===hull&&previous.fire===fire&&previous.smoke===smoke
          &&previous.scale===availability.scale&&previous.generation===generation
          ?previous:{hull,fire,smoke,scale:availability.scale,generation});
    },error=>{if(active)recordFailure(error);});
    return()=>{active=false;release();};
  },[url,diameter,availability.enabled,availability.scale]);
  const available=availability.enabled&&loaded?.hull?.src===url
    &&loaded.scale===availability.scale&&loaded.generation===resourceGeneration;
  useLayoutEffect(()=>{
    if(!available)return;
    const record={effect,pieces,assets:loaded,started:started.current,pauseStart:pauseStart.current,bounds:null as any};
    record.bounds=impactBounds(record);
    records.set(effect.id,record);fitSurface();schedule();
    return()=>remove(effect.id);
  },[available,loaded,effect,pieces]);
  return available?null:<>{original}</>;
}
