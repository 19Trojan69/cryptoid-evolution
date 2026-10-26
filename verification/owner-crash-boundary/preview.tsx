// Local verification only. No SDK, service/account requests or real gameplay.
import { useLayoutEffect, useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import GameRoute from '../../frontend/src/components/GameRoute';
import { installOwnerLifecycleCapture } from '../../frontend/src/lib/ownerLifecycleCapture.mjs';
import { ownerLifecycleEvidence } from '../../frontend/src/lib/ownerLifecycleEvidence.mjs';
import previous from '../../frontend/scripts/fixtures/ownerLifecycleCapture-6fe93a5.mjs.txt?raw';
import { createOwnerFlightRecorder } from '../../frontend/src/pages/ownerFlightRecorder';
import { readCrashTails } from '../../frontend/src/pages/crashTail';
import { exportOwnerFullSession } from '../../frontend/src/pages/stabilityReport.mjs';
const params=new URLSearchParams(location.search),home=params.has('home'),published=params.has('published');
history.replaceState(null,'',home?'/':'/game');
const build={sourceCommit:'a'.repeat(40),sourceTree:'b'.repeat(40),workingTreeDirty:false};
const install=published?new Function('evidence',previous.replace("import { ownerLifecycleEvidence as evidence } from './ownerLifecycleEvidence.mjs';",'').replace('export function installOwnerLifecycleCapture','function installOwnerLifecycleCapture')+';return installOwnerLifecycleCapture;')(ownerLifecycleEvidence):installOwnerLifecycleCapture;
let authorized=true;
const fixture=window as typeof window & {__crashFixture:Record<string,unknown>};
fixture.__crashFixture={report:()=>ownerLifecycleEvidence.report(window),tails:()=>readCrashTails(window),revoke:()=>{authorized=false;},export:async()=>{const id=readCrashTails(window).sessions[0]?.id;return JSON.parse(await (await exportOwnerFullSession(async()=>({canAdmin:true}),()=>window,id)).text());}};
function Fixture(){
 const [started,start]=useState(false),[paused,pause]=useState(false);
 const pausedRef=useRef(paused);pausedRef.current=paused;
 useLayoutEffect(()=>{install(()=>authorized,build);},[]);
 useEffect(()=>{
  if(home||!started)return;
  const context={sector:30,flight:0,phase:'ATTACK_CYCLE',encounter:'boss-fight',status:paused?'paused':'playing',enemies:0,attackers:0,returning:0,playerShots:8,enemyShots:3,effects:0,rocks:0,rockEffects:0,pickups:0};
  const probe=createOwnerFlightRecorder(true,()=>window,{build,fullContext:()=>context});
  let id=0,active=true;
  const tick=(at:number)=>{if(!active)return;context.status=pausedRef.current?'paused':'playing';probe?.begin(at,context);probe?.mark('boss-motion-and-weapons');probe?.sceneRequested();const render=probe?.sceneRenderBegin();probe?.sceneCommitted(render);probe?.end(at);id=requestAnimationFrame(tick);};
  id=requestAnimationFrame(tick);
  return()=>{active=false;cancelAnimationFrame(id);};
 },[started]);
 if(home)return <main className="landing-shell"><h1>Local Home</h1></main>;
 return <GameRoute>{started?<main className="game-shell" data-effects-paused={paused}><h1>Local game DOM</h1><div className="game-field"/><button onClick={()=>pause(v=>!v)}>Pause fixture</button></main>:<div className="game-access-overlay"><p>Local auth gate</p><button onClick={()=>start(true)}>Start fixture</button></div>}</GameRoute>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
