import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import stats from "../build/usageStats.js";
import handlers from "../build/handlers/usage.js";
const { usageIncrement } = stats;

test("increments contain only shared hourly cohorts and bounded counters", () => {
  const a = usageIncrement({ browser: "pi", kind: "visit" }, new Date("2026-10-02T10:42:12Z"));
  const b = usageIncrement({ browser: "pi", kind: "active", seconds: 30, playing: true }, new Date("2026-10-02T10:59:59Z"));
  assert.equal(a.id, b.id);
  assert.deepEqual(a.counters, { visits: 1, activeSeconds: 0, gameSeconds: 0 });
  assert.deepEqual(b.counters, { visits: 0, activeSeconds: 30, gameSeconds: 30 });
  assert.equal(a.fixed.hour.toISOString(), "2026-10-02T10:00:00.000Z");
  assert.equal((a.fixed.expiresAt - a.fixed.hour) / 86400000, 90);
  assert.deepEqual(Object.keys(a.fixed).sort(), ["browser", "expiresAt", "hour", "network"]);
  assert.notEqual(a.id, usageIncrement({ browser: "pi", kind: "visit" }, new Date("2026-10-02T10:42:12Z"), "testnet").id);
});

test("unknown fields, personal data and unbounded durations are rejected", () => {
  for (const field of ["uid", "username", "ip", "session", "token", "url", "timestamp", "userAgent"]) assert.equal(usageIncrement({ browser: "pi", kind: "visit", [field]: "secret" }), null);
  for (const seconds of [-1, 0, 31, 3600, 1.1, "30", null]) assert.equal(usageIncrement({ browser: "external", kind: "active", seconds, playing: false }), null);
  for (const body of [null, [], {}, { browser: "other", kind: "visit" }, { browser: "pi", kind: "visit", seconds: 1 }, { browser: "pi", kind: "active", seconds: 1 }]) assert.equal(usageIncrement(body), null);
});

test("collection writes aggregate counters only without consulting authentication", async () => {
  const writes = [];
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { Object.defineProperty(req, "session", { get() { throw Error("No session access permitted"); } }); next(); });
  app.locals.usageCollection = { async updateOne(...args) { writes.push(args); } };
  app.post("/usage/collect", handlers.collectUsage);
  const server = app.listen(0, "127.0.0.1");
  await new Promise(r => server.once("listening", r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const send = (body, requestOrigin = origin) => fetch(`${origin}/usage/collect`, { method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin, Cookie: "secret-session=123", Authorization: "Bearer secret" }, body: JSON.stringify(body) });
  try {
    const response = await send({ browser: "external", kind: "active", seconds: 15, playing: false });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(writes.length, 1);
    assert.doesNotMatch(JSON.stringify(writes), /secret|Bearer|cookie|uid|username|userAgent/i);
    assert.equal((await send({ browser: "pi", kind: "visit" }, "https://malicious.example")).status, 403);
    assert.equal((await send({ browser: "pi", kind: "visit", uid: "owner" })).status, 400);
    assert.equal(writes.length, 1);
  } finally { await new Promise(r => server.close(r)); }
});
