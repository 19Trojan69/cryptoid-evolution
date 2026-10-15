import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { backupTrace, BACKUP_MAX_BYTES } from "./traceBackupFormat.ts";
import { createRemoteTraceBackup } from "./remoteTraceBackup.ts";
import { handleDiagnostics } from "../../previewServer/diagnosticsService.ts";

test("a response that stalls after headers times out without confirming or blocking another checkpoint", { timeout: 1000 }, async () => {
  let calls = 0, offline;
  const failed = new Promise(resolve => { offline = resolve; });
  const client = createRemoteTraceBackup({
    uuid: () => "run-0001", timeoutMs: 5,
    fetch: async (_url, init) => {
      calls++;
      return { ok: true, json: () => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(Error("aborted")), { once: true })) };
    },
    onState: state => { if (state.status === "offline") offline(); else assert.notEqual(state.status, "saved"); },
  });
  client.enqueue(trace);
  await failed;
  assert.equal(calls, 1);
});
const trace = {
  version: 2,
  environment: "developer-only",
  persistence: "localStorage",
  samples: [
    {
      sector: 100,
      hearts: 2,
      fps: 30,
      phase: "SECTOR_CLEAR",
      encounter: "boss-clear",
      status: "playing",
      secret: "wallet",
      work: { transitions: { count: 1, totalMs: 2, maxMs: 2 }, wallet: { secret: "token" } },
    },
  ],
  events: [
    {
      kind: "boss-defeat-complete",
      atMs: 50,
      sector: 100,
      status: "playing",
      url: "https://secret/?token=wallet",
      message: "password",
    },
  ],
};
function database() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(
    "CREATE TABLE diagnostic_runs (id TEXT PRIMARY KEY,revision INTEGER NOT NULL,received_at INTEGER NOT NULL,client_version TEXT NOT NULL,trace_json TEXT NOT NULL)"
  );
  const adapter = {
    prepare(text) {
      const statement = sql.prepare(text);
      let args = [];
      return {
        bind(...a) {
          args = a;
          return this;
        },
        async first() {
          return statement.get(...args) ?? null;
        },
        run() {
          statement.run(...args);
        },
      };
    },
    async batch(statements) {
      sql.exec("BEGIN");
      try {
        for (const s of statements) s.run();
        sql.exec("COMMIT");
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return { sql, adapter };
}
const post = (runId, revision = 1, extra = {}) =>
  new Request("https://private.example/api/diagnostics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId, revision, clientVersion: "V4", trace, ...extra }),
  });
test("backup allow-list bounds the ring and strips arbitrary fields and sensitive text", () => {
  const data = backupTrace({
    ...trace,
    samples: Array(100).fill(trace.samples[0]),
    events: Array(100).fill(trace.events[0]),
  });
  assert.equal(data.samples.length, 16);
  assert.equal(data.events.length, 64);
  const text = JSON.stringify(data);
  for (const word of ["wallet", "token", "password", "https://", "secret"]) assert.ok(!text.includes(word));
  assert.ok(new TextEncoder().encode(text).length <= BACKUP_MAX_BYTES);
  assert.equal(backupTrace({ version: 2, environment: "developer-only", samples: [], events: [] }), null);
});
test("server acknowledgement survives complete loss of browser storage and prevents stale overwrites", async () => {
  const { sql, adapter } = database();
  try {
    assert.equal((await handleDiagnostics(post("run-0001", 3), adapter, 1000)).status, 200);
    await handleDiagnostics(post("run-0001", 1), adapter, 900);
    const data = await (
      await handleDiagnostics(new Request("https://private.example/api/diagnostics"), adapter, 1001)
    ).json();
    assert.equal(data.latest.revision, 3);
    assert.equal(data.latest.trace.events[0].kind, "boss-defeat-complete");
    assert.equal(data.latest.savedAt, 1000);
    assert.ok(!JSON.stringify(data).includes("wallet"));
  } finally {
    sql.close();
  }
});
test("private diagnostic table retains at most eight runs and rejects oversized/cross-site writes", async () => {
  const { sql, adapter } = database();
  try {
    for (let i = 0; i < 12; i++) await handleDiagnostics(post("run-000" + i), adapter, 1000 + i);
    assert.equal(sql.prepare("SELECT count(*) AS n FROM diagnostic_runs").get().n, 8);
    const bad = post("run-0001");
    bad.headers.set("sec-fetch-site", "cross-site");
    assert.equal((await handleDiagnostics(bad, adapter)).status, 403);
    const large = new Request("https://private.example/api/diagnostics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "x".repeat(BACKUP_MAX_BYTES + 2048),
    });
    assert.equal((await handleDiagnostics(large, adapter)).status, 413);
    assert.equal((await handleDiagnostics(post("x"), adapter)).status, 400);
  } finally {
    sql.close();
  }
});
test("client serializes/coalesces requests, waits for real acknowledgement and recovers on a new client", async () => {
  const { sql, adapter } = database();
  let calls = 0,
    active = 0,
    peak = 0,
    state;
  const fetch = async (url, init) => {
    calls++;
    active++;
    peak = Math.max(peak, active);
    await Promise.resolve();
    try {
      return await handleDiagnostics(new Request("https://private.example" + url, init), adapter, 5000);
    } finally {
      active--;
    }
  };
  const client = createRemoteTraceBackup({ fetch, uuid: () => "run-0001", onState: s => (state = s) });
  client.enqueue(trace);
  client.enqueue(trace);
  client.enqueue(trace);
  for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
  assert.equal(peak, 1);
  assert.equal(calls, 1);
  assert.equal(state.status, "saved");
  let recovered;
  const newPage = createRemoteTraceBackup({ fetch, uuid: () => "run-0002", onRecovered: t => (recovered = t) });
  assert.equal(await newPage.recover(), true);
  assert.equal(recovered.samples[0].sector, 100);
  sql.close();
});
test("backup network failures stay non-blocking and retry on the next checkpoint", async () => {
  let calls = 0,
    state;
  const client = createRemoteTraceBackup({
    fetch: async () => {
      calls++;
      if (calls === 1) throw Error("offline");
      return Response.json({ runId: "run-0001", revision: 2, savedAt: 123 });
    },
    uuid: () => "run-0001",
    onState: s => (state = s),
  });
  assert.doesNotThrow(() => client.enqueue(trace));
  for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  assert.equal(state.status, "offline");
  assert.equal(calls, 1);
  client.enqueue(trace);
  for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  assert.equal(state.status, "saved");
  assert.equal(calls, 2);
});
