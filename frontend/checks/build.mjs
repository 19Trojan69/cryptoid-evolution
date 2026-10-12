import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const stubs={react:'react-stub.mjs','react/jsx-runtime':'react-stub.mjs','react-router-dom':'router-stub.mjs'};
const ui=['CardReveal','SystemSettings','MissionWeaponShop','SectorBackdrop','Starfield','BlockchainProgress','BonusRockLayer','GameSceneBoundary'];
await esbuild.build({entryPoints:['checks/engine-entry.mjs'],outfile:'checks/engine.cjs',bundle:true,platform:'node',format:'cjs',target:'es2022',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'test-boundaries',setup(b){
 b.onResolve({filter:/.*/},a=>{if(a.path === './paintedShip')return {path:path.resolve('src/pages/paintedShip.ts')};if(stubs[a.path])return {path:path.resolve('checks',stubs[a.path])};if(/(?:^|\/)i18n(?:\.ts)?$/.test(a.path))return {path:path.resolve('checks/locale-stub.mjs')};if(/(?:^|\/)gameLoop(?:\.ts)?$/.test(a.path))return {path:path.resolve('checks/loop-stub.mjs')};if(ui.some(s=>a.path.endsWith('/'+s)))return {path:path.resolve('checks/visual-stub.mjs')};});
 b.onLoad({filter:/\.css$/},()=>({contents:'',loader:'text'}));
 b.onLoad({filter:/GamePage\.tsx$/},a=>{let s=fs.readFileSync(a.path,'utf8');s=s.replace('export default GameEntry;', 'export default GamePage;').replace('useRef({ width: 800, height: 600 })','useRef({ width: 390, height: 760 })');
 const marker=s.includes('  const renderScene =')?'  const renderScene =':'  return (\n    <main className="game-shell"';
 if(!s.includes(marker))throw new Error('Missing engine inspection boundary');
 s=s.replace(marker,`  ensureSceneResourcesRef.current = () => true; // Node physics harness: image readiness is tested separately.
  globalThis.engineDebug = { raw:()=>stateRef.current, snapshot:()=>({...stateRef.current, intro:{...varietyRef.current}, flight:flightRef.current, spawned:formationIndexRef.current, total:sectionSlotsRef.current?.length??0, sectionMs:sectionElapsedRef.current, elapsed:elapsedRef.current}), restart, restoreCombat, saveCombat, destroyBoss:()=>destroyBoss(stateRef.current,performance.now()), pause:()=>{stateRef.current.status="paused";}, resume:()=>{stateRef.current.status="playing";lastFrameRef.current=0;}, refs:()=>combatRefs, slots:()=>sectionSlotsRef.current, setAdmin:()=>{adminRunRef.current=true;}, formationStarted:()=>formationStartedRef.current };\n`+marker);
 return {contents:s,loader:'tsx'};});
}}]});
