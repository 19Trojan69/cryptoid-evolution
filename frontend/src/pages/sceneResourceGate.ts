export type ResourceLease = {ready:Promise<unknown>;release:()=>void};
// One pending batch. Stale completions cannot resume or reveal another scene.
export class SceneResourceGate {
 private key=''; private ready=false; private failed=false; private disposed=false;
 private lease:ResourceLease|null=null; private generation=0;
 private pending:(waiting:boolean)=>void;private fault:(error:unknown)=>void;
 constructor(pending:(waiting:boolean)=>void,fault:(error:unknown)=>void){this.pending=pending;this.fault=fault;}
 ensure(key:string,load:()=>ResourceLease) {
  if(this.disposed)return false;
  if(this.key===key)return this.ready;
  this.lease?.release();this.lease=null;this.key=key;this.ready=false;this.failed=false;
  const token=++this.generation;this.pending(true);
  try{this.lease=load();}catch(error){this.failed=true;this.pending(false);this.fault(error);return false;}
  void this.lease.ready.then(()=>{
   if(this.disposed||token!==this.generation)return;
   this.ready=true;this.pending(false);
  },error=>{
   if(this.disposed||token!==this.generation)return;
   this.failed=true;this.pending(false);this.fault(error);
  });return false;
 }
 retry(){if(this.failed){this.lease?.release();this.lease=null;this.key='';this.failed=false;++this.generation;}}
 dispose(){this.disposed=true;++this.generation;this.lease?.release();this.lease=null;}
}
