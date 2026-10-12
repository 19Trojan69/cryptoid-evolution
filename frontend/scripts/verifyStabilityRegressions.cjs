// Actual before/after source with isolated host/state fixtures.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),repo=path.dirname(root),base='16fcfb43aad836de0e38f684c0d4cade82b78976';
const read=(file,before)=>before?execFileSync('git',['show',base+':frontend/src/'+file],{cwd:repo,encoding:'utf8'}):fs.readFileSync(path.join(root,'src',file),'utf8');
const ast=s=>ts.createSourceFile('audit.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const boss=require('../src/pages/bossWeaponSound.ts'),enemy=require('../src/pages/enemyWeaponSound.ts');
async function audio(before){
 const tree=ast(read('pages/gameAudio.ts',before)),cls=tree.statements.find(n=>ts.isClassDeclaration(n)&&n.name.text==='GameAudio');let buffers=0;
 const context={exports:{},...boss,...enemy,readEffectsVolume:()=>.4,effectsGain:v=>v,
  AudioContext:class{state='running';sampleRate=8000;destination={};createGain(){return{gain:{value:1},connect:x=>x,disconnect(){}};}createBuffer(){if(++buffers===3)throw Error('fixture allocation');return{copyToChannel(){}};}async resume(){}async close(){}}};
 vm.runInNewContext(compile(cls.getText(tree)),context);const instance=new context.exports.GameAudio();
 const first=await instance.start(),partial=instance.bossSamples.size,retry=await instance.start(),completed=instance.bossSamples.size;instance.close();
 return{first,partialBossSamples:partial,retry,bossSamplesAfterRetry:completed,expected:Object.keys(boss.bossSoundReferences).length*3};
}
function lateActivation(before){
 const tree=ast(read('pages/GamePage.tsx',before));let step;const visit=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(tree)==='step')step=n.initializer.getText(tree);ts.forEachChild(n,visit);};visit(tree);assert.ok(step);
 const state={status:'playing',hearts:2,score:123,shards:45,weaponTimers:[0,0,60000,0,0,0]},simulatedStatuses=[],faults=[];
 const context={ensureSceneResourcesRef:{current:()=>true},stateRef:{current:state},sceneFailedRef:{current:true},document:{hidden:false},performance:{now:()=>100},
  lastFrameRef:{current:84},lastMeasuredFrameRef:{current:0},lastWorkMsRef:{current:0},diagnosticsRef:{current:null},saveQueueRef:{current:null},
  frameDiagnosticsRef:{current:{sample(){}}},simulate:()=>simulatedStatuses.push(state.status),interruptionRef:{current:reason=>{faults.push(reason);state.status='paused';}}};
 vm.runInNewContext(compile('globalThis.step='+step),context);context.step(100);
 return{simulatedStatuses,faults,state};
}
(async()=>{
 const result={base,mode:'actual source with isolated fixtures; no mobile or original incident reproduction',
  atomicSamples:{before:await audio(true),after:await audio(false)},lateActivation:{before:lateActivation(true),after:lateActivation(false)}};
 assert.equal(result.atomicSamples.before.partialBossSamples,2);assert.equal(result.atomicSamples.before.bossSamplesAfterRetry,2);
 assert.equal(result.atomicSamples.after.partialBossSamples,0);assert.equal(result.atomicSamples.after.bossSamplesAfterRetry,result.atomicSamples.after.expected);
 assert.deepEqual(result.lateActivation.before.simulatedStatuses,['playing']);assert.deepEqual(result.lateActivation.after.simulatedStatuses,['paused']);
 assert.deepEqual(result.lateActivation.after.faults,['render-error']);
 for(const key of ['hearts','score','shards','weaponTimers'])assert.deepEqual(result.lateActivation.after.state[key],result.lateActivation.before.state[key]);
 result.passed=true;if(process.env.CRYPTOID_REGRESSIONS_OUT)fs.writeFileSync(process.env.CRYPTOID_REGRESSIONS_OUT,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
