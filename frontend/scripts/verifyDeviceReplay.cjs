// Integration of the exact device hooks and controller with the existing real
// GamePage simulation host. Presentation/audio/API remain stubs, not a browser test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module');
const file=path.join(__dirname,'verifySimulationStability.cjs');
let source=fs.readFileSync(file,'utf8');
const once=(before,after)=>{assert.equal(source.split(before).length,2,before);source=source.replace(before,after);};
once('const hooks = `','const hooks = fs.readFileSync(path.join(__dirname,"deviceReplay/gameHooks.ts.txt"),"utf8") + `');
once('  const document = {',`  const {createDeviceReplay}=await import(path.join(__dirname,'deviceReplay/controller.mjs'));
  let deviceReport;
  host.__cryptoidDeviceReplay=createDeviceReplay({now:()=>clock,onFinish:r=>{deviceReport=r;}});
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
  await advance(90000);
  assert.ok(deviceReport,'controller finished');
  assert.equal(deviceReport.completed,true,JSON.stringify(deviceReport));
  assert.equal(deviceReport.phases.length,4);
  for(const phase of deviceReport.phases){
    assert.equal(phase.end.sector,12);assert.equal(phase.end.status,'playing');
    assert.equal(phase.end.enemies,phase.enemies);assert.ok(phase.frames>0);assert.ok(phase.volleys>0);
    assert.equal(phase.fixtureResets,0,'no emergency fixture reset');
  }
  assert.equal(deviceReport.phases[0].end.weaponLevel,1);
  assert.equal(deviceReport.phases[1].end.weaponLevel,2);
  assert.equal(deviceReport.phases[2].end.weaponLevel,2);
  assert.equal(deviceReport.phases[3].end.weaponLevel,1);
  deviceReport.coverage.rendering='Presentation/audio/API stubbed by the Node integration host; not a device measurement';
  for(const cleanup of cleanups.reverse())cleanup();
  for(const [id,t] of [...timers])if(!t.repeat&&t.at<=clock+1000){timers.delete(id);t.fn();}
  process.removeListener('unhandledRejection',unhandled);
  assert.equal(frames.size,0);assert.equal(errors.length,0,errors.join('\\n'));
  const result={passed:true,frameStepMs:Number(process.env.CRYPTOID_REPLAY_FRAME_MS||16),
    mode:'real GamePage simulation; rendering/audio/API stubs',report:deviceReport};
  if(process.env.CRYPTOID_REPLAY_VERIFY_OUT)fs.writeFileSync(process.env.CRYPTOID_REPLAY_VERIFY_OUT,JSON.stringify(result,null,2));
  console.log(JSON.stringify({passed:result.passed,frameStepMs:result.frameStepMs,phases:deviceReport.phases.map(p=>({name:p.name,volleys:p.volleys,acceptedTimeRatio:p.acceptedTimeRatio,weaponLevel:p.end.weaponLevel,fixtureResets:p.fixtureResets}))}));
})().catch(error=>{console.error(error);process.exitCode=1;});
`;
const runner=new Module(file,module);runner.filename=file;runner.paths=Module._nodeModulePaths(path.dirname(file));runner._compile(source,file);
