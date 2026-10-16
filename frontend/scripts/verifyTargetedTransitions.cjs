// Direct-entry, accelerated QA around reported trouble spots. This executes
// actual GamePage simulation with the existing host. GPU, rendering, audio
// hardware and account APIs are stubs: no Pi Browser/FPS result is implied.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const Module = require('node:module');

const scenarios = [
  { name: 'bonus-level1-to-level2', sector: 10, encounter: 'bonus', blocks: 2 },
  { name: 'level2-block2-long-combat', sector: 12, blocks: 2, sustainMs: 180000 },
  { name: 'block39-boss40-bonus-block41', sector: 39, blocks: 2 },
  { name: 'boss40-direct', sector: 40, blocks: 1 },
  { name: 'stress-pause-resume', sector: 25, blocks: 2 },
  { name: 'block249-boss250-bonus-block251', sector: 249, blocks: 2 },
  { name: 'boss490-direct', sector: 490, blocks: 1 },
  // This covers model/intro entry for boss 500, not the full final victory.
  { name: 'block499-to-final-boss-intro', sector: 499, blocks: 1 },
];
const profiles = [
  { name: 'steady60', steps: [1000 / 60] },
  { name: 'slow20', steps: [50] },
  { name: 'intermittent', steps: [16, 16, 16, 100] },
];
const output = process.env.CRYPTOID_TRANSITIONS_OUT || '/tmp/cryptoid-targeted-transitions.json';

