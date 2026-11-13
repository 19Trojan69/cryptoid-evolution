import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { createApiGateway } = require("../../build/apiGateway.js");
const { default: mountShipNftPreview, mountTestnetShipNftPreview } = require("../../build/handlers/shipNftPreview.js");
const { default: mountProgressEndpoints } = require("../../build/handlers/progress.js");
const { emptyPlayerSave } = require("../../build/playerSave.js");
const { confirmedMainnetShipUpgrades, shipNftCatalog, SHIP_NFT_ART_REVISION } = require("../../build/shipNftEligibility.js");

const response = () => ({
  code: 200, headers: {},
  setHeader(name, value) { this.headers[name] = value; },
  status(code) { this.code = code; return this; },
  json(body) { this.body = body; return this; },
});
const user = { uid: "pilot", _id: "pilot-id", accessToken: "verified-token" };
const receipt = (product_id, overrides = {}) => ({
  product_id, user: user.uid, paid: true, payment_network: "Pi Network",
  payment_amount_pi: product_id.endsWith("_3") ? 19.9 : 9.9,
  pi_payment_id: `paid-${product_id}`, txid: "a".repeat(64), completed_at: new Date(), ...overrides,
});

function fixture({ mainnet, orders = [], enabled = true } = {}) {
  let read;
  mountShipNftPreview({ get(path, handler) { assert.equal(path, "/"); read = handler; } }, () => enabled);
  const artLookups = [];
  const orderLookups = [];
  const locals = {
    userCollection: {
      async findOne(filter) {
        assert.deepEqual(filter, { uid: user.uid, _id: user._id });
        return { playerByNetwork: { mainnet, testnet: { fleet: { "grey-scout": { grey: 1 } } } } };
      },
    },
    orderCollection: {
      find(filter) {
        assert.equal(filter.user, user.uid);
        assert.equal(filter.payment_network, "Pi Network");
        assert.equal(filter.paid, true);
        assert.deepEqual(filter.cancelled, { $ne: true });
        assert.deepEqual(filter.owner_testnet_catalog, { $ne: true });
        orderLookups.push(filter.product_id.$in);
        // Deliberately pass all mocked rows so the receipt validation is exercised too.
        return { async toArray() { return orders; } };
      },
    },
    shipNftPreviewCollection: {
      find(filter) {
        artLookups.push(filter._id.$in);
        return { async toArray() { return filter._id.$in.map(_id => ({ _id, webp: "UklGRpreview" })); } };
      },
    },
  };
  return {
    artLookups, orderLookups,
    async request({ network = "mainnet", token = user.accessToken, query = {}, adminMode = false } = {}) {
      const req = { query, session: { currentUser: user, adminMode }, app: { locals },
        get(name) { return { "x-cryptoid-app-network": network, authorization: `Bearer ${token}` }[name]; } };
      const res = response();
      await read(req, res);
      return res;
    },
  };
}

const cardsById = new Map(shipNftCatalog.map(card => [card.id, card]));

test("each of the 20 ship families has three distinct cards with the correct caps and upgrade IDs", () => {
  assert.equal(shipNftCatalog.length, 60);
  assert.equal(cardsById.size, 60);
  for (const field of ["story", "spritePath", "backgroundPath"]) {
    assert.equal(new Set(shipNftCatalog.map(card => card[field])).size, 60);
  }
  assert.equal(cardsById.get("grey-scout-advanced").productId, "ship_02_stage_2");
  assert.equal(cardsById.get("nova-wing-elite").requiresProductId, "ship_01_stage_2");
  assert.equal(cardsById.get("grey-scout-standard").standardPriceShards, 0);
  assert.equal(cardsById.get("nova-wing-standard").standardPriceShards, 150);
  assert.equal(cardsById.get("pi-vanguard-standard").standardPriceShards, 4_400);
  assert.equal(cardsById.get("core-carrier-standard").standardPriceShards, 4_650);
  for (const card of shipNftCatalog) {
    assert.equal(card.maxSupply, [99_999, 31_415, 3_141][card.stage - 1]);
    assert.equal(card.upgradePricePi, [null, 9.9, 19.9][card.stage - 1]);
    assert.equal(card.stage === 1, Number.isSafeInteger(card.standardPriceShards));
    assert.equal(card.productId, card.stage === 1 ? null : `ship_${String(card.sprite + 1).padStart(2, "0")}_stage_${card.stage}`);
  }
});

