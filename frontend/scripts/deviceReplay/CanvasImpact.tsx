import React,{useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {usePaintedShipStyle} from '../../src/pages/paintedShip';
import {explosionDiameter} from '../../src/pages/shipRealism';
import {FIRE_KEYS,SMOKE_KEYS,layerFrame,fragmentFrame,polygonPoints,layerSvg} from './rasterMath.mjs';
import {impactBounds,unionBounds,fieldBounds} from './effectBounds.mjs';

const art=__CRYPTOID_EXPLOSION_ART__;
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
    const url=URL.createObjectURL(new Blob([geometry.svg],{type:'image/svg+xml'}));
    try{
      const svg=new Image();await new Promise<void>((resolve,reject)=>{svg.onload=()=>{svg.onload=svg.onerror=null;resolve();};svg.onerror=()=>{svg.onload=svg.onerror=null;reject(new Error('Effect texture unavailable'));};svg.src=url;});
      if(generation!==resourceGeneration)throw new Error('Stale texture preparation cancelled');
      const canvas=document.createElement('canvas');canvas.width=canvas.height=geometry.pixels;
      const context=canvas.getContext('2d');if(!context)throw new Error('Texture canvas unavailable');
      context.drawImage(svg,0,0);preparationCount++;
      const result={...geometry,canvas};readyTextures.set(key,result);retained=true;return result;
    }finally{URL.revokeObjectURL(url);if(!retained&&generation===resourceGeneration)textureBytes-=bytes;}
  })();textures.set(key,pending);return pending;
};
const recordFailure=(error:any)=>{if(failures.length<8)failures.push(String(error?.message??error));};
const dpr=()=>window.devicePixelRatio||1;
const resources=(url:string,diameter:number)=>{
  const scale=dpr(),hull=readyImages.get(url),fire=readyTextures.get(`fire:${diameter}:${scale}`),smoke=readyTextures.get(`smoke:${diameter}:${scale}`);
  return hull&&fire&&smoke?{hull,fire,smoke}:null;
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
let fieldWidth=1,fieldHeight=1,grownBounds:any=null,surfaceBox={left:0,top:0,right:1,bottom:1},surfaceResizes=0,maxSurfaceBytes=0;
let mode='original',draws=0,fragmentDraws=0,fallbacks=0,drawSamples:number[]=[],samples:any[]=[],lastSample=0;
function fitSurface(){
  if(!surface)return;
  if(mode==='bounded')for(const record of records.values())grownBounds=unionBounds(grownBounds,record.bounds);
  const box=mode==='bounded'?fieldBounds(grownBounds,fieldWidth,fieldHeight):{left:0,top:0,right:fieldWidth,bottom:fieldHeight};
  const width=box.right-box.left,height=box.bottom-box.top,scale=dpr(),pixelsX=Math.ceil(width*scale),pixelsY=Math.ceil(height*scale);
  if(surface.width!==pixelsX||surface.height!==pixelsY){surface.width=pixelsX;surface.height=pixelsY;surfaceResizes++;}
  surfaceBox=box;surface.style.left=`${box.left}px`;surface.style.top=`${box.top}px`;surface.style.width=`${width}px`;surface.style.height=`${height}px`;
  maxSurfaceBytes=Math.max(maxSurfaceBytes,pixelsX*pixelsY*4);
}
function frame(time:number){
  frameId=0;if(!surface||!records.size)return;
  const paused=surface.parentElement?.closest('.game-shell')?.getAttribute('data-effects-paused')==='true';
  if(paused){if(!pausedAt)pausedAt=time;frameId=requestAnimationFrame(frame);return;}
  if(pausedAt){pauseTotal+=time-pausedAt;pausedAt=0;}
  const ctx=surface.getContext('2d');if(!ctx)return;
  const started=performance.now(),scale=dpr();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,surface.width,surface.height);
  ctx.setTransform(scale,0,0,scale,-surfaceBox.left*scale,-surfaceBox.top*scale);
  for(const record of records.values()){drawImpact(ctx,record,Math.max(0,time-record.started-(pauseTotal-record.pauseStart)));draws++;fragmentDraws+=record.pieces.length;}
  if(drawSamples.length===512)drawSamples.shift();drawSamples.push(performance.now()-started);
  frameId=requestAnimationFrame(frame);
}
const schedule=()=>{if(!frameId&&surface&&records.size)frameId=requestAnimationFrame(frame);};
const remove=(id:number)=>{records.delete(id);if(!records.size&&surface){if(frameId)cancelAnimationFrame(frameId);frameId=0;surface.getContext('2d')?.clearRect(0,0,surface.width,surface.height);grownBounds=null;fitSurface();}};

