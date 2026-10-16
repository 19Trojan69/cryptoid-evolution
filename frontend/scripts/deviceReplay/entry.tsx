import React, { memo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import GamePage from '../../src/pages/GamePage';
import { primeGameAudio } from '../../src/pages/gameAudio';
import { MusicPlayer, handoffGameMusic } from '../../src/pages/musicPlayback';
import { readMusicVolume } from '../../src/pages/musicPreferences';
import { createDeviceReplay } from './controller.mjs';

declare global { interface Window { __cryptoidDeviceReplay: any; __cryptoidBlockedRequests: string[]; } }
const StableGame = memo(GamePage);
const build = __CRYPTOID_REPLAY_BUILD__;
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
  return nativeFetch(input,{...init,credentials:'omit'});
};
// The application API is also removed by the bundler. This denies any stray
// browser-level XHR before it can make a request.
XMLHttpRequest.prototype.open = function() {
  window.__cryptoidBlockedRequests.push('XHR request blocked');
  throw new Error('Kontozugriff im Gerätetest gesperrt');
};

function App() {
  const [running,setRunning] = useState(false);
  const [progress,setProgress] = useState({label:'',remainingSeconds:88});
  const [report,setReport] = useState<any>(null);
  const [copied,setCopied] = useState(false);
  const [copyFallback,setCopyFallback] = useState(false);
  const [sound,setSound] = useState(true);
  const start = () => {
    setReport(null);setCopied(false);setCopyFallback(false);
    localStorage.setItem('cryptoid_language','de');
    localStorage.setItem('cryptoid_home_music',sound?'on':'off');
    if(sound){primeGameAudio();const music=new MusicPlayer('/audio/battle-orbit.mp3',readMusicVolume());void music.play();handoffGameMusic(music);}
    const device={userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight},
      pixelRatio:devicePixelRatio,visibility:document.visibilityState,sound};
    window.__cryptoidBlockedRequests.length=0;
    window.__cryptoidDeviceReplay=createDeviceReplay({onProgress:setProgress,onFinish:result=>{
      setReport({...result,build,device,blockedRequests:[...window.__cryptoidBlockedRequests]});setRunning(false);
    }});
    setRunning(true);
  };
  const copy = async () => {
    try{await navigator.clipboard.writeText(JSON.stringify(report,null,2));setCopied(true);}
    catch{setCopyFallback(true);}
  };
  return running ? <>
    <div className="device-replay-game"><BrowserRouter><StableGame/></BrowserRouter></div>
    <div className="device-replay-progress"><span>{progress.label}<br/>{progress.remainingSeconds} s</span>
      <button onClick={()=>window.__cryptoidDeviceReplay.abort('stopped')}>Beenden</button></div>
  </> : <main className="device-replay-panel">
    <small>CRYPTOID EVOLUTION · GERÄTETEST</small>
    <h1>{report?'Messung beendet':'Kurzer automatischer Test'}</h1>
    {!report ? <>
      <p>Der Test läuft rund 90 Sekunden selbstständig. Bitte das Fenster geöffnet lassen.</p>
      <p>Einzel- und Doppelschüsse sowie das Schild werden in festen Situationen verglichen.</p>
      <p>Es ist kein Spielkonto nötig. Dein normaler Spielstand wird nicht geladen.</p>
      <label><input type="checkbox" checked={sound} onChange={e=>setSound(e.target.checked)}/> Mit Musik und Soundeffekten</label>
      <button onClick={start}>Test starten</button>
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
