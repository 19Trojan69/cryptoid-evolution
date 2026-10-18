// Integration of the exact device hooks and controller with the existing real
// GamePage simulation host. Presentation/audio/API remain stubs, not a browser test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module');
const effects=process.env.CRYPTOID_REPLAY_PROFILE==='effects';
const lifecycle=effects||process.env.CRYPTOID_REPLAY_PROFILE==='lifecycle';
const file=path.join(__dirname,'verifySimulationStability.cjs');
let source=fs.readFileSync(file,'utf8');
const once=(before,after)=>{assert.equal(source.split(before).length,2,before);source=source.replace(before,after);};
once('const hooks = `','const hooks = fs.readFileSync(path.join(__dirname,"deviceReplay/'+(lifecycle?'lifecycleHooks.ts.txt':'gameHooks.ts.txt')+'"),"utf8") + `');
once('  const document = {',`  const {createDeviceReplay}=await import(path.join(__dirname,'deviceReplay/controller.mjs'));
  const {LIFECYCLE_PHASES}=await import(path.join(__dirname,'deviceReplay/lifecyclePhases.mjs'));
  const {EFFECT_PHASES}=await import(path.join(__dirname,'deviceReplay/effectPresentation.mjs'));
  let deviceReport;
  host.__cryptoidDeviceReplay=createDeviceReplay({now:()=>clock,...${lifecycle?'{phases:'+(effects?'EFFECT_PHASES':'LIFECYCLE_PHASES')+'}':'{}'},onFinish:r=>{deviceReport=r;}});
  const document = {`);
once('  context.__GamePageFactory();',`  const entry=context.module.exports.default();
  assert.equal(entry.type,context.__GamePageFactory,'real GameEntry mounts the game');
  entry.type();`);
once('  qa.cards();\n  qa.protect();','  // Device fixture installed by the exact effect hook; do not replace it.');
once('      qa.protect();','      // Device fixture maintains controlled lives itself.');
once('clock = Math.min(end, clock + 16);',`clock = Math.min(end, clock + Number(process.env.CRYPTOID_REPLAY_FRAME_MS||16));`);
// Use the same three instrumentation positions as buildDeviceReplay.mjs.
once('source.replace("useRef({ width: 800, height: 600 })",',`source.replace('      const delta = Math.min(34, frameGap);',
                '      const delta = Math.min(34, frameGap);\\n      if(state.status===\\'playing\\')(window as any).__cryptoidDeviceReplay?.clock(time,frameGap,delta);')
                .replace('            state.shots.push(...volley.slice(0, MAX_PLAYER_SHOTS - state.shots.length));',
                '            state.shots.push(...volley.slice(0, MAX_PLAYER_SHOTS - state.shots.length));\\n            (window as any).__cryptoidDeviceReplay?.volley(time);')
                .replace("      finally { probe?.mark('phase-save-and-paint'); probe?.end(time); }",
                "      finally { probe?.mark('phase-save-and-paint'); probe?.end(time); (window as any).__cryptoidDeviceReplay?.afterFrame(time,0); }")
                .replace("useRef({ width: 800, height: 600 })",`);
// End after a full 88-second fixture instead of continuing campaign QA.
const cut=source.indexOf('  const emit = (type) => {');assert.ok(cut>0);
source=source.slice(0,cut)+`
  await advance(${effects?70000:lifecycle?120000:90000});
  assert.ok(deviceReport,'controller finished');
  assert.equal(deviceReport.completed,true,JSON.stringify(deviceReport));
  assert.equal(deviceReport.phases.length,${effects?3:4});
  for(const phase of deviceReport.phases){
    assert.equal(phase.end.status,'playing');assert.ok(phase.frames>0);assert.ok(phase.volleys>0);
    assert.equal(phase.fixtureResets,0,'no emergency fixture reset');
    ${lifecycle?'assert.ok(phase.end.lifecycle.samples.length<=128);assert.ok(phase.wallMs>=phase.durationMs);assert.ok(phase.wallMs<phase.durationMs+100);':"assert.equal(phase.end.sector,12);assert.equal(phase.end.enemies,phase.enemies);"}
  }
  ${effects?`for(const phase of deviceReport.phases){
    assert.ok(phase.end.destroyed>=10);assert.ok(phase.end.lifecycle.refills>=10);
    assert.ok(phase.end.lifecycle.maxEffects>0);assert.equal(phase.end.sector,12);
    // Phase snapshot precedes sustain/refill on the boundary frame.
    assert.ok(phase.end.enemies>0&&phase.end.enemies<=6);assert.equal(phase.end.weaponLevel,2);
  }`:lifecycle?`const [before,destruction,transitions,after]=deviceReport.phases;
  for(const p of [before,after]){assert.equal(p.end.enemies,6);assert.equal(p.end.destroyed,0);assert.equal(p.end.lifecycle.maxEffects,0);}
  assert.ok(destruction.end.destroyed>=10,JSON.stringify(destruction.end));
  assert.ok(destruction.end.lifecycle.refills>=10);assert.ok(destruction.end.lifecycle.maxEffects>0);
  assert.equal(destruction.end.sector,12);assert.equal(destruction.end.enemies,6);
  assert.ok(transitions.end.sector>12,JSON.stringify(transitions.end));
  assert.ok(transitions.end.lifecycle.sectorChanges>0);assert.ok(transitions.end.lifecycle.phaseFrames.ENTRY>0);
  assert.ok(transitions.end.lifecycle.phaseFrames.SECTOR_CLEAR>0);assert.ok(transitions.end.lifecycle.effectEvents>0);
  for(const phase of deviceReport.phases)assert.equal(phase.end.weaponLevel,2);`:`assert.deepEqual(deviceReport.phases.map(p=>p.end.weaponLevel),[1,2,2,1]);`}
  deviceReport.coverage.rendering='Presentation/audio/API stubbed by the Node integration host; not a device measurement';
  for(const cleanup of cleanups.reverse())cleanup();
  for(const [id,t] of [...timers])if(!t.repeat&&t.at<=clock+1000){timers.delete(id);t.fn();}
  process.removeListener('unhandledRejection',unhandled);
  assert.equal(frames.size,0);assert.equal(errors.length,0,errors.join('\\n'));
  const result={passed:true,frameStepMs:Number(process.env.CRYPTOID_REPLAY_FRAME_MS||16),
    mode:'real GamePage simulation; rendering/audio/API stubs',report:deviceReport};
  if(process.env.CRYPTOID_REPLAY_VERIFY_OUT)fs.writeFileSync(process.env.CRYPTOID_REPLAY_VERIFY_OUT,JSON.stringify(result,null,2));
  console.log(JSON.stringify({passed:result.passed,frameStepMs:result.frameStepMs,phases:deviceReport.phases.map(p=>({name:p.name,volleys:p.volleys,acceptedTimeRatio:p.acceptedTimeRatio,weaponLevel:p.end.weaponLevel,fixtureResets:p.fixtureResets,sector:p.end.sector,destroyed:p.end.destroyed,maxEffects:p.end.lifecycle?.maxEffects,sectorChanges:p.end.lifecycle?.sectorChanges}))}));
})().catch(error=>{console.error(error);process.exitCode=1;});
`;
const runner=new Module(file,module);runner.filename=file;runner.paths=Module._nodeModulePaths(path.dirname(file));runner._compile(source,file);
