import test from 'node:test';
import assert from 'node:assert/strict';
import { armOwnerTimingCapture, createOwnerTimingCapture } from './ownerTimingCapture.ts';
import { resourceTimingEnabled } from './performanceDiagnostics.ts';
import { cleanTimingCapture, readTimingCapture, OWNER_TIMING_ARM_KEY, OWNER_TIMING_KEY, OWNER_TIMING_MAX_BYTES } from './timingReport.mjs';
import { readOwnerStabilityReport } from './stabilityReport.mjs';
const build = { sourceCommit: 'a'.repeat(40), sourceTree: 'b'.repeat(40), workingTreeDirty: true };
const playing = { sector: 20, flight: 0, phase: 'ATTACK_CYCLE', encounter: 'boss-fight', status: 'playing',
  enemies: 0, attackers: 0, returning: 0, playerShots: 3, enemyShots: 4, effects: 1, rocks: 0, rockEffects: 0, pickups: 0 };
const fixture = () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key,value) => data.set(key,value), removeItem: key => data.delete(key) };
  return { data, host: { sessionStorage: storage, localStorage: storage, __cryptoidBootId: 'boot-test' } };
};
test('fresh owner check gates arming and an ordinary player never even obtains the host', async () => {
  const forbidden = () => { throw Error('storage accessed'); };
  for (const canAdmin of [undefined,false,'true']) await assert.rejects(armOwnerTimingCapture(async () => ({canAdmin}), forbidden), /owner_access_required/);
  assert.equal(await armOwnerTimingCapture(async () => ({canAdmin:true}), forbidden, () => false), false);
  assert.equal(createOwnerTimingCapture(false, forbidden, {build}), null);
  await assert.rejects(armOwnerTimingCapture(async () => { throw Error('401'); }, forbidden), /401/);
});
test('one-shot capture expires after 90 seconds, exposes no debug global and preserves only technical evidence', async () => {
  const { data, host } = fixture(); let now = 1000;
  await armOwnerTimingCapture(async () => ({canAdmin:true}), () => host, () => true, 5000);
  const probe = createOwnerTimingCapture(true, () => host, {build, now: () => now, wallNow: () => 6000,
    runtime: () => ({jobsStarted:2,materialTotalMs:7,longTasksSupported:false,username:'private-user'}) });
  assert.ok(probe); assert.equal(data.has(OWNER_TIMING_ARM_KEY), false);
  assert.equal(createOwnerTimingCapture(true, () => host, {build}), null);
  assert.equal(resourceTimingEnabled(), true);
  for (let i=0;i<100;i++) {
    now = 1000+i*1000;
    probe.begin(now,{...playing,username:'private-user',score:99999});
    probe.simulationStep(50,34);
    probe.pacing({frameGap:50,delta:34,slowFrames:8,paintInterval:50,requested:true,forced:false});
    now+=2; probe.mark('boss-motion-and-weapons'); probe.sceneRequested();
    const start=probe.sceneRenderBegin(); now+=3; probe.sceneCommitted(start); probe.end(now);
  }
  const capture=readTimingCapture(host);
  assert.equal(capture.finished,true); assert.equal(capture.metadata.sourceCommit,build.sourceCommit);
  assert.equal(capture.metadata.workingTreeDirty,true); assert.equal(capture.metadata.runtimeBaseline.materialTotalMs,7);
  assert.equal(capture.samples.reduce((n,s)=>n+s.pacing.frames,0),90);
  assert.equal(capture.samples.reduce((n,s)=>n+s.pacing.discardedMs,0),90*16);
  assert.ok(capture.samples.some(s=>s.work['boss-motion-and-weapons'].maxMs===2));
  assert.ok(capture.samples.some(s=>s.sceneCommitWaitP95Ms===3));
  assert.ok(data.get(OWNER_TIMING_KEY).length<OWNER_TIMING_MAX_BYTES);
  assert.ok(!data.get(OWNER_TIMING_KEY).includes('private-')); assert.ok(!data.get(OWNER_TIMING_KEY).includes('99999'));
  assert.equal(resourceTimingEnabled(),false);
  const saved=data.get(OWNER_TIMING_KEY); probe.hit('boss-hull'); probe.finish(); probe.sceneRequested();
  assert.equal(data.get(OWNER_TIMING_KEY),saved);
});
test('StrictMode cleanup before the first playing frame preserves the one-shot request', async () => {
  const {host,data}=fixture();
  await armOwnerTimingCapture(async()=>({canAdmin:true}),()=>host,()=>true,1000);
  const options={build,wallNow:()=>2000,now:()=>10};
  const first=createOwnerTimingCapture(true,()=>host,options);
  first.begin(10,{...playing,status:'loading'});first.finish();
  assert.equal(data.get(OWNER_TIMING_ARM_KEY),'1000');
  const second=createOwnerTimingCapture(true,()=>host,options);
  second.begin(10,playing);second.end(10);second.finish();
  assert.equal(data.has(OWNER_TIMING_ARM_KEY),false);
});
test('invalid, expired, future or denied arming fails closed',()=>{
  for(const raw of ['garbage','0','-1','5000000','1000']){
    const {host,data}=fixture();data.set(OWNER_TIMING_ARM_KEY,raw);
    assert.equal(createOwnerTimingCapture(true,()=>host,{build,wallNow:()=>1000000}),null);
  }
  const host={};Object.defineProperty(host,'sessionStorage',{get(){throw Error('blocked');}});
  assert.equal(createOwnerTimingCapture(true,()=>host,{build}),null);
});
test('bounded schema excludes private fields, malformed input and oversized storage; owner export includes capture', async()=>{
  const {host,data}=fixture();
  const input={environment:'owner-admin',metadata:{...build,recordedAt:1000,username:'private-user'},samples:Array.from({length:100},()=>({
    ...playing,username:'private-user',score:1,frameMaxMs:55,simulationMaxMs:Infinity,
    pacing:{wallMs:50,simulatedMs:34,discardedMs:16,token:'private-token'},work:{'private-section':{count:1}}})),
    events:[{kind:'private-message',atMs:1},{kind:'home-intent',atMs:10,stack:'private-stack'}]};
  const clean=cleanTimingCapture(input); assert.equal(clean.samples.length,90); assert.equal(clean.events.length,1);
  assert.ok(!JSON.stringify(clean).includes('private-'));
  data.set(OWNER_TIMING_KEY,JSON.stringify(input));
  const report=await readOwnerStabilityReport(async()=>({canAdmin:true}),()=>host);
  assert.equal(report.version,5);assert.equal(report.timingCapture.samples[0].frameMaxMs,55);
  data.set(OWNER_TIMING_KEY,'x'.repeat(OWNER_TIMING_MAX_BYTES+1)); assert.equal(readTimingCapture(host),null);
  data.set(OWNER_TIMING_KEY,'{broken'); assert.equal(readTimingCapture(host),null);
});
test('pause/background gaps are excluded and storage failure cannot interrupt simulation', async()=>{
  const {host}=fixture();let now=100;
  await armOwnerTimingCapture(async()=>({canAdmin:true}),()=>host,()=>true,1000);
  const probe=createOwnerTimingCapture(true,()=>host,{build,now:()=>now,wallNow:()=>2000});
  probe.begin(now,playing);probe.simulationStep(0,0);probe.end(now);
  now+=16;probe.begin(now,playing);probe.simulationStep(16,16);probe.end(now);
  probe.suspend(now);now+=60000;
  probe.begin(now,playing);probe.simulationStep(16,16);probe.end(now);
  probe.finish();assert.ok(probe.export().samples.every(s=>s.frameMaxMs<=16));
  const bad=fixture();await armOwnerTimingCapture(async()=>({canAdmin:true}),()=>bad.host,()=>true,1000);
  const safe=createOwnerTimingCapture(true,()=>bad.host,{build,now:()=>now,wallNow:()=>2000});
  bad.host.sessionStorage.setItem=()=>{throw Error('QuotaExceededError');};bad.host.localStorage=bad.host.sessionStorage;
  assert.doesNotThrow(()=>{safe.begin(now,playing);safe.end(now);safe.finish();});
});