test("the API is closed until launch and refuses Testnet even on the Mainnet project", async () => {
  assert.equal((await fixture({ enabled: false }).request()).code, 404);
  const live = fixture();
  assert.equal((await live.request({ network: "testnet" })).code, 404);
  assert.equal((await live.request({ token: "wrong-token" })).code, 401);
  for (const query of [{ stage: "2.0" }, { stage: ["1"] }, { stage: "4" }, { page: "5" }]) {
    assert.equal((await live.request({ query })).code, 400);
  }
  let backendStarted = false;
  const gateway = createApiGateway(async () => { backendStarted = true; throw new Error("Unexpected backend"); }, () => ({
    VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "cryptoid-evolution-testnet.vercel.app",
  }));
  for (const path of ["ship-nft-preview", "ship-nft-preview/"]) {
    const res = response();
    await gateway({ url: `/api/index?path=${path}`, headers: { host: "cryptoid-evolution-testnet.vercel.app" } }, res);
    assert.equal(res.code, 404);
  }
  assert.equal(backendStarted, false);
});

test("Testnet uses the verified player's saved fleet and reveals only paid matching upgrades", async () => {
  let read;
  mountTestnetShipNftPreview({ get(_path, handler) { read = handler; } });
  const account = { playerByNetwork: { mainnet: { fleet: { "solar-lance": { grey: 1 } } } },
    rewardsByNetwork: { mainnet: { bossWins: { 1: 2, 2: 1, 3: 1 } }, testnet: { bossWins: { 2: 3, 17: 1 } } } };
  const orderChecks = [];
  const upgrades = ["ship_02_stage_2"];
  const locals = {
    userCollection: { async findOne(filter) {
      assert.deepEqual(filter, { uid: user.uid, _id: user._id });
      return account;
    } },
    orderCollection: { find(filter) {
      assert.equal(filter.user, user.uid);
      assert.equal(filter.payment_network, "Pi Testnet");
      assert.equal(filter.paid, true);
      assert.deepEqual(filter.cancelled, { $ne: true });
      orderChecks.push(filter.product_id.$in);
      return { async toArray() { return upgrades.filter(id => filter.product_id.$in.includes(id)).map(product_id => ({ product_id })); } };
    } },
  };
  const request = async ({ network = "testnet", token = user.accessToken, stage = "1", page = "1", path = "/" } = {}) => {
    const req = { path, testnetSave: true, query: { stage, page }, session: { currentUser: user, adminMode: true }, app: { locals },
      get(name) { return { "x-cryptoid-app-network": network, authorization: `Bearer ${token}` }[name]; } };
    const res = response();
    await read(req, res);
    return res;
  };
  assert.equal((await request({ network: "mainnet" })).code, 404);
  assert.equal((await request({ token: "other-account" })).code, 401);
  assert.equal((await request({ page: "5" })).code, 400);
  const starter = await request();
  assert.equal(starter.headers["Cache-Control"], "private, no-store");
  assert.equal(starter.body.total, 20);
  assert.equal(starter.body.cards.length, 1);
  assert.equal(starter.body.cards[0].id, "grey-scout-standard");
  assert.equal(starter.body.cards[0].maxSupply, 99_999);
  assert.ok(starter.body.cards[0].webp.startsWith("UklGR"));
  assert.deepEqual(orderChecks, []);
  account.playerByNetwork.testnet = { fleet: { "grey-scout": { grey: 1 }, "pi-vanguard": { grey: 1 } } };
  assert.deepEqual((await request({ stage: "2" })).body.cards.map(card => card.id), ["grey-scout-advanced"]);
  assert.deepEqual((await request({ stage: "3" })).body.cards, []);
  upgrades.push("ship_02_stage_3");
  assert.deepEqual((await request({ stage: "3" })).body.cards.map(card => card.id), ["grey-scout-elite"]);
  const vanguard = (await request({ page: "4" })).body.cards[0];
  assert.equal(vanguard.id, "pi-vanguard-standard");
  assert.equal(vanguard.livery, "Metallic Edition");
  upgrades.push("ship_19_stage_3"); // An Elite receipt alone cannot skip Advanced.
  const progress = await request({ path: "/progress" });
  assert.equal(progress.headers["Cache-Control"], "private, no-store");
  assert.deepEqual(progress.body, { owner: user.uid, boss: 2, ships: [2, 1, 1] });
  assert.equal((await request({ path: "/progress", token: "other-account" })).code, 401);
  assert.equal((await request({ path: "/progress", network: "mainnet" })).code, 404);
});

test("Standard requires saved Mainnet ownership and handles imported and older confirmed hulls", async () => {
  const fleet = { "grey-scout": { grey: 1 }, "nova-wing": { silver: 1 }, "solar-lance": { gold: 1 } };
  const legacy = fixture({ mainnet: { fleet, legacyImported: true, standardShipAcquisitions: { "solar-lance": "2026-11-13" } } });
  const { body, headers } = await legacy.request({ adminMode: true });
  assert.equal(headers["Cache-Control"], "private, no-store");
  assert.equal(body.owner, user.uid);
  assert.equal(body.cards[0].status, "eligible");
  assert.deepEqual(body.cards[1], { id: "nova-wing-standard", name: "Nova Wing", maxSupply: 99_999, status: "needs-hull-proof" });
  assert.equal(body.cards[2].status, "eligible");
  assert.deepEqual(legacy.artLookups, [[`${SHIP_NFT_ART_REVISION}:grey-scout-standard`, `${SHIP_NFT_ART_REVISION}:solar-lance-standard`]]);
  assert.deepEqual(legacy.orderLookups, []);
  const previous = fixture({ mainnet: { fleet, legacyImported: false } });
  assert.equal((await previous.request()).body.cards[1].status, "eligible");
  const absent = await fixture().request({ adminMode: true });
  assert.equal(absent.body.cards[0].status, "needs-hull");
});

