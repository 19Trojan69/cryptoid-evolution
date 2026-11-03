import assert from 'node:assert/strict';
import { isAbsolute } from 'node:path';
import { SafariClient } from '../ios-safari-native-20261103/safariClient.mjs';
export class CalibratedSafariClient extends SafariClient {
  async start(udid,initialUrl,simulator,handoff,phase) {
    const url=new URL(initialUrl);
    assert.equal(url.protocol,'http:');assert.equal(url.hostname,'127.0.0.1');
    assert.equal(url.pathname,'/');assert.equal(url.search,'');assert.equal(url.hash,'');
    assert.equal(this.origin,'http://127.0.0.1:4444','Only the local calibrated transport');
    assert.equal(simulator.udid,udid);assert.equal(simulator.runtime.version,'18.5');
    assert.equal(simulator.booted,true);assert.equal(simulator.calibrationVerified,true);
    assert.equal(simulator.physicalDevice,false);assert.ok(isAbsolute(simulator.wdaDerivedDataPath));
    assert.ok(['pilot','soak'].includes(phase));
    assert.equal(handoff.phase,phase);assert.equal(handoff.udid,udid);
    assert.equal(handoff.controlVerified,true);assert.equal(handoff.trustedNativeProbeTapVerified,true);
    assert.equal(handoff.previousGamePhaseCompleted,phase==='soak');
    assert.match(handoff.sessionId,/^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
    assert.ok(Number.isFinite(handoff.previousTimeOrigin)&&handoff.previousTimeOrigin>0);
    const previous=new URL(handoff.previousOrigin);
    assert.equal(previous.protocol,'http:');assert.equal(previous.hostname,'127.0.0.1');
    assert.notEqual(previous.origin,url.origin,'Each game phase needs its own origin');
    const caps=handoff.capabilities;
    assert.equal(String(caps.platformName).toLowerCase(),'ios','No desktop fallback');
    assert.equal(String(caps.browserName).toLowerCase(),'safari');assert.equal(caps.udid,udid);
    assert.equal(caps.nativeWebTap,true);assert.equal(caps.safariGarbageCollect,false);
    assert.equal(caps.disableAutomaticScreenshots,true);
    // The parent retains ownership. No new session, reset, reopen or fallback.
    this.borrowedCalibratedSession=true;this.session=handoff.sessionId;
    const contextBefore=await this.command('GET','/context');
    assert.match(contextBefore,/^WEBVIEW_/);
    const before=await this.execute(`return {origin:location.origin,timeOrigin:performance.timeOrigin,
      mounted:!!document.querySelector('.game-shell')};`);
    assert.equal(before.origin,handoff.previousOrigin);
    assert.equal(before.timeOrigin,handoff.previousTimeOrigin);assert.equal(before.mounted,false);
    await this.command('POST','/timeouts',{script:30000,pageLoad:90000,implicit:0});
    await this.command('POST','/url',{url:initialUrl});
    const after=await this.waitFor(async()=>{
      const point=await this.execute(`return {origin:location.origin,timeOrigin:performance.timeOrigin,
        ready:document.readyState,mounted:!!document.querySelector('.game-shell')};`);
      return point.origin===url.origin&&point.ready!=='loading'?point:false;
    },'new local guest document in the verified session');
    assert.notEqual(after.timeOrigin,before.timeOrigin,'No reuse of the previous document');
    assert.equal(after.mounted,false,'Never navigate over an active game');
    const contextAfter=await this.command('GET','/context');assert.match(contextAfter,/^WEBVIEW_/);
    this.nativeNavigation={method:'WebDriver POST /url',contextBefore,contextAfter,before,after,
      newDocumentAndOriginVerified:true,newWebDriverSession:false};
    return caps;
  }
  async close() {
    if(this.borrowedCalibratedSession){this.session=null;return;}
    await super.close();
  }
}
