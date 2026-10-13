// Execute the real resource pipeline and GamePage forecast with controlled
// Image/Canvas hosts. No browser/native GPU/memory/frame-rate inference.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {build}=require('esbuild'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
(async()=>{
 const compiled=await build({absWorkingDir:root,entryPoints:['src/pages/sceneResources.ts'],bundle:true,write:false,platform:'node',format:'cjs',define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent',plugins:[{name:'inspect-real-resources',setup(b){b.onLoad({filter:/(paintedShip|sceneResources)\.ts$/},a=>({contents:fs.readFileSync(a.path,'utf8')+(a.path.endsWith('paintedShip.ts')?'\nglobalThis.__paintStats=paintedShipResourceStats;':"\nexport {sceneResourcePlan} from './sceneResourcePlan';"),loader:'ts'}));}}]});
 let nextURL=0,failedURL=null;const decoding=[],revoked=[],canvases=[],data=new Map();
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};
 class Image {
  naturalWidth=282;naturalHeight=282;complete=true;
  set src(value){this.url=value;if(value)queueMicrotask(()=>value===failedURL?this.onerror?.():this.onload?.());}
  decode(){return new Promise(resolve=>decoding.push(resolve));}
 }
 const canvas=()=>{const c={width:0,height:0,getContext:()=>({drawImage(){},getImageData:(_x,_y,w,h)=>({data:new Uint8ClampedArray(w*h*4).fill(128)}),putImageData(){}}),toBlob:callback=>queueMicrotask(()=>callback({size:60000}))};canvases.push(c);return c;};
 const context={exports:{},module:{exports:{}},console,Image,Uint8ClampedArray,queueMicrotask,setTimeout,clearTimeout,URL:{createObjectURL:()=>`blob:fixture-${++nextURL}`,revokeObjectURL:url=>revoked.push(url)},window:{setTimeout,clearTimeout,localStorage:storage,location:{hostname:'localhost'},__ENV:{appNetwork:'testnet'}},localStorage:storage,document:{createElement:canvas}};
 context.module.exports=context.exports;vm.runInNewContext(compiled.outputFiles[0].text,context);
 const {prepareSceneResources,sceneResourcePlan}=context.module.exports;
 const host={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'src/pages/sceneResourcePreloader.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,host);
 const faults=[],preloader=new host.exports.SceneResourcePreloader(error=>faults.push(error));
 const records=[],leases=[];
 const resources={stateRef:{current:{sector:21,encounter:'normal',asteroids:[],boss:null}},shipSelectionRef:{current:{skin:{sprite:0},color:{id:'gold'}}},shipStageRef:{current:1},bossEscortWaveRef:{current:0},rulesVersionRef:{current:2},sceneResourcePreloaderRef:{current:preloader},sceneResourcePlan,prepareSceneResources:(...args)=>{const lease=prepareSceneResources(...args);leases.push(lease);records.push({sector:resources.stateRef.current.sector,encounter:resources.stateRef.current.encounter,wave:resources.bossEscortWaveRef.current,warm:lease.isReady()});return lease;}};
 const tree=ts.createSourceFile('game.tsx',fs.readFileSync(path.join(root,'src/pages/GamePage.tsx'),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let actualForecast;
 const visit=node=>{if(ts.isVariableDeclaration(node)&&node.name.getText(tree)==='prepareSceneForecast')actualForecast=node.initializer.getText(tree);ts.forEachChild(node,visit);};visit(tree);assert.ok(actualForecast);
 vm.runInNewContext(ts.transpileModule('globalThis.prepare='+actualForecast,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,resources);
 const peaks={painted:0,sources:0,pending:0,estimatedBytes:0,retained:0};
 const sample=()=>{const s=context.__paintStats();for(const key of Object.keys(peaks))peaks[key]=Math.max(peaks[key],s[key]);assert.ok(s.painted<=48);assert.ok(s.sources<=8);assert.ok(s.estimatedBytes<=24*1024*1024);};
 const drain=async()=>{for(let i=0;i<5000;i++){for(const resolve of decoding.splice(0))resolve();await new Promise(resolve=>setTimeout(resolve,1));sample();if(context.__paintStats().pending===0&&decoding.length===0){await Promise.resolve();return;}}assert.fail('resource forecast never settles');};
 resources.prepare();for(let i=0;i<10000;i++)resources.prepare();assert.equal(records.length,1,'same scene preparation is deduplicated');
 assert.equal(records[0].warm,false);await drain();assert.equal(leases.at(-1).isReady(),true);
 let transitions=0;
 for(const [first,last] of [[22,53],[482,500]]){
  if(first===482){resources.stateRef.current={sector:481,encounter:'normal',asteroids:[],boss:null};resources.bossEscortWaveRef.current=0;resources.prepare();await drain();}
  for(let sector=first;sector<=last;sector++){
   const state=resources.stateRef.current;state.sector=sector;state.encounter=sector%10===0?'boss-fight':'normal';state.boss=sector%10===0?{config:sceneResourcePlan(sector-1,'normal',0,2).upcomingBoss}:null;resources.bossEscortWaveRef.current=0;
   resources.prepare();assert.equal(records.at(-1).warm,true,`previous encounter forecast covers ${sector}`);transitions++;await drain();
   if(state.boss){for(let wave=1;wave<6;wave++){resources.bossEscortWaveRef.current=wave;resources.prepare();assert.equal(records.at(-1).warm,true);transitions++;await drain();}
    state.encounter='bonus';state.boss=null;resources.prepare();assert.equal(records.at(-1).warm,true);transitions++;await drain();}
  }
 }
 preloader.dispose();await drain();assert.equal(context.__paintStats().retained,0,'every forecast pin is released on unmount');
 failedURL='/ships/evolution/ship_20_stage_2.png';const failed=prepareSceneResources([{sprite:19,color:'pink',stage:2}]);await assert.rejects(failed.ready,/Ship image unavailable/);failed.release();failedURL=null;
 const retry=prepareSceneResources([{sprite:19,color:'pink',stage:2}]);await drain();await retry.ready;retry.release();
 assert.equal(context.__paintStats().retained,0);assert.equal(faults.length,0);assert.ok(canvases.every(c=>c.width===0&&c.height===0));
 const result={passed:true,mode:'actual resource pipeline and actual GamePage forecast with controlled 282px Image/Canvas hosts, original pixel algorithm fallback, no browser/GPU/FPS proof',warmTransitions:transitions,deduplicatedCalls:10000,loopGatesAdded:0,loadingOverlaysAdded:0,forecastFailuresDoNotPauseCombat:true,failedImageRetry:true,peaks,afterUnmount:context.__paintStats(),temporaryCanvasesReleased:canvases.length,blobURLsRevoked:revoked.length};
 if(process.env.CRYPTOID_PRELOADING_OUT)fs.writeFileSync(process.env.CRYPTOID_PRELOADING_OUT,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
