import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { baseBossArtworkIds, nftPreparationManifest, mountNftPreparation } = require("../build/nftPreparation.js");
const { shipNftCatalog } = require("../build/shipNftEligibility.js");
const { bossNftEditions, retroNftTerms } = require("../build/nftCollectionTerms.js");

test("the preparation contains every existing design once and stays unpublished", () => {
  const result = nftPreparationManifest();
  assert.equal(result.phase, "preparation");
  assert.equal(result.publishable, false);
  assert.equal(result.network, "mainnet");
  assert.deepEqual([result.summary.bosses, result.summary.ships, result.summary.retro, result.summary.total], [200, 60, 240, 500]);
  assert.equal(new Set(result.cards.map(card => card.id)).size, 500);
  assert.match(result.catalogHash, /^[a-f0-9]{64}$/);
  assert.equal(result.catalogHash, nftPreparationManifest().catalogHash);
  assert.equal(result.summary.missingImageUris, 500);
  assert.equal(result.summary.missingMetadataUris, 500);
  assert.equal(result.summary.unlinkedNftProducts, 0);
  assert.equal(result.summary.preparedNftProducts, 390);
  assert.equal(result.issuance.state, "unavailable");
  assert.equal(result.issuance.blockchainOwnershipVerified, false);
  assert.equal(result.issuance.ready, false);
  assert.equal(result.metadata.ready, false);
  assert.equal(result.summary.silhouetteDesigns, 98);
  for (const card of result.cards) {
    assert.ok(Number.isSafeInteger(card.maxSupply) && card.maxSupply > 0, card.id);
    assert.ok(Number.isFinite(card.price.amount) && card.price.amount >= 0, card.id);
    assert.equal(card.metadataUri, null);
    assert.equal(card.metadataDraft.image, null);
    assert.equal(card.artwork.ownerOnly, true);
    assert.equal(card.artwork.network, "testnet");
  }
});

test("paid boss editions require a purchase and preserve their individual victory thresholds", () => {
  const cards = nftPreparationManifest().cards;
  for (let boss = 1; boss <= 50; boss++) {
    const prefix = "boss-" + String(boss).padStart(2, "0") + "-";
    const victory = cards.find(card => card.id === prefix + "victory");
    assert.equal(victory.acquisition.kind, "boss_victory");
    assert.equal(victory.acquisition.minimumWins, 1);
    assert.equal(victory.price.amount, 0);
    assert.equal(victory.maxSupply, bossNftEditions.victory.supply);
    const holo = cards.find(card => card.id === prefix + "holo");
    assert.equal(holo.acquisition.kind, "boss_purchase");
    assert.equal(holo.price.amount, 14.9);
    for (const [edition, wins, supply, price] of [["platinum", 2, 628, 25], ["diamond", 3, 314, 50]]) {
      const card = cards.find(item => item.id === prefix + edition);
      assert.equal(card.acquisition.kind, "boss_purchase");
      assert.equal(card.acquisition.minimumWins, wins);
      assert.equal(card.maxSupply, supply);
      assert.equal(card.price.amount, price);
      assert.equal(card.productId, `nft_boss_${String(boss).padStart(2, "0")}_${edition}`);
      assert.equal(card.productState, "prepared");
    }
  }
});

test("ship metadata retains the released hull, stage, price and prerequisite mapping", () => {
  const cards = nftPreparationManifest().cards;
  for (const ship of shipNftCatalog) {
    const card = cards.find(item => item.id === ship.id);
    assert.equal(card.maxSupply, ship.maxSupply);
    assert.equal(card.productId, ship.productId);
    assert.equal(card.acquisition.shipId, ship.shipId);
    assert.equal(card.acquisition.stage, ship.stage);
    assert.equal(card.acquisition.proof, ship.acquisition);
    assert.equal(card.acquisition.requiresProductId, ship.requiresProductId);
    assert.equal(card.metadataDraft.description, ship.story);
    assert.equal(card.price.nftIncluded, true);
    assert.equal(card.price.amount, ship.stage === 1 ? ship.standardPriceShards : ship.upgradePricePi);
  }
});

test("retro definitions preserve all six rank terms and the token-specific ship traits", () => {
  const cards = nftPreparationManifest().cards.filter(card => card.collection === "retro");
  for (const card of cards) {
    assert.equal(card.maxSupply, retroNftTerms[card.edition].supply);
    assert.equal(card.price.amount, retroNftTerms[card.edition].pricePi);
    assert.equal(card.acquisition.kind, "retro_purchase");
    assert.equal(card.productId, `nft_retro_${String(card.acquisition.level).padStart(3, "0")}_${card.edition}`);
    assert.equal(card.productState, "prepared");
    assert.deepEqual(card.acquisition.requiredTokenTraits, ["modelId", "stage", "colorId"]);
  }
});

test("authored boss stories are copied exactly and affect the content fingerprint", () => {
  assert.equal(baseBossArtworkIds.length, 100);
  const original = nftPreparationManifest();
  const text = "  The original story remains intact.  ";
  const changed = nftPreparationManifest(new Map([[baseBossArtworkIds[0], text]]));
  assert.equal(changed.cards[0].metadataDraft.description, text);
  assert.equal(changed.summary.missingDescriptions, 99);
  assert.notEqual(changed.catalogHash, original.catalogHash);
});

function harness({ network = "mainnet", documents = [], available = true } = {}) {
  const routes = {}, reads = [];
  const collection = {
    find(query, options) {
      reads.push({ query, options });
      return { async toArray() { return documents; } };
    },
    updateOne() { throw new Error("Preparation must remain read-only"); },
  };
  mountNftPreparation({ get(path, handler) { routes[path] = handler; } });
  const req = { get: () => network, query: {}, app: { locals: { bossNftPreviewCollection: available ? collection : null } } };
  return {
    req, reads,
    async call(query = {}) {
      req.query = query;
      const res = {
        statusCode: 200, headers: {},
        setHeader(key, value) { this.headers[key] = value; },
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; },
      };
      await routes["/nft-preparation"](req, res);
      return res;
    },
  };
}

test("the owner summary reads story fields without exporting protected image data", async () => {
  const h = harness({ documents: [{ _id: baseBossArtworkIds[0], story: "Original", webp: "private-artwork" }] });
  const result = await h.call();
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.summary.total, 500);
  assert.equal(result.body.cards, undefined);
  assert.equal(result.headers["Cache-Control"], "private, no-store");
  assert.deepEqual(h.reads[0].options.projection, { _id: 1, story: 1 });
  const downloaded = await h.call({ download: "1" });
  assert.equal(downloaded.body.cards.length, 500);
  assert.ok(downloaded.headers["Content-Disposition"].includes(".json"));
  assert.ok(!JSON.stringify(downloaded.body).includes("private-artwork"));
  assert.equal(downloaded.body.publishable, false);
});

test("wrong networks, malformed download requests and unavailable storage cannot produce a preparation export", async () => {
  const testnet = harness({ network: "testnet" });
  assert.equal((await testnet.call()).statusCode, 403);
  assert.equal(testnet.reads.length, 0);
  const invalid = harness();
  for (const download of ["true", ["1"], ""]) assert.equal((await invalid.call({ download })).statusCode, 400);
  assert.equal(invalid.reads.length, 0);
  assert.equal((await harness({ available: false }).call()).statusCode, 503);
});
