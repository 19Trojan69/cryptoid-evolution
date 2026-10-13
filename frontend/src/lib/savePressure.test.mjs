import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require=createRequire(import.meta.url),{build}=require('esbuild');
const ts=require('typescript');
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
const source=file=>process.env.CRYPTOID_PRESSURE_TEST_BASE
 ?execFileSync('git',['show',`${process.env.CRYPTOID_PRESSURE_TEST_BASE}:frontend/${file}`],{cwd:root,encoding:'utf8'})
 :fs.readFileSync(path.join(root,file),'utf8');
async function fixture(initial=[],quota=false) {
 const compiled=await build({absWorkingDir:root,entryPoints:['src/lib/accountSave.ts'],bundle:true,write:false,platform:'node',format:'cjs',define:{'import.meta.env':'{}'},logLevel:'silent',plugins:[{name:'controlled-save-host',setup(b){
  b.onResolve({filter:/axiosClient(?:\.ts)?$/},a=>({path:a.path,namespace:'fixture-api'}));
  b.onLoad({filter:/.*/,namespace:'fixture-api'},()=>({contents:'export const axiosClient={post:(path,body)=>globalThis.__send(path,body)};',loader:'js'}));
  b.onLoad({filter:/accountSave\.ts$/},()=>({contents:source('src/lib/accountSave.ts'),loader:'ts'}));
 }}]});
 const records=new Map([['cryptoid_save_outbox_v1_testnet_fixture-user',JSON.stringify(initial)]]),receipts=[];
 let denied=quota,release;
 const held=new Promise(resolve=>release=resolve);
 const storage={getItem:key=>records.get(key)??null,setItem:(key,value)=>{if(denied)throw new Error('Storage quota fixture');records.set(key,String(value));}};
 const scope={exports:{},module:{exports:{}},console,setTimeout,clearTimeout,localStorage:storage,window:{localStorage:storage,location:{hostname:'cryptoid-evolution-testnet.vercel.app'},__ENV:{appNetwork:'testnet'}},__send:async(path,body)=>{await held;receipts.push({path,body});return {data:{}};}};
 scope.module.exports=scope.exports;vm.runInNewContext(compiled.outputFiles[0].text,scope);
 return {queue:scope.module.exports.createSaveQueue('fixture-user'),receipts,release,storage,records,allowStorage:()=>denied=false};
}
const checkpoint=score=>({path:'/progress/checkpoint',body:{runId:'fixture-run',combat:{stage:31,encounter:'normal'},save:{score,shards:score,hearts:3}}});
test('checkpoint coalescing remains intact; every reward barrier survives pressure and drains once',async()=>{
 const f=await fixture();assert.equal(f.queue.underPressure,false);
 const completion=f.queue.enqueue(checkpoint(0));
 for(let i=1;i<=1000;i++)f.queue.enqueue(checkpoint(i));
 assert.equal(f.queue.pendingCount,2);assert.equal(f.queue.underPressure,false);
 for(let i=0;i<30;i++)f.queue.enqueue({path:'/rewards/event',body:{runId:'fixture-run',kind:'block',stage:i+1,level:Math.floor(i/10)+1,save:{score:i,shards:i,hearts:3}}});
 assert.equal(f.queue.pendingCount,32);assert.equal(f.queue.underPressure,true);
 f.release();await completion;assert.equal(f.receipts.length,32);
 assert.equal(f.receipts[1].body.save.score,1000);assert.equal(f.receipts.filter(entry=>entry.path==='/rewards/event').length,30);
 assert.equal(f.queue.pendingCount,0);assert.equal(f.queue.underPressure,false);
});
test('denied local storage protects even one pending entry and can recover',async()=>{
 const f=await fixture([],true),completion=f.queue.enqueue(checkpoint(1));
 assert.equal(f.queue.durable,false);assert.equal(f.queue.underPressure,true);assert.equal(f.queue.pendingCount,1);
 f.allowStorage();f.release();await completion;assert.equal(f.queue.durable,true);assert.equal(f.queue.underPressure,false);
});
test('large payloads and restored queues are pressure-checked without dropping their entries',async()=>{
 const large={...checkpoint(1),body:{...checkpoint(1).body,fixturePadding:'x'.repeat(1024*1024)}};
 const fresh=await fixture();const completion=fresh.queue.enqueue(large);assert.equal(fresh.queue.pendingCount,1);assert.ok(fresh.queue.pendingBytes>=2*1024*1024);assert.equal(fresh.queue.underPressure,true);fresh.release();await completion;
 const restored=await fixture([large]);assert.equal(restored.queue.pendingCount,1);assert.equal(restored.queue.underPressure,true);const done=restored.queue.drain();restored.release();await done;assert.equal(restored.receipts.length,1);
});
test('actual GamePage pauses pressure without generating another save and blocks premature resume',()=>{
 const tree=ts.createSourceFile('GamePage.tsx',source('src/pages/GamePage.tsx'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),functions={};
 const visit=node=>{if(ts.isVariableDeclaration(node)&&['step','resumeWeaponSelection'].includes(node.name.getText(tree)))functions[node.name.getText(tree)]=node.initializer.getText(tree);if(ts.isBinaryExpression(node)&&node.left.getText(tree)==='interruptionRef.current'&&ts.isArrowFunction(node.right))functions.interrupt=node.right.getText(tree);ts.forEachChild(node,visit);};visit(tree);
 assert.ok(functions.step&&functions.interrupt&&functions.resumeWeaponSelection);
 const state={status:'playing',sector:31,phase:'ENTRY',encounter:'normal',hearts:3,score:800,shards:51,paidWeaponMs:18000,asteroids:[],shots:[],enemyShots:[],effects:[]};let saves=0,simulations=0;const countdown=[],diagnostics=[];
 const scope={stateRef:{current:state},saveQueueRef:{current:{underPressure:true}},lastFrameRef:{current:0},lastMeasuredFrameRef:{current:0},lastSavedAtRef:{current:0},fieldSizeRef:{current:{width:390,height:760}},soundRef:{current:null},musicRef:{current:null},navigator:{userAgent:'Fixture'},document:{hidden:false},diagnosticsRef:{current:null},clearControls(){},setTechnicalPause(){},setWeaponCountdown:value=>countdown.push(value),setWeaponMenuOpen(){},setGame(){},setSaveNotice(){},recordGameDiagnostic:value=>diagnostics.push(value),sectorInChapter:stage=>(stage-1)%10+1,saveCombatRef:{current:()=>{saves++;return Promise.resolve();}},simulate:()=>{if(state.status==='playing')simulations++;}};
 for(const [name,code] of Object.entries(functions))vm.runInNewContext(ts.transpileModule('globalThis.'+name+'='+code,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,scope);
 scope.interruptionRef={current:scope.interrupt};scope.step(1000);
 assert.equal(state.status,'paused');assert.equal(simulations,1);assert.equal(saves,0);assert.equal(diagnostics[0]?.reason,'save-pressure');
 assert.equal(state.hearts,3);assert.equal(state.score,800);assert.equal(state.shards,51);assert.equal(state.paidWeaponMs,18000);
 countdown.length=0;scope.resumeWeaponSelection();assert.deepEqual(countdown,[]);
 scope.saveQueueRef.current.underPressure=false;scope.resumeWeaponSelection();assert.deepEqual(countdown,[3]);
});
