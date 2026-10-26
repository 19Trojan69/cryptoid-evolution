// Local visual fixture, never an app route or production hook.
import {useState,useLayoutEffect,useRef,type CSSProperties} from 'react';
import GameHudStats from '../../frontend/src/pages/GameHudStats';
import {createRoot} from 'react-dom/client';
import GameRoute from '../../frontend/src/components/GameRoute';
import GameAccessGate from '../../frontend/src/components/GameAccessGate';
import SignIn from '../../frontend/src/components/SignIn';
import GameShipVisual from '../../frontend/src/pages/GameShipVisual';
import BossHealthView from '../../frontend/src/pages/BossHealthView';
import WeaponReloadNotice from '../../frontend/src/pages/WeaponReloadNotice';
import {createSectorBoss} from '../../frontend/src/pages/sectorBoss';
import {shipHullStyle} from '../../frontend/src/pages/shipFleet';
import {enemyHealthClearance} from '../../frontend/src/pages/enemyHealthClearance';
import {shipOverlayGeometry} from '../../frontend/src/pages/shipOverlayGeometry';
import type {ShipStage} from '../../frontend/src/pages/shipEvolution';
import '../../frontend/src/index.css';
import '../../frontend/src/fleetMenus.css';
import '../../frontend/src/cockpitMenus.css';
const params=new URLSearchParams(location.search),mode=params.get('mode'),stage=Number(params.get('stage')||1) as ShipStage,baseline=params.has('baseline');
(window as any).__launchBounds=shipOverlayGeometry(0,1).bounds;
function Notice(){const[extra,setExtra]=useState(false);const field=useRef<HTMLDivElement>(null);useLayoutEffect(()=>{const node=field.current;if(node)node.style.setProperty('--hud-bottom',`${node.querySelector('.game-hud')!.getBoundingClientRect().height}px`);},[]);(window as any).__extraNotice=()=>setExtra(true);return <GameRoute><main className="game-shell"><div className="game-field" ref={field} style={{'--hud-bottom':'82px'} as CSSProperties}>
 <header className="game-hud"><div className="hud-actions"><button className="game-control home-control">⌂</button></div><GameHudStats hearts={3} heartsHit={false} levelLabel="3" shards={12345} score={1234} block={1} locale="de"/><button className="game-control pause-control">Ⅱ</button></header>
 <div className="game-label">LEVEL 3 · MEME NEBULA · Block 1/9</div><span className="flight-indicator" style={{top:'calc(var(--hud-bottom) + 25px)'}}>Gruppe 1/4</span>
 {extra&&<div className="bonus-counter" style={{top:145}}>12/12 BONUSZIELE · KEIN FEINDFEUER</div>}
 {baseline?<div className="weapon-reloading" role="status">Nachladen… · Doppellaser</div>:<WeaponReloadNotice layoutKey={String(extra)}>Nachladen… · Doppellaser</WeaponReloadNotice>}
 </div></main></GameRoute>;}
function Gallery(){return <main className="game-field qa-field"><style>{`.qa-field{width:100%;height:auto;max-width:none;min-height:100vh;overflow:visible;background:#061523;padding:18px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.qa-cell{height:230px;position:relative;background:#0b2233;border:1px solid #25445a;border-radius:8px;overflow:visible}.qa-cell h2{font:12px monospace;margin:10px;color:#ffe1a5}.qa-cell .asteroid{left:50%;top:106px;width:96px;height:96px;--flame-length:31%;--visual-bank:8deg;transform:translate(-50%,-50%)}.qa-cell .material-hull::after{display:none}`}</style>
 {Array.from({length:20},(_,sprite)=><section className="qa-cell" key={sprite} data-sprite={sprite}><h2>{sprite} · stage {stage}</h2><div className={`asteroid asteroid-${sprite%4>1?'large':'small'} cryptoid cryptoid-${['light','medium','heavy','elite'][sprite%4]}`} style={{...shipHullStyle(sprite,true),...enemyHealthClearance(sprite,stage)}}><GameShipVisual sprite={sprite} color="grey" stage={stage} variant="enemy"/><span className="health-bar" role="progressbar"><b style={{width:'64%'}}/></span></div></section>)}
 {[1,12,30,50].map(id=>{const boss=createSectorBoss(id*10,230,90,900);return <section key={'boss'+id} className="qa-cell" data-boss={id}><div className="asteroid sector-boss" style={{width:boss.width,height:boss.height}}><BossHealthView boss={boss}/><div style={{position:'absolute',top:80,width:boss.width,height:boss.height}}><BossHealthView boss={{...boss,turrets:boss.turrets.map(g=>({...g,health:0}))}}/></div></div></section>;})}
 </main>;}
createRoot(document.getElementById('root')!).render(mode==='gallery'?<Gallery/>:mode==='notice'?<Notice/>:mode==='signin'?<div className="landing-shell"><SignIn onSignIn={()=>{}} onModalClose={()=>{}}/></div>:<GameRoute><GameAccessGate pending error={null} onRetry={()=>{}}/></GameRoute>);
