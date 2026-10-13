import { paintShipMaterial } from './shipMaterial.ts';
type Job={data:Uint8ClampedArray;width:number;height:number;target:readonly number[];accent?:readonly number[]};
// The existing paintTail serializes jobs. One reusable worker, no extra paint cache.
let worker:Worker|null=null,unsupported=false;
let idleTimer:ReturnType<typeof setTimeout>|undefined;
export async function paintShipMaterialAsync(job:Job) {
 if(!unsupported&&typeof Worker!=='undefined'){
  try{
   clearTimeout(idleTimer);
   worker??=new Worker(new URL('./shipMaterialWorker.ts',import.meta.url),{type:'module'});
   const current=worker,copy=job.data.slice();
   const result=await new Promise<Uint8ClampedArray>((resolve,reject)=>{
    const timer=setTimeout(()=>{cleanup();reject(new Error('Material worker timed out'));},10_000);
    const cleanup=()=>{clearTimeout(timer);current.onmessage=current.onerror=current.onmessageerror=null;};
    current.onmessage=event=>{cleanup();if(event.data.failed)reject(new Error('Material preparation failed'));else resolve(event.data.data);};
    current.onerror=event=>{event.preventDefault?.();cleanup();reject(new Error('Material worker unavailable'));};
    current.onmessageerror=event=>{event.preventDefault?.();cleanup();reject(new Error('Material worker unavailable'));};
    try {current.postMessage({...job,data:copy},[copy.buffer]);}catch(error){cleanup();reject(error);}
   });job.data.set(result);
   idleTimer=setTimeout(()=>{if(worker===current){worker.terminate();worker=null;}},30_000);return;
  }catch{worker?.terminate();worker=null;unsupported=true;}
 }
 // Exact original algorithm for browsers that reject workers; keep the same pixels.
 paintShipMaterial(job.data,job.width,job.height,job.target,job.accent);
}
