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
  let authorize, read, outro, update;
  const artLookups = [], writes = [];
  mountBossNftPreview({
    use(handler) { authorize = handler; },
    get(path, handler) {
      if (path === "/outro/:id") outro = handler;
      else { assert.equal(path, "/"); read = handler; }
    },
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
      async findOne({ _id }) {
        artLookups.push([_id]);
        return _id.endsWith(':3') ? null : { webp: "UklGRpreview" };
      },
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
    async request({ network = "testnet", testnetSave = true, token = user.accessToken, query = {}, id, body, outroCard = false } = {}) {
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
      if (authorized) await (outroCard ? outro : id === undefined ? read : update)(req, res);
      return res;
    },
  };
}

test("the former public Boss NFT preview is retired on Testnet for every session", async () => {
  const create = project => createApiGateway(async () => { throw Error("Legacy preview must not start a backend"); }, () => ({
    VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: project,
  }));
  const headers = { host: "cryptoid-evolution-testnet.vercel.app", "x-cryptoid-app-network": "testnet" };
  const check = async (project, authorization) => {
    const res = response();
    await create(project)({ url: "/api/index?path=boss-nft-preview&edition=holo", headers: { ...headers, authorization } }, res);
    return res.code;
  };
  assert.equal(await check("cryptoid-evolution.vercel.app", "Bearer token"), 404);
  assert.equal(await check(headers.host), 404);
  assert.equal(await check(headers.host, "Bearer token"), 404);
});

test("the Testnet gateway only forwards the signed, read-only individual boss outro", async () => {
  const forwarded = [];
  const gateway = project => createApiGateway(async () => ({
    async start() {},
    app(req, res) {
      forwarded.push([req.url, req.headers["x-cryptoid-app-network"], req.testnetSave]);
      res.status(200);
    },
  }), () => ({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: project }));
  const testnet = "cryptoid-evolution-testnet.vercel.app";
  const check = async ({ path = "boss-nft-preview/outro/1", project = testnet, method = "GET", authorization = "Bearer token" } = {}) => {
    const res = response();
    await gateway(project)({ method, url: `/api/index?path=${path}&run=round`, headers: { host: project, authorization } }, res);
    assert.equal(res.headers["Cache-Control"], path.endsWith("/51") ? undefined : "private, no-store");
    return res.code;
  };
  assert.equal(await check({ project: "cryptoid-evolution.vercel.app" }), 404);
  assert.equal(await check({ authorization: "" }), 401);
  assert.equal(await check({ method: "POST" }), 405);
  assert.equal(await check({ path: "boss-nft-preview/outro/51" }), 404);
  assert.equal(await check(), 200);
  assert.deepEqual(forwarded, [["/boss-nft-preview/outro/1?run=round", "testnet", true]]);
});

test("an outro returns only the confirmed boss Victory card, with the unlock tied to the same run", async () => {
  const f = fixture({
    rewardsByNetwork: { testnet: { bossWins: { 1: 1, 3: 1 } }, mainnet: { bossWins: { 2: 1 } } },
    rewardRunId: { testnet: "round" },
    rewardEventKeys: { testnet: ["boss:1", "boss-card:1"] },
    testnetBossHoloInterest: [1],
  });
  const card = (id, query = {}, token) => f.request({ id, query, token, outroCard: true });
  assert.equal((await card("1", {}, "someone-else")).code, 401);
  assert.equal((await card("51")).code, 404);
  assert.deepEqual((await card("2")).body, { owner: "pilot", id: 2, card: null });
  assert.deepEqual(f.artLookups, []);
  assert.deepEqual((await card("3", { run: "round" })).body, { owner: "pilot", id: 3, card: null });
  const first = await card("1", { run: "round", edition: "holo" });
  assert.equal(first.headers["Cache-Control"], "private, no-store");
  assert.deepEqual(first.body, { owner: "pilot", id: 1, card: { webp: "UklGRpreview", newlyUnlocked: true } });
  assert.deepEqual((await card("1", { run: "previous" })).body.card, { webp: "UklGRpreview", newlyUnlocked: false });
  assert.deepEqual(f.artLookups, ["3", "1", "1"].map(id => [`${BOSS_NFT_PREVIEW_ART_REVISION}:victory:${id}`]));
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
