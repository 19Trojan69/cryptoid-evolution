import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { createFullSessionRecorder } from './fullSessionRecorder.ts';
import { exportFullSession, readFullSessionStatus, readFullSessionSummaries, settleFullSessionWrites } from './fullSessionStore.ts';
import { FULL_SESSION_STATUS_KEY, cleanFullData } from './fullSessionFormat.ts';
import { sessionDiagnostic, sessionDiagnosticsActive } from '../lib/sessionDiagnosticEvents.ts';
import { hullSourceJob, hullVariantJob, hullPreparationStep } from './hullPreparationDiagnostics.ts';
import { staticHullHost, until } from '../../scripts/staticHullHost.mjs';
import { assertObservationOnly } from '../../scripts/fullSessionScope.mjs';
import { readFileSync } from 'node:fs';

test('ordinary players allocate no graphics job or breadcrumb', () => {
  assert.equal(sessionDiagnosticsActive(),false);
  assert.equal(hullSourceJob('/ships/evolution/ship_01_stage_1.png'),undefined);
  assert.equal(hullVariantJob(0,'gold',1),undefined);
  assert.doesNotThrow(()=>hullPreparationStep('variant-ready',undefined));
});

test('actual image callbacks distinguish loading, optional decode and readiness with a stable numeric job', async t => {
  const f=await staticHullHost({holdLoads:true,holdDecode:true}),events=[];
  const stop=f.api.__qaObserve((kind,data)=>events.push({kind,data}));t.after(stop);
  const plan=f.api.retainPreparedHulls([{sprite:7,color:'gold',stage:1}]);t.after(()=>plan.release());
  await until(()=>f.loads.length===1);
  assert.deepEqual(events.map(x=>x.data.step),['variant-create-before','variant-load-start']);
  await f.loads.shift().load();await until(()=>f.decodes.length===1);
  assert.equal(events.at(-1).data.step,'variant-decode-before');
  assert.equal(f.api.paintedShipResourceStats().painted,0);
  f.decodes.shift().resolve();assert.deepEqual([...await plan.settled],[true]);
  assert.deepEqual(events.map(x=>x.data.step),['variant-create-before','variant-load-start','variant-loaded',
    'variant-decode-before','variant-decode-after','variant-ready']);
  assert.equal(new Set(events.map(x=>x.data.imageJob)).size,1);
  assert.ok(events.every(x=>x.kind==='boundary'&&x.data.sprite===7&&x.data.hullStage===1&&Number.isSafeInteger(x.data.paintIndex)));
  assert.equal(JSON.stringify(events).includes('/ships/'),false);
});

test('actual raw-source readback and temporary-surface release are individually observable', async t => {
  const f=await staticHullHost({holdLoads:true}),events=[];
  t.after(f.api.__qaObserve((kind,data)=>events.push(data)));
  f.api.preloadHullSources(['/ships/evolution/ship_08_stage_1.png']);
  assert.deepEqual(events.map(x=>x.step),['source-create-before','source-load-start']);
  await f.loads.shift().load();
  assert.deepEqual(events.map(x=>x.step),['source-create-before','source-load-start','source-loaded',
    'source-center-before','source-center-after','source-ready','source-surface-release-before','source-surface-released']);
  assert.equal(f.counters.liveCanvasBytes,0);assert.equal(f.counters.readbacks,1);
  assert.ok(events.every(x=>x.sprite===7&&x.hullStage===1));
});

test('load and decode failures preserve retry/fallback behavior and cannot publish a ready image', async t => {
  for(const failure of ['failLoad','failDecode']){
    const f=await staticHullHost({[failure]:1}),events=[];
    t.after(f.api.__qaObserve((kind,data)=>events.push(data)));
    const hull={sprite:7,color:'gold',stage:1},plan=f.api.retainPreparedHulls([hull]);
    assert.deepEqual([...await plan.settled],[false]);plan.release();
    assert.equal(events.some(x=>x.step==='variant-ready'),false);
    assert.equal(events.some(x=>x.step==='variant-load-failed'),failure==='failLoad');
    assert.equal(events.some(x=>x.step==='variant-decode-after'),false);
    const retry=f.api.retainPreparedHulls([hull]);assert.deepEqual([...await retry.settled],[true]);retry.release();
    assert.equal(events.at(-1).step,'variant-ready');assert.equal(f.api.paintedShipResourceStats().pending,0);
  }
});

test('scope proof rejects hidden cache mutations and side effects in a diagnostic argument', () => {
  const source=readFileSync(new URL('./paintedShip.ts',import.meta.url),'utf8');
  const changed=source.replace('new ResourceCache<string>(24,','new ResourceCache<string>(23,');
  assert.notEqual(changed,source);
  assert.throws(()=>assertObservationOnly({'src/pages/paintedShip.ts':changed}),/only exact observation/);
  const hidden=source.replace('hullVariantJob(index, colorId, stage)','hullVariantJob(++index, colorId, stage)');
  assert.throws(()=>assertObservationOnly({'src/pages/paintedShip.ts':hidden}),/one exact diagnostic addition/);
});

function fixture(t) {
  let time = 0, writes = 0;
  const values = new Map();
  const host = { indexedDB: new IDBFactory(), localStorage: {
    getItem: key => values.get(key) ?? null,
    setItem: (key,value) => { writes++; values.set(key,value); },
  } };
  const recorder = createFullSessionRecorder(true, () => host, {
    build: { sourceCommit: 'a'.repeat(40), sourceTree: 'b'.repeat(40), workingTreeDirty: false },
    now: () => time, wallNow: () => 1792693242974 + time,
  });
  t.after(async()=>{recorder.finish();await settleFullSessionWrites();});
  const note = (step, extra={}) => sessionDiagnostic('boundary', {
    operation:'hull-plan-progress',step,imageJob:1,sprite:7,hullStage:1,paintIndex:3,...extra,
  });
  return {host,values,recorder,note,advance:ms=>{time+=ms;},writes:()=>writes};
}