if (!process.env.CRYPTOID_TRANSITION_CASE) {
  const cases = [];
  fs.mkdirSync(path.dirname(output), { recursive: true });
  for (const scenario of scenarios) for (const profile of profiles) {
    const report = `${output}.${scenario.name}.${profile.name}.json`;
    const child = spawnSync(process.execPath, [__filename], {
      env: { ...process.env, CRYPTOID_TRANSITION_CASE: JSON.stringify({ scenario, profile }),
        CRYPTOID_WIDTH: '390', CRYPTOID_HEIGHT: '844', CRYPTOID_PROBE: '0',
        CRYPTOID_SIMULATION_BLOCKS: String(scenario.blocks), CRYPTOID_SIMULATION_OUT: report },
      encoding: 'utf8', maxBuffer: 2 * 1024 * 1024, timeout: 120000,
    });
    const result = child.status === 0
      ? JSON.parse(fs.readFileSync(report, 'utf8'))
      : { passed: false, error: String(child.error || child.stderr || child.stdout) };
    cases.push({ scenario: scenario.name, profile: profile.name, result });
    console.log(JSON.stringify({ scenario: scenario.name, profile: profile.name,
      passed: result.passed, normal: result.normal, bosses: result.bosses,
      error: result.error?.slice(-1200) }));
  }
  const result = { passed: cases.every(c => c.result.passed),
    testedGamePageSha256: createHash('sha256').update(fs.readFileSync(path.join(__dirname, '../src/pages/GamePage.tsx'))).digest('hex'),
    mode: 'Actual GamePage, direct starts, controlled extra lives/forced clears; presentation/audio/API stubs',
    limitation: 'Not a browser/GPU/FPS benchmark or a full 500-stage playthrough',
    cases };
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  assert.ok(result.passed, 'All targeted cases must pass; details in ' + output);
} else {
  const { scenario, profile } = JSON.parse(process.env.CRYPTOID_TRANSITION_CASE);
  const harness = path.join(__dirname, 'verifySimulationStability.cjs');
  let source = fs.readFileSync(harness, 'utf8');
  const once = (before, after) => {
    assert.equal(source.split(before).length, 2, 'unique harness insertion: ' + before.slice(0, 70));
    source = source.replace(before, after);
  };
  const startHook = `
  targetedStart: () => {
    const sector=${scenario.sector}, s=createInitialState(), {width,height}=fieldSizeRef.current;
    Object.assign(s,{sector,section:sector,chainBlocks:(sector-1)%10,status:'playing',hearts:99,
      player:{x:.02,y:.88},encounter:${JSON.stringify(scenario.encounter || (scenario.sector % 10 === 0 ? 'boss-intro' : 'normal'))}});
    if(s.encounter==='boss-intro')s.boss=createSectorBoss(sector,width,visibleTopRef.current,height);
    stateRef.current=s;adminRunRef.current=true;lastPlayerRef.current={...s.player};
    formationIndexRef.current=0;formationOffsetRef.current=0;flightRef.current=0;
    formationStartedRef.current=false;bonusIndexRef.current=0;
    spawnTimerRef.current=0;sectionElapsedRef.current=0;clearTimerRef.current=0;
    attackCooldownRef.current=0;fireTimerRef.current=0;elapsedRef.current=0;
    sectionSlotsRef.current=createFormationSlots(sector,sector,width,height,visibleTopRef.current,playerDiameterRef.current);
    lastFrameRef.current=performance.now();
  },`;
  once('globalThis.__campaignQA = {', 'globalThis.__campaignQA = {\n' + startHook);
  once('  qa.cards();\n  qa.protect();', '  qa.cards();\n  qa.protect();\n  qa.targetedStart();');
  // Existing waits express nominal simulation durations. Extend injected wall
  // time under clipped profiles so each transition actually has time to occur.
  // This does not change GamePage delta or its callback behavior.
  const scale = profile.steps.reduce((a,b)=>a+b,0) /
    profile.steps.reduce((a,b)=>a+Math.min(34,b),0);
  once('  const advance = async (ms) => {',
    `  const frameSteps=${JSON.stringify(profile.steps)};let frameStep=0;\n  const advance = async (ms) => {`);
  once('    const end = clock + ms;', `    const end = clock + ms * ${scale};`);
  once('clock = Math.min(end, clock + 16);', 'clock = Math.min(end, clock + frameSteps[frameStep++ % frameSteps.length]);');
  once('const sustainedMs = Number(process.env.CRYPTOID_SUSTAIN_MS || 0);', `const sustainedMs = sector === ${scenario.sector} ? ${scenario.sustainMs || 0} : 0;`);
  once('[1, 25, 49, 99, 249, 499].includes(sector)', 'sustainedMs > 0');
  once('  const arrivalPatterns = new Set();', '  const arrivalPatterns = new Set();\n  const sustainedRuns=[];');
  once('if (sustainedMs && sustainedMs > 0) { sustaining = true; await advance(sustainedMs); sustaining = false; }',
    `if (sustainedMs && sustainedMs > 0) {
      const startWall=clock,attackBefore=activeAttackFrames,returnBefore=returningFrames;
      sustaining=true;await advance(sustainedMs);sustaining=false;
      const held=qa.info();assert.equal(held.sector,sector,'long combat stays in selected block');
      assert.equal(held.encounter,'normal');assert.equal(held.status,'playing');
      assert.ok(activeAttackFrames>attackBefore,'long combat exercises actual attacks');
      sustainedRuns.push({sector,nominalWaitMs:sustainedMs,injectedWallMs:clock-startWall,
        attackFrames:activeAttackFrames-attackBefore,returnFrames:returningFrames-returnBefore});
    }`);
  once('    if (count >= 25) assert.ok(normal.includes(25));',
    `    assert.equal(normal[0], ${scenario.encounter === 'bonus' || scenario.sector % 10 === 0 ? scenario.sector + 1 : scenario.sector}, 'direct start reaches its first normal block');`);
  once('    assert.equal(bosses.length, Math.floor((normal.length - 1) / 9));',
    `    const expectedBosses=[];for(let sector=${scenario.encounter === 'bonus' ? scenario.sector + 1 : scenario.sector};sector<normal.at(-1);sector++)if(sector%10===0&&sector<=500)expectedBosses.push(sector);\n    assert.deepEqual(bosses,expectedBosses);`);
  once('      stressObjectsReleased: count >= 25,', `      stressObjectsReleased: ${scenario.sector === 25},`);
  once('      pausePreservesTimers: count >= 25,', `      pausePreservesTimers: ${scenario.sector === 25},`);
  // snapshotOf intentionally rounds stored weapon timers to integer ms.
  // Fractional RAF profiles must compare to that exact saved representation.
  once('      assert.equal(qa.info()[key], saved[key]);',
    "      assert.equal(qa.info()[key], key === 'paid' ? Math.round(saved[key]) : saved[key]);");
  once('      randomSeed: 20261012,',
    `      randomSeed: 20261012, directStartSector:${scenario.sector}, frameProfile:${JSON.stringify(profile)}, nominalWaitToInjectedWallScale:${scale}, sustainedRuns,`);
  const runner = new Module(harness, module);
  runner.filename = harness;
  runner.paths = Module._nodeModulePaths(path.dirname(harness));
  runner._compile(source, harness);
}
