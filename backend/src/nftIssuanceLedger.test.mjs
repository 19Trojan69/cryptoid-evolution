import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { MongoClient } = require("mongodb");
const { createPreparedNftIssuanceLedger } = require("../build/nftIssuanceLedger.js");
const hash = value => createHash("sha256").update(value).digest("hex");
const catalogHash = hash("synthetic ledger catalog; not a publication");
const publication = {
  metadataUri: `https://nft-fixture.cryptoid-evolution.app/nft/${hash("synthetic metadata")}/card.json`,
  metadataSha256: hash("synthetic metadata"),
};
const baseCatalog = (cap = 2) => ({
  appId: "synthetic-app", network: "Pi Network", catalogHash,
  cards: [{ id: "synthetic-card-a", maxSupply: cap, publication }, { id: "synthetic-card-b", maxSupply: cap, publication }],
});
const acquisition = (id, extra = {}) => ({
  appId: "synthetic-app", network: "Pi Network", catalogHash,
  cardId: "synthetic-card-a", uid: `synthetic-user-${id}`, recipient: `synthetic-recipient-${id}`,
  sourceKind: "payment", sourceId: id, evidenceSha256: hash(`synthetic entitlement ${id}`), ...extra,
});
const confirmation = (claim, reviewedPublication, extra = {}) => ({
  status: "confirmed", network: "Pi Network", appId: claim.appId, cardId: claim.cardId,
  issuanceKey: claim.issuanceKey, submissionId: claim.submissionId, recipient: claim.recipient,
  transactionId: hash(`synthetic chain tx ${claim._id}`), assetId: `synthetic-asset-${claim._id}`,
  metadataUri: reviewedPublication.metadataUri, metadataSha256: reviewedPublication.metadataSha256,
  evidenceSha256: hash(`synthetic issuance verification ${claim._id}`), confirmedAt: new Date(), ...extra,
});
const code = expected => error => error?.code === expected;

test("ledger rejects untrusted configuration before opening collections", () => {
  const client = { db() { throw new Error("must not touch DB"); } };
  for (const overrides of [{ network: "Pi Testnet" }, { catalogHash: "fake" }, { appId: "" }]) {
    assert.throws(() => createPreparedNftIssuanceLedger(client, "fixture", { ...baseCatalog(), ...overrides }, {
      resolveAcquisition: async () => null,
    }), code("nft_ledger_configuration_invalid"));
  }
  for (const cards of [[{ id: "same", maxSupply: 0 }], [{ id: "same", maxSupply: 1.5 }],
    [{ id: "same", maxSupply: 1 }, { id: "same", maxSupply: 1 }]]) {
    assert.throws(() => createPreparedNftIssuanceLedger(client, "fixture", { ...baseCatalog(), cards }, {
      resolveAcquisition: async () => null,
    }), code("nft_ledger_catalog_invalid"));
  }
  assert.throws(() => createPreparedNftIssuanceLedger(client, "fixture", {
    ...baseCatalog(), cards: [{ id: "same", maxSupply: 1, publication: { ...publication, metadataUri: "https://example.invalid/metadata.json" } }],
  }, { resolveAcquisition: async () => null }), code("nft_ledger_publication_invalid"));
});

test("importing/constructing ledger does not initialize storage and transaction failures do not fall back", async () => {
  let writes = 0;
  const ledger = createPreparedNftIssuanceLedger({
    db: () => ({ collection: () => ({
      createIndex: () => { writes++; }, updateOne: () => { writes++; },
    }) }),
    startSession: () => ({ withTransaction: async () => { throw new Error("transactions unavailable"); }, endSession: async () => {} }),
  }, "fixture", baseCatalog(), { resolveAcquisition: async () => null });
  await assert.rejects(ledger.reserve("any"), code("nft_ledger_not_initialized"));
  await assert.rejects(ledger.beginSubmission(hash("id")), code("nft_ledger_not_initialized"));
  await assert.rejects(ledger.reconcile(hash("id")), code("nft_ledger_not_initialized"));
  await assert.rejects(ledger.initializeStorage(), /transactions unavailable/);
  await assert.rejects(ledger.reserve("any"), code("nft_ledger_not_initialized"));
  assert.equal(writes, 0);
});

// Opt-in integration uses a throwaway LOCAL replica set only. The fixture URI
// never reads application configuration and cannot connect to Atlas/production.
const testUri = process.env.CRYPTOID_NFT_LEDGER_TEST_URI;
if (testUri && !/^mongodb:\/\/(?:127\.0\.0\.1|localhost|\[::1\]):\d+(?:\/[^?]*)?(?:\?.*)?$/.test(testUri)) {
  throw new Error("CRYPTOID_NFT_LEDGER_TEST_URI must name a loopback test replica set");
}
const integration = (name, fn) => test(name, { skip: !testUri ? "local replica-set URI not supplied" : false }, fn);

