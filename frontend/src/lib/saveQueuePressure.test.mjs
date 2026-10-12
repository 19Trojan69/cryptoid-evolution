import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { appendPendingSave } from './saveOutbox.ts';

// The real queue with deferred fixture HTTP and storage, no account or database.
function fixture() {
 const source=fs.readFileSync(new URL('./accountSave.ts',import.meta.url),'utf8');
 const ast=ts.createSourceFile('accountSave.ts',source,ts.ScriptTarget.Latest,true);
 const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='createSaveQueue');
 let resolve,denied=false;const gate=new Promise(done=>resolve=done),data=new Map(),posts=[];
 const context={appendPendingSave,shipSaveNetwork:'testnet',retrySave:fn=>fn(),cappedSnapshot:s=>s,
  localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(denied)throw new Error('fixture quota');data.set(k,v);}},
  axiosClient:{post:async(path,body)=>{posts.push({path,body});await gate;return {data:{}};}}};
 const code=ts.transpileModule(fn.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code+'\nglobalThis.queue=createSaveQueue("fixture-owner");',context);
 return {queue:context.queue,release:()=>resolve(),deny:v=>denied=v,posts};
}
const checkpoint = n=>({path:'/progress/checkpoint',body:{runId:'fixture-run',combat:{stage:25,encounter:'normal',sequence:n}}});
test('a prolonged outage retains all barriers, signals pressure, then drains each event exactly once',async()=>{
 const h=fixture();const first=h.queue.enqueue(checkpoint(1));
 for(let n=2;n<=1000;n++)h.queue.enqueue(checkpoint(n));
 assert.equal(h.queue.pendingCount,2);assert.equal(h.queue.underPressure,false);
 for(let stage=1;stage<=30;stage++)h.queue.enqueue({path:'/rewards/event',body:{runId:'fixture-run',stage,kind:'block'}});
 assert.equal(h.queue.pendingCount,32);assert.equal(h.queue.underPressure,true);
 h.release();await first;assert.equal(h.queue.pendingCount,0);assert.equal(h.queue.underPressure,false);
 assert.equal(h.posts.length,32);assert.equal(h.posts[1].body.combat.sequence,1000);
 assert.equal(new Set(h.posts.filter(p=>p.path==='/rewards/event').map(p=>p.body.stage)).size,30);
});
test('storage denial and large payloads protect progress; restored storage recovers durability',async()=>{
 const h=fixture();h.deny(true);const first=h.queue.enqueue(checkpoint(1));
 assert.equal(h.queue.durable,false);assert.equal(h.queue.underPressure,true);
 h.deny(false);h.queue.enqueue(checkpoint(2));assert.equal(h.queue.durable,true);assert.equal(h.queue.underPressure,false);
 h.queue.enqueue({path:'/rewards/event',body:{runId:'fixture-run',fixturePadding:'x'.repeat(1024*1024)}});
 assert.ok(h.queue.pendingBytes>=2*1024*1024);assert.equal(h.queue.underPressure,true);
 h.release();await first;assert.equal(h.queue.underPressure,false);assert.equal(h.posts.length,3);
});
