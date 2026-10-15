import {useEffect,useRef,useState} from 'react';
import {InsectoidsEngine} from '../src/pages/insectoidsEngine';
import {insectoidRoster,insectoidAsset} from '../src/pages/insectoidRoster';
import {drawAnatomicalWeapons,drawInsectEye,prepareInsectEye,type EyeAtlas} from './insectOrganicRenderer';
import {GameAudio} from '../src/pages/gameAudio';
import './insectoidsPreview.css';

type Assets={enemies:HTMLImageElement[];hull:HTMLImageElement;weapon:HTMLImageElement;eye:EyeAtlas;backdrop:HTMLImageElement;player:HTMLImageElement;viruses:HTMLCanvasElement[];flashes:HTMLCanvasElement[]};
const loadImage=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Grafik konnte nicht geladen werden.'));i.src=src;});
const canvas=(w:number,h:number)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const phaseLabel=(e:InsectoidsEngine)=>e.phase==='round'?`Vorrunde ${e.round}/9`:e.phase==='boss-warning'?'SIGNAL: VIRIDIAN HARVESTER':e.phase==='boss'?'SPECIAL BOSS':e.phase==='boss-explosion'?'REAKTOR ZERSTÖRT':e.phase==='heart'?'EXTRA-LIFE EINSAMMELN':e.phase==='bonus'?'BONUSRUNDE':e.phase==='victory'?'MISSION ABGESCHLOSSEN':'VERSUCH BEENDET';

function virusSprite(frame:number){
 const c=canvas(40,40),x=c.getContext('2d')!;x.translate(20,20);x.rotate(frame*Math.PI/12);
 x.strokeStyle='#9aff5f';x.fillStyle='#d7ff99';x.lineWidth=2;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;x.beginPath();x.moveTo(Math.cos(a)*6,Math.sin(a)*6);x.lineTo(Math.cos(a)*12,Math.sin(a)*12);x.stroke();x.beginPath();x.arc(Math.cos(a)*12,Math.sin(a)*12,2.5,0,Math.PI*2);x.fill();}
 const g=x.createRadialGradient(-2,-3,1,0,0,8);g.addColorStop(0,'#deffa2');g.addColorStop(.45,'#77cd45');g.addColorStop(1,'#275329');x.fillStyle=g;x.beginPath();x.arc(0,0,7,0,Math.PI*2);x.fill();x.fillStyle='#31562c';x.beginPath();x.arc(2,2,2,0,Math.PI*2);x.fill();return c;
}

function explosionSprite(i:number){const c=canvas(192,192),x=c.getContext('2d')!,g=x.createRadialGradient(96,96,2,96,96,92);g.addColorStop(0,'#fff9cd');g.addColorStop(.16,'#edff8d');g.addColorStop(.33,i===1?'#acff39':'#ffc15c');g.addColorStop(.58,'#e65329bb');g.addColorStop(1,'#8f271000');x.fillStyle=g;x.fillRect(0,0,192,192);return c;}

