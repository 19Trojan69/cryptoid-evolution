import {Fragment,lazy,Suspense,useEffect,useRef,useState} from 'react';
import {createBrowserRouter,Navigate,RouterProvider,useNavigate,useRouteError} from 'react-router-dom';
import {ALERT_POLICY,RESOURCE_FIELDS,resourceHigh,appendSample,chartPath,cleanSample,clock,finite,memoryMiB,MAX_SAMPLES,readReport,saveReport,SAMPLE_MS} from './model.mjs';
import {beginRunTrace,followingDocument,noteFault,noteLifecycle,withLifecycle} from './lifecycle.mjs';
import {primeGameAudio} from '../../frontend/src/pages/gameAudio';
import {watchMenuViewport} from '../../frontend/src/lib/menuViewport';
import './lab.css';

const loadGame=()=>import('../../frontend/src/pages/GamePage');
const Game=lazy(loadGame);
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
 const content=()=>JSON.stringify(withLifecycle(report),null,2);
 const file=()=>new File([content()],'Cryptoid-Evolution-Speicherlabor.json',{type:'application/json'});
 const download=()=>{if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(file());const a=document.createElement('a');a.href=url.current;a.download='Cryptoid-Evolution-Speicherlabor.json';a.click();};
 const share=async()=>{const f=file();try{if(!navigator.canShare?.({files:[f]})){setText(content());return;}await navigator.share({files:[f],title:'Cryptoid Evolution · Speicherlabor'});}catch{setMessage('Teilen wurde nicht abgeschlossen. Der Bericht bleibt erhalten.');}};
 return <div className="lab-export"><button onClick={download}>Bericht herunterladen</button><button onClick={()=>void share()}>Bericht teilen</button><button onClick={()=>setText(text?'':content())}>Berichttext anzeigen</button>{message&&<p role="status">{message}</p>}{text&&<textarea aria-label="Diagnosebericht zum Kopieren" readOnly value={text}/>}</div>;
}
function RunStatus({report}) {
 const following = followingDocument(report);
 if (report.state === 'failed') return <p>Die Spielansicht wurde durch einen Darstellungsfehler unterbrochen.</p>;
 if (following?.navigationType === 'reload') return <p>Die Browserseite wurde nach diesem Lauf neu geladen.</p>;
 if (following) return <p>Nach diesem Lauf wurde im selben Tab eine neue Browserseite gestartet.</p>;
 if (report.state === 'stopped') return <p>Die Aufzeichnung wurde beim Verlassen der Spielansicht beendet.</p>;
 return <p>Der letzte Lauf hat keinen protokollierten Abschluss.</p>;
}
function Menu(){
 const navigate=useNavigate(),[scene,setScene]=useState('normal'),[protection,setProtection]=useState(false),[confirmed,setConfirmed]=useState(false);
 const lease=useRef(null),mounted=useRef(true),[preparation,setPreparation]=useState('cold');
 const [last,setLast]=useState(currentReport),point=last?.samples.at(-1);
 useEffect(()=>setLast(currentReport()),[]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(!window.__cryptoidLabWarmHandoff)lease.current?.release();};},[]);
 async function prepare(){
   setPreparation('preparing');
   try{const [,warm]=await Promise.all([loadGame(),import('./warmup.mjs')]);const current=await warm.warmLabScene(scene);if(!mounted.current){current.release();return;}lease.current=current;setPreparation('ready');}
   catch{if(mounted.current)setPreparation('failed');}
 }
 function chooseScene(value){lease.current?.release();lease.current=null;setPreparation('cold');setScene(value);}
 function start(){
   if (preparation !== 'ready') return;
   const options={scene,protection};window.__cryptoidLabOptions=options;
   window.__cryptoidLabWarmHandoff=true;window.__cryptoidLabWarmRelease=()=>{lease.current?.release();lease.current=null;};
   const report={schema:1,startedAt:Date.now(),state:'running',identity,options,alertPolicy:ALERT_POLICY,sampleMs:SAMPLE_MS,maxSamples:MAX_SAMPLES,dropped:0,samples:[],
     limits:{totalNativeRamAvailable:false,heapIsOptionalApproximateChromiumOnly:true,resourceBytesAreLogicalEstimates:true,resourceCategoriesMayOverlap:true,lastCheckpointIsNotExactCrashTime:true,diagnosticOverheadPresent:true}};
   beginRunTrace(report);
   window.__cryptoidLabRun = report;
   remember(report);
   primeGameAudio();
   navigate('/game');
 }
 return <main className="lab-menu"><section><p className="lab-eyebrow">CRYPTOID EVOLUTION · SEPARATE DIAGNOSEVERSION</p><h1>Speicherlabor</h1>
   <p>Spielen mit einer kleinen Live-Anzeige und einem Verlauf. Diese eigene Testadresse verwendet keine echten Konten, Käufe oder Online-Spielstände.</p>
   <div className="lab-limit"><strong>Gesamter Browser-RAM ist auf dem iPhone nicht messbar.</strong><p>Die Grafik zeigt geschätzte Bild-, Canvas- und Audiobestände. Sie ist keine Messung des gesamten Arbeitsspeichers. Ein zusätzlicher ungefährer JavaScript-Wert erscheint nur, wenn der Browser ihn bereitstellt.</p></div>
   <p>Die Anzeige startet klein und transparent. Mit + öffnest du die Details. Rot markiert einen deutlichen Anstieg gegenüber dem Anfang dieses Laufs: mindestens 50 % und 8 MiB mehr, beim JS-Heap 16 MiB mehr. Die Referenz entsteht aus drei aktiven Messpunkten nach 10 Sekunden. Das sind Vergleichsmarken, keine gemessenen RAM-Grenzen.</p>
   <label>Startpunkt<select aria-label="Startpunkt" disabled={preparation==='preparing'} value={scene} onChange={e=>chooseScene(e.target.value)}>
     <option value="normal">Level 1 · normaler Spielstart</option>
     <option value="turrets">Boss 2 · mit Geschützen</option>
     <option value="last-turret">Boss 2 · letztes Geschütz</option>
     <option value="reactor">Boss 2 · Reaktor bei 55 %</option>
   </select></label>
   {scene==='last-turret' && <p className="lab-note">Das mittlere Geschütz hat noch einen Treffer übrig. Der Bericht speichert seinen Abschuss, die Reaktoröffnung, die erste Salve und die ersten Begleitschiffe.</p>}
   <label className="lab-check"><input type="checkbox" checked={protection} onChange={e=>setProtection(e.target.checked)}/>Testschutz gegen Lebensverlust</label>
   <p className="lab-note">Testschutz ist eine künstliche Messhilfe. Er ist anfangs aus und verhindert nicht die Zerstörung des Bosses. Der direkte Bossstart ist eine vorbereitete Testszene; Level 1 verwendet den normalen Ablauf.</p>
   <p>Die Anzeige aktualisiert alle 5 Sekunden. Bis zu 30 Minuten Verlauf bleiben lokal gespeichert, sofern der Browser Speicher erlaubt. Nach einem Abbruch öffnest du dieselbe Adresse erneut. Der letzte gesicherte Punkt ist kein sekundengenauer Absturzzeitpunkt.</p>
   <p>Der Bericht hält auch Seitenwechsel, sichtbare Programmfehler und Hinweise auf einen Seitenneustart fest.</p>
   {last && <section className="lab-last">
     <h2>Letzter gesicherter Lauf</h2>
     {last.identity?.gameRules !== 'current-testnet-rules' && <p>Dieser Bericht stammt aus der früheren Laborversion mit abweichendem Spielmodus. Er bleibt zum Speichern verfügbar.</p>}
     {point
       ? <p>Spieluhr {clock(point.activeMs)} · Laufzeit {clock(point.wallMs)} · Level {point.level ?? '–'}{point.bossId ? ` · Boss ${point.bossId}` : ''}</p>
       : <p>Der Lauf hat noch keinen Messpunkt.</p>}
     <RunStatus report={last}/>
     <Export report={last}/>
     <label className="lab-check"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>Den letzten lokalen Bericht durch einen neuen Lauf ersetzen</label>
   </section>}
   {preparation!=='ready'&&<button className="lab-primary" disabled={preparation==='preparing'||(!!last&&!confirmed)} onClick={()=>void prepare()}>{preparation==='preparing'?'Test wird vorbereitet …':preparation==='failed'?'Vorbereitung erneut versuchen':'Test vorbereiten'}</button>}
   {preparation==='ready'&&<button className="lab-primary" disabled={!!last&&!confirmed} onClick={start}>Testspiel starten</button>}
   <p className="lab-note">Die benötigten Bilder werden zuerst geladen. Jede Szene öffnet angehalten; erst dein Antippen von „Fortsetzen“ startet das Spiel.</p>
   <p className="lab-note">Quelle: {identity.baseRuntime.slice(0,8)} · Diagnose {identity.sourceCommit.slice(0,8)}. Der Monitor verändert die Messbedingungen etwas; ein bestandener Lauf beweist noch keinen White-Screen-Fix.</p>
 </section></main>;
}
function Graph({samples,reference}){
 const series=[['paintedBytes','#66d9ef','Bildcache ~'],['canvasCacheBytes','#b8a1ff','Effektcache ~'],['domCanvasLogicalBytes','#ee9dcf','Canvas-Flächen ~'],['audioBufferBytes','#ffc36b','Audio-PCM ~'],['heapBytes','#f4fafb','JS-Heap ≈']];
 const maximum=Math.max(1048576,...samples.flatMap(s=>series.map(([k])=>finite(s[k])??0)))*1.1;
 return <div className="lab-graph"><div className="lab-scale">Verlauf · 0–{(maximum/1048576).toFixed(0)} MiB</div><svg viewBox="0 0 300 70" role="img" aria-label="Verlauf geschätzter Teilressourcen, kein Gesamt-RAM"><path d="M0 0V70H300" stroke="#476173" fill="none"/>{series.map(([key,color])=><path key={key} d={chartPath(samples,key,300,70,maximum)} stroke={resourceHigh(samples.at(-1)?.[key],key,reference)?'#ff596d':color} strokeWidth="1.5" fill="none"/>)}</svg><div className="lab-legend">{series.filter(([key])=>samples.some(s=>s[key]!==null)).map(([key,color,name])=><span key={key} style={{color}}>{name}</span>)}</div><small>{clock(samples[0]?.wallMs)}–{clock(samples.at(-1)?.wallMs)} echte Laufzeit</small></div>;
}
const COMPACT_RESOURCES=[['heapBytes','JS'],['paintedBytes','Bilder'],['domCanvasLogicalBytes','Canvas'],['audioBufferBytes','Ton']];
const DETAIL_RESOURCES=[['heapBytes','JS-Heap ≈'],['paintedBytes','Bildcache ~'],['canvasCacheBytes','Effektcache ~'],['domCanvasLogicalBytes','Canvas-Flächen ~'],['audioBufferBytes','Audio-PCM ~']];
function ResourceRows({point,reference,compact=false}){
 return (compact?COMPACT_RESOURCES:DETAIL_RESOURCES).map(([field,label])=>{const high=resourceHigh(point?.[field],field,reference);return <Fragment key={field}><dt>{label}</dt><dd data-resource={field} data-high={high?'true':'false'} className={high?'lab-value-high':undefined} title={high?'Deutlich über der Referenz dieses Laufs; keine RAM-Grenze':undefined}>{compact&&finite(point?.[field])===null?'—':memoryMiB(point?.[field])}</dd></Fragment>;});
}
function Panel(){
 const report=useRef(window.__cryptoidLabRun),started=useRef(performance.now()),[point,setPoint]=useState(null),[expanded,setExpanded]=useState(false),[stored,setStored]=useState(true),[fault,setFault]=useState(false);
 useEffect(()=>{
   let stopped=false;
   const tick=()=>{if(stopped)return;const read=window.__cryptoidLabRead;if(typeof read!=='function')return;
     try{const sample=cleanSample(read(),performance.now()-started.current);appendSample(report.current,sample);setStored(remember(report.current));setPoint(sample);setFault(false);}catch{setFault(true);}
   };
   tick();const timer=setInterval(tick,SAMPLE_MS);document.addEventListener('visibilitychange',tick);
   return ()=>{stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',tick);};
 },[]);
 const value=k=>point?.[k]??'–';
 const reference=report.current?.reference,high=RESOURCE_FIELDS.some(field=>resourceHigh(point?.[field],field,reference));
 return <aside className={`lab-monitor${expanded?'':' lab-monitor-small'}`} aria-label="Live-Ressourcenmonitor" data-lab-monitor="true" data-expanded={expanded?'true':'false'}>
   <header><strong className={high?'lab-value-high':undefined}>{high?'ANSTIEG':'DIAGNOSE'} · {clock(point?.activeMs)}</strong><button aria-label={expanded?'Monitor verkleinern':'Monitor vergrößern'} onClick={()=>setExpanded(v=>!v)}>{expanded?'−':'+'}</button></header>
   <div className="lab-monitor-content"><p className="lab-clock">Echt {clock(point?.wallMs)}{expanded?` · ${point?.status??'lädt …'}`:''}</p>
   {!expanded&&<dl className="lab-mini"><ResourceRows compact point={point} reference={reference}/></dl>}
   {expanded&&<><dl><ResourceRows point={point} reference={reference}/><dt>DOM / Animationen</dt><dd>{value('domNodes')} / {value('pacedActive')}</dd><dt>Geschosse / Effekte</dt><dd>{point?(point.playerShots??0)+(point.enemyShots??0):'–'} / {value('effects')}</dd></dl>
     <p>Level {value('level')}{point?.bossId?` · Boss ${point.bossId} · Kern ${finite(point.reactorPercent)===null?'–':point.reactorPercent.toFixed(0)} %`:''}</p><Graph samples={report.current?.samples??[]} reference={reference}/><p className="lab-note">{reference?'Rot = deutlicher Anstieg zur Referenz.':'Referenz wird nach der Startphase erfasst.'} Teilwerte können sich überlappen.</p></>}
   <p className="lab-total">Gesamt-RAM: nicht messbar</p>
   {point?.unobservedGapMs>0&&expanded&&<p className="lab-warning">Beobachtungslücke: {clock(point.unobservedGapMs)}</p>}
   {!stored&&<p className="lab-warning" role="status">Lokales Speichern fehlgeschlagen.</p>}
   {fault&&<p className="lab-warning" role="status">Messpunkt derzeit nicht verfügbar.</p>}
   </div>
 </aside>;
}
function LabGame() {
 useEffect(() => () => {
   window.__cryptoidLabWarmRelease?.();
   delete window.__cryptoidLabWarmRelease;
   window.__cryptoidLabWarmHandoff = false;
 }, []);
 if (window.__cryptoidLabRun?.state !== 'running') return <Navigate to="/" replace/>;
 return <><Suspense fallback={<div className="lab-menu"><p>Spielszene wird geladen …</p></div>}><Game/></Suspense><Panel/></>;
}
function LabRouteError() {
 const error = useRouteError();
 const navigate = useNavigate();
 const activeRun = window.__cryptoidLabRun;
 useEffect(() => {
   if (activeRun?.state !== 'running') return;
   noteFault('render-error', error, {surface: 'lab-route'});
   activeRun.state = 'failed';
   remember(activeRun);
 }, [activeRun, error]);
 return <main className="lab-menu"><section role="alert">
   <h1>Spiel unterbrochen</h1>
   <p>Die Spielansicht konnte nicht weiter angezeigt werden. Du kannst den Bericht hier herunterladen.</p>
   <Export report={activeRun ?? currentReport()}/>
   <button className="lab-primary" onClick={() => navigate('/', {replace: true})}>Zur Laborübersicht</button>
 </section></main>;
}
const router = createBrowserRouter([
 {path: '/', element: <Menu/>, errorElement: <LabRouteError/>},
 {path: '/game', element: <LabGame/>, errorElement: <LabRouteError/>},
 {path: '*', element: <Menu/>, errorElement: <LabRouteError/>},
]);
let previousPath = router.state.location.pathname;
router.subscribe(({location, historyAction}) => {
 const path = location.pathname;
 if (path === previousPath) return;
 if (path === '/game') noteLifecycle('game-monitor-start', {route: 'game', historyAction});
 if (previousPath === '/game') {
   const report = window.__cryptoidLabRun;
   if (report?.state === 'running') {
     noteLifecycle('game-monitor-stop', {route: path === '/' ? 'home' : 'other', historyAction});
     report.state = 'stopped';
     remember(report);
   }
 }
 previousPath = path;
});
export default function App(){useEffect(watchMenuViewport,[]);return <RouterProvider router={router}/>;}
