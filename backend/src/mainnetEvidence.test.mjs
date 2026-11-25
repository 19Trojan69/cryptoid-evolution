import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const axios = require("axios");
const { MAINNET_EVIDENCE_ID, inspectCheckoutEvidence } = require("../build/mainnetEvidence.js");
const { inspectMainnetReadiness, readMainnetRelease } = require("../build/mainnetRelease.js");
const key = "simulated-mainnet-key-not-a-credential";
const wallet = "G" + "A".repeat(55);
const revision = "1".repeat(40);
const envKeys = ["CRYPTOID_APP_NETWORK", "VERCEL_PROJECT_PRODUCTION_URL", "PI_MAINNET_APP_ID", "PI_MAINNET_API_KEY",
  "PI_MAINNET_WALLET_ADDRESS", "VERCEL_GIT_COMMIT_SHA", "CRYPTOID_CODE_REVISION", "ADMIN_PI_UID", "PI_API_KEY",
  "CRYPTOID_MAINNET_READY", "CRYPTOID_MAINNET_RELEASED", "CRYPTOID_NFT_READY"];

function environment(t, overrides = {}) {
  const previous = Object.fromEntries(envKeys.map(name => [name, process.env[name]]));
  for (const name of envKeys) delete process.env[name];
  Object.assign(process.env, {
    CRYPTOID_APP_NETWORK: "mainnet", VERCEL_PROJECT_PRODUCTION_URL: "cryptoid-evolution.vercel.app",
    PI_MAINNET_APP_ID: "test-app-mainnet", PI_MAINNET_API_KEY: key, PI_MAINNET_WALLET_ADDRESS: wallet,
    VERCEL_GIT_COMMIT_SHA: revision, ADMIN_PI_UID: "verified-owner", ...overrides,
  });
  t.after(() => { for (const name of envKeys) {
    if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
  } });
}

function evidence() {
  const approval = { status: "approved", evidenceSha256: "a".repeat(64), sourceUrl: "https://develop.pi/app/test-app-mainnet" };
  return {
    schemaVersion: 1, network: "Pi Network", appId: "test-app-mainnet", walletAddress: wallet,
    codeRevision: revision, reviewedBy: "verified-owner",
    keyFingerprint: createHash("sha256").update(key).digest("hex"),
    reviewedAt: new Date(Date.now() - 600_000).toISOString(), validUntil: new Date(Date.now() + 86400_000).toISOString(),
    walletApproval: { ...approval }, appApproval: { ...approval }, checkoutPaymentId: "checkout-verification-1",
    checkoutAcceptance: { kind: "end_to_end_u2a", codeRevision: revision, paymentId: "checkout-verification-1",
      reviewedBy: "verified-owner", verifiedAt: new Date(Date.now() - 1200_000).toISOString(), evidenceSha256: "d".repeat(64) },
  };
}

function fixture(t, changes = {}) {
  const proof = changes.evidence === undefined ? evidence() : changes.evidence;
  const order = changes.order === undefined ? {
    pi_payment_id: "checkout-verification-1", user: "verified-pilot", product_id: "weapon_twin", paid: true,
    payment_network: "Pi Network", payment_amount_pi: 0.15, to_address: wallet, quantity: 1, weapon_model: 1,
    txid: "b".repeat(64), approved_at: new Date(Date.now() - 1800_000), completed_at: new Date(Date.now() - 1700_000),
  } : changes.order;
  const payment = changes.payment === undefined ? {
    identifier: "checkout-verification-1", user_uid: "verified-pilot", direction: "user_to_app", amount: 0.15,
    metadata: { productId: "weapon_twin" }, network: "Pi Network", to_address: wallet,
    status: { developer_approved: true, developer_completed: true, transaction_verified: true },
    transaction: { txid: "b".repeat(64) },
  } : changes.payment;
  const adminReads = [], orderReads = [], apiReads = [];
  t.mock.method(axios, "get", async (url, options) => {
    apiReads.push({ url, options });
    if (changes.apiError) throw changes.apiError;
    return { data: payment };
  });
  const req = { get: () => "mainnet", body: {}, app: { locals: {
    userCollection: {},
    adminCollection: { async findOne(query) {
      adminReads.push(query);
      return query._id === MAINNET_EVIDENCE_ID ? proof : { released: true, revision: 7 };
    }, updateOne() { throw new Error("Readiness must never write operator evidence or release"); } },
    orderCollection: { async findOne(query) { orderReads.push(query); return order; },
      updateOne() { throw new Error("Readiness must never credit an order"); } },
  } } };
  return { req, proof, order, payment, adminReads, orderReads, apiReads,
    async inspect() { return Object.fromEntries((await inspectCheckoutEvidence(req)).map(check => [check.id, check])); } };
}

