import test from 'node:test';
import assert from 'node:assert/strict';
import { CalibratedSafariClient } from './calibratedSafariClient.mjs';
const sim={udid:'fresh-simulator',runtime:{version:'18.5'},booted:true,calibrationVerified:true,physicalDevice:false,wdaDerivedDataPath:'/isolated/wda'};
test('preopen failure stops before any WebDriver session request',async()=>{
 let requests=0;const driver=new CalibratedSafariClient(undefined,()=>{throw Error('openurl failed');});
 driver.request=async()=>{requests++;};
 await assert.rejects(driver.start(sim.udid,'http://127.0.0.1:3000',sim),/openurl failed/);
 assert.equal(requests,0);
});
test('a verified fresh simulator is required before native commands',async()=>{
 let opens=0;const driver=new CalibratedSafariClient(undefined,()=>{opens++;});
 for(const input of [{...sim,calibrationVerified:false},{...sim,physicalDevice:true},{...sim,runtime:{version:'26.2'}},{...sim,wdaDerivedDataPath:'relative'}])
  await assert.rejects(driver.start(sim.udid,'http://127.0.0.1:3000',input));
 await assert.rejects(driver.start(sim.udid,'https://external.invalid',sim));
 assert.equal(opens,0);
});
test('the calibrated request has no conflicting app identity or WDA deeplink, and refuses desktop results',async()=>{
 const order=[];const driver=new CalibratedSafariClient(undefined,()=>order.push('preopen'));
 driver.request=async(method,path,body)=>{
  order.push('request');const c=body.capabilities.alwaysMatch;
  assert.equal(c.browserName,'Safari');assert.equal(c['appium:noReset'],true);
  assert.equal(c['appium:initialDeeplinkUrl'],undefined);assert.equal(c['appium:bundleId'],undefined);
  assert.equal(c['appium:disableAutomaticScreenshots'],true);assert.equal(c['appium:safariGarbageCollect'],false);
  return {sessionId:'test-only',capabilities:{platformName:'mac',browserName:'Safari'}};
 };
 await assert.rejects(driver.start(sim.udid,'http://127.0.0.1:3000',sim),/No desktop fallback/);
 assert.deepEqual(order,['preopen','request']);
});