/** One canvas and RAF. React only receives small HUD/phase updates, at <=5Hz. */
export default function InsectoidsPreview(){
 const view=useRef<HTMLCanvasElement>(null),engine=useRef<InsectoidsEngine|null>(null),assets=useRef<Assets|null>(null),audio=useRef<GameAudio|null>(null);
 const [ready,setReady]=useState(false),[loadingError,setLoadingError]=useState(''),[running,setRunning]=useState(false),[run,setRun]=useState(0),[weapon,setWeapon]=useState(3),[sound,setSound]=useState(true);
 const [hud,setHud]=useState({label:'',score:0,hearts:3,paused:false,fault:'',end:false});
 const [gallery,setGallery]=useState(false);
 useEffect(()=>{let live=true;
  const urls=insectoidRoster.map(d=>insectoidAsset(d.id));
  void Promise.all([Promise.all(urls.map(loadImage)),loadImage('/ships/bosses/insect/viridian-harvester.webp'),loadImage('/ships/bosses/insect/anatomical-stinger.webp'),loadImage('/ships/evolution/ship_01_stage_1.png'),loadImage('/ships/bosses/insect/reactor-eye-mantis.webp'),loadImage('/ships/bosses/insect/earth-backdrop.webp')]).then(([enemies,hull,weapon,player,eye,backdrop])=>{if(live){assets.current={enemies,hull,weapon,player,eye:prepareInsectEye(eye,hull,canvas),backdrop,viruses:Array.from({length:12},(_,i)=>virusSprite(i)),flashes:Array.from({length:3},(_,i)=>explosionSprite(i))};setReady(true);}}).catch(()=>{if(live)setLoadingError('Grafiken laden fehlgeschlagen. Bitte neu laden.');});
  return()=>{live=false;assets.current?.eye.dispose();assets.current=null;};
 },[]);
 const start=(boss=false)=>{
  const w=Math.min(window.innerWidth,1000),h=Math.max(280,window.innerHeight-76);
  const e=new InsectoidsEngine(w,h,weapon,boss);engine.current=e;
  audio.current?.close();audio.current=null;
  if(sound){const a=new GameAudio();audio.current=a;void a.start().catch(()=>{});e.audio=(kind,pan)=>{try{if(kind==='player')a.play('laser',e.weaponLevel);else if(kind==='hit')a.play('enemyHit');else if(kind==='explosion')a.play('explosion');else if(kind==='pickup')a.play('pickup');else a.playBossWeapon(kind,kind==='siege'?28:kind==='heavy'?20:kind==='plasma'?10:6,1,pan);}catch{/* Audio is optional; simulation continues. */}};}
  setHud({label:phaseLabel(e),score:0,hearts:3,paused:false,fault:'',end:false});setRunning(true);setRun(n=>n+1);
 };
 useEffect(()=>{
  if(!running||!view.current||!assets.current||!engine.current)return;
  const c=view.current,a=assets.current,e=engine.current,ctx=c.getContext('2d',{alpha:false});if(!ctx)return;
  const background=canvas(1,1);let frame=0,last=0,acc=0,hudClock=0,dead=false,renderFailed=false;let pointerId:number|null=null;
  const resize=()=>{const box=c.getBoundingClientRect();e.resize(Math.max(160,box.width),Math.max(240,box.height));const dpr=Math.min(1.5,window.devicePixelRatio||1);c.width=Math.round(e.width*dpr);c.height=Math.round(e.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    background.width=Math.ceil(e.width);background.height=Math.ceil(e.height);const bg=background.getContext('2d')!;bg.fillStyle='#040c18';bg.fillRect(0,0,e.width,e.height);const planet=Math.min(e.width*.92,e.height*.62);bg.globalAlpha=.16;bg.drawImage(a.backdrop,(e.width-planet)/2,e.height*.28,planet,planet);bg.globalAlpha=1;bg.fillStyle='#59798c';for(let i=0;i<46;i++){const x=((i*137+31)%997)/997*e.width,y=((i*251+23)%991)/991*e.height;bg.fillRect(x,y,i%7===0?1.5:1,1);}
  };
  resize();
  const sync=()=>setHud({label:phaseLabel(e),score:e.score,hearts:e.hearts,paused:e.paused,fault:e.fault,end:e.phase==='victory'||e.phase==='defeat'});
  const pointer=(ev:PointerEvent)=>{if(ev.pointerType!=='mouse'&&ev.pointerId!==pointerId)return;if(ev.pointerType!=='mouse')ev.preventDefault();const r=c.getBoundingClientRect();e.point(ev.clientX-r.left,ev.clientY-r.top-(ev.pointerType==='mouse'?0:68));};
  const down=(ev:PointerEvent)=>{if(pointerId!==null)return;pointerId=ev.pointerId;c.setPointerCapture(ev.pointerId);pointer(ev);};
  const up=(ev:PointerEvent)=>{if(pointerId===ev.pointerId)pointerId=null;};
  const hidden=()=>{if(document.hidden){e.pause();audio.current?.setPaused(true);last=0;acc=0;sync();}};
  const key=(ev:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key)){ev.preventDefault();const dx=ev.key==='ArrowLeft'?-55:ev.key==='ArrowRight'?55:0,dy=ev.key==='ArrowUp'?-55:ev.key==='ArrowDown'?55:0;e.point(e.target.x*e.width+dx,e.target.y*e.height+dy);}else if(ev.key==='Escape'){e.pause();sync();}};
  const render=()=>{
   ctx.drawImage(background,0,0,e.width,e.height);
   if(e.phase==='round')for(const n of e.enemies)if(n.active){ctx.drawImage(a.enemies[n.type],n.x-n.radius,n.y-n.radius,n.radius*2,n.radius*2);}
   if(e.phase==='bonus')for(const n of e.enemies)if(n.active){ctx.fillStyle='#e4c77a';ctx.beginPath();ctx.moveTo(n.x,n.y-14);ctx.lineTo(n.x+10,n.y);ctx.lineTo(n.x,n.y+14);ctx.lineTo(n.x-10,n.y);ctx.closePath();ctx.fill();}
   const b=e.boss;
   if(b&&e.phase!=='boss-warning'){
    ctx.save();if(e.phase==='boss-explosion')ctx.globalAlpha=Math.max(0,1-e.phaseTime/3800);
    ctx.drawImage(a.hull,b.x-b.width/2,b.y-b.height/2,b.width,b.height);
    drawAnatomicalWeapons(ctx,b,a.weapon,e.phase==='boss-explosion');
    drawInsectEye(ctx,b,a.eye,e.time);
    const exposed=b.turrets.every(t=>t.health<=0);
    for(let i=0;i<b.turrets.length;i++){const s=b.turrets[i],g=b.weaponSlots![i],px=b.x+(g.sourceX/b.config.sourceWidth-.5)*b.width,py=b.y+(g.sourceY/b.config.sourceHeight-.5)*b.height;
      if(s.health>0){ctx.fillStyle='#14221e';ctx.fillRect(px-13,py-18,26,3);ctx.fillStyle=s.health/s.maxHealth>.4?'#a8e443':'#ff6b48';ctx.fillRect(px-13,py-18,26*s.health/s.maxHealth,3);}
      if(b.insect!.telegraphGun===i&&s.health>0){ctx.strokeStyle='#efff8a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,9+3*Math.sin(e.time*.012),0,Math.PI*2);ctx.stroke();}
    }
    if(exposed){ctx.fillStyle='#1b2922';ctx.fillRect(b.x-b.width*.3,b.y-b.height*.5-13,b.width*.6,4);ctx.fillStyle='#b4ec4a';ctx.fillRect(b.x-b.width*.3,b.y-b.height*.5-13,b.width*.6*b.health/b.maxHealth,4);}
    ctx.restore();
    if(e.phase==='boss-explosion'&&e.phaseTime<2500){const pulse=e.phaseTime%500;if(pulse<300){const stage=Math.floor(e.phaseTime/500),size=Math.min(b.width*.8,220)*(stage===4?1:.65),offset=stage%2?-.15:.15;ctx.globalAlpha=1-pulse/300;ctx.drawImage(a.flashes[stage%3],b.x+b.width*offset-size/2,b.y-size/2,size,size);ctx.globalAlpha=1;}}
   }
   for(const p of e.shots){if(!p.active)continue;const s=p.shot;
    if(p.hostile&&s.projectileType==='virus'){const sprite=a.viruses[Math.floor(e.time/90)%12];ctx.drawImage(sprite,s.x-13,s.y-13,26,26);}
    else if(p.hostile){ctx.fillStyle=s.weaponColor??'#b8ff3c';ctx.beginPath();ctx.arc(s.x,s.y,s.renderRadius??s.radius,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f4ffd2';ctx.beginPath();ctx.arc(s.x-2,s.y-2,Math.max(2,s.radius*.4),0,Math.PI*2);ctx.fill();}
    else{ctx.fillStyle='#efe5b2';ctx.fillRect(s.x-1.5,s.y-9,3,18);}
   }
   for(const p of e.sparks)if(p.active){ctx.globalAlpha=Math.max(0,p.life/p.total);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;
   if(e.phase==='heart'){const x=e.width*.5,y=e.height*.66+Math.sin(e.time*.003)*5;ctx.strokeStyle='#f8b2aa';ctx.fillStyle='#ef726c';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.stroke();ctx.font='26px sans-serif';ctx.textAlign='center';ctx.fillText('♥',x,y+9);}
   if(e.hearts>0&&!(e.invulnerable>0&&Math.floor(e.time/100)%2)){const x=e.player.x*e.width,y=e.player.y*e.height;ctx.fillStyle='#80bcf0';ctx.beginPath();ctx.moveTo(x-4,y+22);ctx.lineTo(x,y+34+Math.sin(e.time*.07)*3);ctx.lineTo(x+4,y+22);ctx.fill();ctx.drawImage(a.player,x-32,y-32,64,64);}
   if(e.phase==='boss-warning'){ctx.textAlign='center';ctx.fillStyle='#d9f99a';ctx.font='bold 16px system-ui';ctx.fillText('SPECIAL BOSS',e.width/2,e.height*.32);ctx.font='14px system-ui';ctx.fillText('VIRIDIAN HARVESTER',e.width/2,e.height*.32+28);}
  };
  const tick=(now:number)=>{if(dead)return;
   try{
    if(last&&!e.paused){const elapsed=now-last;if(elapsed>500){e.pause('Längere Unterbrechung erkannt. Dein Lauf bleibt hier pausiert.');acc=0;}else{acc+=elapsed;let steps=0;while(acc>=16.6667&&steps<8){e.step(16.6667);acc-=16.6667;steps++;}if(acc>250){e.pause('Die Darstellung war zu langsam. Dein Lauf bleibt erhalten.');acc=0;}}}
    last=now;if(!e.paused)renderFailed=false;if(!renderFailed)render();if(now-hudClock>200){hudClock=now;sync();}
   }catch{renderFailed=true;e.pause('Ein Darstellungsfehler wurde abgefangen. Der Lauf wurde nicht verlassen.');sync();}
   frame=requestAnimationFrame(tick);
  };
  c.addEventListener('pointerdown',down);c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);c.addEventListener('pointermove',pointer,{passive:false});document.addEventListener('visibilitychange',hidden);window.addEventListener('resize',resize);window.addEventListener('keydown',key);frame=requestAnimationFrame(tick);
  return()=>{dead=true;cancelAnimationFrame(frame);c.removeEventListener('pointerdown',down);c.removeEventListener('pointerup',up);c.removeEventListener('pointercancel',up);c.removeEventListener('pointermove',pointer);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('resize',resize);window.removeEventListener('keydown',key);background.width=background.height=0;e.dispose();audio.current?.close();audio.current=null;};
 },[running,run]);
 const leave=()=>{setRunning(false);engine.current=null;};
 const pause=()=>{const e=engine.current;if(!e)return;if(e.paused){e.resume();audio.current?.setPaused(false);}else{e.pause();audio.current?.setPaused(true);}setHud(h=>({...h,paused:e.paused,fault:e.fault}));};
 if(!running)return <main className="insect-menu"><section><p className="insect-eyebrow">TROJAN WOLF GAMES · PRIVATE TESTMISSION</p><h1>CRYPTOID<br/><em>EVOLUTION</em></h1><p>SPECIAL MISSION · VERDANT BREACH</p><p className="insect-intro">20 biomechanische Raumgegner. Neun Vorrunden mit Virenmunition. Beim Special-Boss öffnet sich das Facettenauge als Kernwaffe.</p><div className="insect-menu-controls"><label>Testwaffe<select value={weapon} onChange={e=>setWeapon(Number(e.target.value))}><option value={1}>L1 · Standard</option><option value={3}>L3 · Schnellere Teststrecke</option><option value={5}>L5 · Phasen schnell prüfen</option></select></label><label className="insect-check"><input type="checkbox" checked={sound} onChange={e=>setSound(e.target.checked)}/> Soundeffekte</label></div><button disabled={!ready} onClick={()=>start(false)}>{ready?'9 Vorrunden + Special-Boss spielen':'Grafiken werden vorbereitet …'}</button><button className="insect-secondary" disabled={!ready} onClick={()=>start(true)}>Boss direkt testen</button><button className="insect-secondary" onClick={()=>setGallery(!gallery)}>{gallery?'Gegnerübersicht schließen':'Die 20 Gegner ansehen'}</button>{loadingError&&<p role="alert">{loadingError}</p>}<p className="insect-fine">Eigenständiger Prototyp: eine vollständige Testmission. 49 weitere Special-Bosse folgen erst nach Stabilitäts- und Gerätetests. Keine Konten, Käufe oder dauerhaften Belohnungen. Mit Finger bewegen, das Schiff feuert automatisch. Am Computer: Maus oder Pfeiltasten.</p>{gallery&&<div className="insect-gallery">{insectoidRoster.map((d,i)=><figure key={d.id}><img src={assets.current?.enemies[i]?.src} alt={d.name}/><figcaption>{i+1}. {d.name}</figcaption></figure>)}</div>}</section></main>;
 return <main className="insect-game"><header><button onClick={leave} className="insect-home" aria-label="Zum Testmenü">⌂</button><span className="insect-mode-label">SPECIAL</span><b>{hud.hearts>0?'♥'.repeat(hud.hearts):'—'}</b><span className="insect-score"><small>SCORE</small>{hud.score.toLocaleString('de-DE')}</span><button onClick={pause}>{hud.paused?'Fortsetzen':'Pause'}</button></header><div className="insect-round-label" aria-live="polite">{hud.label}</div><canvas ref={view} aria-label="Special-Mission-Spielfeld, mit Finger oder Maus steuerbar"/>{(hud.paused||hud.end)&&<div className="insect-overlay"><section><h2>{hud.paused?'Pausiert':hud.label}</h2><p>{hud.fault||(hud.end?'Dieser Prototyp bleibt nach der Mission hier. Weitere Bossmissionen sind noch nicht freigeschaltet.':'Dein Lauf bleibt an dieser Stelle erhalten.')}</p>{hud.paused&&<button onClick={pause}>Fortsetzen</button>}<button onClick={leave}>Zum Testmenü</button></section></div>}</main>;
}
