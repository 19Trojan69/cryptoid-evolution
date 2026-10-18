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
import { RASTER_PHASES, BOUNDED_PHASES, CAMPAIGN_PHASES, RASTER_CSS } from './rasterPhases.mjs';
import { createCanvasPresentation, ReplayCanvasImpact } from './CanvasImpact';
import { compareSurfacePixels } from './effectBounds.mjs';

declare global { interface Window { __cryptoidDeviceReplay: any; __cryptoidBlockedRequests: string[]; } }
const StableGame = memo(GamePage);
const build = __CRYPTOID_REPLAY_BUILD__;
const lifecycle = __CRYPTOID_LIFECYCLE__;
const effects = __CRYPTOID_EFFECTS__;
const fragments = __CRYPTOID_FRAGMENTS__;
const workload = __CRYPTOID_WORKLOAD__;
const layers = __CRYPTOID_LAYERS__;
const raster = __CRYPTOID_RASTER__;
const bounded = __CRYPTOID_BOUNDED__;
const campaign = __CRYPTOID_CAMPAIGN__;
const totalSeconds = campaign ? 73 : raster||layers ? 53 : workload ? 58 : effects ? 68 : lifecycle ? 118 : 88;
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

function RasterProof({close}:{close:()=>void}) {
  const [pixelResult,setPixelResult]=useState('');
  const comparePixels=()=>{
    const results=[];
    for(let i=0;i<3;i++){
      const full=document.querySelector(`[data-raster-stage="${i}-canvas"] canvas`) as HTMLCanvasElement|null;
      const crop=document.querySelector(`[data-raster-stage="${i}-bounded"] canvas`) as HTMLCanvasElement|null;
      if(!full||!crop||!full.hasAttribute('data-proof-origin-x')||!crop.hasAttribute('data-proof-origin-x')){setPixelResult('Bilder werden noch vorbereitet.');return;}
      const a=full.getContext('2d')!.getImageData(0,0,full.width,full.height).data,b=crop.getContext('2d')!.getImageData(0,0,crop.width,crop.height).data;
      const difference=compareSurfacePixels(a,full.width,full.height,b,crop.width,crop.height,Math.round(Number(crop.getAttribute('data-proof-origin-x'))*devicePixelRatio),Math.round(Number(crop.getAttribute('data-proof-origin-y'))*devicePixelRatio));
      results.push({frame:i,...difference});
    }
    setPixelResult(JSON.stringify({passed:results.every(r=>r.differentPixels===0),dpr:devicePixelRatio,frames:results}));
  };
  return <main className="raster-proof"><style>{RASTER_CSS+`
    .raster-proof{padding:24px;background:#081e31;color:#eefaff;font-family:system-ui}
    .raster-proof-pair{display:flex;gap:12px}.raster-proof-cell{width:340px;text-align:center}
    .raster-proof-stage{height:225px;width:340px;position:relative;overflow:hidden;background:#081e31}
    .raster-proof .impact-effect *,.raster-proof .impact-effect::before,.raster-proof .impact-effect::after{animation-delay:calc(var(--fragment-delay,0s) - var(--proof-time))!important;animation-play-state:paused!important}
  `}</style><h1>Original und Canvas · Sichtvergleich</h1><button onClick={close}>Zurück zum Gerätetest</button>
    {bounded&&<><button onClick={comparePixels}>Zeichenflächen vergleichen</button><output aria-label="Pixelvergleich">{pixelResult}</output></>}
    {[.18,.65,1.6].map((time,index)=>{
      const effect={id:87,x:170,y:112,kind:'explosion',startedAt:0,sprite:0,debrisSize:index===1?72:50,debrisColor:'green',shipClass:index===1?'heavy':'light',debrisRotation:21,impactX:7,impactY:-12,velocityX:42,velocityY:-20};
      const diameter=Math.min(480,Math.max(24,effect.debrisSize*1.25));
      const original=<div className="impact-effect explosion" style={{left:170,top:112,width:diameter,height:diameter,marginLeft:-diameter/2,marginTop:-diameter/2}}>{shipDebris(effect as any)}</div>;
      return <section key={time}><p>{time} s · {index===1?'acht':'vier'} Teile</p><div className="raster-proof-pair">
        <div className="raster-proof-cell"><b>Original</b><div className="raster-proof-stage" data-raster-stage={`${index}-original`} style={{'--proof-time':`${time}s`} as React.CSSProperties}>{original}</div></div>
        <div className="raster-proof-cell"><b>Canvas</b><div className="raster-proof-stage" data-raster-stage={`${index}-canvas`}><ReplayCanvasImpact effect={effect} debris={shipDebris(effect as any)} original={null} frozenMs={time*1000}/></div></div>
        {bounded&&<div className="raster-proof-cell"><b>Begrenzte Fläche</b><div className="raster-proof-stage" data-raster-stage={`${index}-bounded`}><ReplayCanvasImpact effect={effect} debris={shipDebris(effect as any)} original={null} frozenMs={time*1000} boundedProof/></div></div>}
      </div></section>;
    })}
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
    const renderer=raster?createCanvasPresentation():null;
    window.__cryptoidDeviceReplay=createDeviceReplay({...(lifecycle?{phases:campaign?CAMPAIGN_PHASES:bounded?BOUNDED_PHASES:raster?RASTER_PHASES:layers?LAYER_PHASES:workload?WORKLOAD_PHASES:fragments?FRAGMENT_PHASES:effects?EFFECT_PHASES:LIFECYCLE_PHASES}:{}),onProgress:setProgress,onFinish:result=>{
      clearTimeout(mountWatchdog);
      presentation?.stop();
      paths?.stop();
      layerProbe?.stop();
      if(renderer)result.rendererCleanup=renderer.stop();
      if(lifecycle)result.coverage.fixtures='Controlled lives/one-hit enemies and automatic aiming; real shot collisions, explosions and normal block transitions; no scored/account run';
      if(effects)result.coverage.presentation=fragments?'Same real collision/refill workload. Middle phase bounds each fragment to its original polygon cell with the full-resolution hull offset inside it; same polygon, pivot, trajectory, count, fire, smoke, audio and timing. DOM samples do not prove pixel presentation.':'Same real collision/refill workload in all three phases. Middle phase adds will-change hints only; original CSS artwork, filters, fragments and timings remain. DOM samples do not prove pixel presentation.';
      if(workload)result.coverage.presentation='Cause-isolation only: normal explosion/shatter DOM and explosion sound requests are omitted independently in designated phases. Simulation effects, hull illumination, original other visuals, music, shot sounds, haptics and 34 ms cap continue. First 1500 ms of each phase settle prior work and are excluded from measurements; clock counts only full frame intervals after that cutoff. No omissions are proposed for the game.';
      if(layers)result.coverage.presentation='Layer cause-isolation only: normal explosion/shatter fire/smoke pseudo-elements and fragment subtrees are omitted independently in designated phases. Original effect wrappers, simulation effects, hull illumination, all original audio, other graphics, haptics, mobile paint cadence and 34 ms cap continue. First 1500 ms of each phase settle prior work and are excluded; only full frame intervals after that cutoff are measured. DOM/CSS samples do not prove pixel presentation. No omissions are proposed for the game.';
      if(raster)result.coverage.presentation='Renderer candidate only, no omissions: original CSS display versus shared DPR Canvas. Full-resolution original hulls, same original seeded fragment polygon/flight props, piece count, effect lifetime, fire/smoke CSS artwork and animation keys, original audio/haptics/hull illumination/mobile paint and 34 ms cap. First 1500 ms excluded. Static SVG textures approximate CSS premultiplied gradients with dense stops; visual comparison is required, not assumed pixel-identical. Account/API isolation remains.';
      if(bounded)result.coverage.presentation='Surface bounds candidate: identical v8 Canvas drawing, resolution, textures, original hulls, piece count, polygons, trajectories, timing, audio, haptics, illumination and 34 ms cap. Only the middle phase bounds the backing store to conservative whole-lifetime effect extents, growing until the active set empties. Existing game-field clipping remains; no source or visible effect is cropped. First 1500 ms excluded. Frozen full/bounded pixel proof is available separately.';
      if(campaign)result.coverage.presentation='Complete bounded Canvas candidate before, during and after ordinary block transitions. Same original full-resolution hulls, fire/smoke artwork, fragments, trajectories, timing, audio, illumination, mobile paint cadence and 34 ms cap. Mounted effects retain hull resources; only unused decoded hulls may be evicted from the eight-entry cache. Reference phases refill defeated enemies; transition phase uses ordinary clear/intro/entry without refills. Controlled lives, one-hit enemies and automatic aiming; not a scored campaign or boss test. First 1500 ms of every phase excluded. Visual confirmation is separate from counters.';
      setReport({...result,build,device,blockedRequests:[...window.__cryptoidBlockedRequests]});setRunning(false);
    }});
    if(presentation)window.__cryptoidDeviceReplay.presentation=presentation;
    if(paths)window.__cryptoidDeviceReplay.workload=paths;
    if(layerProbe)window.__cryptoidDeviceReplay.layers=layerProbe;
    if(renderer)window.__cryptoidDeviceReplay.renderer=renderer;
    const mountWatchdog=setTimeout(()=>{
      if(!window.__cryptoidDeviceReplay.active)window.__cryptoidDeviceReplay.abort('fixture-not-started');
    },5000);
    setRunning(true);
  };
  const copy = async () => {
    try{await navigator.clipboard.writeText(JSON.stringify(report,null,effects||workload||layers||raster?0:2));setCopied(true);}
    catch{setCopyFallback(true);}
  };
  return proof ? raster?<RasterProof close={()=>setProof(false)}/>:<FragmentProof close={()=>setProof(false)}/> : running ? <>
    {effects&&<style>{fragments?FRAGMENT_CROP_CSS:EFFECT_PRESENTATION_CSS}</style>}
    {layers&&<style>{LAYER_CSS}</style>}
    {raster&&<style>{RASTER_CSS}</style>}
    <div className="device-replay-game"><BrowserRouter><StableGame/></BrowserRouter></div>
    <div className="device-replay-progress"><span>{progress.label}<br/>{progress.remainingSeconds} s</span>
      <button onClick={()=>window.__cryptoidDeviceReplay.abort('stopped')}>Beenden</button></div>
  </> : <main className="device-replay-panel">
    <small>CRYPTOID EVOLUTION · GERÄTETEST</small>
    <h1>{report?'Messung beendet':'Kurzer automatischer Test'}</h1>
    {!report ? <>
      <p>Der Test läuft {campaign?'rund 75 Sekunden':raster||layers?'rund 55 Sekunden':workload?'rund eine Minute':effects?'rund 70 Sekunden':lifecycle?'rund zwei Minuten':'rund 90 Sekunden'} selbstständig. Bitte das Fenster geöffnet lassen.</p>
      <p>{campaign?'Mehrere Blockwechsel werden mit der vollständigen Explosionsdarstellung automatisch durchgespielt. Bitte achte darauf, ob Feuer, Rauch und Trümmer auch nach den Wechseln sichtbar bleiben und das Spieltempo stabil bleibt. Du brauchst nichts zu steuern.':raster?'Drei gleiche Zerstörungsphasen vergleichen die bisherige und die neue Darstellung. Feuer, Rauch, Trümmer und Klang bleiben in allen Phasen an. Bitte achte auf die sichtbaren Effekte und das Spieltempo. Du brauchst nichts zu steuern.':layers?'Feuer/Rauch und Trümmer werden kurz einzeln und zusammen ausgeblendet. Das ist für diesen Vergleich beabsichtigt. Am Anfang und Ende erscheint die vollständige Explosion, der Klang bleibt durchgehend an. Bitte achte auf die sichtbaren Effekte und das Spieltempo. Du brauchst nichts zu steuern.':workload?'Explosionsbild und Explosionsklang werden einzeln kurz ausgeschaltet. Fehlende Explosionen oder ein fehlender Explosionsklang sind in diesen Testphasen beabsichtigt. Am Anfang und Ende läuft beides. Du brauchst nichts zu steuern.':fragments?'Drei gleiche Zerstörungsphasen vergleichen die Darstellung der Trümmer. In der mittleren Phase werden ihre Zeichenflächen enger begrenzt. Bitte achte auf Feuer, Trümmer und das Spieltempo. Du brauchst nichts zu steuern.':effects?'Drei gleiche Zerstörungsphasen vergleichen die Explosionsdarstellung. Die mittlere Phase prüft eine andere Verarbeitung der Animationsebenen. Bitte achte darauf, ob Feuer und Trümmer sichtbar sind. Du brauchst nichts zu steuern.':lifecycle?'Gegnerzerstörungen, Explosionen und Blockwechsel werden automatisch geprüft. Du brauchst nichts zu steuern.':'Einzel- und Doppelschüsse sowie das Schild werden in festen Situationen verglichen.'}</p>
      <p>Es ist kein Spielkonto nötig. Dein normaler Spielstand wird nicht geladen.</p>
      <label><input type="checkbox" checked={sound} disabled={workload||layers||raster} onChange={e=>setSound(e.target.checked)}/> Mit Musik und Soundeffekten</label>
      <button onClick={start}>Test starten</button>
      {(fragments||raster)&&<button onClick={()=>setProof(true)}>Darstellung vergleichen</button>}
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
