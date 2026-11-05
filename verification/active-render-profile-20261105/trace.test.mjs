import test from 'node:test';
import assert from 'node:assert/strict';
import {summarize,nodeIds,limits,capture} from './trace.mjs';
import {EventEmitter} from 'node:events';
const span=(frame='main',count=4)=>({name:'UpdateLayoutTree',pid:1,tid:1,ph:'X',ts:100,dur:7,args:{beginData:{frame},elementCount:count}});
const invalid=(frame='main',nodeId=2)=>({name:'StyleRecalcInvalidationTracking',pid:1,tid:1,ph:'I',ts:101,args:{data:{frame,nodeId,reason:'Inline CSS style declaration was mutated',subtree:true}}});
test('frame identity, repeat work and invalidation counts remain distinct',()=>{const r=summarize([span(),span(),span('other',100),invalid(),invalid('other',8)],'main',{2:'DIV#known'});
 assert.equal(r.elementStyleCalculations,8);assert.equal(r.styleSpans,2);assert.equal(r.invalidationEvents,1);assert.equal(r.perNodeResolveEvents,0);
 assert.equal(r.relatedEventGroups[0].label,'DIV#known');assert.deepEqual(nodeIds([span(),invalid(),invalid('other',8)],'main'),[2]);});
test('missing work counts and partial spans cannot pass as measured zero or complete',()=>{for(const e of [{...span(),ph:'B'},span('main',undefined),{...span(),args:{beginData:{frame:'main'}}}]){
 if(e.args.elementCount===4&&e.ph==='X')continue;assert.throws(()=>summarize([e],'main'));}
 assert.throws(()=>summarize([span('other')],'main'));});
test('unframed renderer evidence stays explicitly process-only',()=>{const e=invalid();delete e.args.data.frame;
 const r=summarize([span(),e],'main');assert.equal(r.relatedEventGroups[0].exactFrameEvents,0);assert.equal(r.relatedEventGroups[0].processOnlyEvents,1);});
test('native data loss and collector budgets fail while saving evidence and detaching',async()=>{for(const mode of ['loss','budget','ok']){
 class Session extends EventEmitter{async send(name){if(name==='Tracing.start')this.emit('Tracing.dataCollected',{value:mode==='budget'?Array(limits.events+1).fill(span()):[span()]});
  if(name==='Tracing.end')this.emit('Tracing.tracingComplete',{dataLossOccurred:mode==='loss'});return{};}async detach(){this.closed=true;}}
 const s=new Session();let saved;const r=await capture({session:s,run:async()=>({}),save:x=>{saved=x}});
 assert.equal(r.result.complete,mode==='ok');assert.ok(saved.length);assert.equal(s.closed,true);assert.equal(s.listenerCount('Tracing.dataCollected'),0);}});
