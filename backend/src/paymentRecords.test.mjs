import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import records from "../build/paymentRecords.js";
import handlers from "../build/handlers/payments.js";

const { piNetwork, paymentSnapshot, paymentRecord, csvRow, paymentRecordHeaders } = records;

test("server verified network and original price are preserved; legacy network is not guessed", () => {
  assert.equal(piNetwork("Pi Network"), "Pi Network");
  assert.equal(piNetwork("Pi Testnet"), "Pi Testnet");
  assert.equal(piNetwork(undefined), "Ungeklärt");
  const snapshot = paymentSnapshot({ network: "Pi Testnet", amount: 9.9, memo: "Advanced", created_at: "2026-09-29T05:00:00Z" }, "Ship Advanced");
  assert.equal(snapshot.payment_network, "Pi Testnet");
  assert.equal(snapshot.payment_amount_pi, 9.9);
  const historical = paymentRecord({ pi_payment_id: "old", product_id: "ship_01_stage_2", paid: true });
  assert.equal(historical[0], "Ungeklärt");
  assert.equal(historical[7], "");
});

test("CSV blocks formula injection and retains quoted cell data", () => {
  assert.equal(csvRow(["=HYPERLINK(\"https://example.test\")", "One; Two\nThree"]),
    '"\'=HYPERLINK(""https://example.test"")";"One; Two\nThree"\r\n');
  assert.equal(paymentRecordHeaders.length, paymentRecord({}).length);
});

const exportHandler = () => {
  const router = express.Router();
  handlers.default(router);
  return router.stack.find(layer => layer.route?.path === "/admin/export").route.stack[0].handle;
};

const invoke = async (session, network, rows) => {
  let status = 200;
  const output = [];
  const headers = {};
  const res = {
    status(code) { status = code; return this; },
    json(value) { output.push(value); return this; },
    setHeader(key, value) { headers[key] = value; },
    write(value) { output.push(value); },
    end() {},
  };
  const orderCollection = { find() { return { sort() { return { async *[Symbol.asyncIterator]() { yield* rows; } }; } }; } };
  await exportHandler()({ session, query: { network }, app: { locals: { orderCollection } } }, res);
  return { status, headers, content: output.join("") };
};

test("only the verified owner can download separate Mainnet and Testnet records", async () => {
  const previous = process.env.ADMIN_PI_UID;
  process.env.ADMIN_PI_UID = "owner";
  try {
    const rows = [
      { pi_payment_id: "m1", payment_network: "Pi Network", paid: true, payment_amount_pi: 10 },
      { pi_payment_id: "t1", payment_network: "Pi Testnet", paid: true, payment_amount_pi: 10 },
      { pi_payment_id: "old", paid: true },
    ];
    assert.equal((await invoke({}, "mainnet", rows)).status, 401);
    assert.equal((await invoke({ currentUser: { uid: "stranger" } }, "mainnet", rows)).status, 403);
    const mainnet = await invoke({ currentUser: { uid: "owner" } }, "mainnet", rows);
    assert.equal(mainnet.status, 200);
    assert.match(mainnet.content, /"m1"/);
    assert.doesNotMatch(mainnet.content, /"t1"|"old"/);
    assert.equal(mainnet.headers["Cache-Control"], "no-store");
    const testnet = await invoke({ currentUser: { uid: "owner" } }, "testnet", rows);
    assert.match(testnet.content, /"t1"/);
    assert.doesNotMatch(testnet.content, /"m1"|"old"/);
    const unknown = await invoke({ currentUser: { uid: "owner" } }, "unknown", rows);
    assert.match(unknown.content, /"old"/);
    assert.doesNotMatch(unknown.content, /"m1"|"t1"/);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_PI_UID;
    else process.env.ADMIN_PI_UID = previous;
  }
});
