import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
import { observeSessionDiagnostics, sessionDiagnostic } from '../lib/sessionDiagnosticEvents.ts';
import { cleanPauseDiagnostic, recordPauseEvidence, PAUSE_REASONS } from './pauseDiagnostics.ts';
import { cleanFullRecord } from './fullSessionFormat.ts';
import { createCrashTail, readCrashTails } from './crashTail.ts';
import { createFullSessionRecorder } from './fullSessionRecorder.ts';
import { settleFullSessionWrites, readFullSessionSummaries, exportFullSession } from './fullSessionStore.ts';
import { IDBFactory } from 'fake-indexeddb';
import { restorePauseEvidenceChanges, pauseEvidenceChanges } from '../../scripts/pauseEvidenceReviewedChanges.mjs';
const state = { status: 'playing', sector: 20, phase: 'ATTACK_CYCLE', encounter: 'boss-fight', token: 'private-state' };
const host = { performance: { now: () => 12_000 }, document: { hidden: false, hasFocus: () => true } };
test('pause evidence never acquires a host without verified ownership, an observer and a playing transition', () => {
  const forbidden = () => { throw Error('Host must not be acquired'); };
  assert.doesNotThrow(() => recordPauseEvidence(false, 'blur', state, 2, forbidden));
  assert.doesNotThrow(() => recordPauseEvidence(true, 'blur', state, 2, forbidden));
  const rows = [], stop = observeSessionDiagnostics((kind, data) => rows.push({kind, data}));
  try { recordPauseEvidence(false, 'blur', state, 2, forbidden); recordPauseEvidence(true, 'blur', {...state,status:'paused'}, 2, forbidden); }
  finally { stop(); }
  assert.equal(rows.length, 0);
});
test('all actual reason codes survive cleaning while raw errors, state arrays and identity are excluded', () => {
  for (const pauseReason of PAUSE_REASONS) {
    const data = cleanPauseDiagnostic({ ...state, operation:'pause-enter', pauseReason, frameGapMs:3001,
      targetStatus:'playing', error:'private-error', coordinate:55, url:'private-url', children:[state] });
    assert.equal(data.pauseReason, pauseReason); assert.equal(data.status, 'playing'); assert.equal(data.targetStatus, 'paused');
    assert.ok(!JSON.stringify(data).includes('private')); assert.equal(data.children, undefined);
    assert.ok(cleanFullRecord({seq:1,at:1,clockMs:1,kind:'pause',data}));
  }
  assert.equal(cleanPauseDiagnostic({...state,operation:'pause-enter',pauseReason:'private-unknown'}), null);
});
test('observing a pause records the measured gap without mutating play state or propagating observer faults', () => {
  const rows=[], stop=observeSessionDiagnostics((kind,data)=>{ rows.push({kind,data}); throw Error('Broken observer'); });
  const original=structuredClone(state);
  try { assert.doesNotThrow(()=>recordPauseEvidence(true,'loop-stall',state,8_000,()=>host)); }
  finally { stop(); }
  assert.deepEqual(state, original); assert.equal(rows.at(-1).data.frameGapMs,4000);
  assert.equal(rows.at(-1).data.hidden,false); assert.equal(rows.at(-1).data.focused,true);
});
test('pause entry survives immediate recorder and crash-tail persistence with its reason', async () => {
  const values=new Map(), storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const ownerHost={indexedDB:new IDBFactory(),localStorage:storage,sessionStorage:storage};
  const full=createFullSessionRecorder(true,()=>ownerHost,{build:{sourceCommit:'a'.repeat(40),sourceTree:'b'.repeat(40),workingTreeDirty:false},now:()=>1,wallNow:()=>100});
  const tail=createCrashTail(true,()=>ownerHost,{id:'pause-test',build:{},now:()=>1,wallNow:()=>100});
  full.start();tail.frame({...state});
  const stop=observeSessionDiagnostics((kind,data)=>tail.record(kind,data));
  try { sessionDiagnostic('pause',{...state,operation:'pause-enter',pauseReason:'blur',privateValue:'private'}); }
  finally { stop(); }
  await settleFullSessionWrites();
  const report=readCrashTails(ownerHost);assert.equal(report.sessions[0].events.at(-1).data.pauseReason,'blur');
  const summary=(await readFullSessionSummaries(ownerHost)).sessions[0];
  const capture=JSON.parse(await (await exportFullSession(ownerHost,summary.id)).text());
  assert.equal(capture.records.find(r=>r.kind==='pause').data.pauseReason,'blur');
  assert.ok(!JSON.stringify(capture).includes('private'));
  full.finish();tail.finish();await settleFullSessionWrites();
});
test('exact pause additions restore the complete published controller and reject hidden runtime mutations', () => {
  const source=readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
  const hash=s=>createHash('sha256').update(s).digest('hex');
  const original='625fecc2cb959e4ed4ba690f7867d0a07b247b9a136a8ce308afecaf6dcd94fa';
  assert.equal(hash(restorePauseEvidenceChanges(source)), original);assert.equal(pauseEvidenceChanges.length,12);
  const hidden=source.replace("recordPauseEvidence(ownerDiagnostics, 'blur',", "recordPauseEvidence(true, 'blur',");
  assert.notEqual(hidden,source);assert.throws(()=>restorePauseEvidenceChanges(hidden));
  const stall=source.replace('window.setInterval(callback, 500)','window.setInterval(callback, 1000)');
  assert.notEqual(hash(restorePauseEvidenceChanges(stall)),original);
});
test('actual focus, visibility and technical callback bodies report their distinct entry reasons', () => {
  const source=readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
  const ast=ts.createSourceFile('GamePage.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX), bodies={};
  const visit=node=>{
    if(ts.isVariableDeclaration(node)&&['blur','pauseAfterBackground'].includes(node.name.getText(ast))) bodies[node.name.getText(ast)]=node.initializer.getText(ast);
    if(ts.isBinaryExpression(node)&&node.left.getText(ast)==='interruptionRef.current')bodies.technical=node.right.getText(ast);
    ts.forEachChild(node,visit);
  };visit(ast);
  for(const [index,[name,hidden,expected]] of [['blur',false,'blur'],['pauseAfterBackground',true,'visibility-hidden'],['pauseAfterBackground',false,'background-return'],['technical',false,'loop-stall']].entries()) {
    const rows=[], stop=observeSessionDiagnostics((kind,data)=>{if(kind==='pause')rows.push(data);});
    const s={...state,hearts:3,score:10,shards:5,asteroids:[],effects:[],shots:[],enemyShots:[]};
    const doc={visibilityState:hidden?'hidden':'visible',hidden,hasFocus:()=>name!=='blur'};
    const context={ownerDiagnostics:true,stateRef:{current:s},lastFrameRef:{current:8000},backgroundHiddenAtRef:{current:1},
      slowFramesRef:{current:0},document:doc,performance:{now:()=>14000+index*1000},Date:{now:()=>5000},
      recordPauseEvidence:(...args)=>recordPauseEvidence(...args,()=>({performance:{now:()=>14000+index*1000},document:doc})),
      clearControls(){},setGame(){},setSaveNotice(){},saveCombatRef:{current:async()=>{}},
      soundRef:{current:{setPaused(){}}},musicRef:{current:{pause(){}}},performanceProbeRef:{current:null},
      recordReloadEvent(){},setTechnicalPause(){},setWeaponCountdown(){},setWeaponMenuOpen(){},recordGameDiagnostic(){},
      sectorInChapter:()=>10,lastSavedAtRef:{current:0},lastMeasuredFrameRef:{current:0},fieldSizeRef:{current:{width:412,height:839}},navigator:{userAgent:'synthetic'}};
    try {
      assert.ok(bodies[name]);
      const js=ts.transpileModule('const callback='+bodies[name]+';callback('+(name==='technical'?"'loop-stall'":'')+');',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
      vm.runInNewContext(js,context);
      assert.equal(s.status,'paused');assert.equal(rows.length,1);assert.equal(rows[0].pauseReason,expected);assert.equal(rows[0].status,'playing');
    } finally { stop(); }
  }
});
