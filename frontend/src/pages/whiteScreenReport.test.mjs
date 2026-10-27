import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import axios from 'axios';
import { createOwnerFlightRecorder } from './ownerFlightRecorder.ts';
import { readCrashTails } from './crashTail.ts';
import { exportOwnerFullSession } from './stabilityReport.mjs';
import { readFullSessionSummaries,settleFullSessionWrites } from './fullSessionStore.ts';
import { sessionDiagnostic,observeSessionDiagnostics,sessionDiagnosticsActive } from '../lib/sessionDiagnosticEvents.ts';
import { installSessionRequestDiagnostics } from '../lib/sessionRequestDiagnostics.ts';
function fixture(database=true){
 let now=0,wall=1000000;const data=new Map();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const host={localStorage:storage,sessionStorage:storage,...database?{indexedDB:new IDBFactory()}:{}},build={sourceCommit:'a'.repeat(40),sourceTree:'b'.repeat(40),workingTreeDirty:true};
 const context={sector:90,phase:'ATTACK_CYCLE',encounter:'boss-fight',status:'playing',enemies:1};
 const probe=createOwnerFlightRecorder(true,()=>host,{build,now:()=>now,wallNow:()=>wall,fullContext:()=>context});
 return{host,probe,context,data,advance(ms){now+=ms;wall+=ms;},frame(){probe.begin(now,context);probe.end(now);}};
}
test('one report keeps committed history separate from the synchronous last seconds even without unload',async()=>{
 const f=fixture();f.frame();f.advance(2000);f.frame();await settleFullSessionWrites();
 const [summary]=(await readFullSessionSummaries(f.host)).sessions;
 f.advance(37);sessionDiagnostic('boundary',{operation:'boss-summary-cleanup-before',sector:90});
 f.advance(1);f.probe.lifecycle('render-error',new TypeError('PRIVATE message'));
 const tail=readCrashTails(f.host).sessions[0];assert.equal(tail.id,summary.id);assert.equal(tail.state,'recording');
 const replacement={...f.host};const file=await exportOwnerFullSession(async()=>({canAdmin:true}),()=>replacement,summary.id);
 const report=JSON.parse(await file.text());
 assert.equal(report.integrity.contiguous,true);assert.ok(report.records.length>0);
 assert.equal(report.crashEvidence.tail.id,summary.id);assert.equal(report.crashEvidence.observedTailIsNotCommittedHistory,true);
 assert.ok(report.crashEvidence.tail.events.some(r=>r.data.operation==='boss-summary-cleanup-before'));
 assert.ok(report.crashEvidence.tail.events.some(r=>r.data.kind==='render-error'));
 assert.ok(report.crashEvidence.latestObservedAt>=report.crashEvidence.latestCommittedAt);
 assert.ok(report.crashEvidence.technical);assert.ok(report.crashEvidence.lifecycle);assert.ok(!JSON.stringify(report).includes('PRIVATE'));
 f.probe.finish();await settleFullSessionWrites();
});
test('a database failure cannot stop the independent tail and its explicit partial export',async()=>{
 const f=fixture(false);f.frame();await settleFullSessionWrites();
 f.advance(100);sessionDiagnostic('request',{operation:'failure',endpoint:'weapon',httpStatus:409,errorCode:'save_before_activation'});
 const tail=readCrashTails(f.host).sessions[0];assert.equal(sessionDiagnosticsActive(),true);
 const file=await exportOwnerFullSession(async()=>({canAdmin:true}),()=>f.host,tail.id),report=JSON.parse(await file.text());
 assert.equal(report.fullSessionUnavailable,true);assert.equal(report.records,null);assert.equal(report.crashEvidence.latestCommittedAt,null);
 assert.equal(report.crashEvidence.tail.errors.at(-1).data.errorCode,'save_before_activation');
 f.probe.finish();assert.equal(sessionDiagnosticsActive(),false);
});
test('a resumed paused boss summary starts capture without pretending simulation has resumed',async()=>{
 const f=fixture();f.context.status='paused';f.context.encounter='bonus';
 sessionDiagnostic('boundary',{operation:'boss-summary-open',sector:90,status:'paused'});
 await settleFullSessionWrites();const [summary]=(await readFullSessionSummaries(f.host)).sessions;
 assert.ok(summary);assert.equal(readCrashTails(f.host).sessions[0].id,summary.id);
 assert.equal(readCrashTails(f.host).sessions[0].events[0].data.operation,'boss-summary-open');
 f.probe.finish();await settleFullSessionWrites();
});
test('actual response observation preserves rejection identity and stores only fixed error codes and request ids',async()=>{
 const events=[],release=observeSessionDiagnostics((kind,details)=>events.push({kind,details}));
 const error=new Error('PRIVATE');const client=axios.create({adapter:async config=>{error.config=config;error.response={status:409,data:{error:'save_before_activation',token:'PRIVATE'},headers:{'x-vercel-id':'fra1::abc-123','x-cryptoid-upstream-request-id':'cdg1::upstream-456',cookie:'PRIVATE'}};throw error;}});
 installSessionRequestDiagnostics(client);await assert.rejects(client.post('/hangar/weapon/activate',{uid:'PRIVATE'}),e=>e===error);release();
 const event=events.find(e=>e.details.operation==='failure').details;
 assert.equal(event.errorCode,'save_before_activation');assert.equal(event.providerRequestId,'fra1::abc-123');assert.equal(event.httpStatus,409);assert.equal(event.upstreamRequestId,'cdg1::upstream-456');
 assert.ok(!JSON.stringify(events).includes('PRIVATE'));assert.ok(!JSON.stringify(events).includes('cookie'));
});
test('the verified owner export joins a small document-origin discrepancy without altering committed history',async()=>{
 const f=fixture();f.host.performance={timeOrigin:900000};
 try{
  f.frame();f.advance(2000);f.frame();await settleFullSessionWrites();
  const [summary]=(await readFullSessionSummaries(f.host)).sessions;
  const sourceCommit='a'.repeat(40);
  f.data.set('cryptoid_owner_lifecycle_v1',JSON.stringify({version:1,events:[
   {kind:'document-start',at:950000,documentStartedAt:900003,sourceCommit,route:'home'},
   {kind:'document-start',at:1100100,documentStartedAt:1100000,previousDocumentStartedAt:900003,sourceCommit,route:'home'},
  ]}));
  let verifications=0;
  const file=await exportOwnerFullSession(async()=>{verifications++;return{canAdmin:true};},()=>f.host,summary.id);
  const report=JSON.parse(await file.text()),boundary=report.crashEvidence.recoveryBoundary;
  assert.equal(verifications,1);assert.equal(report.integrity.contiguous,true);
  assert.equal(report.summary.count,summary.count);assert.equal(report.records.length,summary.count);
  assert.equal(report.crashEvidence.tail.documentStartedAt,900000);
  assert.equal(boundary.status,'replacement-without-lifecycle-signal');
  assert.equal(boundary.documentStartOffsetMs,3);assert.equal(boundary.lifecycleDocumentStartedAt,900003);
  assert.equal(boundary.homeObservedAt,1100100);assert.equal(boundary.nativeCauseKnown,false);
  assert.equal(boundary.whitePixelsObserved,false);assert.equal(report.crashEvidence.observedTailIsNotCommittedHistory,true);
 }finally{f.probe.finish();await settleFullSessionWrites();}
});
