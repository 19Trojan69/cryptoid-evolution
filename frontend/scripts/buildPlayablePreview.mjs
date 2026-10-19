// Login-free, account-free QA build. Never imported by the production entry.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {previewHudComparisonCSS} from './playPreviewHudComparison.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(process.argv[2]||path.join(root,'play-preview-dist'));
const temporary=fs.mkdtempSync(path.join(root,'.play-preview-'));
const write=(name,content)=>fs.writeFileSync(path.join(temporary,name),content);
const memory=`class MemoryStorage {values=new Map();get length(){return this.values.size;}key(i){return [...this.values.keys()][i]??null;}getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,String(v));}removeItem(k){this.values.delete(k);}clear(){this.values.clear();}}
export const localStorage=new MemoryStorage();export const sessionStorage=new MemoryStorage();
localStorage.setItem('cryptoid_language','de');
`;
write('memory.ts',memory);
const imports=fs.readFileSync(path.join(root,'src/main.tsx'),'utf8').match(/^import ['"].*\.css['"];?$/gm).map(line=>line.replace("'./","'../src/"));
const entry=`import {createRoot} from 'react-dom/client';import {useEffect,useState} from 'react';import {createMemoryRouter,RouterProvider,useNavigate} from 'react-router-dom';
import Game from '../src/pages/GamePage';import {primeGameAudio} from '../src/pages/gameAudio';import {requestGameFullscreen} from '../src/pages/gameFullscreen';
import {localStorage,sessionStorage} from './memory';
${imports.join('\n')}
function Menu(){const navigate=useNavigate();const [ambientEvents,setAmbientEvents]=useState(false),[originalTurrets,setOriginalTurrets]=useState(false),[disableHudBlur,setDisableHudBlur]=useState(false);const start=(phase,sector)=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('cryptoid_language','de');window.__cryptoidPlayStart={phase,sector,ambientEvents,originalTurrets};document.documentElement.dataset.previewHudFilter=disableHudBlur?'off':'original';primeGameAudio();requestGameFullscreen();navigate('/game');};
return <main className="play-preview-menu"><section><p className="eyebrow">CRYPTOID EVOLUTION · STARTVERGLEICH</p><h1>Spielvorschau</h1><p>Direkt spielen – ohne Pi-Anmeldung.</p>
<p>Größere Turmkörper, unveränderte Rohre. Sternschnuppen und Blinkstern sind zunächst ausgeschaltet.</p>
<label className="play-preview-compare"><input type="checkbox" checked={disableHudBlur} onChange={e=>setDisableHudBlur(e.target.checked)}/> HUD-Unschärfe ausschalten · nur Vergleichstest</label>
<p className="play-preview-note">Für den Startvergleich reichen jeweils etwa 20 Sekunden ab Level 1: einmal ohne Haken, einmal mit Haken. Nur die Hintergrundunschärfe hinter der Kopfzeile ändert sich.</p>
<details><summary>Vergleichseinstellungen</summary><label><input type="checkbox" checked={ambientEvents} onChange={e=>setAmbientEvents(e.target.checked)}/> Sternschnuppen und Blinkstern anzeigen</label><label><input type="checkbox" checked={originalTurrets} onChange={e=>setOriginalTurrets(e.target.checked)}/> Ursprüngliche kleine Turmkörper verwenden</label></details>
<button className="button button-primary" onClick={()=>start('bonus',20)}>Bonusrunde starten</button>
<button className="button button-secondary" onClick={()=>start('boss',20)}>Boss 2 starten</button>
<button className="button button-secondary" onClick={()=>start('normal',1)}>Ab Level 1 spielen</button>
<p>Nach der Bonusrunde bleibt die Level-Zusammenfassung bis „Next Mission“ stehen.</p>
<p className="play-preview-note">Diese Vorschau hat keine Konten, Käufe, Ranglisten oder Admin-Funktionen. Testfortschritt bleibt nur während der geöffneten Sitzung erhalten. Über Home kommst du hierher zurück.</p></section></main>;}
function Playing(){useEffect(()=>{const viewport=()=>{const v=window.visualViewport;document.documentElement.style.setProperty('--preview-height',(v?.height||window.innerHeight)+'px');document.documentElement.style.setProperty('--preview-top',(v?.offsetTop||0)+'px');};
const lock=event=>{const panel=event.target instanceof Element?event.target.closest('.game-modal,.level-complete-banner'):null;if(panel&&panel.scrollHeight>panel.clientHeight)return;if(event.cancelable)event.preventDefault();};
viewport();window.addEventListener('resize',viewport);window.visualViewport?.addEventListener('resize',viewport);document.addEventListener('touchmove',lock,{passive:false});return()=>{window.removeEventListener('resize',viewport);window.visualViewport?.removeEventListener('resize',viewport);document.removeEventListener('touchmove',lock);};},[]);return <Game/>;}
const router=createMemoryRouter([{path:'/',element:<Menu/>},{path:'/game',element:<Playing/>},{path:'*',element:<Menu/>}]);
createRoot(document.getElementById('root')).render(<RouterProvider router={router}/>);`;
write('entry.tsx',entry);
const initialize=`  // Isolated QA entry only: select a starting encounter, never an Admin session.
  useEffect(() => {
    const selection = (window as Window & {__cryptoidPlayStart?: {phase: string; sector: number}}).__cryptoidPlayStart;
    if (!selection) return;
    const state = stateRef.current;
    state.sector = selection.sector; state.section = selection.sector;
    state.chainBlocks = selection.phase === 'normal' ? (selection.sector - 1) % 10 : 9;
    state.phase = 'SECTOR_INTRO';
    state.encounter = selection.phase === 'boss' ? 'boss-intro' : selection.phase === 'bonus' ? 'bonus' : 'normal';
    state.boss = selection.phase === 'boss' ? createSectorBoss(selection.sector, fieldSizeRef.current.width, visibleTopRef.current, fieldSizeRef.current.height) : null;
    sectionSlotsRef.current = null;
    setGame({...state});
  }, []);
`;
let transformedGame=false;
try {
 const result=await build({absWorkingDir:root,entryPoints:[path.join(temporary,'entry.tsx')],bundle:true,write:false,format:'iife',outfile:path.join(output,'assets/play-preview.js'),minify:true,jsx:'automatic',target:['es2022'],inject:[path.join(temporary,'memory.ts')],define:{'import.meta.env':'{"VITE_CRYPTOID_DIAGNOSTICS":"0"}','process.env.NODE_ENV':'"production"','__CRYPTOID_RELEASE__':JSON.stringify('LEVEL SUMMARY PLAY PREVIEW · '+(process.env.VERCEL_GIT_COMMIT_SHA||'local').slice(0,8))},plugins:[{name:'account-free-play-preview',setup(b){
  b.onResolve({filter:/\/paintedShip$/},args=>({path:path.resolve(args.resolveDir,args.path+'.ts')}));
  b.onResolve({filter:/^\//},args=>args.kind==='url-token'?{path:args.path,external:true}:undefined);
  b.onLoad({filter:/\.(?:tsx?|mjs|js)$/},args=>{
   if(args.path.includes('node_modules')||args.path===path.join(temporary,'memory.ts'))return;
   if(args.path.endsWith('/hooks/useAuth.ts'))return {loader:'ts',contents:`export const useAuth=()=>({authReady:true,isLoading:false,authError:'',isAuthenticated:false,canAdmin:false,adminMode:false,user:null,signIn:async()=>{},requireAuth:()=>{}});`};
   if(args.path.endsWith('/lib/axiosClient.ts'))return {loader:'ts',contents:`const disabled=()=>Promise.reject(new Error('Account API disabled in isolated play preview'));export const axiosClient={get:disabled,post:disabled};export const PI_ACCESS_TOKEN_KEY='preview-unused';export const getBaseURL=()=>'';`};
   let source=fs.readFileSync(args.path,'utf8').replaceAll('window.localStorage','localStorage').replaceAll('window.sessionStorage','sessionStorage');
   if(args.path.endsWith('/pages/Starfield.tsx')){
    const anchor='ambientEvents = true';if(source.split(anchor).length!==2)throw Error('Expected ambient-events preview anchor');
    source=source.replace(anchor,'ambientEvents = (window as Window & {__cryptoidPlayStart?: {ambientEvents?: boolean}}).__cryptoidPlayStart?.ambientEvents !== false');
   }
   if(args.path.endsWith('/pages/bossTurretBody.ts')){
    const anchor='Math.max(1, MIN_TURRET_BODY_DIAMETER / (2 * gun.halfWidth * scale))';if(source.split(anchor).length!==2)throw Error('Expected turret-body preview anchor');
    source=source.replace(anchor,`(window as Window & {__cryptoidPlayStart?: {originalTurrets?: boolean}}).__cryptoidPlayStart?.originalTurrets ? 1 : ${anchor}`);
   }
   if(args.path.endsWith('/pages/GamePage.tsx')){
    const anchor='  const levelLabel =';
    if(source.split(anchor).length!==2)throw Error('Expected exactly one preview initialization anchor');
    source=source.replace(anchor,initialize+anchor);transformedGame=true;
   }
   return {contents:source,loader:args.path.endsWith('.tsx')?'tsx':args.path.endsWith('.ts')?'ts':'js'};
  });
 }}]});
 if(!transformedGame)throw Error('Game source was not included');
 fs.mkdirSync(output,{recursive:true});
 fs.cpSync(path.join(root,'public'),output,{recursive:true});
 for(const file of result.outputFiles){fs.mkdirSync(path.dirname(file.path),{recursive:true});fs.writeFileSync(file.path,file.contents);}
 fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Cryptoid Evolution – Startvergleich</title><link rel="stylesheet" href="/assets/play-preview.css"><style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden;overscroll-behavior:none}body{position:fixed;inset:0}.game-shell{position:fixed;left:0;top:var(--preview-top,0px);height:var(--preview-height,100dvh);width:100%;overscroll-behavior:none}.play-preview-menu{height:100%;overflow-y:auto;box-sizing:border-box;display:grid;place-items:center;padding:24px;background:#030916;color:#e8dfc8}.play-preview-menu section{width:min(420px,100%)}.play-preview-menu .button{display:block;width:100%;margin:16px 0}.play-preview-menu label{display:block;margin:12px 0;line-height:1.5}.play-preview-menu summary{cursor:pointer}.play-preview-note{font-size:13px;line-height:1.5;opacity:.8}${previewHudComparisonCSS}</style><script>window.__ENV={appNetwork:'testnet'};</script></head><body><div id="root"></div><script src="/assets/play-preview.js"></script></body></html>`);
 fs.writeFileSync(path.join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
 fs.writeFileSync(path.join(output,'preview-api-disabled.json'),JSON.stringify({error:'account_api_disabled',preview:true}));
 console.log(JSON.stringify({output,loginRequired:false,adminEnabled:false,accountApiEnabled:false,persistentStorage:false,originalGameSource:true}));
} finally {fs.rmSync(temporary,{recursive:true,force:true});}
