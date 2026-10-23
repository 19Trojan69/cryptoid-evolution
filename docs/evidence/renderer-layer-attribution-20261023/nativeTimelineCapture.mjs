// Native engine instrumentation for a bounded localhost fixture only.
import {writeFileSync} from 'node:fs';

export async function startWebkitTimelineAudit(playwright,page,result,root,tag){
  const implementation=playwright._connection.toImpl(page);
  const session=(implementation.delegate??implementation._delegate)._session;
  const audit=result.timelineAudit={localOnly:true,platform:'Linux WPE software rendering',limit:20000,records:[],script:[],cpu:[],unsupported:[],overflow:false};
  const active=[];
  let stopped=false;
  const layersEnabled=process.env.SCENE_TIMELINE_LAYERS==='1';
  const layerAttributes=new Map();
  const layers=async label=>{
    if(!layersEnabled)return;
    try{
      await session.send('LayerTree.enable');
      const {root:document}=await session.send('DOM.getDocument');
      const {layers}=await session.send('LayerTree.layersForNode',{nodeId:document.nodeId});
      for(const layer of layers){
        if(!layerAttributes.has(layer.nodeId)){
          try{layerAttributes.set(layer.nodeId,(await session.send('DOM.getAttributes',{nodeId:layer.nodeId})).attributes);}catch{layerAttributes.set(layer.nodeId,[]);}
        }
        layer.attributes=layerAttributes.get(layer.nodeId);
        try{layer.reasons=(await session.send('LayerTree.reasonsForCompositingLayer',{layerId:layer.layerId})).compositingReasons;}catch{}
      }
      (audit.layers??=[]).push({label,hostAt:Date.now(),layers});
    }catch(error){audit.unsupported.push({label,layerError:String(error)});}
  };
  await layers('before-profile');
  const capture=(key,value)=>{if(audit[key].length<audit.limit)audit[key].push(value);else audit.overflow=true;};
  session.on('Timeline.eventRecorded',({record})=>capture('records',record));
  session.on('ScriptProfiler.trackingUpdate',({event})=>capture('script',event));
  session.on('CPUProfiler.trackingUpdate',({event})=>capture('cpu',event));
  session.on('Timeline.recordingStarted',event=>{audit.start=event;});
  session.on('Timeline.recordingStopped',event=>{audit.end=event;});
  try{await session.send('Timeline.enable');await session.send('Timeline.setInstruments',{instruments:['Timeline']});await session.send('Timeline.start',{maxCallStackDepth:0});active.push('Timeline.stop');}catch(error){audit.unsupported.push(String(error));}
  try{await session.send('ScriptProfiler.startTracking',{includeSamples:false});active.push('ScriptProfiler.stopTracking');}catch(error){audit.unsupported.push(String(error));}
  try{await session.send('CPUProfiler.startTracking');active.push('CPUProfiler.stopTracking');}catch(error){audit.unsupported.push(String(error));}
  return {layers,async stop(){
    if(stopped)return;stopped=true;
    for(const command of active.reverse())try{await session.send(command);}catch(error){audit.unsupported.push(String(error));}
    await layers('after-profile');
    const tracePath=root+'timeline-'+tag+'.json';
    writeFileSync(tracePath,JSON.stringify(audit));
    const {records,script,cpu,...summary}=audit;
    result.timelineAudit={...summary,tracePath,recordCount:records.length,scriptCount:script.length,cpuCount:cpu.length};
  }};
}
