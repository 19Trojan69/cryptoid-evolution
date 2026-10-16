// Exercises the actual GamePage loop with injected RAF timestamps. Rendering,
// audio hardware and APIs use the existing simulation host: this is NOT a
// Pi Browser, Safari, GPU or measured-device-FPS benchmark.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const Module = require('node:module');

const profiles = [
  { name: '60hz', steps: [1000 / 60] },
  { name: '30hz', steps: [1000 / 30] },
  { name: '25hz', steps: [40] },
  { name: '20hz', steps: [50] },
  { name: 'jitter', steps: [16, 16, 16, 100] },
  { name: 'recovery', segments: [[1000 / 60], [50], [1000 / 60]] },
];
const output = process.env.CRYPTOID_CADENCE_OUT || '/tmp/cryptoid-shot-cadence-20261016.json';
if (!process.env.CRYPTOID_CADENCE_CASE) {
  const cases = profiles.map(profile => {
    const child = spawnSync(process.execPath, [__filename], {
      env: { ...process.env, CRYPTOID_CADENCE_CASE: JSON.stringify(profile),
        CRYPTOID_WIDTH: '390', CRYPTOID_HEIGHT: '844', CRYPTOID_PROBE: '0',
        CRYPTOID_SIMULATION_OUT: output + '.' + profile.name + '.json' },
      encoding: 'utf8', maxBuffer: 1024 * 1024,
    });
    assert.equal(child.status, 0, child.stderr + child.stdout);
    return JSON.parse(fs.readFileSync(output + '.' + profile.name + '.json', 'utf8'));
  });
  const segment = name => cases.find(c => c.name === name).segments[0];
  assert.ok(Math.abs(segment('60hz').volleys - segment('30hz').volleys) <= 1,
    '30 Hz preserves nominal firing cadence');
  assert.ok(segment('25hz').volleys < segment('30hz').volleys,
    '40 ms frame gaps reproduce lost firing cadence in the current loop');
  assert.ok(segment('20hz').volleys < segment('25hz').volleys,
    '50 ms frame gaps reproduce additional firing slowdown');
  const recovery = cases.find(c => c.name === 'recovery').segments;
  assert.ok(Math.abs(recovery[0].volleys - recovery[2].volleys) <= 1,
    'cadence recovers when RAF delivery recovers without resetting combat');
  const result = { passed: true, limitation: 'Injected RAF timestamps in actual GamePage simulation; no rendering or browser performance inference', cases };
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} else {
  const profile = JSON.parse(process.env.CRYPTOID_CADENCE_CASE);
  const harness = path.join(__dirname, 'verifySimulationStability.cjs');
  let source = fs.readFileSync(harness, 'utf8');
  const once = (before, after) => {
    assert.equal(source.split(before).length, 2, 'unique harness insertion: ' + before.slice(0, 70));
    source = source.replace(before, after);
  };
  const hooks = [
    'cadenceStart: () => {',
    ' const s=stateRef.current,{width,height}=fieldSizeRef.current;',
    ' const slots=createFormationSlots(1,1,width,height,visibleTopRef.current,playerDiameterRef.current);',
    ' const enemy=spawnAsteroid(nextIdRef.current++,width,visibleTopRef.current,0,1,slots);',
    ' enemy.entryElapsed=enemy.entryDuration;enemy.formationElapsed=enemy.formationDuration;',
    ' enemy.health=enemy.maxHealth=1000000;enemy.attackPattern=null;',
    ' Object.assign(s,{status:"playing",sector:1,section:1,phase:"ATTACK_CYCLE",encounter:"normal",asteroids:[enemy],boss:null,shots:[],enemyShots:[],effects:[],powerUps:[],rocks:[],rockEffects:[],hearts:99,player:{x:.02,y:.88},weaponLevel:1,pickupWeaponLevel:1,paidWeaponLevel:1,paidWeaponMs:0,weaponCap:1,weaponSource:"base",weaponTimers:[0,0,0,0,0,0],unlockedWeapons:[1],rapidFireMs:0,overdriveMs:0});',
    ' sectionSlotsRef.current=slots;formationIndexRef.current=slots.length;formationStartedRef.current=true;',
    ' sectionElapsedRef.current=20000;attackCooldownRef.current=1e12;shipStageRef.current=1;',
    ' fireTimerRef.current=0;elapsedRef.current=0;lastFrameRef.current=performance.now();',
    ' globalThis.__cadenceFires=[];',
    ' soundRef.current=new Proxy({}, {get:(_target,key)=>key==="play" ? (kind)=>{if(kind==="laser")globalThis.__cadenceFires.push(performance.now());} : ()=>{}});',
    '},',
    'cadenceHold: () => {',
    ' const s=stateRef.current;s.enemyShots=[];s.powerUps=[];s.effects=[];s.rocks=[];s.rockEffects=[];',
    ' s.hearts=99;s.phase="ATTACK_CYCLE";attackCooldownRef.current=1e12;',
    ' for(const e of s.asteroids)e.health=e.maxHealth=1000000;',
    '},',
    'cadenceData: () => ({wall:performance.now(),simulation:elapsedRef.current,fires:[...globalThis.__cadenceFires],hull:shipSelectionRef.current.skin.id,interval:shipFireInterval(shipSelectionRef.current.skin.id,1,0),shotCount:stateRef.current.shots.length,phase:stateRef.current.phase,status:stateRef.current.status}),',
  ].join('\n');
  once('globalThis.__campaignQA = {', 'globalThis.__campaignQA = {\n' + hooks);
  once('  const advance = async (ms) => {', '  let cadenceSteps=null,cadenceStep=0,cadenceMeasuring=false;\n  const advance = async (ms) => {');
  once('clock = Math.min(end, clock + 16);', 'clock = Math.min(end, clock + (cadenceSteps ? cadenceSteps[cadenceStep++ % cadenceSteps.length] : 16));');
  once('      const before = qa.info();\n      if (sustaining)', '      if(cadenceMeasuring)qa.cadenceHold();\n      const before = qa.info();\n      if (sustaining)');
  const run = [
    '  if (process.env.CRYPTOID_CADENCE_CASE) {',
    '    const profile=JSON.parse(process.env.CRYPTOID_CADENCE_CASE);',
    '    await advance(9000);qa.cadenceStart();cadenceMeasuring=true;',
    '    const segments=[];',
    '    for(const steps of profile.segments || [profile.steps]) {',
    '      cadenceSteps=steps;cadenceStep=0;',
    '      const before=qa.cadenceData();',
    '      await advance(30000);',
    '      const after=qa.cadenceData(),fires=after.fires.slice(before.fires.length);',
    '      const gaps=fires.slice(1).map((t,i)=>t-fires[i]).sort((a,b)=>a-b);',
    '      assert.equal(after.status,"playing");assert.ok(["ATTACK_CYCLE","REFORM","FORMATION"].includes(after.phase),"continuous active combat");',
    '      assert.ok(peaks.shots<28,"shot cap does not explain the slowdown");',
    '      segments.push({frameStepsMs:steps,wallMs:after.wall-before.wall,simulationMs:after.simulation-before.simulation,volleys:fires.length,meanGapMs:gaps.reduce((a,b)=>a+b,0)/gaps.length,p95GapMs:gaps[Math.ceil(gaps.length*.95)-1],maxGapMs:gaps.at(-1),nominalIntervalMs:after.interval,hull:after.hull,peakShots:peaks.shots});',
    '    }',
    '    for(const cleanup of cleanups.reverse())cleanup();',
    '    for(const [id,t] of [...timers])if(!t.repeat&&t.at<=clock){timers.delete(id);t.fn();}',
    '    assert.equal(frames.size,0);assert.equal(timers.size,0);',
    '    assert.equal([...listeners.values()].reduce((n,set)=>n+set.size,0),0);',
    '    assert.equal(errors.length,0);',
    '    process.removeListener("unhandledRejection",unhandled);',
    '    fs.writeFileSync(output,JSON.stringify({name:profile.name,segments,cleanup:{raf:frames.size,timers:timers.size,listeners:0}},null,2));',
    '    return;',
    '  }',
  ].join('\n');
  once('  try {\n    while (normal.length < count) {', run + '\n  try {\n    while (normal.length < count) {');
  const runner = new Module(harness, module);
  runner.filename = harness;
  runner.paths = Module._nodeModulePaths(path.dirname(harness));
  runner._compile(source, harness);
}
