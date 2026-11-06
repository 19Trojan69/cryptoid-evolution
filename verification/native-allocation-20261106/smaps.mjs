import assert from 'node:assert/strict';
export function summarizeSmaps(text){
 const groups=new Map();let current=null,count=0;
 const classify=path=>{
  if(path==='[heap]')return 'libc-heap';
  if(path.startsWith('[stack'))return 'stack';
  if(!path||path.startsWith('[anon:'))return 'anonymous';
  if(/^\/dev\/dri|^\/dmabuf|^\/memfd:.*(?:gpu|dmabuf)/i.test(path))return 'graphics-device';
  if(/memfd:|\/dev\/shm/.test(path))return 'shared-memory';
  if(path.startsWith('['))return 'kernel-special';
  const name=path.split('/').at(-1).replace(/[^a-zA-Z0-9_.+-]/g,'').slice(0,96);
  return /\.so(?:[.\d]*)?$/.test(name)?'library:'+name:'mapped-file-other';
 };
 for(const line of text.split('\n')){
  const h=line.match(/^[a-f0-9]+-[a-f0-9]+\s+\S+\s+\S+\s+\S+\s+\d+\s*(.*)$/i);
  if(h){count++;const key=classify(h[1].trim());if(!groups.has(key))groups.set(key,{kind:key,mappings:0,Size:0,Rss:0,Pss:0,Private_Dirty:0,Private_Clean:0,Shared_Dirty:0,Shared_Clean:0,Anonymous:0,Swap:0});current=groups.get(key);current.mappings++;continue;}
  const m=line.match(/^(Size|Rss|Pss|Private_Dirty|Private_Clean|Shared_Dirty|Shared_Clean|Anonymous|Swap):\s+(\d+) kB$/);
  if(m){assert.ok(current,'A mapping header is required');current[m[1]]+=Number(m[2]);}
 }
 assert.ok(count>0,'Actual mappings must be present');
 return {units:'KiB',mappings:count,groups:[...groups.values()].sort((a,b)=>b.Pss-a.Pss),
  limits:'Mapping classes are not allocation owners. Size is virtual space; PSS, RSS and heaptrack requested bytes differ. No raw addresses or mapping paths retained.'};
}
