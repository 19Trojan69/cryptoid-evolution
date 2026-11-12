import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { default: mountAdminEndpoints } = require("../build/handlers/admin.js");

function galleryFixture(t, rewards) {
  const previous = process.env.ADMIN_PI_TESTNET_UID;
  process.env.ADMIN_PI_TESTNET_UID = "gallery-owner";
  t.after(() => {
    if (previous === undefined) delete process.env.ADMIN_PI_TESTNET_UID;
    else process.env.ADMIN_PI_TESTNET_UID = previous;
  });
  let ownerCheck;
  let gallery;
  const lookups = [];
  mountAdminEndpoints({
    use(handler) { ownerCheck = handler; },
    post() {},
    get(path, handler) { if (path === "/boss-nfts") gallery = handler; },
  });
  return {
    lookups,
    async read(uid, query = {}) {
      const req = {
        session: { currentUser: uid ? { uid } : undefined, adminMode: true },
        headers: { "x-cryptoid-app-network": "testnet" },
        get(name) { return this.headers[name]; },
        query,
        app: { locals: {
          userCollection: { async findOne(filter, options) {
            lookups.push({ filter, options });
            return { rewardsByNetwork: rewards };
          } },
          bossNftPreviewCollection: { find(filter) {
            lookups.push(filter);
            return { async toArray() {
              return filter._id.$in.map(_id => ({ _id, story: "A boss story", webp: "UklGRpreview" })).reverse();
            } };
          } },
        } },
      };
      const res = {
        code: 200, headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        status(code) { this.code = code; return this; },
        json(body) { this.body = body; return this; },
      };
      let authorized = false;
      await ownerCheck(req, res, () => { authorized = true; });
      if (authorized) await gallery(req, res);
      return res;
    },
  };
}

test("anonymous and ordinary players cannot read NFT gallery artwork or progress", async t => {
  const f = galleryFixture(t, {});
  const guest = await f.read(undefined);
  const player = await f.read("another-player");
  assert.equal(guest.code, 401);
  assert.equal(player.code, 403);
  assert.equal(player.headers["Cache-Control"], "no-store");
  assert.deepEqual(f.lookups, []);
});

test("both editions show only confirmed wins from the current account and network", async t => {
  const f = galleryFixture(t, {
    testnet: { bossWins: { 1: 1, 9: 0, 18: 2, 30: "1", 50: 3, 51: 1 }, highestLevel: 500 },
    mainnet: { bossWins: { 2: 1 } },
  });
  for (const edition of ["victory", "holo"]) {
    const reply = await f.read("gallery-owner", { edition, page: "1" });
    assert.equal(reply.code, 200);
    assert.equal(reply.body.total, 3);
    assert.deepEqual(reply.body.cards.map(card => card.id), [1, 18, 50]);
    assert.deepEqual(f.lookups.at(-2), {
      filter: { uid: "gallery-owner" },
      options: { projection: { _id: 0, "rewardsByNetwork.testnet.bossWins": 1 } },
    });
    assert.deepEqual(f.lookups.at(-1)._id.$in, [1, 18, 50].map(id => edition + ":" + id));
  }
});

test("a full collection loads six cards at a time and rejects unsupported query values", async t => {
  const bossWins = Object.fromEntries(Array.from({ length: 50 }, (_, index) => [index + 1, 1]));
  const f = galleryFixture(t, { testnet: { bossWins } });
  const first = await f.read("gallery-owner", { edition: "holo", page: "1" });
  const last = await f.read("gallery-owner", { edition: "holo", page: "9" });
  assert.equal(first.body.pageSize, 6);
  assert.deepEqual(first.body.cards.map(card => card.id), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(last.body.cards.map(card => card.id), [49, 50]);
  const count = f.lookups.length;
  assert.equal((await f.read("gallery-owner", { edition: "invalid" })).code, 400);
  assert.equal((await f.read("gallery-owner", { page: "10" })).code, 400);
  assert.equal(f.lookups.length, count);
});

test("test mode or a high reached level does not unlock unearned NFTs", async t => {
  const f = galleryFixture(t, { testnet: { highestLevel: 500, completedChains: [1] }, mainnet: { bossWins: { 1: 1 } } });
  const result = await f.read("gallery-owner");
  assert.deepEqual(result.body, { total: 0, pageSize: 6, cards: [] });
  assert.equal(f.lookups.length, 1);
});
