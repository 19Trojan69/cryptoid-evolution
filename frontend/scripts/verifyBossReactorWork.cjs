// Actual React rendering of the production reactor, with JSX creation counts.
// Host-tree equality is not a WebKit/GPU memory, thermal or device-FPS result.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const assert = require('node:assert/strict');
const { build } = require('esbuild');
const root = path.resolve(__dirname, '..');
const qa = createRequire(path.join(process.env.CRYPTOID_SCENE_QA || '/tmp/cryptoid-reactor-qa', 'package.json'));
const React = qa('react'), Renderer = qa('react-test-renderer'), jsx = qa('react/jsx-runtime');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const originalError = console.error;
console.error = (...args) => {
  if (!String(args[0]).startsWith('react-test-renderer is deprecated')) originalError(...args);
};
const baseline = process.env.CRYPTOID_REACTOR_BASE || 'a21018085b9ea522a6e5fd7b13f26251ff5a9823';
async function runtime(ref) {
  const source = ref ? execFileSync('git', ['show', `${ref}:frontend/src/pages/BossReactorView.tsx`], {cwd:root,encoding:'utf8'})
    : fs.readFileSync(path.join(root,'src/pages/BossReactorView.tsx'),'utf8');
  const counts = { elements: 0 };
  const countedJsx = { ...jsx, jsx:(...args)=>{counts.elements++;return jsx.jsx(...args);},
    jsxs:(...args)=>{counts.elements++;return jsx.jsxs(...args);} };
  // Both independent renderer roots need matching IDs for exact tree comparison.
  // Still call the actual hook so hook ordering and lifetime remain real React.
  const react = { ...React, useId:()=>{React.useId();return 'reactor-qa';} };
  const compiled = await build({absWorkingDir:root,stdin:{contents:"export {default as Reactor} from './src/pages/BossReactorView';export {createSectorBoss,moveSectorBoss} from './src/pages/sectorBoss';",resolveDir:root,loader:'tsx'},
    bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime'],
    plugins:[{name:'actual-reactor',setup(b){b.onLoad({filter:/BossReactorView\.tsx$/},()=>({contents:source,loader:'tsx'}));}}]});
  const scope = {module:{exports:{}},require:name=>name==='react'?react:name==='react/jsx-runtime'?countedJsx:qa(name)};
  vm.runInNewContext(compiled.outputFiles[0].text,scope);
  let tree;
  return {...scope.module.exports,counts,
    update(boss){Renderer.act(()=>{const node=React.createElement(scope.module.exports.Reactor,{boss});if(tree)tree.update(node);else tree=Renderer.create(node);});return JSON.stringify(tree.toJSON());},
    host(){return tree.root.findByType('svg');},
    unmount(){Renderer.act(()=>tree.unmount());tree=null;},
  };
}
(async()=>{
  const before=await runtime(baseline),after=await runtime(process.env.CRYPTOID_REACTOR_CANDIDATE_REF || null);
  const model=before.moveSectorBoss(before.createSectorBoss(10,430,96,825),10000,430,825);
  let comparisons=0;
  const compare=(boss,label)=>{assert.equal(after.update(boss),before.update(boss),label);comparisons++;};
  compare(model,'initial closed reactor');
  const beforeHost=before.host(),afterHost=after.host();
  const initial={before:before.counts.elements,after:after.counts.elements};
  const frames=1200;
  for(let frame=0;frame<frames;frame++) {
    model.elapsed+=1000/30;model.x+=.01;model.y+=.001;model.turrets[0].a+=.01;
    compare({...model},'closed reactor while parent moves '+frame);
  }
  const stable={frames,beforeElements:before.counts.elements-initial.before,afterElements:after.counts.elements-initial.after};
  assert.equal(before.host(),beforeHost);assert.equal(after.host(),afterHost);
  const openCore=[];
  model.turrets.forEach(g=>{g.health=0;});
  for(const phase of ['opening','charge','recoil']) {
    model.core={elapsed:0,volley:phase==='opening'?0:1};
    compare({...model},`prime ${phase}`);
    const start={before:before.counts.elements,after:after.counts.elements};
    for(let frame=1;frame<=frames;frame++) {
      model.core.elapsed=phase==='opening'?frame%900:phase==='charge'?180+frame%1600:frame%180;
      compare({...model},`${phase} frame ${frame}`);
    }
    const work={phase,frames,beforeElements:before.counts.elements-start.before,afterElements:after.counts.elements-start.after};
    if(process.env.CRYPTOID_REQUIRE_OPEN_REACTOR_FIX==='1')assert.ok(work.afterElements<work.beforeElements*.5,`${phase}: fixed artwork should not be reconstructed each frame`);
    openCore.push(work);
  }
  for(let id=1;id<=50;id++) for(const width of [320,430,820]) {
    const boss=before.moveSectorBoss(before.createSectorBoss(id*10,width,96,825),10000,width,825);
    compare(boss,`boss ${id}, width ${width}, closed`);
    boss.turrets.forEach(g=>{g.health=0;});
    boss.core={elapsed:0,volley:0};
    for(const elapsed of [0,1,150,450,899,900,1799]) {
      boss.core.elapsed=elapsed;compare({...boss},`boss ${id}, opening ${elapsed}`);
    }
    boss.core.volley=1;
    for(const elapsed of [0,17,90,179,180,900,2800]) {
      boss.core.elapsed=elapsed;compare({...boss},`boss ${id}, recoil/charge ${elapsed}`);
    }
    boss.core.lastShotColor='#76aaff';compare({...boss},`boss ${id}, energy color`);
    boss.width*=1.1;boss.height*=.9;compare({...boss},`boss ${id}, resize`);
    boss.config={...boss.config,image:'/reactor-replacement.webp'};compare({...boss},`boss ${id}, replacement image`);
    boss.health=0;compare({...boss},`boss ${id}, defeated`);
    boss.turrets[0].health=1;compare({...boss},`boss ${id}, closed/restored`);
  }
  before.unmount();after.unmount();
  const corrected=stable.afterElements===0&&stable.beforeElements>10000;
  if(process.env.CRYPTOID_REQUIRE_REACTOR_FIX==='1')assert.ok(corrected,'unchanged SVG must reuse its previous element tree');
  const result={passed:true,closedArtworkReused:stable.afterElements===0,openArtworkReused:openCore.every(work=>work.afterElements<work.beforeElements*.5),baseline,stable,openCore,exactHostTreeComparisons:comparisons,bosses:50,widths:[320,430,820],sameSvgHostDuringStableUpdates:true,
    limits:'Actual React + JSX operation counts. No browser raster, GPU/native memory, physical iPhone heat, FPS or Whitescreen-cause proof.'};
  if(process.env.CRYPTOID_REACTOR_REPORT)fs.writeFileSync(process.env.CRYPTOID_REACTOR_REPORT,JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
