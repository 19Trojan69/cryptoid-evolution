import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';

export const limits=Object.freeze({events:30000,bytes:16*1024*1024,nodes:1024,bufferKiB:32768});
export const names=new Set(['UpdateLayoutTree','ScheduleStyleRecalculation','ScheduleStyleInvalidationTracking',
 'StyleRecalcInvalidationTracking','StyleInvalidatorInvalidationTracking','StyleResolver::ResolveStyle']);
export const categories=['devtools.timeline','disabled-by-default-devtools.timeline',
 'disabled-by-default-devtools.timeline.invalidationTracking'];
const frame=e=>e.args?.data?.frame??e.args?.beginData?.frame;
export function summarize(events,frameId,labels={}) {
 assert.equal(typeof frameId,'string');assert.ok(frameId);assert.ok(events.length<=limits.events);
 const recalc=events.filter(e=>e.name==='UpdateLayoutTree'&&frame(e)===frameId);
 assert.ok(recalc.length,'No actual style spans for the inspected frame');
 for(const e of recalc){assert.equal(e.ph,'X');assert.ok(Number.isFinite(e.ts));assert.ok(Number.isFinite(e.dur)&&e.dur>=0);
  assert.ok(Number.isSafeInteger(e.args?.elementCount)&&e.args.elementCount>=0,'Missing counts are not zero');}
 const pids=new Set(recalc.map(e=>e.pid));assert.equal(pids.size,1,'One renderer required');
 const related=events.filter(e=>e.name!=='UpdateLayoutTree'&&pids.has(e.pid)&&(!frame(e)||frame(e)===frameId));
 const groups=new Map();
 for(const e of related){const d=e.args?.data??e.args?.beginData??{};const id=d.nodeId??null;
  const key=JSON.stringify([e.name,id,d.reason??null,d.subtree??null,d.changedAttribute??null,d.changedClass??null]);
  if(!groups.has(key))groups.set(key,{event:e.name,nodeId:id,label:labels[id]??d.nodeName??null,
   reason:d.reason??null,subtree:d.subtree??null,changedAttribute:d.changedAttribute??null,
   changedClass:d.changedClass??null,events:0,exactFrameEvents:0,processOnlyEvents:0});
  const g=groups.get(key);g.events++;if(frame(e)===frameId)g.exactFrameEvents++;else g.processOnlyEvents++;
 }
 const rows=[...groups.values()].sort((a,b)=>b.events-a.events);
 return {styleSpans:recalc.length,elementStyleCalculations:recalc.reduce((n,e)=>n+e.args.elementCount,0),
  nativeStyleSpanDurationUs:recalc.reduce((n,e)=>n+e.dur,0),eventCounts:Object.fromEntries([...names].map(n=>[n,events.filter(e=>e.name===n).length])),
  relatedEventGroups:rows,invalidationEvents:related.filter(e=>e.name.includes('InvalidationTracking')).length,
  perNodeResolveEvents:related.filter(e=>e.name==='StyleResolver::ResolveStyle').length,
  repeatedCalculationsAreWorkNotUniqueNodes:true,invalidationCountsAreNotPerNodeRecalcCounts:true,
  noPendingEventHeuristicOrAllocationStackAttribution:true,profiledDurationIsNotUninstrumentedPerformance:true,
  memoryBenefitMeasured:false,nativeTerminationCauseMeasured:false};
}
export function nodeIds(events,frameId){const pids=new Set(events.filter(e=>e.name==='UpdateLayoutTree'&&frame(e)===frameId).map(e=>e.pid));
 const ids=[...new Set(events.filter(e=>pids.has(e.pid)&&(!frame(e)||frame(e)===frameId))
  .map(e=>e.args?.data?.nodeId??e.args?.beginData?.nodeId).filter(x=>Number.isSafeInteger(x)&&x>0))];
 assert.ok(ids.length<=limits.nodes,'Node lookup budget');return ids;}
const within=(promise,ms)=>new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Native trace deadline')),ms);
 promise.then(x=>{clearTimeout(t);resolve(x)},e=>{clearTimeout(t);reject(e)});});
export async function capture({session,run,save}) {
 const events=[];let bytes=32,fault=null,tracing=false,completion=null;
 const result={complete:false,requestedGc:false,memoryDumps:0,heapSnapshots:false,apiWrappers:false};
 const receive=chunk=>{try{assert.ok(Array.isArray(chunk.value));for(const e of chunk.value){if(!names.has(e.name))continue;
  const size=Buffer.byteLength(JSON.stringify(e))+1;if(events.length>=limits.events||bytes+size>limits.bytes){fault??='event-or-byte-budget';continue;}
  events.push(e);bytes+=size;}}catch{fault??='malformed-events';}};
 const stop=async()=>{let done;const ended=new Promise(resolve=>{done=resolve;session.once('Tracing.tracingComplete',done)});
  try{const [,value]=await within(Promise.all([session.send('Tracing.end'),ended]),15000);completion=value;}
  finally{tracing=false;session.off('Tracing.tracingComplete',done);}};
 const write=()=>{const raw=Buffer.from(JSON.stringify({traceEvents:events}));assert.ok(raw.length<=limits.bytes);
  const data=gzipSync(raw);save(data);return{sha256:createHash('sha256').update(data).digest('hex'),bytes:raw.length,
   compressedBytes:data.length,events:events.length,collectorFault:fault,dataLossOccurred:completion?.dataLossOccurred??null};};
 session.on('Tracing.dataCollected',receive);
 try{await within(session.send('Tracing.start',{transferMode:'ReportEvents',traceConfig:{recordMode:'recordUntilFull',
   traceBufferSizeInKb:limits.bufferKiB,excludedCategories:['*'],includedCategories:categories,memoryDumpConfig:{triggers:[]}}}),15000);
  tracing=true;result.proof=await run();await stop();result.trace=write();assert.equal(fault,null);assert.equal(completion?.dataLossOccurred,false);
  result.complete=true;
 }catch(e){result.failure=e.message;}
 finally{if(tracing)try{await stop()}catch(e){result.stopFailure=e.message;}
  if(!result.trace)try{result.trace=write()}catch(e){result.saveFailure=e.message;}
  session.off('Tracing.dataCollected',receive);try{await within(session.detach(),5000);result.detached=true}catch{result.detached=false;}
  if(!completion||!result.detached)result.complete=false;}
 return{result,events};
}
export async function resolveLabels(session,ids){const labels={},unresolved=[];
 for(const id of ids){try{const {node}=await session.send('DOM.describeNode',{backendNodeId:id,depth:0});
  const attrs=Object.fromEntries(Array.from({length:(node.attributes?.length??0)/2},(_,i)=>[node.attributes[i*2],node.attributes[i*2+1]]));
  labels[id]=[node.nodeName,attrs.id?'#'+attrs.id:'',attrs.class?'.'+attrs.class.trim().replace(/\s+/g,'.'):''].join('').slice(0,600);
 }catch{unresolved.push(id);}}
 return{labels,unresolved};}