test("missing scoped configuration fails before reading proof, orders or Pi", async t => {
  environment(t);
  const h = fixture(t);
  for (const name of ["CRYPTOID_APP_NETWORK", "PI_MAINNET_APP_ID", "PI_MAINNET_API_KEY", "PI_MAINNET_WALLET_ADDRESS", "VERCEL_GIT_COMMIT_SHA", "ADMIN_PI_UID"]) {
    const value = process.env[name];
    delete process.env[name];
    const checks = await h.inspect();
    assert.equal(checks.walletCheckout.ready, false, name);
    assert.equal(h.adminReads.length, 0, name);
    assert.equal(h.orderReads.length, 0, name);
    assert.equal(h.apiReads.length, 0, name);
    process.env[name] = value;
  }
});

test("generic API keys and browser or environment readiness flags cannot replace scoped evidence", async t => {
  environment(t, { PI_API_KEY: "generic-key", CRYPTOID_MAINNET_READY: "1", CRYPTOID_MAINNET_RELEASED: "1", CRYPTOID_NFT_READY: "1" });
  delete process.env.PI_MAINNET_API_KEY;
  const h = fixture(t);
  h.req.body = { ready: true, mainnetReleased: true, walletConnected: true, evidence: evidence() };
  h.req.app.locals.mainnetReady = true;
  const checks = await h.inspect();
  assert.equal(checks.piPayments.ready, false);
  assert.equal(checks.walletCheckout.ready, false);
  assert.equal(h.adminReads.length + h.orderReads.length + h.apiReads.length, 0);
});

test("wrong deployment or server network cannot read or attest Mainnet checkout", async t => {
  environment(t);
  const h = fixture(t);
  for (const [name, value] of [["CRYPTOID_APP_NETWORK", "testnet"], ["VERCEL_PROJECT_PRODUCTION_URL", "cryptoid-evolution-testnet.vercel.app"]]) {
    const original = process.env[name];
    process.env[name] = value;
    const checks = await h.inspect();
    assert.equal(checks.appNetwork.ready, false);
    assert.equal(checks.walletCheckout.ready, false);
    assert.equal(h.adminReads.length + h.orderReads.length + h.apiReads.length, 0);
    process.env[name] = original;
  }
});

test("valid owner-reviewed proof probes only its existing receipt without issuing payment operations", async t => {
  environment(t);
  const h = fixture(t);
  const checks = await h.inspect();
  assert.equal(Object.values(checks).every(check => check.ready), true);
  assert.equal(checks.walletCheckout.reason, "verified_existing_receipt");
  assert.deepEqual(h.adminReads, [{ _id: MAINNET_EVIDENCE_ID }]);
  assert.deepEqual(h.orderReads, [{ pi_payment_id: "checkout-verification-1", payment_network: "Pi Network", paid: true, cancelled: { $ne: true } }]);
  assert.equal(h.apiReads.length, 1);
  assert.equal(h.apiReads[0].url, "https://api.minepi.com/v2/payments/checkout-verification-1");
  assert.deepEqual(h.apiReads[0].options, { headers: { Authorization: `Key ${key}` }, timeout: 4000, maxRedirects: 0 });
});

