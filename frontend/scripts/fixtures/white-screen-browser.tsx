// Local verification fixture. Never imported by the application or deployed.
import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import BossIntermission from '../../src/pages/BossIntermission';
import AdminPlayers from '../../src/pages/AdminPlayers';
import {axiosClient} from '../../src/lib/axiosClient';
import {createOwnerFlightRecorder} from '../../src/pages/ownerFlightRecorder';
import {sessionDiagnostic} from '../../src/lib/sessionDiagnosticEvents';
import {readOwnerStabilityReport,exportOwnerFullSession} from '../../src/pages/stabilityReport.mjs';
import {settleFullSessionWrites} from '../../src/pages/fullSessionStore';
import {releaseIdleCanvasEffects} from '../../src/pages/CanvasEffects';
import {releaseUnusedPaintedShips} from '../../src/pages/paintedShip';
import '../../src/index.css';
import '../../src/missionDialogMobile.css';
import '../../src/gameViewport.css';
import '../../src/locales/typography.css';
import '../../src/pages/admin.css';
const summary={stage:10,score:100,shards:12,destroyed:10,hearts:3,combos:2};
const verify=async()=>(await axiosClient.get('/admin/status')).data;
const fixture={
 report:null as unknown,
 startRecording(){
  const context={sector:90,phase:'ATTACK_CYCLE',encounter:'boss-fight',status:'playing',enemies:1};
  const probe=createOwnerFlightRecorder(true,()=>window,{build:{sourceCommit:'a'.repeat(40),sourceTree:'b'.repeat(40),workingTreeDirty:true},now:()=>performance.now(),wallNow:()=>Date.now(),fullContext:()=>context});
  probe!.begin(performance.now(),context);probe!.end(performance.now());return settleFullSessionWrites();
 },
 finalObservation(){sessionDiagnostic('request',{operation:'failure',endpoint:'weapon',httpStatus:409,errorCode:'save_before_activation',providerRequestId:'fra1::browser-test',upstreamRequestId:'cdg1::browser-test'});},
 async recover(){const report=await readOwnerStabilityReport(verify,()=>window);const id=report!.crashTail!.sessions[0].id;const file=await exportOwnerFullSession(verify,()=>window,id);fixture.report=JSON.parse(await file!.text());return fixture.report;},
};
Object.assign(window,{cryptoidVerification:fixture});
function BossCase(){
 const [prepared,setPrepared]=useState(false),[failed,setFailed]=useState(false),[status,setStatus]=useState('paused'),[busy,setBusy]=useState(false);
 const prepare=async()=>{setBusy(true);setFailed(false);try{const boot=await axiosClient.get('/_fixture/run');await axiosClient.post('/progress/boss-summary/prepare',{runId:boot.data.runId,stage:10});const saved=await axiosClient.get('/progress/me');if(saved.data.save.mission.bossIntermission.stage!==10)throw Error('checkpoint missing');if(!releaseIdleCanvasEffects())throw Error('consumers active');releaseUnusedPaintedShips();setPrepared(true);}catch{setFailed(true);}finally{setBusy(false);}};
 useEffect(()=>{void prepare();},[]);
 const resume=async()=>{setBusy(true);try{const boot=await axiosClient.get('/_fixture/run');await axiosClient.post('/progress/boss-summary/continue',{runId:boot.data.runId,stage:10,confirm:true});setStatus('playing');}catch{setFailed(true);}finally{setBusy(false);}};
 return <main className="game-shell"><output data-testid="status">{status}</output><output data-testid="prepared">{String(prepared)}</output>{status==='paused'&&<BossIntermission summary={summary} prepared={prepared} saving={busy} failed={failed} continuing={false} onRetry={()=>{void prepare();}} onContinue={()=>{void resume();}}/>}</main>;
}
createRoot(document.getElementById('root')!).render(location.pathname==='/admin-test'?<main className="admin-shell"><AdminPlayers/></main>:location.pathname==='/boss-test'?<BossCase/>:<p>Controlled recorder verification</p>);
