export type ResourceLease = {ready:Promise<unknown>;isReady?:()=>boolean;release:()=>void};
// One pending batch. Stale completions cannot resume or reveal another scene.
export class SceneResourceGate {
 private key=''; private ready=false; private failed=false; private disposed=false;
 private lease:ResourceLease|null=null; private generation=0;
 private pending:(waiting:boolean)=>void;private fault:(error:unknown)=>void;
 constructor(pending:(waiting:boolean)=>void,fault:(error:unknown)=>void){this.pending=pending;this.fault=fault;}
 ensure(key:string,load:()=>ResourceLease) {
  if(this.disposed)return false;
  if(this.key===key)return this.ready;
  const previous=this.lease;
  this.key=key;this.ready=false;this.failed=false;
  const token=++this.generation;
  // Acquire the new pins before releasing the forecast. Otherwise trimming
  // can revoke the very Blob URLs that the incoming scene is about to use.
  try{this.lease=load();this.ready=this.lease.isReady?.()??false;}
  catch(error){this.failed=true;this.pending(false);this.fault(error);return false;}
  previous?.release();
  // A decoded cache hit is synchronous: no wait frame or loading overlay.
  this.pending(!this.ready);
  void this.lease.ready.then(()=>{
   if(this.disposed||token!==this.generation||this.ready)return;
   this.ready=true;this.pending(false);
  },error=>{
   if(this.disposed||token!==this.generation)return;
   this.ready=false;this.failed=true;this.pending(false);this.fault(error);
  });return this.ready;
 }
 retry(){if(this.failed){this.lease?.release();this.lease=null;this.key='';this.failed=false;++this.generation;}}
 dispose(){if(this.disposed)return;this.disposed=true;++this.generation;this.lease?.release();this.lease=null;}
}
