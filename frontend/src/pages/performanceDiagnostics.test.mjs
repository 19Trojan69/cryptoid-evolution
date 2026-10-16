import test from "node:test";
import assert from "node:assert/strict";
import {
  createPerformanceProbe,
  developerProbeEnabled,
  errorSite,
  PERFORMANCE_SAMPLE_LIMIT,
} from "./performanceDiagnostics.ts";

const playing = {
  sector: 25,
  flight: 0,
  phase: "FORMATION",
  encounter: "normal",
  status: "playing",
  enemies: 6,
  attackers: 1,
  returning: 0,
  playerShots: 4,
  enemyShots: 3,
  effects: 2,
  rocks: 0,
  rockEffects: 0,
  pickups: 1,
};

test("ordinary builds cannot enable diagnostics via a URL; sampling owns no timers or RAF", () => {
  assert.equal(developerProbeEnabled(), false);
  let now = 1000;
  const persisted = [];
  const probe = createPerformanceProbe({ now: () => now, persist: text => persisted.push(text) });
  for (let i = 0; i < 50000; i++) {
    now += 16;
    probe.begin(now, playing);
    now += 0.3;
    probe.mark("enemy-motion-and-fire");
    now += 0.2;
    probe.end(now);
  }
  const data = probe.export();
  assert.equal(data.samples.length, PERFORMANCE_SAMPLE_LIMIT);
  assert.ok(data.samples.every(s => s.frameP95Ms === 16.5 && s.simulationP95Ms === 0.5));
  assert.ok(persisted.length < 90, "storage writes throttled to 10 seconds");
  assert.ok(JSON.stringify(data).length < 100000, "bounded trace");
});

test("phase durations describe the previous phase and paused time is excluded from frame and volley gaps", () => {
  let now = 1000;
  const probe = createPerformanceProbe({ now: () => now, persist() {} });
  for (let i = 0; i < 5; i++) {
    now += 16;
    probe.begin(now, playing);
    probe.volley(now, false);
    now += 1;
    probe.end(now);
  }
  now += 16;
  probe.begin(now, { ...playing, phase: "SECTOR_CLEAR" });
  now += 1;
  probe.end(now);
  const complete = probe.export().events.find(e => e.kind === "phase-complete");
  assert.equal(complete.phase, "FORMATION");
  assert.equal(complete.durationMs, 85);
  probe.suspend(now);
  now += 60000;
  probe.begin(now, playing);
  probe.volley(now, false);
  now += 1;
  probe.end(now);
  probe.finish();
  assert.ok(probe.export().samples.every(s => s.frameMaxMs < 100 && s.volleyGapP95Ms < 100));
  const frozen = JSON.stringify(probe.export());
  probe.begin(now, playing);
  probe.end(now);
  probe.finish();
  assert.equal(JSON.stringify(probe.export()), frozen);
});

test("unavailable browser metrics and denied storage cannot throw into a game frame", () => {
  let now = 1000;
  const probe = createPerformanceProbe({
    now: () => now,
    persist() {
      throw Error("quota");
    },
    runtime() {
      throw Error("unsupported");
    },
  });
  for (let i = 0; i < 200; i++) {
    now += 16;
    probe.begin(now, playing);
    probe.mark("setup");
    probe.end(now);
  }
  assert.doesNotThrow(() => probe.finish());
  assert.ok(probe.export().samples.length);
});

test("forensic events exclude exception text, origins, query tokens, accounts and raw stacks", () => {
  const error = new Error("secret user token");
  error.stack =
    "Error: secret\n at frame (https://private.example/assets/GamePage-abc123.js:345:67)\n at user (https://private.example/?token=secret:1:2)";
  assert.deepEqual(errorSite(error), { file: "GamePage-abc123.js", line: 345, column: 67 });
  const probe = createPerformanceProbe({ now: () => 1000, persist() {} });
  probe.begin(1000, playing);
  probe.lifecycle("error", error);
  const serialized = JSON.stringify(probe.export());
  for (const sensitive of ["secret", "private.example", "token", "stack", "account"])
    assert.ok(!serialized.includes(sensitive));
  assert.deepEqual(errorSite({ stack: "malformed" }), {});
});

