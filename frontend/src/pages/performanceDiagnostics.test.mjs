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
