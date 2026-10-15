import test from "node:test";
import assert from "node:assert/strict";
import { diagnosticExport } from "./diagnosticExport.ts";
import { createPerformanceProbe } from "./performanceDiagnostics.ts";

const trace = { samples: [{ sector: 30 }], events: [] };
test("export prefers live measurements and retains the last session when storage is denied", () => {
  assert.equal(diagnosticExport({ __cryptoidDiagnostics: { export: () => trace } }).trace, trace);
  const host = { __cryptoidLatestTrace: trace };
  for (const key of ["localStorage", "sessionStorage"])
    Object.defineProperty(host, key, {
      get() {
        throw Error("denied");
      },
    });
  const data = diagnosticExport(host);
  assert.equal(data.available, true);
  assert.equal(data.trace, trace);
});
test("export recovers session storage and explicitly reports when no evidence exists", () => {
  const host = {
    localStorage: {
      getItem() {
        throw Error("denied");
      },
    },
    sessionStorage: { getItem: () => JSON.stringify(trace) },
  };
  assert.deepEqual(diagnosticExport(host).trace, trace);
  assert.equal(diagnosticExport({}).available, false);
});
test("probe keeps evidence in memory when both native storage getters throw", () => {
  const previous = globalThis.window,
    host = {};
  for (const key of ["localStorage", "sessionStorage"])
    Object.defineProperty(host, key, {
      get() {
        throw Error("denied");
      },
    });
  globalThis.window = host;
  let now = 1000;
  const probe = createPerformanceProbe({ now: () => now });
  try {
    const state = {
      sector: 30,
      flight: 0,
      phase: "ATTACK_CYCLE",
      encounter: "boss-fight",
      status: "playing",
      enemies: 0,
      attackers: 0,
      returning: 0,
      playerShots: 0,
      enemyShots: 0,
      effects: 0,
      rocks: 0,
      rockEffects: 0,
      pickups: 0,
    };
    for (let i = 0; i < 200; i++) {
      now += 16;
      probe.begin(now, state);
      probe.end(now);
    }
    probe.finish();
    const data = diagnosticExport(host);
    assert.equal(data.available, true);
    assert.ok(data.trace.samples.length > 0);
    assert.equal(data.trace.persistence, "memory-only");
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});
