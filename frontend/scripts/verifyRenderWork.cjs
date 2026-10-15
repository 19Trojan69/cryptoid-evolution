// Actual React reconciliation without a browser/GPU. Counts redundant work;
// checks identical host trees and active Canvas commands, not device FPS.
// QA-only dependencies: npm install --prefix /tmp/cryptoid-render-qa --ignore-scripts
//   --no-audit --no-fund --package-lock=false react@19.3.1 react-test-renderer@19.3.1
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const assert=require('node:assert/strict'),{createHash}=require('node:crypto'),{createRequire}=require('node:module'),{build}=require('esbuild');
const root=path.resolve(__dirname,'..'),qaRequire=createRequire(path.join(process.env.CRYPTOID_RENDER_QA||'/tmp/cryptoid-render-qa','package.json'));
const React=qaRequire('react'),Renderer=qaRequire('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const baseline=process.env.CRYPTOID_RENDER_BASE_REF||'9cdf32caba9787f94879c380673de9f21a798562';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function measure(ref){
 const counts={blockRenders:0},timers=new Map();let nextTimer=0;const canvases=[];
 function canvas(){const commands=[],g=new Proxy({},{get:(_,name)=>name==='createRadialGradient'?((...args)=>{commands.push([name,...args]);return{addColorStop:(...a)=>commands.push(['addColorStop',...a])};}):(...args)=>commands.push([name,...args.map(a=>a?.commands?'texture':a)]),set:(_,name,value)=>{commands.push(['set',name,value]);return true;}});const c={width:300,height:150,commands,getContext:()=>g};canvases.push(c);return c;}
 const compiled=await build({absWorkingDir:root,stdin:{contents:"export {default as Rocks} from './src/pages/BonusRockLayer';export {default as Blocks} from './src/pages/BlockchainProgress';",resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime'],define:{'import.meta.env':'{}'},plugins:[{name:'actual-components-qa',setup(b){b.onResolve({filter:/^\.\.\/i18n$/},()=>({path:'locale',namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:"import {useContext,createContext} from 'react';export const context=createContext('Block');export const useLocale=()=>{const label=useContext(context);return {t:()=>label}};globalThis.__localeContext=context;",loader:'js'}));b.onLoad({filter:/(BlockchainProgress|BonusRockLayer)\.tsx$/},a=>{let s=ref?cp.execFileSync('git',['show',`${ref}:frontend/src/pages/${path.basename(a.path)}`],{cwd:root,encoding:'utf8'}):fs.readFileSync(a.path,'utf8');if(a.path.endsWith('BlockchainProgress.tsx'))s=s.replace('  const { t } = useLocale();','  globalThis.__counts.blockRenders++;\n  const { t } = useLocale();');return {contents:s,loader:'tsx'};});}}]});
 const context={exports:{},require:qaRequire,console,globalThis:{__counts:counts},window:{devicePixelRatio:3,setTimeout:fn=>{const id=++nextTimer;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)},document:{createElement:canvas}};
 context.module={exports:context.exports};vm.runInNewContext(compiled.outputFiles[0].text,context);const {Rocks,Blocks}=context.module.exports;
 let rocksRoot,blocksRoot;const updateRocks=props=>Renderer.act(()=>{const el=React.createElement(Rocks,props);if(rocksRoot)rocksRoot.update(el);else rocksRoot=Renderer.create(el,{createNodeMock:()=>canvas()});});
 for(let i=0;i<240;i++)updateRocks({rocks:[],effects:[],width:390,height:844});
 const idleClears=canvases[0].commands.filter(x=>x[0]==='clearRect').length;
 canvases[0].commands.length=0;
 for(let i=0;i<20;i++)updateRocks({rocks:[{seed:2,x:120+i,y:180+i*2,radius:22,rotation:i*.1,hitMs:i===2?200:0}],effects:[{seed:3,x:160,y:220,radius:24,age:i*30,final:true,points:4}],width:390,height:844});
 const activeCommands=hash(canvases.map(c=>c.commands));
 updateRocks({rocks:[],effects:[],width:390,height:844});const removalClears=canvases[0].commands.filter(x=>x[0]==='clearRect').length-20;
 const beforeIdle=canvases[0].commands.length;for(let i=0;i<80;i++)updateRocks({rocks:[],effects:[],width:390,height:844});const afterRemovalCommands=canvases[0].commands.length-beforeIdle;
 updateRocks({rocks:[],effects:[],width:844,height:390});assert.equal(canvases[0].width,1266);assert.equal(canvases[0].height,585);
 const locale=context.globalThis.__localeContext;const updateBlocks=(blocks,saved=false,label='Block')=>Renderer.act(()=>{const el=React.createElement(locale.Provider,{value:label},React.createElement(Blocks,{blocks,saved}));if(blocksRoot)blocksRoot.update(el);else blocksRoot=Renderer.create(el);});
 for(let i=0;i<240;i++)updateBlocks(6);const blockRenders=counts.blockRenders,normalTree=hash(blocksRoot.toJSON());
 updateBlocks(7);const changedTree=hash(blocksRoot.toJSON());assert.notEqual(changedTree,normalTree);
 updateBlocks(9,true);const savedTree=hash(blocksRoot.toJSON());
 updateBlocks(9,true,'Abschnitt');assert.match(blocksRoot.toJSON().props['aria-label'],/Abschnitt/);
 Renderer.act(()=>{rocksRoot.unmount();blocksRoot.unmount();});assert.equal(timers.size,0);
 return {idleClears,blockRenders,activeCommands,removalClears,afterRemovalCommands,normalTree,changedTree,savedTree,cleanupTimers:timers.size};
}
(async()=>{const before=await measure(baseline),after=await measure(null);assert.equal(after.activeCommands,before.activeCommands,'active rocks, textures and fragments issue identical drawing commands');for(const k of ['normalTree','changedTree','savedTree'])assert.equal(after[k],before[k],'block presentation unchanged');assert.equal(after.removalClears,1,'last visible drawing is cleared');const corrected=after.idleClears===0&&after.blockRenders===1&&after.afterRemovalCommands===0;if(process.env.CRYPTOID_REQUIRE_RENDER_FIX==='1')assert.ok(corrected);console.log(JSON.stringify({passed:true,corrected,baseline,before,after,limits:'Actual React test renderer and mocked Canvas; no browser, GPU or FPS inference.'},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