test('the last graphics step survives a later phase breadcrumb and is explicitly separate from committed records', async t => {
  const f=fixture(t);f.recorder.start();await settleFullSessionWrites();
  f.note('variant-decode-before');f.advance(7);
  f.recorder.event({kind:'phase-start',sector:55,phase:'SECTOR_INTRO',encounter:'normal',status:'playing'});
  const status=readFullSessionStatus(f.host);
  assert.equal(status.lastGraphics.data.step,'variant-decode-before');
  assert.equal(status.lastGraphics.data.imageJob,1);
  assert.equal(status.lastObserved.data.kind,'phase-start');
  assert.ok(status.lastGraphics.seq>status.lastCommittedSeq,'synchronous observation is not an IDB commit');
  await settleFullSessionWrites();
  const {sessions}=await readFullSessionSummaries(f.host);
  const data=JSON.parse(await (await exportFullSession(f.host,sessions[0].id)).text());
  assert.equal(data.integrity.contiguous,true);
  assert.equal(data.records.find(r=>r.data.operation==='hull-plan-progress').data.step,'variant-decode-before');
  assert.equal(data.storageStatus.lastGraphics.data.step,'variant-decode-before');
  f.recorder.finish();await settleFullSessionWrites();
});

test('graphics observations batch with existing flushes instead of creating one database transaction per image step', async t => {
  const f=fixture(t);f.recorder.start();await settleFullSessionWrites();
  const before=(await readFullSessionSummaries(f.host)).sessions[0];
  for(let i=1;i<=30;i++)f.note('variant-load-start',{imageJob:i});
  await settleFullSessionWrites();
  const waiting=(await readFullSessionSummaries(f.host)).sessions[0];
  assert.equal(waiting.lastSeq,before.lastSeq);assert.equal(waiting.chunks,before.chunks);
  assert.equal(readFullSessionStatus(f.host).lastGraphics.data.imageJob,30);
  f.recorder.sample({sector:55,phase:'SECTOR_INTRO',encounter:'normal',status:'playing',atMs:1,frames:1});
  await settleFullSessionWrites();
  const after=(await readFullSessionSummaries(f.host)).sessions[0];
  assert.equal(after.chunks,before.chunks+1);assert.equal(after.lastSeq,before.lastSeq+31);
  f.recorder.finish();await settleFullSessionWrites();
});

test('graphics schema admits only known steps and bounded numeric artwork identifiers, including its status marker', async t => {
  const f=fixture(t);f.recorder.start();await settleFullSessionWrites();
  f.note('source-load-start',{url:'https://private.invalid/?token=private-secret',wallet:'private-wallet',message:'private-error',
    imageJob:Infinity,sprite:-1,hullStage:44,paintIndex:999});
  let status=readFullSessionStatus(f.host);
  assert.equal(status.lastGraphics.data.step,'source-load-start');
  for(const key of ['imageJob','sprite','hullStage','paintIndex','url','wallet','message'])assert.equal(status.lastGraphics.data[key],undefined);
  assert.equal(JSON.stringify(status).includes('private-'),false);
  const clean=cleanFullData('boundary',{operation:'hull-plan-progress',step:'private-step',imageJob:1});
  assert.equal(clean.step,undefined);
  f.values.set(FULL_SESSION_STATUS_KEY,JSON.stringify({state:'recording',lastGraphics:{seq:3,at:1,clockMs:1,kind:'boundary',
    data:{operation:'transition-before',step:'variant-ready',url:'private-url'}}}));
  assert.equal(readFullSessionStatus(f.host).lastGraphics,undefined,'unrelated boundary cannot masquerade as graphics progress');
  f.recorder.finish();await settleFullSessionWrites();
});

test('denied breadcrumb storage and late image notifications cannot interrupt gameplay or resurrect a finished recorder', async t => {
  const f=fixture(t);f.recorder.start();await settleFullSessionWrites();
  f.host.localStorage.setItem=()=>{throw new Error('SecurityError private');};
  assert.doesNotThrow(()=>f.note('source-center-before'));
  f.recorder.finish();await settleFullSessionWrites();
  const count=f.recorder.stats().sequence;
  f.note('variant-ready');assert.equal(f.recorder.stats().sequence,count);
  assert.equal(sessionDiagnosticsActive(),false);
});

test('normal recorder cleanup leaves an immediate finish observation before its asynchronous database commit', async t => {
  const f=fixture(t);f.recorder.start();await settleFullSessionWrites();
  f.note('variant-ready');
  f.recorder.finish();
  const observed=readFullSessionStatus(f.host);
  assert.equal(observed.lastObserved.kind,'end');assert.equal(observed.lastObserved.data.operation,'finish');
  assert.ok(observed.lastObserved.seq>observed.lastCommittedSeq);
  assert.equal(observed.lastGraphics.data.step,'variant-ready');
  await settleFullSessionWrites();
  const {sessions}=await readFullSessionSummaries(f.host);
  assert.equal(sessions[0].state,'closed');
});

test('marker timing at clock zero cannot change starting versus recording state', async t => {
  const f=fixture(t);
  f.advance(10);f.note('source-load-start');
  assert.equal(readFullSessionStatus(f.host).state,'starting');
  f.advance(-10);f.recorder.start();
  assert.equal(readFullSessionStatus(f.host).state,'recording');
  await settleFullSessionWrites();
  assert.equal(readFullSessionStatus(f.host).state,'recording');
});