async function fixture(t, { catalog = baseCatalog(), resolve, verify = async () => null } = {}) {
  const client = new MongoClient(testUri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const databaseName = `cryptoid_nft_ledger_test_${randomUUID().replaceAll("-", "")}`;
  const db = client.db(databaseName);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const records = new Map();
  const dependencies = {
    resolveAcquisition: resolve ?? (async reference => records.get(reference) ?? null),
    verifyIssuance: verify,
  };
  const ledger = createPreparedNftIssuanceLedger(client, databaseName, catalog, dependencies);
  await ledger.initializeStorage();
  return { client, databaseName, db, ledger, records, dependencies, catalog };
}

integration("real transactions never oversubscribe a cap under simultaneous distinct acquisitions", async t => {
  const f = await fixture(t, { catalog: baseCatalog(3) });
  for (let n = 0; n < 30; n++) f.records.set(`purchase-${n}`, acquisition(`purchase-${n}`));
  const results = await Promise.allSettled([...f.records.keys()].map(id => f.ledger.reserve(id)));
  const passed = results.filter(result => result.status === "fulfilled").map(result => result.value);
  const failed = results.filter(result => result.status === "rejected");
  assert.equal(passed.length, 3);
  assert.equal(failed.length, 27);
  assert.ok(failed.every(result => result.reason.code === "nft_supply_unavailable"));
  assert.deepEqual(passed.map(claim => claim.serial).sort(), [1, 2, 3]);
  assert.ok(passed.every(claim => claim.state === "reserved"));
  assert.equal(await f.db.collection("nft_issuance_claims_v1").countDocuments(), 3);
  const series = await f.db.collection("nft_issuance_series_v1").findOne({ cardId: "synthetic-card-a" });
  assert.equal(series.allocated, 3);
  assert.equal(series.confirmed, 0);
});

integration("same acquisition retries reserve exactly one durable serial, including concurrent retries", async t => {
  const f = await fixture(t);
  f.records.set("purchase", acquisition("purchase"));
  const results = await Promise.all(Array.from({ length: 20 }, () => f.ledger.reserve("purchase")));
  assert.equal(new Set(results.map(claim => claim._id)).size, 1);
  assert.equal(new Set(results.map(claim => claim.serial)).size, 1);
  assert.equal(await f.db.collection("nft_issuance_claims_v1").countDocuments(), 1);
  assert.equal((await f.db.collection("nft_issuance_series_v1").findOne({ cardId: "synthetic-card-a" })).allocated, 1);
});

integration("acquisition resolver must establish exact app/network/catalog and source provenance", async t => {
  const f = await fixture(t);
  const invalid = [null, acquisition("bad", { network: "Pi Testnet" }), acquisition("bad", { appId: "another-app" }),
    acquisition("bad", { catalogHash: hash("other") }), acquisition("bad", { cardId: "unknown-card" }),
    acquisition("bad", { sourceKind: "browser" }), acquisition("bad", { evidenceSha256: "not-verified" })];
  for (let n = 0; n < invalid.length; n++) {
    f.records.set(`bad-${n}`, invalid[n]);
    await assert.rejects(f.ledger.reserve(`bad-${n}`), code("nft_acquisition_unverified"));
  }
  assert.equal(await f.db.collection("nft_issuance_claims_v1").countDocuments(), 0);
  assert.ok((await f.db.collection("nft_issuance_series_v1").find().toArray()).every(series => series.allocated === 0));
});

integration("source replay cannot move an entitlement between card, account, recipient or evidence", async t => {
  const f = await fixture(t);
  const original = acquisition("purchase");
  f.records.set("reference", original);
  await f.ledger.reserve("reference");
  for (const extra of [{ cardId: "synthetic-card-b" }, { uid: "other-user" }, { recipient: "other-recipient" }, { evidenceSha256: hash("other") }]) {
    f.records.set("reference", { ...original, ...extra });
    await assert.rejects(f.ledger.reserve("reference"), code("nft_entitlement_conflict"));
  }
  const series = await f.db.collection("nft_issuance_series_v1").find().toArray();
  assert.equal(series.reduce((sum, row) => sum + row.allocated, 0), 1);
});

integration("a failed entitlement insert rolls the allocation back in the same real transaction", async t => {
  const f = await fixture(t);
  f.records.set("purchase", acquisition("purchase"));
  // Simulate a conflicting pre-existing source row under a different _id in
  // this disposable DB: the unique source index must reject the insert.
  await f.db.collection("nft_issuance_claims_v1").insertOne({
    _id: "synthetic-conflicting-row", appId: "synthetic-app", network: "Pi Network",
    sourceKind: "payment", sourceId: "purchase", issuanceKey: "synthetic-other-key", state: "reserved",
  });
  await assert.rejects(f.ledger.reserve("purchase"), error => error.code === 11000);
  assert.equal((await f.db.collection("nft_issuance_series_v1").findOne({ cardId: "synthetic-card-a" })).allocated, 0);
  assert.equal(await f.db.collection("nft_issuance_claims_v1").countDocuments(), 1);
});

integration("one worker claims pending; retries, crashes and restart do not authorize resubmission", async t => {
  const f = await fixture(t, { catalog: baseCatalog(1) });
  f.records.set("purchase", acquisition("purchase"));
  f.records.set("another", acquisition("another"));
  const claim = await f.ledger.reserve("purchase");
  const workers = await Promise.all(Array.from({ length: 15 }, () => f.ledger.beginSubmission(claim._id)));
  assert.equal(workers.filter(result => result.dispatchClaimed).length, 1);
  assert.equal(new Set(workers.map(result => result.claim.submissionId)).size, 1);
  assert.ok(workers.every(result => result.claim.state === "pending"));
  await assert.rejects(f.ledger.reserve("another"), code("nft_supply_unavailable"));
  const restarted = createPreparedNftIssuanceLedger(f.client, f.databaseName, f.catalog, f.dependencies);
  await restarted.initializeStorage();
  assert.equal((await restarted.reserve("purchase")).state, "pending");
  assert.equal((await restarted.beginSubmission(claim._id)).dispatchClaimed, false);
  assert.equal((await restarted.reconcile(claim._id)).state, "pending");
  assert.equal((await f.db.collection("nft_issuance_series_v1").findOne({ cardId: "synthetic-card-a" })).allocated, 1);
});

integration("missing verifier or publication keeps claims reserved and cannot record confirmation", async t => {
  for (const missing of ["verifier", "publication"]) {
    const catalog = baseCatalog();
    if (missing === "publication") catalog.cards.forEach(card => delete card.publication);
    const f = await fixture(t, { catalog, verify: missing === "verifier" ? undefined : async () => null });
    // An explicitly absent callback must stay absent, rather than use fixture default.
    const dependencies = missing === "verifier" ? { resolveAcquisition: f.dependencies.resolveAcquisition } : f.dependencies;
    const ledger = createPreparedNftIssuanceLedger(f.client, f.databaseName, catalog, dependencies);
    await ledger.initializeStorage();
    f.records.set("purchase", acquisition("purchase"));
    const claim = await ledger.reserve("purchase");
    await assert.rejects(ledger.beginSubmission(claim._id), code(missing === "verifier" ? "nft_chain_verifier_unavailable" : "nft_publication_unverified"));
    assert.equal((await ledger.reserve("purchase")).state, "reserved");
    if (missing === "verifier") await assert.rejects(ledger.reconcile(claim._id), code("nft_chain_verifier_unavailable"));
  }
});

integration("confirmation is independently verified and counted exactly once under concurrent reconciliation", async t => {
  const f = await fixture(t, { verify: async (claim, pub) => confirmation(claim, pub) });
  f.records.set("purchase", acquisition("purchase"));
  const claim = await f.ledger.reserve("purchase");
  await f.ledger.beginSubmission(claim._id);
  const confirmed = await Promise.all(Array.from({ length: 15 }, () => f.ledger.reconcile(claim._id)));
  assert.ok(confirmed.every(row => row.state === "confirmed"));
  assert.equal(new Set(confirmed.map(row => row.assetId)).size, 1);
  const series = await f.db.collection("nft_issuance_series_v1").findOne({ cardId: "synthetic-card-a" });
  assert.equal(series.allocated, 1);
  assert.equal(series.confirmed, 1);
  assert.equal((await f.ledger.beginSubmission(claim._id)).dispatchClaimed, false);
  assert.equal((await f.ledger.reserve("purchase")).state, "confirmed");
});

integration("mismatched chain evidence and verifier outages leave supply pending", async t => {
  let extra = {};
  let unavailable = false;
  const f = await fixture(t, { verify: async (claim, pub) => {
    if (unavailable) throw new Error("synthetic chain unavailable");
    return confirmation(claim, pub, extra);
  } });
  f.records.set("purchase", acquisition("purchase"));
  const claim = await f.ledger.reserve("purchase");
  await f.ledger.beginSubmission(claim._id);
  for (const changes of [{ network: "Pi Testnet" }, { appId: "other" }, { cardId: "synthetic-card-b" },
    { recipient: "other" }, { issuanceKey: hash("other") }, { submissionId: "other" },
    { metadataSha256: hash("other") }, { metadataUri: "https://nft-fixture.cryptoid-evolution.app/other" },
    { confirmedAt: new Date(Date.now() + 60_000) }, { transactionId: "missing-chain-proof" }]) {
    extra = changes;
    await assert.rejects(f.ledger.reconcile(claim._id), code("nft_chain_confirmation_mismatch"));
  }
  unavailable = true;
  await assert.rejects(f.ledger.reconcile(claim._id), /synthetic chain unavailable/);
  assert.equal((await f.ledger.reserve("purchase")).state, "pending");
  const series = await f.db.collection("nft_issuance_series_v1").findOne({ cardId: "synthetic-card-a" });
  assert.equal(series.allocated, 1);
  assert.equal(series.confirmed, 0);
});

integration("the same confirmed chain asset cannot satisfy two entitlements and rollback keeps the second pending", async t => {
  const f = await fixture(t, { verify: async (claim, pub) => confirmation(claim, pub, { assetId: "synthetic-shared-asset" }) });
  f.records.set("first", acquisition("first"));
  f.records.set("second", acquisition("second"));
  const first = await f.ledger.reserve("first");
  const second = await f.ledger.reserve("second");
  await f.ledger.beginSubmission(first._id);
  await f.ledger.beginSubmission(second._id);
  await f.ledger.reconcile(first._id);
  await assert.rejects(f.ledger.reconcile(second._id), error => error.code === 11000);
  assert.equal((await f.ledger.reserve("second")).state, "pending");
  const series = await f.db.collection("nft_issuance_series_v1").findOne({ cardId: "synthetic-card-a" });
  assert.equal(series.allocated, 2);
  assert.equal(series.confirmed, 1);
});

integration("reinitialization cannot rewrite supply, catalog or publication policy or reset counters", async t => {
  const f = await fixture(t);
  f.records.set("purchase", acquisition("purchase"));
  await f.ledger.reserve("purchase");
  for (const changes of [
    { cards: [{ ...f.catalog.cards[0], maxSupply: 999 }] },
    { catalogHash: hash("another catalog") },
    { cards: [{ ...f.catalog.cards[0], publication: { ...publication, metadataSha256: hash("replacement") } }] },
  ]) {
    const changed = createPreparedNftIssuanceLedger(f.client, f.databaseName, { ...f.catalog, ...changes }, f.dependencies);
    await assert.rejects(changed.initializeStorage(), code("nft_series_policy_conflict"));
    await assert.rejects(changed.reserve("purchase"), code("nft_ledger_not_initialized"));
  }
  await f.ledger.initializeStorage();
  const series = await f.db.collection("nft_issuance_series_v1").findOne({ cardId: "synthetic-card-a" });
  assert.equal(series.maxSupply, 2);
  assert.equal(series.allocated, 1);
  assert.equal(series.catalogHash, catalogHash);
});

integration("damaged series counters or claim-to-series bindings fail closed before confirmation", async t => {
  const f = await fixture(t, { verify: async (claim, pub) => confirmation(claim, pub) });
  f.records.set("purchase", acquisition("purchase"));
  const claim = await f.ledger.reserve("purchase");
  await f.ledger.beginSubmission(claim._id);
  const stocks = f.db.collection("nft_issuance_series_v1");
  const claims = f.db.collection("nft_issuance_claims_v1");
  const original = await stocks.findOne({ _id: claim.seriesId });
  for (const damage of [{ confirmed: -1 }, { confirmed: 0.5 }, { allocated: 1.5 },
    { allocated: 99 }, { maxSupply: 99 }, { publicationFingerprint: hash("wrong publication") }]) {
    await stocks.updateOne({ _id: original._id }, { $set: damage });
    await assert.rejects(f.ledger.reconcile(claim._id), code("nft_supply_state_conflict"));
    assert.equal((await claims.findOne({ _id: claim._id })).state, "pending");
    await stocks.replaceOne({ _id: original._id }, original);
  }
  const anotherSeries = await stocks.findOne({ cardId: "synthetic-card-b" });
  await claims.updateOne({ _id: claim._id }, { $set: { seriesId: anotherSeries._id } });
  await assert.rejects(f.ledger.reconcile(claim._id), code("nft_supply_state_conflict"));
  await claims.updateOne({ _id: claim._id }, { $set: { seriesId: original._id, serial: 99 } });
  await assert.rejects(f.ledger.reconcile(claim._id), code("nft_supply_state_conflict"));
  assert.equal((await stocks.findOne({ _id: original._id })).confirmed, 0);
  assert.equal((await stocks.findOne({ _id: anotherSeries._id })).confirmed, 0);
});