test("game over and exit report the real status and remaining hearts", () => {
  let now=1000;
  const probe=createPerformanceProbe({now:()=>now,persist(){}});
  probe.begin(now,{...playing,hearts:1});now+=1;probe.end(now);
  now+=16;probe.begin(now,{...playing,status:'destroying',hearts:0});
  now+=2250;probe.begin(now,{...playing,status:'game-over',hearts:0});
  probe.lifecycle('home-intent');probe.finish();
  const events=probe.export().events;
  assert.deepEqual(events.filter(e=>e.kind==='status-change').map(e=>[e.status,e.hearts]),[['destroying',0],['game-over',0]]);
  assert.equal(events.at(-1).status,'game-over');assert.equal(events.at(-1).hearts,0);
});

test("short phase windows calculate FPS from measured frame intervals", () => {
  let now=1000;const probe=createPerformanceProbe({now:()=>now,persist(){}});
  probe.begin(now,playing);probe.end(now);
  now+=20;probe.begin(now,playing);probe.end(now);
  now+=20;probe.begin(now,{...playing,phase:'REFORM'});probe.end(now);
  now+=20;probe.begin(now,{...playing,phase:'ENTRY'});probe.end(now);
  probe.finish();
  assert.ok(probe.export().samples.filter(s=>s.frames>1).every(s=>s.fps===50));
  assert.ok(probe.export().samples.every(s=>Number.isFinite(s.sampleDurationMs)));
});

test("rapid phase changes do not repeatedly enumerate DOM animations", () => {
  let now=1000,calls=0;const probe=createPerformanceProbe({now:()=>now,persist(){},runtime(){calls++;now+=3;return{animations:40};}});
  for(let i=0;i<100;i++){now+=16;probe.begin(now,{...playing,phase:i%2?'ENTRY':'REFORM'});probe.end(now);}
  probe.finish();
  assert.equal(calls,1);assert.equal(probe.export().samples.at(-1).runtimeSampleMs,3);
  assert.ok(probe.export().samples.every(s=>s.runtimeAgeMs<2000));
});

test("scene measurements distinguish render-to-commit work and scheduling wait without new loops", () => {
  let now=1000;const probe=createPerformanceProbe({now:()=>now,persist(){}});
  probe.begin(now,playing);probe.end(now);probe.sceneRequested();
  now+=8;const started=probe.sceneRenderBegin();now+=12;probe.sceneCommitted(started);
  now+=20;probe.begin(now,playing);probe.end(now);probe.finish();
  const sample=probe.export().samples.at(-1);
  assert.equal(sample.sceneRequests,1);assert.equal(sample.sceneCommits,1);
  assert.equal(sample.sceneCommitWaitP95Ms,20);assert.equal(sample.sceneRenderToCommitP95Ms,12);
  const frozen=JSON.stringify(probe.export());probe.sceneRequested();probe.sceneCommitted(now);
  assert.equal(JSON.stringify(probe.export()),frozen);
});


test("boss checkpoints persist immediately with fresh context without changing the frame context", () => {
 let now = 1000; const saved = [];
 const probe = createPerformanceProbe({ now: () => now, persist: () => {}, backup: trace => saved.push(trace) });
 probe.begin(now, { ...playing, sector: 39, phase: 'SECTOR_CLEAR' }); probe.end(now);
 now += 17;
 probe.checkpoint('boss-model-start', { sector: 40, phase: 'SECTOR_INTRO', encounter: 'boss-intro', hearts: 1 });
 assert.equal(saved.at(-1).events.at(-1).kind, 'boss-model-start');
 assert.equal(saved.at(-1).events.at(-1).sector, 40);
 probe.begin(now, { ...playing, sector: 40, phase: 'SECTOR_INTRO', encounter: 'boss-intro' });
 const complete = probe.export().events.find(event => event.kind === 'phase-complete');
 assert.equal(complete.sector, 39);
 assert.equal(saved.at(-1).events.at(-1).kind, 'phase-start');
 probe.checkpoint('boss-texture-ready', { bossId: 4, bossTextureWidth: 2048, bossTextureHeight: 966 });
 assert.equal(saved.at(-1).events.at(-1).bossTextureWidth, 2048);
 probe.finish(); const count = saved.length; probe.checkpoint('boss-model-ready'); assert.equal(saved.length, count);
});