test("missing, stale, mismatched or unreviewed portal evidence cannot reach order or Pi reads", async t => {
  environment(t);
  for (const edit of [
    () => null,
    e => ({ ...e, schemaVersion: 2 }), e => ({ ...e, network: "Pi Testnet" }), e => ({ ...e, appId: "another-app" }),
    e => ({ ...e, reviewedBy: "unverified-browser-user" }), e => ({ ...e, codeRevision: "2".repeat(40) }),
    e => ({ ...e, walletAddress: "G" + "B".repeat(55) }), e => ({ ...e, keyFingerprint: "c".repeat(64) }),
    e => ({ ...e, reviewedAt: "not-a-date" }), e => ({ ...e, reviewedAt: new Date(Date.now() + 60000).toISOString() }),
    e => ({ ...e, validUntil: new Date(Date.now() - 1000).toISOString() }),
    e => ({ ...e, validUntil: new Date(Date.now() + 91 * 86400_000).toISOString() }),
  ]) {
    const h = fixture(t, { evidence: edit(evidence()) });
    const checks = await h.inspect();
    assert.equal(checks.walletConnection.ready, false);
    assert.equal(checks.externalPiApproval.ready, false);
    assert.equal(checks.walletCheckout.ready, false);
    assert.equal(h.orderReads.length + h.apiReads.length, 0);
  }
});

test("Pi approval proof must be approved, fingerprinted and from the exact official origin", async t => {
  environment(t);
  for (const kind of ["walletApproval", "appApproval"]) for (const change of [
    { status: "unknown" }, { evidenceSha256: null }, { sourceUrl: "https://minepi.com.attacker.invalid/approval" },
    { sourceUrl: "http://develop.pi/app" }, { sourceUrl: "https://secret@develop.pi/app" },
    { sourceUrl: "https://develop.pi:8443/app" },
  ]) {
    const e = evidence(); e[kind] = { ...e[kind], ...change };
    const h = fixture(t, { evidence: e });
    const checks = await h.inspect();
    assert.equal(checks[kind === "walletApproval" ? "walletConnection" : "externalPiApproval"].ready, false);
    assert.equal(checks.walletCheckout.ready, false);
    assert.equal(h.orderReads.length + h.apiReads.length, 0);
  }
});

test("an existing receipt cannot replace exact current-revision end-to-end acceptance", async t => {
  environment(t);
  for (const change of [
    undefined, { kind: "receipt_only" }, { codeRevision: "2".repeat(40) }, { paymentId: "another-payment" },
    { reviewedBy: "another-owner" }, { evidenceSha256: undefined }, { evidenceSha256: "placeholder" },
    { verifiedAt: "not-a-time" }, { verifiedAt: new Date(Date.now() + 60000).toISOString() },
    { verifiedAt: new Date(Date.now() - 300_000).toISOString() },
  ]) {
    const e = evidence();
    e.checkoutAcceptance = change ? { ...e.checkoutAcceptance, ...change } : undefined;
    const h = fixture(t, { evidence: e });
    const checks = await h.inspect();
    assert.equal(checks.walletConnection.ready, true);
    assert.equal(checks.externalPiApproval.ready, true);
    assert.equal(checks.walletCheckout.ready, false);
    assert.equal(checks.walletCheckout.reason, "verified_mainnet_checkout_required");
    assert.equal(h.orderReads.length + h.apiReads.length, 0);
  }
  const tooEarly = fixture(t);
  tooEarly.proof.checkoutAcceptance.verifiedAt = new Date(Date.now() - 2400_000).toISOString();
  assert.equal((await tooEarly.inspect()).walletCheckout.ready, false);
  assert.equal(tooEarly.orderReads.length, 1);
  assert.equal(tooEarly.apiReads.length, 0);
});

