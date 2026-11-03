import test from 'node:test';
import assert from 'node:assert/strict';
import { CalibratedSafariClient } from './calibratedSafariClient.mjs';
const sim={udid:'fresh-simulator',runtime:{version:'18.5'},booted:true,calibrationVerified:true,
  physicalDevice:false,wdaDerivedDataPath:'/isolated/wda'};
const lease={phase:'pilot',udid:sim.udid,sessionId:'0dee8e53-d259-400e-8713-16f2f7ac1367',
  controlVerified:true,trustedNativeProbeTapVerified:true,previousGamePhaseCompleted:false,
  previousOrigin:'http://127.0.0.1:3000',previousTimeOrigin:1000,
  capabilities:{platformName:'iOS',browserName:'Safari',udid:sim.udid,nativeWebTap:true,
    safariGarbageCollect:false,disableAutomaticScreenshots:true}};
const target='http://127.0.0.1:4000';
function fixture({context='WEBVIEW_1',before={},after={}}={}) {
  const driver=new CalibratedSafariClient();const calls=[];let reads=0;
  driver.request=async(method,path,body)=>{
    calls.push({method,path,body});
    assert.ok(path.startsWith('/session/'+lease.sessionId+'/'),'Only the existing session');
    if(path.endsWith('/context'))return context;
    if(path.endsWith('/execute/sync'))return reads++===0
      ?{origin:lease.previousOrigin,timeOrigin:1000,mounted:false,...before}
      :{origin:target,timeOrigin:2000,mounted:false,ready:'complete',...after};
    if(path.endsWith('/timeouts')||path.endsWith('/url'))return null;
    throw Error('Unexpected native command');
  };
  return {driver,calls};
}
test('unverified, wrong-phase and foreign-device handoffs fail before any HTTP request',async()=>{
  for(const changes of [{controlVerified:false},{trustedNativeProbeTapVerified:false},{phase:'soak'},
    {previousGamePhaseCompleted:true},{udid:'other'},{sessionId:''},
    {capabilities:{...lease.capabilities,platformName:'mac'}}]){
    const {driver,calls}=fixture();
    await assert.rejects(driver.start(sim.udid,target,sim,{...lease,...changes},'pilot'));
    assert.equal(calls.length,0);assert.equal(driver.session,null);
  }
  for(const input of [{...sim,calibrationVerified:false},{...sim,physicalDevice:true},
    {...sim,runtime:{version:'26.2'}},{...sim,wdaDerivedDataPath:'relative'}]){
    const {driver,calls}=fixture();
    await assert.rejects(driver.start(sim.udid,target,input,lease,'pilot'));assert.equal(calls.length,0);
  }
  const {driver,calls}=fixture();
  await assert.rejects(driver.start(sim.udid,'https://external.invalid',sim,lease,'pilot'));
  assert.equal(calls.length,0);
});
test('a wrong context, replaced previous document or mounted game cannot be navigated away',async()=>{
  for(const input of [{context:'NATIVE_APP'},{before:{timeOrigin:999}},{before:{origin:target}},
    {before:{mounted:true}}]){
    const {driver,calls}=fixture(input);
    await assert.rejects(driver.start(sim.udid,target,sim,lease,'pilot'));
    assert.ok(!calls.some(x=>x.path.endsWith('/url')));
    await driver.close();assert.ok(!calls.some(x=>x.method==='DELETE'));
  }
});
test('ordinary navigation retains the calibrated session and requires a new origin and document',async()=>{
  const {driver,calls}=fixture();
  const caps=await driver.start(sim.udid,target,sim,lease,'pilot');
  assert.equal(caps,lease.capabilities);assert.equal(driver.session,lease.sessionId);
  assert.equal(driver.nativeNavigation.newDocumentAndOriginVerified,true);
  assert.equal(driver.nativeNavigation.newWebDriverSession,false);
  assert.deepEqual(calls.filter(x=>x.path.endsWith('/url')).map(x=>x.body),[{url:target}]);
  const count=calls.length;await driver.close();assert.equal(calls.length,count);
  assert.equal(driver.session,null);assert.ok(!calls.some(x=>x.method==='DELETE'||x.path==='/session'));
  const broken=fixture({after:{timeOrigin:1000}});
  await assert.rejects(broken.driver.start(sim.udid,target,sim,lease,'pilot'),/previous document/);
  assert.equal(broken.calls.filter(x=>x.path.endsWith('/url')).length,1,'No automatic retry or recovery');
});
test('the long flow cannot borrow a session before a completed pilot',async()=>{
  const {driver,calls}=fixture();
  await assert.rejects(driver.start(sim.udid,target,sim,{...lease,phase:'soak'},'soak'));
  assert.equal(calls.length,0);
});
