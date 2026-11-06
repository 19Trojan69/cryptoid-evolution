import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {createBrowserRouter,RouterProvider,useNavigate} from 'react-router-dom';
import {appendSample,chartPath,cleanSample,clock,finite,memoryMiB,MAX_SAMPLES,readReport,saveReport,SAMPLE_MS} from './model.mjs';
import {primeGameAudio} from '../../frontend/src/pages/gameAudio';
import {watchMenuViewport} from '../../frontend/src/lib/menuViewport';
import './lab.css';

const Game=lazy(()=>import('../../frontend/src/pages/GamePage'));
const identity=__CRYPTOID_BUILD__;
// A new document always shows the last local report, never restarts combat.
if(location.pathname!=='/')history.replaceState(null,'','/');
function currentReport(){try{return readReport(localStorage);}catch{return null;}}
function remember(report){try{return saveReport(localStorage,report);}catch{return false;}}
function Export({report}){
 const [text,setText]=useState(''),[message,setMessage]=useState('');
 const url=useRef(null);
 useEffect(()=>()=>{if(url.current)URL.revokeObjectURL(url.current);},[]);
 if(!report)return null;
 const content=()=>JSON.stringify(report,null,2);
 const file=()=>new File([content()],'Cryptoid-Evolution-Speicherlabor.json',{type:'application/json'});
 const download=()=>{if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(file());const a=document.createElement('a');a.href=url.current;a.download='Cryptoid-Evolution-Speicherlabor.json';a.click();};
 const share=async()=>{const f=file();try{if(!navigator.canShare?.({files:[f]})){setText(content());return;}await navigator.share({files:[f],title:'Cryptoid Evolution · Speicherlabor'});}catch{setMessage('Teilen wurde nicht abgeschlossen. Der Bericht bleibt erhalten.');}};
 return <div className="lab-export"><button onClick={download}>Bericht herunterladen</button><button onClick={()=>void share()}>Bericht teilen</button><button onClick={()=>setText(text?'':content())}>Berichttext anzeigen</button>{message&&<p role="status">{message}</p>}{text&&<textarea aria-label="Diagnosebericht zum Kopieren" readOnly value={text}/>}</div>;
}
function Menu(){
 const navigate=useNavigate(),[scene,setScene]=useState('normal'),[protection,setProtection]=useState(false),[confirmed,setConfirmed]=useState(false);
 const [last,setLast]=useState(currentReport),point=last?.samples.at(-1);
 useEffect(()=>setLast(currentReport()),[]);
 function start(){
   const options={scene,protection};window.__cryptoidLabOptions=options;
   const report={schema:1,startedAt:Date.now(),state:'running',identity,options,sampleMs:SAMPLE_MS,maxSamples:MAX_SAMPLES,dropped:0,samples:[],
     limits:{totalNativeRamAvailable:false,heapIsOptionalApproximateChromiumOnly:true,resourceBytesAreLogicalEstimates:true,resourceCategoriesMayOverlap:true,lastCheckpointIsNotExactCrashTime:true,diagnosticOverheadPresent:true}};
   window.__cryptoidLabRun=report;remember(report);primeGameAudio();navigate('/game');
 }
 return <main className="lab-menu"><section><p className="lab-eyebrow">CRYPTOID EVOLUTION · SEPARATE DIAGNOSEVERSION</p><h1>Speicherlabor</h1>
   <p>Spielen mit einer kleinen Live-Anzeige und einem Verlauf. Diese eigene Testadresse verwendet keine echten Konten, Käufe oder Online-Spielstände.</p>
   <div className="lab-limit"><strong>Gesamter Browser-RAM ist auf dem iPhone nicht messbar.</strong><p>Die Grafik zeigt geschätzte Bild-, Canvas- und Audiobestände. Sie ist keine Messung des gesamten Arbeitsspeichers. Ein zusätzlicher ungefährer JavaScript-Wert erscheint nur, wenn der Browser ihn bereitstellt.</p></div>
   <label>Startpunkt<select value={scene} onChange={e=>setScene(e.target.value)}><option value="normal">Level 1 · normaler Spielstart</option><option value="turrets">Boss 2 · mit Geschützen</option><option value="reactor">Boss 2 · Reaktor bei 55 %</option></select></label>
   <label className="lab-check"><input type="checkbox" checked={protection} onChange={e=>setProtection(e.target.checked)}/>Testschutz gegen Lebensverlust</label>
   <p className="lab-note">Testschutz ist eine künstliche Messhilfe. Er ist anfangs aus und verhindert nicht die Zerstörung des Bosses. Der direkte Bossstart ist eine vorbereitete Testszene; Level 1 verwendet den normalen Ablauf.</p>
   <p>Die Anzeige aktualisiert alle 5 Sekunden. Bis zu 30 Minuten Verlauf bleiben lokal gespeichert, sofern der Browser Speicher erlaubt. Nach einem Abbruch öffnest du dieselbe Adresse erneut. Der letzte gesicherte Punkt ist kein sekundengenauer Absturzzeitpunkt.</p>
   {point&&<section className="lab-last"><h2>Letzter gesicherter Lauf</h2><p>Spieluhr {clock(point.activeMs)} · Laufzeit {clock(point.wallMs)} · Level {point.level??'–'}{point.bossId?` · Boss ${point.bossId}`:''}</p><p>{last.state==='stopped'?'Regulär zur Testübersicht zurückgekehrt.':'Kein regulärer Abschluss gespeichert; die Ursache ist daraus nicht erkennbar.'}</p><Export report={last}/><label className="lab-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Den letzten lokalen Bericht durch einen neuen Lauf ersetzen</label></section>}
   <button className="lab-primary" disabled={!!point&&!confirmed} onClick={start}>Testspiel starten</button>
   <p className="lab-note">Quelle: {identity.baseRuntime.slice(0,8)} · Diagnose {identity.sourceCommit.slice(0,8)}. Der Monitor verändert die Messbedingungen etwas; ein bestandener Lauf beweist noch keinen White-Screen-Fix.</p>
 </section></main>;
}
function Graph({samples}){
 const series=[['paintedBytes','#66d9ef','Bildcache ~'],['canvasCacheBytes','#b8a1ff','Effektcache ~'],['audioBufferBytes','#ffc36b','Audio-PCM ~'],['heapBytes','#f4fafb','JS-Heap ≈']];
 const maximum=Math.max(1048576,...samples.flatMap(s=>series.map(([k])=>finite(s[k])??0)))*1.1;
 return <div className="lab-graph"><div className="lab-scale">Verlauf · 0–{(maximum/1048576).toFixed(0)} MiB</div><svg viewBox="0 0 300 70" role="img" aria-label="Verlauf geschätzter Teilressourcen, kein Gesamt-RAM"><path d="M0 0V70H300" stroke="#476173" fill="none"/>{series.map(([key,color])=><path key={key} d={chartPath(samples,key,300,70,maximum)} stroke={color} strokeWidth="1.5" fill="none"/>)}</svg><div className="lab-legend">{series.filter(([key])=>samples.some(s=>s[key]!==null)).map(([key,color,name])=><span key={key} style={{color}}>{name}</span>)}</div><small>{clock(samples[0]?.wallMs)}–{clock(samples.at(-1)?.wallMs)} reale Laufzeit</small></div>;
}
function Panel(){
 const report=useRef(window.__cryptoidLabRun),started=useRef(performance.now()),[point,setPoint]=useState(null),[expanded,setExpanded]=useState(true),[stored,setStored]=useState(true),[fault,setFault]=useState(false);
 useEffect(()=>{
   let stopped=false;
   report.current.state='running';remember(report.current);
   const tick=()=>{if(stopped)return;const read=window.__cryptoidLabRead;if(typeof read!=='function')return;
     try{const sample=cleanSample(read(),performance.now()-started.current);appendSample(report.current,sample);setStored(remember(report.current));setPoint(sample);setFault(false);}catch{setFault(true);}
   };
   tick();const timer=setInterval(tick,SAMPLE_MS);document.addEventListener('visibilitychange',tick);
   return ()=>{stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',tick);report.current.state='stopped';remember(report.current);};
 },[]);
 const value=k=>point?.[k]??'–';
 return <aside className={`lab-monitor${expanded?'':' lab-monitor-small'}`} aria-label="Live-Ressourcenmonitor" data-lab-monitor="true">
   <header><strong>DIAGNOSE · {clock(point?.activeMs)}</strong><button aria-label={expanded?'Monitor verkleinern':'Monitor vergrößern'} onClick={()=>setExpanded(v=>!v)}>{expanded?'−':'+'}</button></header>
   <div className="lab-monitor-content"><p className="lab-total">Browser-Gesamt-RAM: <b>nicht verfügbar</b></p><p>Laufzeit {clock(point?.wallMs)} · {point?.status??'Szene lädt …'}</p>
   {expanded&&<><dl><dt>JS-Heap ≈</dt><dd>{memoryMiB(point?.heapBytes)}</dd><dt>Bildcache ~</dt><dd>{memoryMiB(point?.paintedBytes)}</dd><dt>Effektcache ~</dt><dd>{memoryMiB(point?.canvasCacheBytes)}</dd><dt>Audio-PCM ~</dt><dd>{memoryMiB(point?.audioBufferBytes)}</dd><dt>DOM / Animationen</dt><dd>{value('domNodes')} / {value('pacedActive')}</dd><dt>Geschosse / Effekte</dt><dd>{point?(point.playerShots??0)+(point.enemyShots??0):'–'} / {value('effects')}</dd></dl>
     <p>Level {value('level')}{point?.bossId?` · Boss ${point.bossId} · Kern ${finite(point.reactorPercent)===null?'–':point.reactorPercent.toFixed(0)} % · ${point.liveTurrets} Geschütze`:''}</p><Graph samples={report.current?.samples??[]}/><p className="lab-note">~ logische Ressourcenbytes; ≈ Browser-Schätzung. Bereiche können sich überlappen. Kein RAM-Gesamtwert.</p></>}
   {point?.unobservedGapMs>0&&<p className="lab-warning">Beobachtungslücke: {clock(point.unobservedGapMs)}</p>}
   {!stored&&<p className="lab-warning" role="status">Lokales Speichern fehlgeschlagen. Der Verlauf bleibt nur bis zum Schließen verfügbar.</p>}
   {fault&&<p className="lab-warning" role="status">Messpunkt derzeit nicht verfügbar. Der letzte gültige Punkt bleibt erhalten.</p>}
   </div>
 </aside>;
}
function LabGame(){return <><Suspense fallback={<div className="lab-menu"><p>Spielszene wird geladen …</p></div>}><Game/></Suspense><Panel/></>;}
const router=createBrowserRouter([{path:'/',element:<Menu/>},{path:'/game',element:<LabGame/>},{path:'*',element:<Menu/>}]);
export default function App(){useEffect(watchMenuViewport,[]);return <RouterProvider router={router}/>;}