test("unsafe checkout identifiers, unavailable orders and malformed completion proof cannot be probed", async t => {
  environment(t);
  const badId = fixture(t); badId.proof.checkoutPaymentId = "../other-payment";
  assert.equal((await badId.inspect()).walletCheckout.ready, false);
  assert.equal(badId.orderReads.length + badId.apiReads.length, 0);
  for (const edit of [
    () => null, o => ({ ...o, product_id: "unknown_product" }), o => ({ ...o, user: "" }),
    o => ({ ...o, to_address: "G" + "B".repeat(55) }), o => ({ ...o, approved_at: undefined }),
    o => ({ ...o, completed_at: undefined }), o => ({ ...o, completed_at: "invalid" }),
    o => ({ ...o, completed_at: new Date(Date.now() + 3600_000) }),
  ]) {
    const h = fixture(t); const changed = edit(h.order);
    // The stub intentionally returns only the supplied persisted order.
    h.req.app.locals.orderCollection.findOne = async query => { h.orderReads.push(query); return changed; };
    assert.equal((await h.inspect()).walletCheckout.ready, false);
    assert.equal(h.apiReads.length, 0);
  }
});

test("Pi receipt mismatches never attest checkout", async t => {
  environment(t);
  for (const edit of [
    p => ({ ...p, identifier: "other-payment" }), p => ({ ...p, user_uid: "other-account" }),
    p => ({ ...p, network: "Pi Testnet" }), p => ({ ...p, direction: "app_to_user" }),
    p => ({ ...p, to_address: "G" + "B".repeat(55) }), p => ({ ...p, amount: 0.3 }),
    p => ({ ...p, metadata: { productId: "weapon_rapid_twin" } }),
    p => ({ ...p, metadata: { ...p.metadata, weaponModel: 2, quantity: 1 } }),
    p => ({ ...p, metadata: { ...p.metadata, weaponModel: 2, quantity: 2 } }),
    p => ({ ...p, status: { ...p.status, developer_approved: false } }),
    p => ({ ...p, status: { ...p.status, developer_completed: false } }),
    p => ({ ...p, status: { ...p.status, transaction_verified: false } }),
    p => ({ ...p, status: { ...p.status, cancelled: true } }), p => ({ ...p, status: { ...p.status, user_cancelled: true } }),
    p => ({ ...p, transaction: { txid: "different" } }),
  ]) {
    const h = fixture(t); const changed = edit(h.payment);
    t.mock.method(axios, "get", async (url, options) => { h.apiReads.push({ url, options }); return { data: changed }; });
    const checks = await h.inspect();
    assert.equal(checks.walletCheckout.ready, false);
    assert.equal(checks.walletCheckout.reason, "mainnet_checkout_evidence_mismatch");
    assert.equal(h.apiReads.length, 1);
  }
});

test("Pi outage and credential failures fail closed without reflecting remote secrets", async t => {
  environment(t);
  const h = fixture(t, { apiError: new Error("Key private-token simulated upstream error") });
  const checks = await h.inspect();
  assert.equal(checks.walletCheckout.ready, false);
  assert.equal(checks.walletCheckout.reason, "mainnet_checkout_verification_unavailable");
  assert.equal(JSON.stringify(checks).includes("private-token"), false);
});

test("even complete checkout proof and stored operator release cannot bypass unsupported NFT delivery", async t => {
  environment(t);
  const h = fixture(t);
  const readiness = await inspectMainnetReadiness(h.req);
  assert.equal(readiness.checks.find(check => check.id === "walletCheckout").ready, true);
  assert.equal(readiness.checks.find(check => check.id === "nftIssuance").ready, false);
  assert.equal(readiness.checks.find(check => check.id === "nftMetadata").ready, false);
  assert.equal(readiness.ready, false);
  const release = await readMainnetRelease(h.req, readiness);
  assert.equal(release.released, true);
  assert.equal(release.enabled, false);
});
