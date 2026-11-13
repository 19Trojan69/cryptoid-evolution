import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { createApiGateway } = require("../../build/apiGateway.js");
const { default: mountBossNftPreview, BOSS_NFT_PREVIEW_ART_REVISION } = require("../../build/handlers/bossNftPreview.js");

const response = () => ({
  code: 200, headers: {},
  setHeader(name, value) { this.headers[name] = value; },
  status(code) { this.code = code; return this; },
  json(body) { this.body = body; return this; },
});

function fixture(account) {
  let authorize, read, update;
  const artLookups = [], writes = [];
  mountBossNftPreview({
    use(handler) { authorize = handler; },
    get(path, handler) { assert.equal(path, "/"); read = handler; },
    put(path, handler) { assert.equal(path, "/holo/:id/interest"); update = handler; },
  });
  const user = { uid: "pilot", _id: "pilot-id", accessToken: "valid-token" };
  const locals = {
    userCollection: {
      async findOne(filter) {
        assert.deepEqual(filter, { _id: user._id, uid: user.uid });
        return account;
      },
      async updateOne(filter, operations) {
        assert.deepEqual(filter, { _id: user._id, uid: user.uid });
        writes.push(operations);
        const before = account.testnetBossHoloInterest ?? [];
        const add = operations.$addToSet?.testnetBossHoloInterest;
        const remove = operations.$pull?.testnetBossHoloInterest.$eq;
        account.testnetBossHoloInterest = add ? [...new Set([...before, add])] : before.filter(id => id !== remove);
        return { matchedCount: 1, modifiedCount: Number(before.length !== account.testnetBossHoloInterest.length) };
      },
      aggregate() { return { async toArray() { return [{ id: 9, count: 3 }]; } }; },
    },
    bossNftPreviewCollection: {
      find(filter) {
        artLookups.push(filter._id.$in);
        return { async toArray() {
          return filter._id.$in.map(_id => ({ _id, story: "Boss story", webp: "UklGRpreview" })).reverse();
        } };
      },
    },
  };
  return {
    artLookups, writes,
    async request({ network = "testnet", testnetSave = true, token = user.accessToken, query = {}, id, body } = {}) {
      const req = {
        query, params: { id }, body, testnetSave,
        session: { currentUser: user },
        app: { locals },
        headers: { "x-cryptoid-app-network": network, authorization: `Bearer ${token}` },
        get(name) { return this.headers[name]; },
      };
      const res = response();
      let authorized = false;
      await authorize(req, res, () => { authorized = true; });
      if (authorized) await (id === undefined ? read : update)(req, res);
      return res;
    },
  };
}

test("only the Testnet deployment routes authenticated NFT preview requests locally", async () => {
  const calls = [];
  const backend = {
    async start() {},
    app(req, res) {
      calls.push({ path: req.url, network: req.headers["x-cryptoid-app-network"], authorizedNetwork: req.testnetSave });
      return res.json({ ok: true });
    },
  };
  const create = project => createApiGateway(async () => backend, () => ({
    VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: project,
  }));
  const headers = { host: "cryptoid-evolution-testnet.vercel.app", "x-cryptoid-app-network": "testnet" };
  const check = async (project, authorization) => {
    const res = response();
    await create(project)({ url: "/api/index?path=boss-nft-preview&edition=holo", headers: { ...headers, authorization } }, res);
    return res.code;
  };
  assert.equal(await check("cryptoid-evolution.vercel.app", "Bearer token"), 404);
  assert.equal(await check(headers.host), 401);
  assert.equal(await check(headers.host, "Bearer token"), 200);
  assert.deepEqual(calls, [{ path: "/boss-nft-preview?edition=holo", network: "testnet", authorizedNetwork: true }]);
});

test("neither a mismatched token nor reaching a boss exposes artwork without a confirmed Testnet win", async () => {
  const f = fixture({ playerByNetwork: { testnet: { highestSector: 500 }, mainnet: { highestSector: 500 } },
    rewardsByNetwork: { mainnet: { bossWins: { 1: 1 } } } });
  assert.equal((await f.request({ token: "another-token" })).code, 401);
  assert.equal((await f.request({ testnetSave: false })).code, 404);
  assert.deepEqual((await f.request()).body, { owner: "pilot", total: 0, pageSize: 6, cards: [] });
  assert.deepEqual(f.artLookups, []);
});

test("a confirmed win reveals each boss in its numbered slot in both editions", async () => {
  const account = { playerByNetwork: { testnet: { highestSector: 1 } }, rewardsByNetwork: { testnet: {} } };
  const f = fixture(account);
  for (let id = 1; id <= 50; id++) {
    const page = String(Math.ceil(id / 6));
    for (const edition of ["victory", "holo"]) {
      account.playerByNetwork.testnet.highestSector = id * 10;
      account.rewardsByNetwork.testnet.bossWins = {};
      assert.deepEqual((await f.request({ query: { edition, page } })).body.cards, []);
      account.rewardsByNetwork.testnet.bossWins = { [id]: 1 };
      const { body, headers } = await f.request({ query: { edition, page } });
      assert.equal(headers["Cache-Control"], "private, no-store");
      assert.equal(body.total, 1);
      assert.deepEqual(body.cards, [{ id, story: "Boss story", webp: "UklGRpreview", defeated: true, interested: false }]);
      assert.deepEqual(f.artLookups.at(-1), [`${BOSS_NFT_PREVIEW_ART_REVISION}:${edition}:${id}`]);
    }
  }
  account.playerByNetwork.testnet.highestSector = 1;
  account.rewardsByNetwork.testnet = { linkedBlocks: { 2: 9 }, bossWins: { 1: 1 } };
  const legacy = await f.request();
  assert.deepEqual(legacy.body.cards.map(card => [card.id, card.defeated]), [[1, true]]);
});

test("Holo interest can be retried or withdrawn after a confirmed win", async () => {
  const f = fixture({ playerByNetwork: { testnet: { highestSector: 20 } }, rewardsByNetwork: { testnet: { bossWins: { 1: 1 } } } });
  const put = (id, interested, owner = "pilot") => f.request({ id, body: { owner, interested } });
  assert.equal((await put("2", true)).code, 403);
  assert.equal((await put("51", true)).code, 400);
  assert.equal((await put("1", "true")).code, 400);
  assert.equal((await put("1", true, "other")).code, 403);
  assert.deepEqual(f.writes, []);
  assert.equal((await put("1", true)).body.changed, true);
  assert.equal((await put("1", true)).body.changed, false);
  const read = await f.request({ query: { edition: "holo" } });
  assert.equal(read.body.cards[0].interested, true);
  assert.equal(read.body.interestSummary, undefined);
  assert.equal((await put("1", false)).body.changed, true);
  assert.equal((await f.request({ query: { edition: "holo" } })).body.cards[0].interested, false);
});

test("only the verified owner receives interest totals and the player's artwork stays progress-gated", async t => {
  const previous = process.env.ADMIN_PI_TESTNET_UID;
  process.env.ADMIN_PI_TESTNET_UID = "pilot";
  t.after(() => {
    if (previous === undefined) delete process.env.ADMIN_PI_TESTNET_UID;
    else process.env.ADMIN_PI_TESTNET_UID = previous;
  });
  const f = fixture({});
  const { body } = await f.request({ query: { edition: "holo" } });
  assert.deepEqual(body.interestSummary, [{ id: 9, count: 3 }]);
  assert.deepEqual(body.cards, []);
  assert.deepEqual(f.artLookups, []);
});
