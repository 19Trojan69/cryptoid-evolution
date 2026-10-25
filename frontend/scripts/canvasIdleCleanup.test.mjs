import test from 'node:test';
import assert from 'node:assert/strict';
import {canvasStaticUrlHost} from './canvasStaticUrlHost.mjs';

test('actual Canvas cleanup refuses a pending consumer, releases the idle surface and allows fresh preparation',async()=>{
 const h=await canvasStaticUrlHost();h.setHold(()=>true);
 const effect={id:1,kind:'explosion',x:100,y:120,sprite:0,shipStage:1,debrisColor:'gold',debrisSize:50};
 const view=h.mount(effect);await h.waitFor(()=>h.stats().retainedHullUsers===1&&h.held.length>=3);
 assert.equal(h.api.releaseIdleCanvasEffects(),false,'pending image consumers remain protected');
 h.unmount(view);assert.equal(h.stats().retainedHullUsers,0);assert.equal(h.api.releaseIdleCanvasEffects(),true);
 assert.equal(h.stats().cacheBytes,0);assert.equal(h.stats().surfaceBytes,0);assert.equal(h.stats().activeDrawFrame,false);
 const requests=h.requests.length;
 const next=h.mount({...effect,id:2});await h.waitFor(()=>h.stats().retainedHullUsers===1&&h.requests.length>requests);
 assert.equal(h.api.releaseIdleCanvasEffects(),false);h.unmount(next);assert.equal(h.api.releaseIdleCanvasEffects(),true);h.close();
});
