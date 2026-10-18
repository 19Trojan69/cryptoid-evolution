import React, { memo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import GamePage, { shipDebris } from '../../src/pages/GamePage';
import { primeGameAudio } from '../../src/pages/gameAudio';
import { MusicPlayer, handoffGameMusic } from '../../src/pages/musicPlayback';
import { readMusicVolume } from '../../src/pages/musicPreferences';
import { createDeviceReplay } from './controller.mjs';
import { LIFECYCLE_PHASES } from './lifecyclePhases.mjs';
import { EFFECT_PHASES, EFFECT_PRESENTATION_CSS, createEffectPresentationProbe } from './effectPresentation.mjs';
import { FRAGMENT_PHASES, FRAGMENT_CROP_CSS } from './fragmentCrop.mjs';
import { WORKLOAD_PHASES, createEffectWorkload } from './effectWorkload.mjs';
import { LAYER_PHASES, LAYER_CSS, createEffectLayersProbe } from './effectLayers.mjs';

declare global { interface Window { __cryptoidDeviceReplay: any; __cryptoidBlockedRequests: string[]; } }
const StableGame = memo(GamePage);
const build = __CRYPTOID_REPLAY_BUILD__;
const lifecycle = __CRYPTOID_LIFECYCLE__;
const effects = __CRYPTOID_EFFECTS__;
const fragments = __CRYPTOID_FRAGMENTS__;
const workload = __CRYPTOID_WORKLOAD__;
const layers = __CRYPTOID_LAYERS__;
const totalSeconds = layers ? 53 : workload ? 58 : effects ? 68 : lifecycle ? 118 : 88;
window.__cryptoidBlockedRequests = [];
const nativeFetch = window.fetch.bind(window);
const assetRoots = /^\/(?:ships|audio|effects|planets|fonts|cards|home|badges|emblems|galaxy|pilots|ranks|assets)\//;
const allowAsset = (input: RequestInfo | URL) => {
  const value = input instanceof Request ? input.url : String(input);
  const url = new URL(value, location.href);
  return url.origin === location.origin && assetRoots.test(url.pathname);
};
window.fetch = (input,init) => {
  const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
  if (!allowAsset(input) || method.toUpperCase() !== 'GET') {
    window.__cryptoidBlockedRequests.push('fetch request blocked');
    return Promise.reject(new Error('Kontozugriff im Gerätetest gesperrt'));
  }
  // The isolated preview's Vercel protection cookie is needed for static assets.
  // No cross-origin or account/API request is permitted by allowAsset above.
  return nativeFetch(input,{...init,credentials:'same-origin'});
};
// The application API is also removed by the bundler. This denies any stray
// browser-level XHR before it can make a request.
XMLHttpRequest.prototype.open = function() {
  window.__cryptoidBlockedRequests.push('XHR request blocked');
  throw new Error('Kontozugriff im Gerätetest gesperrt');
};

function FragmentProof({close}:{close:()=>void}) {
  return <main className="fragment-proof">
    <style>{FRAGMENT_CROP_CSS+`
      .fragment-proof{padding:24px;background:#081e31;color:#eefaff;font-family:system-ui}
      .fragment-proof-pair{display:flex;gap:12px}
      .fragment-proof-cell{width:340px;text-align:center}
      .fragment-proof-stage{height:225px;width:340px;position:relative;overflow:hidden;background:#081e31}
      .fragment-proof .impact-effect{left:170px!important;top:112px!important}
      .fragment-proof .impact-effect::before,.fragment-proof .impact-effect::after{content:none}
      .fragment-proof .scattered-debris-piece{animation-delay:calc(var(--fragment-delay) - var(--proof-time))!important;animation-play-state:paused!important}
    `}</style>
    <h1>Trümmergeometrie · Sichtprüfung</h1><button onClick={close}>Zurück zum Gerätetest</button>
    {[.35,.9,1.6].map((time,index)=><section key={time}>
      <p>{time} s · {index===1?'acht':'vier'} Teile</p><div className="fragment-proof-pair">
      {['original','crop'].map(mode=><div className="fragment-proof-cell" key={mode} data-replay-compositor={mode}>
        <b>{mode==='original'?'Original':'Begrenzte Fläche'}</b>
        <div className="fragment-proof-stage" data-proof-frame={`${index}-${mode}`} style={{'--proof-time':`${time}s`} as React.CSSProperties}>
          <div className="impact-effect explosion" style={{width:90,height:90,marginLeft:-45,marginTop:-45}}>
            {shipDebris({id:87,x:0,y:0,kind:'explosion',startedAt:0,sprite:0,debrisSize:72,debrisColor:'green',shipClass:index===1?'heavy':'light',debrisRotation:21,impactX:7,impactY:-12,velocityX:42,velocityY:-20} as any)}
          </div>
        </div></div>)}
      </div></section>)}
  </main>;
}

function App() {
  const [running,setRunning] = useState(false);
  const [progress,setProgress] = useState({label:'',remainingSeconds:totalSeconds});
  const [report,setReport] = useState<any>(null);
  const [copied,setCopied] = useState(false);
  const [copyFallback,setCopyFallback] = useState(false);
  const [sound,setSound] = useState(true);
  const [proof,setProof] = useState(false);
  const start = () => {
    setReport(null);setCopied(false);setCopyFallback(false);
    localStorage.setItem('cryptoid_language','de');
    localStorage.setItem('cryptoid_home_music',sound?'on':'off');
    if(sound){primeGameAudio();const music=new MusicPlayer('/audio/battle-orbit.mp3',readMusicVolume());void music.play();handoffGameMusic(music);}
    const device={userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight},
      pixelRatio:devicePixelRatio,visibility:document.visibilityState,sound};
    window.__cryptoidBlockedRequests.length=0;
    const presentation=effects?createEffectPresentationProbe({document}):null;
    const paths=workload?createEffectWorkload({document}):null;
    const layerProbe=layers?createEffectLayersProbe({document}):null;
    window.__cryptoidDeviceReplay=createDeviceReplay({...(lifecycle?{phases:layers?LAYER_PHASES:workload?WORKLOAD_PHASES:fragments?FRAGMENT_PHASES:effects?EFFECT_PHASES:LIFECYCLE_PHASES}:{}),onProgress:setProgress,onFinish:result=>{
      clearTimeout(mountWatchdog);
      presentation?.stop();
      paths?.stop();
      layerProbe?.stop();
      if(lifecycle)result.coverage.fixtures='Controlled lives/one-hit enemies and automatic aiming; real shot collisions, explosions and normal block transitions; no scored/account run';
      if(effects)result.coverage.presentation=fragments?'Same real collision/refill workload. Middle phase bounds each fragment to its original polygon cell with the full-resolution hull offset inside it; same polygon, pivot, trajectory, count, fire, smoke, audio and timing. DOM samples do not prove pixel presentation.':'Same real collision/refill workload in all three phases. Middle phase adds will-change hints only; original CSS artwork, filters, fragments and timings remain. DOM samples do not prove pixel presentation.';
      if(workload)result.coverage.presentation='Cause-isolation only: normal explosion/shatter DOM and explosion sound requests are omitted independently in designated phases. Simulation effects, hull illumination, original other visuals, music, shot sounds, haptics and 34 ms cap continue. First 1500 ms of each phase settle prior work and are excluded from measurements; clock counts only full frame intervals after that cutoff. No omissions are proposed for the game.';
      if(layers)result.coverage.presentation='Layer cause-isolation only: normal explosion/shatter fire/smoke pseudo-elements and fragment subtrees are omitted independently in designated phases. Original effect wrappers, simulation effects, hull illumination, all original audio, other graphics, haptics, mobile paint cadence and 34 ms cap continue. First 1500 ms of each phase settle prior work and are excluded; only full frame intervals after that cutoff are measured. DOM/CSS samples do not prove pixel presentation. No omissions are proposed for the game.';
      setReport({...result,build,device,blockedRequests:[...window.__cryptoidBlockedRequests]});setRunning(false);
    }});
    if(presentation)window.__cryptoidDeviceReplay.presentation=presentation;
    if(paths)window.__cryptoidDeviceReplay.workload=paths;
    if(layerProbe)window.__cryptoidDeviceReplay.layers=layerProbe;
    const mountWatchdog=setTimeout(()=>{
      if(!window.__cryptoidDeviceReplay.active)window.__cryptoidDeviceReplay.abort('fixture-not-started');
    },5000);
    setRunning(true);
  };
  const copy = async () => {
    try{await navigator.clipboard.writeText(JSON.stringify(report,null,effects||workload||layers?0:2));setCopied(true);}
    catch{setCopyFallback(true);}
  };
  return proof ? <FragmentProof close={()=>setProof(false)}/> : running ? <>
    {effects&&<style>{fragments?FRAGMENT_CROP_CSS:EFFECT_PRESENTATION_CSS}</style>}
    {layers&&<style>{LAYER_CSS}</style>}
    <div className="device-replay-game"><BrowserRouter><StableGame/></BrowserRouter></div>
    <div className="device-replay-progress"><span>{progress.label}<br/>{progress.remainingSeconds} s</span>
      <button onClick={()=>window.__cryptoidDeviceReplay.abort('stopped')}>Beenden</button></div>
  </> : <main className="device-replay-panel">
    <small>CRYPTOID EVOLUTION · GERÄTETEST</small>
    <h1>{report?'Messung beendet':'Kurzer automatischer Test'}</h1>
    {!report ? <>
      <p>Der Test läuft {layers?'rund 55 Sekunden':workload?'rund eine Minute':effects?'rund 70 Sekunden':lifecycle?'rund zwei Minuten':'rund 90 Sekunden'} selbstständig. Bitte das Fenster geöffnet lassen.</p>
      <p>{layers?'Feuer/Rauch und Trümmer werden kurz einzeln und zusammen ausgeblendet. Das ist für diesen Vergleich beabsichtigt. Am Anfang und Ende erscheint die vollständige Explosion, der Klang bleibt durchgehend an. Bitte achte auf die sichtbaren Effekte und das Spieltempo. Du brauchst nichts zu steuern.':workload?'Explosionsbild und Explosionsklang werden einzeln kurz ausgeschaltet. Fehlende Explosionen oder ein fehlender Explosionsklang sind in diesen Testphasen beabsichtigt. Am Anfang und Ende läuft beides. Du brauchst nichts zu steuern.':fragments?'Drei gleiche Zerstörungsphasen vergleichen die Darstellung der Trümmer. In der mittleren Phase werden ihre Zeichenflächen enger begrenzt. Bitte achte auf Feuer, Trümmer und das Spieltempo. Du brauchst nichts zu steuern.':effects?'Drei gleiche Zerstörungsphasen vergleichen die Explosionsdarstellung. Die mittlere Phase prüft eine andere Verarbeitung der Animationsebenen. Bitte achte darauf, ob Feuer und Trümmer sichtbar sind. Du brauchst nichts zu steuern.':lifecycle?'Gegnerzerstörungen, Explosionen und Blockwechsel werden automatisch geprüft. Du brauchst nichts zu steuern.':'Einzel- und Doppelschüsse sowie das Schild werden in festen Situationen verglichen.'}</p>
      <p>Es ist kein Spielkonto nötig. Dein normaler Spielstand wird nicht geladen.</p>
      <label><input type="checkbox" checked={sound} disabled={workload||layers} onChange={e=>setSound(e.target.checked)}/> Mit Musik und Soundeffekten</label>
      <button onClick={start}>Test starten</button>
      {fragments&&<button onClick={()=>setProof(true)}>Darstellung vergleichen</button>}
    </> : <>
      <p>{report.completed?'Der automatische Test ist vollständig durchgelaufen.':'Der Test wurde unterbrochen. Ein vollständiger Lauf braucht ein geöffnetes Fenster.'}</p>
      <p>Bitte den Bericht kopieren und hier im Chat einfügen. Er enthält keine Kontodaten.</p>
      <button onClick={copy}>{copied?'Bericht kopiert':'Bericht kopieren'}</button>
      <button onClick={()=>{const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Cryptoid_Geraetetest.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>Bericht herunterladen</button>
      <details open={copyFallback}><summary>Bericht ansehen</summary><textarea readOnly value={JSON.stringify(report,null,2)} onFocus={e=>e.target.select()} aria-label="Testbericht zum Kopieren"/></details>
      <button onClick={start}>Erneut starten</button>
    </>}
    <footer>Testversion · {build.gameCommit.slice(0,7)} · {build.id}</footer>
  </main>;
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)window.__cryptoidDeviceReplay?.abort('backgrounded');});
window.addEventListener('pagehide',()=>window.__cryptoidDeviceReplay?.abort('pagehide'));
window.addEventListener('error',()=>window.__cryptoidDeviceReplay?.abort('javascript-error'));
window.addEventListener('unhandledrejection',()=>window.__cryptoidDeviceReplay?.abort('unhandled-rejection'));
createRoot(document.getElementById('root')!).render(<App/>);
