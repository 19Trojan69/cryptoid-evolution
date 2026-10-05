// Best effort: prevent idle dimming during active play, without changing brightness.
export function keepScreenAwake(nav: { wakeLock?: Pick<WakeLock, 'request'> }, doc: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>) {
 let disposed=false, pending=false, lock:WakeLockSentinel|null=null;
 const release=()=>{const current=lock;lock=null;if(current&&!current.released)void current.release().catch(()=>{});};
 const acquire=async()=>{
  if(disposed||pending||doc.visibilityState!=='visible'||lock&&!lock.released||!nav.wakeLock)return;
  pending=true;
  try{
   const next=await nav.wakeLock.request('screen');
   if(disposed||doc.visibilityState!=='visible'){await next.release();return;}
   lock=next;
   next.addEventListener('release',()=>{if(lock===next)lock=null;},{once:true});
  }catch{/* Unsupported policy, power saving or denial must not interrupt play. */}
  finally{pending=false;}
 };
 const visibility=()=>{if(doc.visibilityState==='visible')void acquire();else release();};
 const gesture=()=>{void acquire();};
 doc.addEventListener('visibilitychange',visibility);
 doc.addEventListener('pointerdown',gesture);
 void acquire();
 return ()=>{disposed=true;doc.removeEventListener('visibilitychange',visibility);doc.removeEventListener('pointerdown',gesture);release();};
}
