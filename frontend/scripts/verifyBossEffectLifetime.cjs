// Actual HullDamage reconciliation and CSS pacing with controlled native events.
// This is not a browser compositor, WebKit memory or physical iPhone test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { build } = require('esbuild');
const root = path.resolve(__dirname, '..');
const qa = createRequire(path.join(process.env.CRYPTOID_SCENE_QA || '/tmp/cryptoid-boss-effect-qa', 'package.json'));
const React = qa('react'), Renderer = qa('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const originalError = console.error;
console.error = (...args) => {
  if (!String(args[0]).startsWith('react-test-renderer is deprecated')) originalError(...args);
};
(async () => {
  const compiled = await build({absWorkingDir:root,stdin:{contents:
    "export {default as HullDamage} from './src/pages/HullDamage';export * from './src/pages/hullFires';export * from './src/lib/cssFramePacing';",
    resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});
  const scope={module:{exports:{}},require:qa};
  vm.runInNewContext(compiled.outputFiles[0].text,scope);
  const api=scope.module.exports;
  let tree, maxSites=0, maxNodes=0, hits=0;
  const render=props=>Renderer.act(()=>{
    const view=React.createElement(api.HullDamage,props);
    if(tree)tree.update(view);else tree=Renderer.create(view);
  });
  for(let boss=1;boss<=50;boss++) {
    let sites=[];
    for(let index=0;index<100;index++) {
      const id=++hits, [x,y]=api.bossFireSites[index%api.bossFireSites.length];
      sites=api.addPersistentHullFire(sites,{id,x,y,impactPower:1+index%5},api.hullFireLimit(0,100,true));
      const hit={id,x,y,impactPower:1+index%5};
      render({sites,hit,maskImage:`url('/boss-${boss}.webp')`,bossDamage:.72});
      const spots=tree.root.findAll(n=>n.props.className==='hull-hotspot');
      const bursts=tree.root.findAll(n=>n.props.className==='hull-mini-explosion');
      const nodes=tree.root.findAll(n=>typeof n.type==='string').length;
      maxSites=Math.max(maxSites,spots.length);maxNodes=Math.max(maxNodes,nodes);
      assert.equal(spots.length,sites.length);
      assert.ok(spots.length<=8);assert.equal(bursts.length,1);assert.ok(nodes<=23);
      // An unchanged presentation keeps its actual reconciled host instances.
      const firstSpot=spots[0],burst=bursts[0];
      render({sites,hit,maskImage:`url('/boss-${boss}.webp')`,bossDamage:.72});
      assert.equal(tree.root.findAll(n=>n.props.className==='hull-hotspot')[0],firstSpot);
      assert.equal(tree.root.findAll(n=>n.props.className==='hull-mini-explosion')[0],burst);
    }
    render({sites:[],maskImage:`url('/boss-${boss}.webp')`,bossDamage:0});
    assert.equal(tree.toJSON(),null,'removing the boss removes every heat/burst host node');
  }
  Renderer.act(()=>tree.unmount());assert.equal(tree.toJSON(),null);

  const rootHost=new EventTarget();
  rootHost.ownerDocument={defaultView:{CSS:{supports:()=>true}}};
  rootHost.contains=target=>target.isConnected;
  rootHost.getAnimations=()=>[];
  const stop=api.startCssFramePacing(rootHost);
  const animation=()=>{
    const a=new EventTarget(), timing={easing:'linear'};
    a.playState='running';a.playbackRate=1;
    a.effect={target:{isConnected:true},getTiming:()=>({...timing}),getComputedTiming:()=>({duration:380}),updateTiming:change=>Object.assign(timing,change)};
    api.paceAnimation(a);return a;
  };
  const retire=(a,event)=>{a.effect.target.isConnected=false;a.playState=event==='cancel'?'idle':'finished';a.dispatchEvent(new Event(event));};
  // Eight sites with cooling/flicker/speck plus the reactor pulse stay mounted.
  const persistent=Array.from({length:25},animation);
  let maxTracked=25;
  for(let impact=0;impact<2000;impact++) {
    const burst=Array.from({length:8},animation);
    maxTracked=Math.max(maxTracked,api.cssFramePacingStats().active);
    for(const a of burst)retire(a,impact%2?'cancel':'finish');
    assert.equal(api.cssFramePacingStats().active,25,'completed or replaced bursts release their controller entries');
  }
  for(const a of persistent)retire(a,'cancel');
  assert.equal(api.cssFramePacingStats().active,0);stop();
  const result={passed:true,bosses:50,hullHits:hits,maxLiveHeatSites:maxSites,maxLiveHullHostNodes:maxNodes,
    controllerAnimationsCreated:16025,maxControllerEntries:maxTracked,controllerEntriesAfterCleanup:api.cssFramePacingStats().active,
    limits:'Actual React host reconciliation and synthetic finish/cancel delivery. No native event-delivery, native/GPU memory, physical iPhone FPS, heat or Whitescreen-cause proof.'};
  if(process.env.CRYPTOID_EFFECT_LIFETIME_REPORT)fs.writeFileSync(process.env.CRYPTOID_EFFECT_LIFETIME_REPORT,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
