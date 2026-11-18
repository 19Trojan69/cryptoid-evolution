import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const release = require("../build/mainnetRelease.js");

function harness(saved = null, inspect = release.inspectMainnetReadiness) {
  let state = saved && structuredClone(saved);
  const writes = [];
  const collection = {
    async findOne() { return state && structuredClone(state); },
    async updateOne(query, update, options) {
      writes.push({ query, update });
      if (!state && options?.upsert) state = { _id: query._id, ...update.$setOnInsert };
      const matches = state && Object.entries(query).every(([key, value]) => state[key] === value);
      if (matches && update.$set) Object.assign(state, update.$set);
      return { matchedCount: matches ? 1 : 0 };
    },
  };
  const routes = {};
  release.mountMainnetRelease({
    get(path, handler) { routes["GET " + path] = handler; },
    post(path, handler) { routes["POST " + path] = handler; },
  }, inspect);
  const req = {
    get: () => "mainnet",
    session: { currentUser: { uid: "owner" } },
    app: { locals: { adminCollection: collection, userCollection: {}, orderCollection: {} } },
  };
  return {
    req, writes, state: () => state,
    async call(method = "GET", body) {
      req.body = body;
      const res = {
        code: 200, headers: {},
        setHeader(key, value) { this.headers[key] = value; },
        status(value) { this.code = value; return this; },
        json(value) { this.body = value; return this; },
      };
      await routes[method + " /mainnet-release"](req, res);
      return res;
    },
  };
}

const prepared = () => ({
  ready: true,
  checks: ["database", "piPayments", "nftIssuance", "nftMetadata"].map(id => ({ id, ready: true })),
});

test("a fresh installation stays in preparation without a database write", async () => {
  const h = harness();
  const response = await h.call();
  assert.equal(response.code, 200);
  assert.equal(response.body.enabled, false);
  assert.equal(response.body.released, false);
  assert.equal(response.body.revision, 0);
  assert.equal(h.writes.length, 0);
  assert.equal(response.headers["Cache-Control"], "no-store");
});

test("client readiness fields cannot enable the unfinished NFT implementation", async () => {
  const h = harness();
  const response = await h.call("POST", { action: "release", revision: 0, ready: true });
  assert.equal(response.code, 409);
  assert.equal(response.body.error, "mainnet_not_ready");
  assert.ok(response.body.checks.some(check => check.id === "nftIssuance" && !check.ready));
  assert.equal(h.writes.length, 0);
  assert.equal(await release.mainnetPurchasesReleased(h.req), false);
});

test("a stored release cannot bypass missing server readiness", async () => {
  const h = harness({ released: true, revision: 7 });
  assert.equal((await h.call()).body.enabled, false);
  assert.equal(await release.mainnetPurchasesReleased(h.req), false);
});

test("the prepared release persists the verified owner and increments its revision", async () => {
  const h = harness(null, prepared);
  const response = await h.call("POST", { action: "release", revision: 0 });
  assert.equal(response.code, 200);
  assert.equal(response.body.enabled, true);
  assert.equal(response.body.revision, 1);
  assert.equal(h.state().updatedBy, "owner");
  assert.ok(h.state().updatedAt instanceof Date);
});

test("repeated release requests stay idempotent", async () => {
  const h = harness(null, prepared);
  await h.call("POST", { action: "release", revision: 0 });
  const writes = h.writes.length;
  const response = await h.call("POST", { action: "release", revision: 0 });
  assert.equal(response.code, 200);
  assert.equal(response.body.revision, 1);
  assert.equal(h.writes.length, writes);
});

test("a stale reverse action cannot overwrite a newer release", async () => {
  const h = harness(null, prepared);
  await h.call("POST", { action: "release", revision: 0 });
  const response = await h.call("POST", { action: "hold", revision: 0 });
  assert.equal(response.code, 409);
  assert.equal(response.body.error, "release_changed");
  assert.equal(h.state().released, true);
});

test("the owner can return a released application to preparation", async () => {
  const h = harness({ _id: "mainnet-release:v1", released: true, revision: 3 }, prepared);
  const response = await h.call("POST", { action: "hold", revision: 3 });
  assert.equal(response.code, 200);
  assert.equal(response.body.enabled, false);
  assert.equal(response.body.revision, 4);
});

test("Testnet requests cannot change the Mainnet release", async () => {
  const h = harness(null, prepared);
  h.req.get = () => "testnet";
  assert.equal((await h.call()).code, 403);
  assert.equal((await h.call("POST", { action: "release", revision: 0 })).code, 403);
  assert.equal(h.writes.length, 0);
  assert.equal(await release.mainnetPurchasesReleased(h.req), false);
});

test("missing storage fails closed for reads, writes and purchases", async () => {
  const h = harness(null, prepared);
  delete h.req.app.locals.adminCollection;
  assert.equal((await h.call()).code, 503);
  assert.equal((await h.call("POST", { action: "release", revision: 0 })).code, 503);
  assert.equal(await release.mainnetPurchasesReleased(h.req), false);
});

test("invalid changes and corrupt stored state fail closed", async () => {
  const h = harness(null, prepared);
  for (const body of [{ action: "release" }, { action: "release", revision: -1 }, { action: "release", revision: .5 }, { action: "open", revision: 0 }]) {
    assert.equal((await h.call("POST", body)).code, 400);
  }
  const corrupt = harness({ released: "yes", revision: 0 }, prepared);
  assert.equal((await corrupt.call()).code, 503);
  assert.equal(await release.mainnetPurchasesReleased(corrupt.req), false);
});
