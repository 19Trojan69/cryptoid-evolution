// Actual resource pipeline with controlled Image/Canvas decoding in Node.
// This does not measure browser/GPU/native image memory or device frame rate.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {build}=require('esbuild'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
(async()=>{
 const compiled=await build({absWorkingDir:root,entryPoints:['src/pages/sceneResources.ts'],bundle:true,write:false,platform:'node',format:'cjs',define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent',plugins:[{name:'stats',setup(b){b.onLoad({filter:/(paintedShip|sceneResources)\.ts$/},a=>({contents:fs.readFileSync(a.path,'utf8')+(a.path.endsWith('paintedShip.ts')?'\nglobalThis.__paintStats=paintedShipResourceStats;':"\nexport {sceneResourcePlan} from './sceneResourcePlan';"),loader:'ts'}));}}]});
 let nextURL=0,failedURL=null;const decoding=[],revoked=[],data=new Map();
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};
 class Image {
  naturalWidth=3;naturalHeight=3;complete=true;
  set src(value){this.url=value;queueMicrotask(()=>value===failedURL?this.onerror?.():this.onload?.());}
  get src(){return this.url;}
  decode(){return new Promise(resolve=>decoding.push({url:this.url,resolve}));}
 }
 const canvases=[];
 const makeCanvas=()=>{const c={width:0,height:0,getContext:()=>({drawImage(){},getImageData:(_x,_y,w,h)=>({data:new Uint8ClampedArray(w*h*4).fill(128)}),putImageData(){}}),toBlob:callback=>queueMicrotask(()=>callback({size:31}))};canvases.push(c);return c;};
 const context={exports:{},module:{exports:{}},console,Image,Uint8ClampedArray,queueMicrotask,setTimeout,clearTimeout,URL:{createObjectURL:()=>`blob:fixture-${++nextURL}`,revokeObjectURL:url=>revoked.push(url)},window:{setTimeout,clearTimeout,localStorage:storage,location:{hostname:'localhost'},__ENV:{appNetwork:'testnet'}},localStorage:storage,document:{createElement:makeCanvas}};
 context.module.exports=context.exports;vm.runInNewContext(compiled.outputFiles[0].text,context);
 const {prepareSceneResources}=context.module.exports;
 const gateSource=fs.readFileSync(path.join(root,'src/pages/sceneResourceGate.ts'),'utf8');
 const gateContext={exports:{}};vm.runInNewContext(ts.transpileModule(gateSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,gateContext);
 const pending=[],faults=[],gate=new gateContext.exports.SceneResourceGate(v=>pending.push(v),e=>faults.push(e));
 const primary=[0,1,2].map(sprite=>({sprite,color:'gold',stage:1})),future=[3,4].map(sprite=>({sprite,color:'silver',stage:1}));
 const load=()=>prepareSceneResources(primary,undefined,future);
 for(let i=0;i<1000;i++)assert.equal(gate.ensure('first',load),false);
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 for(let i=0;i<5;i++)await tick();
 assert.ok(decoding.length>0,faults.map(String).join(","));assert.equal(gate.ensure('first',load),false);
 let turns=0;
 while(!gate.ensure('first',load)){
  assert.ok(++turns<1000);for(const job of decoding.splice(0))job.resolve();await tick();
 }
 assert.deepEqual(pending,[true,false]);assert.ok(context.__paintStats().pending>0,'next-flight preparation never blocks the ready current scene');
 while(context.__paintStats().pending){for(const job of decoding.splice(0))job.resolve();await tick();}
 gate.dispose();assert.equal(faults.length,0);
 const boss=prepareSceneResources([],{image:'/fixture/hull',wreckImage:'/fixture/wreck',weaponImage:'/fixture/weapons'});
 let bossReady=false;boss.ready.then(()=>bossReady=true);
 while(!bossReady){for(const job of decoding.splice(0))job.resolve();await tick();}boss.release();
 failedURL='/ships/evolution/ship_20_stage_2.png';
 const failed=prepareSceneResources([{sprite:19,color:'pink',stage:2}]);
 await assert.rejects(failed.ready,/Ship image unavailable/);failed.release();failedURL=null;
 const retried=prepareSceneResources([{sprite:19,color:'pink',stage:2}]);let retryReady=false;retried.ready.then(()=>retryReady=true);
 while(!retryReady){for(const job of decoding.splice(0))job.resolve();await tick();}retried.release();
 for(let batch=0;batch<100;batch++){
  const lease=prepareSceneResources([{sprite:batch%20,color:['gold','silver','bronze'][batch%3],stage:1}]);
  let ready=false;lease.ready.then(()=>ready=true);
  while(!ready){for(const job of decoding.splice(0))job.resolve();await tick();}
  lease.release();lease.release();assert.ok(context.__paintStats().painted<=48);assert.ok(context.__paintStats().sources<=8);
 }
 assert.ok(canvases.every(c=>c.width===0&&c.height===0),'every temporary canvas released');assert.ok(revoked.length>0);
 const source=fs.readFileSync(path.join(root,'src/pages/GamePage.tsx'),'utf8'),tree=ts.createSourceFile('game.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let step,ensureScene;
 const visit=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(tree)==='step')step=n.initializer.getText(tree);if(ts.isVariableDeclaration(n)&&n.name.getText(tree)==='ensureSceneResources')ensureScene=n.initializer.getText(tree);ts.forEachChild(n,visit);};visit(tree);assert.ok(step);
 let ready=false,simulated=0,time=100;const state={status:'playing',paidWeaponMs:60000,rapidFireMs:20000,hearts:3,score:123,shards:45,effects:[{startedAt:84}]};
 const frame={stateRef:{current:state},sceneFailedRef:{current:false},ensureSceneResourcesRef:{current:()=>ready},lastFrameRef:{current:84},lastMeasuredFrameRef:{current:0},lastWorkMsRef:{current:0},saveQueueRef:{current:null},diagnosticsRef:{current:null},document:{hidden:false},performance:{now:()=>time},frameDiagnosticsRef:{current:{sample(){}}},simulate:t=>{simulated++;assert.equal(t-frame.lastFrameRef.current,16);},interruptionRef:{current:()=>assert.fail()}};
 vm.runInNewContext(ts.transpileModule('globalThis.step='+step,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,frame);
 for(let i=0;i<625;i++){frame.step(time);time+=16;}assert.equal(simulated,0);assert.equal(state.paidWeaponMs,60000);assert.equal(state.rapidFireMs,20000);assert.equal(state.effects[0].startedAt,10084);
 ready=true;frame.step(time);assert.equal(simulated,1);
 // Execute GamePage's actual ensure function across real plans. Drain the
 // finite forecast while the current encounter runs, then verify transitions
 // return true in the SAME call, without a loading callback or freeze frame.
 const transitionPending=[],transitionFaults=[];
 const transitionGate=new gateContext.exports.SceneResourceGate(v=>transitionPending.push(v),e=>transitionFaults.push(e));
 const resources={stateRef:{current:{sector:21,encounter:'normal',asteroids:[],boss:null}},shipSelectionRef:{current:{skin:{sprite:0},color:{id:'gold'}}},shipStageRef:{current:1},bossEscortWaveRef:{current:0},flightRef:{current:0},rulesVersionRef:{current:2},resourceGateRef:{current:transitionGate},prepareSceneResources,sceneResourcePlan:context.module.exports.sceneResourcePlan};
 vm.runInNewContext(ts.transpileModule('globalThis.ensure='+ensureScene,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,resources);
 const drain=async()=>{for(let i=0;i<3000;i++){for(const job of decoding.splice(0))job.resolve();await new Promise(resolve=>setTimeout(resolve,1));if(context.__paintStats().pending===0&&decoding.length===0)return;}assert.fail('forecast did not settle');};
 resources.ensure();await drain();assert.equal(resources.ensure(),true);transitionPending.length=0;
 let warmTransitions=0,formationChecks=0;
 for(let sector=21;sector<=53;sector++){
  const state=resources.stateRef.current;state.sector=sector;state.encounter=sector%10===0?'boss-fight':'normal';state.boss=sector%10===0?{config:{image:`/fixture/boss-${sector}`,wreckImage:`/fixture/wreck-${sector}`,weaponImage:`/fixture/guns-${sector}`}}:null;
  // Foreground boss assets match the actual previous-block forecast config.
  if(state.boss){const plan=resources.sceneResourcePlan(sector-1,'normal',0,2);state.boss.config=plan.upcomingBoss;}
  resources.bossEscortWaveRef.current=0;
  assert.equal(resources.ensure(),true,`warm stage ${sector} must not lose a frame`);warmTransitions++;await drain();
  if(state.boss){
   for(let wave=1;wave<6;wave++){resources.bossEscortWaveRef.current=wave;assert.equal(resources.ensure(),true,`escort ${sector}/${wave}`);warmTransitions++;await drain();}
   state.encounter='bonus';state.boss=null;assert.equal(resources.ensure(),true,`bonus ${sector}`);warmTransitions++;await drain();
  }else{
   for(let flight=1;flight<=2;flight++){resources.flightRef.current=flight;assert.equal(resources.ensure(),true);formationChecks++;}
  }
  assert.ok(context.__paintStats().painted<=48,'forecast remains within the material entry budget');
 }
 assert.equal(transitionPending.includes(true),false);
 // A fresh higher-level restore is allowed one initial load, then the same
 // decoded handoff must hold through the final boss and bonus at stage 500.
 resources.stateRef.current={sector:481,encounter:'normal',asteroids:[],boss:null};resources.bossEscortWaveRef.current=0;
 resources.ensure();await drain();assert.equal(resources.ensure(),true);transitionPending.length=0;
 for(let sector=482;sector<=500;sector++){
  const state=resources.stateRef.current;state.sector=sector;state.encounter=sector===500?'boss-fight':'normal';
  state.boss=sector===500?{config:resources.sceneResourcePlan(499,'normal',0,2).upcomingBoss}:null;
  assert.equal(resources.ensure(),true,`high stage ${sector}`);warmTransitions++;await drain();
  if(sector===500){
   for(let wave=1;wave<6;wave++){resources.bossEscortWaveRef.current=wave;assert.equal(resources.ensure(),true);warmTransitions++;await drain();}
   state.encounter='bonus';state.boss=null;assert.equal(resources.ensure(),true);warmTransitions++;await drain();
  }else for(let flight=1;flight<=2;flight++){resources.flightRef.current=flight;assert.equal(resources.ensure(),true);formationChecks++;}
  assert.ok(context.__paintStats().painted<=48);
 }
 assert.equal(transitionPending.includes(true),false);assert.equal(transitionFaults.length,0);transitionGate.dispose();
 const report={passed:true,mode:'actual resource pipeline and actual GamePage step; controlled Node Image/Canvas/worker fallback; no native browser/GPU/FPS proof',decodeGate:true,warmTransitions,formationChecks,warmTransitionWaitingCallbacks:transitionPending.filter(Boolean).length,bossTexturesDecoded:true,failedImageCanRetry:true,forecastDoesNotBlockCurrent:true,loadingChecksDeduplicated:1000,cacheAfter100Batches:context.__paintStats(),temporaryCanvasesReleased:canvases.length,blobURLsRevoked:revoked.length,waitingMilliseconds:10000,powerTimersAndProgressFrozen:true,effectAgeProtected:true,resumeDeltaMs:16};
 if(process.env.CRYPTOID_RESOURCES_OUT)fs.writeFileSync(process.env.CRYPTOID_RESOURCES_OUT,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
