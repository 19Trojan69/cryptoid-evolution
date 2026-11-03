import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { isAbsolute } from 'node:path';
import { SafariClient } from '../ios-safari-native-20261103/safariClient.mjs';
export class CalibratedSafariClient extends SafariClient {
  constructor(origin, preopen = (udid,url) => execFileSync('xcrun',['simctl','openurl',udid,url],
    {encoding:'utf8',timeout:45000,maxBuffer:2**20})) {super(origin);this.preopen=preopen;}
  async start(udid,initialUrl,simulator) {
    const url=new URL(initialUrl);
    assert.equal(url.protocol,'http:');assert.equal(url.hostname,'127.0.0.1');
    assert.equal(simulator.udid,udid);assert.equal(simulator.runtime.version,'18.5');
    assert.equal(simulator.booted,true);assert.equal(simulator.calibrationVerified,true);
    assert.equal(simulator.physicalDevice,false);assert.ok(isAbsolute(simulator.wdaDerivedDataPath));
    this.preopen(udid,initialUrl);
    const value=await this.request('POST','/session',{capabilities:{alwaysMatch:{
      browserName:'Safari',platformName:'iOS','appium:automationName':'XCUITest','appium:udid':udid,
      'appium:safariInitialUrl':initialUrl,'appium:noReset':true,
      'appium:deviceName':'iPhone 16 Pro Max','appium:platformVersion':'18.5',
      'appium:includeSafariInWebviews':true,'appium:nativeWebTap':true,
      'appium:disableAutomaticScreenshots':true,'appium:skipLogCapture':true,
      'appium:safariGarbageCollect':false,'appium:usePrebuiltWDA':true,
      'appium:derivedDataPath':simulator.wdaDerivedDataPath,'appium:showXcodeLog':true,
      'appium:waitForIdleTimeout':1,'appium:wdaStartupRetries':1,
      'appium:wdaLaunchTimeout':120000,'appium:newCommandTimeout':120
    }}},240000);
    assert.ok(value.sessionId);this.session=value.sessionId;
    assert.equal(String(value.capabilities.platformName).toLowerCase(),'ios','No desktop fallback');
    assert.equal(String(value.capabilities.browserName).toLowerCase(),'safari');
    return value.capabilities;
  }
}