test("Advanced and Elite reject other networks, cancelled and incomplete receipts, and enforce matching stages", async () => {
  const otherRows = [
    receipt("ship_02_stage_2", { paid: false }),
    receipt("ship_02_stage_2", { payment_network: "Pi Testnet" }),
    receipt("ship_02_stage_2", { payment_network: undefined }),
    receipt("ship_02_stage_2", { user: "other" }),
    receipt("ship_02_stage_2", { owner_testnet_catalog: true }),
    receipt("ship_02_stage_2", { cancelled: true }),
    receipt("ship_02_stage_2", { payment_amount_pi: 1 }),
    receipt("ship_02_stage_2", { completed_at: undefined }),
    receipt("ship_02_stage_2", { txid: "incomplete" }),
    receipt("ship_01_stage_2"),
    receipt("ship_02_stage_3"),
  ];
  const fleet = { "grey-scout": { grey: 1 }, "nova-wing": { gold: 1 } };
  const missing = fixture({ mainnet: { fleet }, orders: otherRows });
  assert.deepEqual(confirmedMainnetShipUpgrades(user.uid, otherRows), ["ship_01_stage_2", "ship_02_stage_3"]);
  const advanced = await missing.request({ query: { stage: "2" }, adminMode: true });
  assert.equal(advanced.body.cards[0].maxSupply, 31_415);
  assert.equal(advanced.body.cards[0].status, "needs-purchase");
  assert.equal(advanced.body.cards[1].status, "eligible");
  const elite = await missing.request({ query: { stage: "3" } });
  assert.equal(elite.body.cards[0].status, "needs-advanced");
  const owned = fixture({ mainnet: { fleet }, orders: [...otherRows, receipt("ship_02_stage_2")] });
  const confirmed = await owned.request({ query: { stage: "3" } });
  assert.equal(confirmed.body.cards[0].status, "eligible");
  assert.equal(confirmed.body.cards[0].maxSupply, 3_141);
  assert.equal(confirmed.body.cards[0].story, cardsById.get("grey-scout-elite").story);
  assert.equal(confirmed.body.cards[1].status, "needs-purchase");
  assert.deepEqual(owned.artLookups, [[`${SHIP_NFT_ART_REVISION}:grey-scout-elite`]]);
});

test("a successful Mainnet Shard transaction records its proof with the atomic inventory update", async t => {
  const env = {
    CRYPTOID_MAINNET_SHIP_NFTS_ENABLED: "1", VERCEL_ENV: "production",
    VERCEL_PROJECT_PRODUCTION_URL: "cryptoid-evolution.vercel.app",
  };
  for (const key of Object.keys(env)) {
    const previous = process.env[key];
    t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
    process.env[key] = env[key];
  }
  let inventory;
  mountProgressEndpoints({ use() {}, get() {}, post(path, handler) { if (path === "/inventory") inventory = handler; } });
  const run = async (network, modifiedCount, action = "buy") => {
    const writes = [];
    const key = `playerByNetwork.${network}`;
    const save = { ...emptyPlayerSave(), balance: 500, legacyImported: action !== "import" };
    const locals = { userCollection: {
      async findOne() { return { playerByNetwork: { [network]: save } }; },
      async updateOne(filter, operation) { if (operation.$inc) writes.push({ filter, operation }); return { modifiedCount }; },
    } };
    const req = { body: { action, version: 0, skin: "nova-wing", color: "silver", confirm: true, balance: 100,
        fleet: { "nova-wing": { silver: 1 } } },
      session: { currentUser: user }, app: { locals }, get() { return network; } };
    const res = response();
    await inventory(req, res);
    assert.equal(writes.length, 1);
    assert.deepEqual(writes[0].filter, { uid: user.uid, [key + ".version"]: 0 });
    return { res, fields: writes[0].operation.$set };
  };
  const purchased = await run("mainnet", 1);
  assert.equal(purchased.res.code, 200);
  assert.equal(purchased.fields["playerByNetwork.mainnet.balance"], 350);
  assert.ok(Date.parse(purchased.fields["playerByNetwork.mainnet.standardShipAcquisitions"]["nova-wing"]));
  const conflicted = await run("mainnet", 0);
  assert.equal(conflicted.res.code, 409);
  assert.equal((await run("testnet", 1)).fields["playerByNetwork.testnet.standardShipAcquisitions"], undefined);
  assert.equal((await run("mainnet", 1, "import")).fields["playerByNetwork.mainnet.standardShipAcquisitions"], undefined);
});
