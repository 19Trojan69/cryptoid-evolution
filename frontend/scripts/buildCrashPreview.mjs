// Build an isolated developer preview from the public Testnet baseline.
// Game JSX, styles, simulation, timings and assets remain the actual source.
// Only auth/API/account storage and the selectable starting point are test scaffolding.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=process.argv[2]||'/tmp/Cryptoid_Evolution_Absturzdiagnose.html';
const temp=path.join(root,'.stability-preview');fs.mkdirSync(temp,{recursive:true});
const assets=new Map(), assetFiles=new Set();
const add=relative=>{const p=path.join(root,'public',relative);if(!fs.existsSync(p)||!fs.statSync(p).isFile())return;assetFiles.add(relative);};
for(const sub of ['ships/evolution','ships/bosses/evolved','planets'])for(const name of fs.readdirSync(path.join(root,'public',sub)))add(sub+'/'+name);
for(const name of fs.readdirSync(path.join(root,'public/audio')))if(name.endsWith('.mp3')&&fs.statSync(path.join(root,'public/audio',name)).size<200_000)add('audio/'+name);
for(const sub of ['effects','fonts'])if(fs.existsSync(path.join(root,'public',sub)))for(const name of fs.readdirSync(path.join(root,'public',sub)))add(sub+'/'+name);
add('ships/cryptoid-fleet.png');
const memory=`class MemoryStorage {values=new Map();get length(){return this.values.size;}key(i){return [...this.values.keys()][i]??null;}getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,String(v));}removeItem(k){this.values.delete(k);}clear(){this.values.clear();}}
export const localStorage=new MemoryStorage();export const sessionStorage=new MemoryStorage();
localStorage.setItem('cryptoid_language','de');localStorage.setItem('cryptoid_home_music','off');localStorage.setItem('cryptoid_effects_volume','35');
export const previewUUID=()=>globalThis.crypto?.randomUUID?.()??'preview-'+Math.random().toString(36).slice(2);
export const offlineAsset=p=>window.__previewAsset(p);
`;
fs.writeFileSync(path.join(temp,'memory.ts'),memory);
const entry=`import {createRoot} from 'react-dom/client';import {useState,useMemo,useEffect} from 'react';import {createMemoryRouter,RouterProvider} from 'react-router-dom';import Game from '../src/pages/GamePage';import {playerSkins,SHIP_SKIN_KEY,SHIP_COLOR_KEY} from '../src/pages/shipFleet';import {localStorage,sessionStorage} from './memory';import {diagnosticExport} from '../src/pages/diagnosticExport';import '../src/index.css';import '../src/hudDepth.css';import '../src/smartphoneUi.css';
function ReturnToMenu({onReturn}){useEffect(()=>onReturn(),[onReturn]);return null;}
function Preview(){const [playing,setPlaying]=useState(false),[run,setRun]=useState(0),[level,setLevel]=useState(25),[ship,setShip]=useState('grey-scout'),[hand,setHand]=useState('right'),[diagnose,setDiagnose]=useState(true),[music,setMusic]=useState(true),[reportText,setReportText]=useState('');
const router=useMemo(()=>playing?createMemoryRouter([{path:'/game',element:<Game/>},{path:'*',element:<ReturnToMenu onReturn={()=>setPlaying(false)}/>}],{initialEntries:['/game']}):null,[run,playing]);
const start=()=>{localStorage.clear();sessionStorage.clear();for(const [k,v] of Object.entries({cryptoid_language:'de',cryptoid_home_music:music?'on':'off',cryptoid_control_hand:hand,cryptoid_ship_start:'higher',[SHIP_SKIN_KEY]:ship,[SHIP_COLOR_KEY]:'gold'}))localStorage.setItem(k,v);window.__previewLevel=level;window.__cryptoidProbeOptOut=!diagnose;setRun(n=>n+1);setPlaying(true);};
const report=()=>{const data=diagnosticExport(window);if(!data.available){setReportText('Noch keine Messwerte vorhanden. Bitte mit aktivierter Entwicklermessung starten.');return null;}const text=JSON.stringify(data,null,2);setReportText(text);return text;};
const download=()=>{const text=report();if(!text)return;const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Cryptoid_Diagnose_V2.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const lastReport=diagnosticExport(window);const evidence=lastReport.trace||lastReport.previous;const evidenceStatus=evidence?(String(evidence.samples?.length||0)+' Messfenster · '+String(evidence.events?.length||0)+' Ereignisse · '+(evidence.persistence==='memory-only'?'Nur in dieser Sitzung gespeichert':'lokales Protokoll verfügbar')):'Noch keine Messwerte vorhanden';

return playing?<RouterProvider key={run} router={router}/>:<main className="preview-menu"><section><small>TROJAN WOLF GAMES · PRIVATE ENTWICKLERTESTSEITE</small><h1>CRYPTOID<br/><span>EVOLUTION</span></h1><p>Absturzdiagnose V2 · Korrekturtest 15.10.</p><p className="preview-note">HUD, Schiffgrößen, Flugmuster und Kampfgeschwindigkeit bleiben erhalten. Diese Version korrigiert Rumpfvorbereitung, Boss-Kollision und Power-Up-Ursprung. Konten, Käufe und Ranglisten sind gesperrt. Der Test verändert keine echten Spielstände.</p><label>Startpunkt<select value={level} onChange={e=>setLevel(Number(e.target.value))}>{[1,9,10,11,25,29,30,49,50,99,100,249,250,499,500].map(n=><option key={n} value={n}>Stufe {n}{n%10===0?' · Boss':''}</option>)}</select></label><label>Testschiff<select value={ship} onChange={e=>setShip(e.target.value)}>{playerSkins.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Steuerhand<select value={hand} onChange={e=>setHand(e.target.value)}><option value="right">Rechtshänder</option><option value="left">Linkshänder</option></select></label><label className="preview-check"><input type="checkbox" checked={diagnose} onChange={e=>setDiagnose(e.target.checked)}/>Entwicklermessung aktiv</label><label className="preview-check"><input type="checkbox" checked={music} onChange={e=>setMusic(e.target.checked)}/>Originalmusik aktiv</label><button className="preview-start" onClick={start}>Test starten ▶</button><p className="preview-note" role="status">{evidenceStatus}</p><button className="preview-download" onClick={download}>Letzten Diagnosebericht herunterladen</button><button className="preview-download" onClick={report}>Bericht anzeigen / kopieren</button>{reportText&&<textarea className="preview-report" readOnly value={reportText} onFocus={e=>e.target.select()} aria-label="Diagnosebericht zum Kopieren"/>}<p className="preview-note">Zum Testmenü gelangst du über den vorhandenen Home-Button. Nach einem Ausfall diese private Testseite erneut öffnen und den Bericht herunterladen. Der Bericht bleibt lokal; er wird nicht automatisch versendet. Falls dein Browser dauerhafte Speicherung sperrt, steht er nur bis zum Schließen/Neuladen zur Verfügung. Beim Export wird der Bericht auch als kopierbarer Text angezeigt. Ohne Messung lässt sich ein möglicher Diagnoseaufwand gegenprüfen. Pi Browser bitte auf dem eigenen Gerät testen.</p></section></main>;
}createRoot(document.getElementById('root')).render(<Preview/>);`;
fs.writeFileSync(path.join(temp,'entry.tsx'),entry);
const plugin={name:'isolated-stability-preview',setup(b){
 b.onResolve({filter:/\/paintedShip$/},args=>({path:path.resolve(args.resolveDir,args.path+'.ts')}));
 b.onResolve({filter:/^\//},args=>args.kind==='url-token'?{path:args.path,external:true}:undefined);
 b.onLoad({filter:/\.[jt]sx?$/},args=>{
  if(args.path.includes('node_modules')||args.path===path.join(temp,'memory.ts'))return;
  if(args.path.endsWith('/hooks/useAuth.ts'))return {contents:`export const useAuth=()=>({authReady:true,isLoading:false,authError:'',isAuthenticated:false,user:null,signIn:async()=>{}});`,loader:'ts'};
  if(args.path.endsWith('/lib/axiosClient.ts'))return {contents:`const disabled=()=>Promise.reject(new Error('Serverzugriff in der Testvorschau deaktiviert.'));export const axiosClient={get:disabled,post:disabled};export const PI_ACCESS_TOKEN_KEY='preview-unused';export const getBaseURL=()=>'';`,loader:'ts'};
  if(args.path.endsWith('/pages/CardReveal.tsx'))return {contents:'export default ()=>null;',loader:'tsx'};
  let s=fs.readFileSync(args.path,'utf8').replaceAll('window.localStorage','localStorage').replaceAll('window.sessionStorage','sessionStorage').replaceAll('crypto.randomUUID()','previewUUID()');
  if(args.path.endsWith('/pages/GamePage.tsx'))s=s.replace('  const levelLabel =',`  useEffect(()=>{const state=stateRef.current;state.sector=window.__previewLevel||1;state.section=state.sector;state.chainBlocks=(state.sector-1)%10;state.phase='SECTOR_INTRO';sectionSlotsRef.current=null;adminRunRef.current=true;if(state.sector%10===0){state.encounter='boss-intro';state.boss=createSectorBoss(state.sector,fieldSizeRef.current.width,visibleTopRef.current,fieldSizeRef.current.height);}setGame({...state});},[]);\n  const levelLabel =`).replace(/showRewardCards\(firstMissionStarterCards\([^;]+;/g,'');
  s=s.replace(/(["'])\/(ships|planets|audio|effects|fonts|cards|badges|emblems|ranks|home)\/([^"'\n]+)\1/g,(m,q,d,r)=>{add(d+'/'+r);return 'offlineAsset('+JSON.stringify('/'+d+'/'+r)+')';});
  s=s.replace(/`\/(ships|planets|audio|effects)\/([^`]+)`/g,(m,d,r)=>'offlineAsset(`/'+d+'/'+r+'`)');
  s=s.replaceAll('t("Admin center")','"Testvorschau"');
  s=s.replace(/src=offlineAsset\(([^)]+)\)/g,'src={offlineAsset($1)}');
  return {contents:s,loader:args.path.endsWith('tsx')?'tsx':'ts'};
 });
 b.onLoad({filter:/\.css$/},args=>({contents:fs.readFileSync(args.path,'utf8').replace(/@import url\([^)]*\);/g,''),loader:'css'}));
}};
const result=await build({absWorkingDir:root,entryPoints:[path.join(temp,'entry.tsx')],bundle:true,write:false,format:'iife',outfile:path.join(temp,'app.js'),minify:true,jsx:'automatic',target:['es2022'],inject:[path.join(temp,'memory.ts')],plugins:[plugin],define:{'import.meta.env':'{"VITE_CRYPTOID_DIAGNOSTICS":"1"}','process.env.NODE_ENV':'"production"','__CRYPTOID_RELEASE__':'"ENTWICKLERDIAGNOSE V2"'}});
let js=result.outputFiles.find(f=>f.path.endsWith('.js')).text,css=result.outputFiles.find(f=>f.path.endsWith('.css'))?.text||'';
css=css.replace(/url\(\s*['"]?(\/[^)'"\s]+)['"]?\s*\)/g,(m,p)=>{add(p.slice(1));return m;});
const mime=p=>p.endsWith('.webp')?'image/webp':p.endsWith('.png')?'image/png':p.endsWith('.svg')?'image/svg+xml':p.endsWith('.mp3')?'audio/mpeg':p.endsWith('.woff2')?'font/woff2':'application/octet-stream';
// Long music tracks are not used by this preview. Everything rendered uses the
// original files; no ship/texture resolution is reduced in the QA copy.
for(const relative of assetFiles){if(relative.startsWith('audio/')&&fs.statSync(path.join(root,'public',relative)).size>=200_000)continue;assets.set('/'+relative,{mime:mime(relative),data:fs.readFileSync(path.join(root,'public',relative)).toString('base64')});}
const bootstrap=`window.__ENV={appNetwork:'testnet'};window.__previewLevel=25;try{window.__cryptoidPreviousTrace=JSON.parse(window['localStorage'].getItem('cryptoid_developer_trace_v1')||'null');}catch{}const assets=${JSON.stringify(Object.fromEntries(assets))};const urls=new Map();window.__previewAsset=p=>{if(urls.has(p))return urls.get(p);const a=assets[p];if(!a)return '';const bytes=Uint8Array.from(atob(a.data),c=>c.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes],{type:a.mime}));urls.set(p,url);return url;};`;
// CSS assets cannot call JS; replace each path with the generated stable URL
// before applying the stylesheet. Repeated ship masks use short blob URLs.
const styleBoot=`let css=${JSON.stringify(css)};css=css.replace(/url\\(\\s*['"]?(\\/[^)'"\\s]+)['"]?\\s*\\)/g,(m,p)=>'url('+window.__previewAsset(p)+')');const style=document.createElement('style');style.textContent=css;document.head.append(style);`;
const extra=`html,body,#root{margin:0;min-height:100%;background:#030916}.preview-menu{min-height:100dvh;display:grid;place-items:center;padding:24px;font-family:system-ui;color:#e4dece;background:radial-gradient(ellipse at 50% 0,#172643,transparent 70%)}.preview-menu section{width:min(420px,100%)}.preview-menu small{color:#a29b88;letter-spacing:.12em}.preview-menu h1{font-size:clamp(36px,10vw,56px);line-height:.98;letter-spacing:.025em}.preview-menu h1 span{color:#d8c89a}.preview-menu label{display:grid;gap:7px;margin:20px 0}.preview-menu select,.preview-menu button{min-height:48px;border-radius:10px;border:1px solid #b3a88c66;background:#101e32;color:#eee6d0;padding:10px;font:inherit}.preview-start{width:100%;background:linear-gradient(120deg,#d6c49b,#9c8862)!important;color:#071020!important;font-weight:700!important}.preview-note{font-size:13px;line-height:1.55;opacity:.75}.preview-check{display:flex!important;align-items:center;gap:10px!important}.preview-check input{width:20px;height:20px}.preview-download{width:100%;margin-top:12px}.preview-report{width:100%;min-height:200px;margin-top:12px;background:#081425;color:#e8dfc8;font:11px monospace}`;
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Cryptoid Evolution – Stabilitätstest</title><style>${extra}</style></head><body><div id="root"></div><script>${bootstrap.replaceAll('</script','<\\/script')}${styleBoot}${js.replaceAll('</script','<\\/script')}</script></body></html>`);
// An optional web directory keeps HD assets as ordinary cacheable files.
// It carries the same isolated API/auth/storage stubs as the offline copy.
const webDirectory=process.argv[3];
if(webDirectory){
 const destination=path.resolve(webDirectory);fs.mkdirSync(destination,{recursive:true});
 for(const name of fs.readdirSync(path.join(root,'public/audio')))if(name.endsWith('.mp3'))assets.set('/audio/'+name,{mime:'audio/mpeg',data:fs.readFileSync(path.join(root,'public/audio',name)).toString('base64')});
 for(const [relative,asset] of assets){const file=path.join(destination,relative.slice(1));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,Buffer.from(asset.data,'base64'));}
 const onlineBootstrap="window.__ENV={appNetwork:'testnet'};window.__previewLevel=25;try{window.__cryptoidPreviousTrace=JSON.parse(window['localStorage'].getItem('cryptoid_developer_trace_v1')||'null');}catch{}window.__previewAsset=p=>p;";
 let html=fs.readFileSync(output,'utf8').replace(bootstrap.replaceAll('</script','<\\/script'),onlineBootstrap);
 const fontImport=fs.readFileSync(path.join(root,'src/index.css'),'utf8').match(/@import url\(['"]([^'"]+)['"]\);/);
 if(fontImport)html=html.replace('</head>','<link rel="stylesheet" href="'+fontImport[1]+'"></head>');
 fs.mkdirSync(path.join(destination,'assets'),{recursive:true});
 fs.writeFileSync(path.join(destination,'assets/crash-probe.js'),js);
 html=html.replace(js.replaceAll('</script','<\\/script'),'').replace('</body>','<script src="/assets/crash-probe.js"></script></body>');
 fs.writeFileSync(path.join(destination,'index.html'),html);
 fs.writeFileSync(path.join(destination,'robots.txt'),'User-agent: *\nDisallow: /\n');
 console.log(JSON.stringify({webDirectory:destination,assetFiles:assets.size,htmlBytes:Buffer.byteLength(html)}));
}
fs.rmSync(temp,{recursive:true,force:true});console.log(JSON.stringify({output,bytes:fs.statSync(output).size,assets:assets.size}));