export function createCanvasPresentation(){
  return {
    start(phase:any){mode=phase.presentation;draws=fragmentDraws=fallbacks=surfaceResizes=maxSurfaceBytes=0;grownBounds=null;fitSurface();drawSamples=[];samples=[];lastSample=performance.now();},
    get mode(){return mode;},
    sample(){const time=performance.now();if(time-lastSample<3000||samples.length>=4)return;lastSample=time;
      samples.push({atMs:Math.round(time),registeredEffects:records.size,surfaceBox:{...surfaceBox},surfaceBytes:surface?surface.width*surface.height*4:0,dpr:dpr(),proxyEffects:document.querySelectorAll('.replay-canvas-proxy').length,
        originalEffects:document.querySelectorAll('.impact-effect.explosion:not(.replay-canvas-proxy),.impact-effect.shatter:not(.replay-canvas-proxy)').length});},
    read(){const sorted=[...drawSamples].sort((a,b)=>a-b);return {mode,draws,fragmentDraws,fallbacks,registered:records.size,sourceImages:images.size,imageBytes,textures:textures.size,textureBytes,preparationCount,
      hullLoads,hullEvictions,retainedHullUsers:hullUsers.size,
      surfaceBytes:surface?surface.width*surface.height*4:0,surfaceBox:{...surfaceBox},fieldWidth,fieldHeight,surfaceResizes,maxSurfaceBytes,dpr:dpr(),drawWorkP95Ms:sorted.length?+sorted[Math.ceil(sorted.length*.95)-1].toFixed(3):null,
      failures:[...failures],samples,coverage:'Original full-resolution hull images, original seeded polygon/flight props, original fire/smoke CSS artwork and timing. One shared DPR-sized Canvas; no effect, piece, audio or simulation omission. SVG prepares static fire/smoke textures only; animation and clipping are Canvas draws. DOM samples do not prove pixel visibility.'};},
    stop(){resourceGeneration++;if(frameId)cancelAnimationFrame(frameId);frameId=0;records.clear();for(const t of readyTextures.values())t.canvas.width=t.canvas.height=0;
      if(surface)surface.width=surface.height=0;
      textures.clear();readyTextures.clear();images.clear();readyImages.clear();hullUsers.clear();imageBytes=textureBytes=preparationCount=hullLoads=hullEvictions=0;failures=[];mode='original';pausedAt=pauseTotal=0;grownBounds=null;
      return {activeDrawFrame:!!frameId,registeredEffects:records.size,sourceImages:images.size,textureEntries:textures.size,cacheBytes:imageBytes+textureBytes,surfaceBytes:surface?surface.width*surface.height*4:0};},
  };
}
export function ReplayCanvasSurface(){
  const ref=useRef<HTMLCanvasElement>(null);
  useLayoutEffect(()=>{
    const canvas=ref.current!;surface=canvas;
    const resize=()=>{const parent=canvas.parentElement!;fieldWidth=parent.clientWidth;fieldHeight=parent.clientHeight;grownBounds=null;fitSurface();schedule();};
    resize();const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement!);
    return()=>{observer.disconnect();if(frameId)cancelAnimationFrame(frameId);frameId=0;if(surface===canvas)surface=null;canvas.width=canvas.height=0;records.clear();};
  },[]);
  return <canvas ref={ref} className="replay-effects-surface" aria-hidden="true" style={{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:2}}/>;
}

export function ReplayCanvasImpact({effect,debris,original,frozenMs,boundedProof=false}:{effect:any;debris:any;original:React.ReactNode;frozenMs?:number;boundedProof?:boolean}){
  const style=usePaintedShipStyle(effect.sprite,effect.debrisColor,effect.shipStage??1);
  const url=String(style.backgroundImage).replace(/^url\(["']?|["']?\)$/g,''),diameter=explosionDiameter(effect.debrisSize??58);
  const [loaded,setLoaded]=useState<any>(()=>resources(url,diameter));
  const started=useRef(performance.now()),proof=useRef<HTMLCanvasElement>(null);
  const pieces=useMemo(()=>piecesFrom(debris),[debris]);
  const selected=frozenMs!==undefined?'canvas':mode;
  useEffect(()=>{
    let active=true;const release=retainCanvasImpactHull(url);
    void prepareCanvasImpactResources(url,diameter).then(([hull,fire,smoke])=>{if(active)setLoaded({hull,fire,smoke});},error=>{if(active)recordFailure(error);});
    return()=>{active=false;release();};
  },[url,diameter]);
  const canvasSelected=selected==='canvas'||selected==='bounded';
  const available=loaded?.hull?.src===url&&canvasSelected;
  useLayoutEffect(()=>{
    if(!available)return;
    const record={effect,pieces,assets:loaded,started:started.current,pauseStart:pauseTotal,bounds:null as any};
    record.bounds=impactBounds(record);
    if(frozenMs!==undefined){const canvas=proof.current!,local={...record,effect:{...effect,x:170,y:112}};
      const box=boundedProof?fieldBounds(impactBounds(local),340,225):{left:0,top:0,right:340,bottom:225};
      const width=box.right-box.left,height=box.bottom-box.top,scale=dpr();canvas.width=width*scale;canvas.height=height*scale;
      canvas.style.position='absolute';canvas.style.left=`${box.left}px`;canvas.style.top=`${box.top}px`;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
      canvas.setAttribute('data-proof-origin-x',String(box.left));canvas.setAttribute('data-proof-origin-y',String(box.top));
      const ctx=canvas.getContext('2d')!;ctx.setTransform(scale,0,0,scale,-box.left*scale,-box.top*scale);drawImpact(ctx,local,frozenMs);return;}
    records.set(effect.id,record);fitSurface();schedule();return()=>remove(effect.id);
  },[available,loaded,effect,pieces,frozenMs,boundedProof]);
  useEffect(()=>{if(canvasSelected&&!available)fallbacks++;},[canvasSelected,available]);
  if(frozenMs!==undefined)return <canvas ref={proof} data-raster-proof={frozenMs} style={{width:340,height:225}}/>;
  return available?<div className={`impact-effect ${effect.kind} replay-canvas-proxy`} style={{left:effect.x,top:effect.y,width:diameter,height:diameter,marginLeft:-diameter/2,marginTop:-diameter/2}} aria-hidden="true"/>:<>{original}</>;
}
