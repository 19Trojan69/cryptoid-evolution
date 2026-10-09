import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import records from "../build/paymentRecords.js";
import handlers from "../build/handlers/admin.js";

const {
  piNetwork,
  paymentSnapshot,
  paymentRecord,
  csvRow,
  paymentRecordHeaders,
} = records;

test("server verified network and original price are preserved; legacy network is not guessed", () => {
  assert.equal(piNetwork("Pi Network"), "Pi Network");
  assert.equal(piNetwork("Pi Testnet"), "Pi Testnet");
  assert.equal(piNetwork(undefined), "Ungeklärt");
  const snapshot = paymentSnapshot(
    {
      network: "Pi Testnet",
      amount: 9.9,
      memo: "Advanced",
      created_at: "2026-09-29T05:00:00Z",
    },
    "Ship Advanced",
  );
  assert.equal(snapshot.payment_network, "Pi Testnet");
  assert.equal(snapshot.payment_amount_pi, 9.9);
  const historical = paymentRecord({
    pi_payment_id: "old",
    product_id: "ship_01_stage_2",
    paid: true,
  });
  assert.equal(historical[0], "Ungeklärt");
  assert.equal(historical[7], "");
});

test("CSV blocks formula injection and retains quoted cell data", () => {
  assert.equal(
    csvRow(['=HYPERLINK("https://example.test")', "One; Two\nThree"]),
    '"\'=HYPERLINK(""https://example.test"")";"One; Two\nThree"\r\n',
  );
  assert.equal(paymentRecordHeaders.length, paymentRecord({}).length);
});

const invoke = async (session, network, rows, status = "all") => {
  const app = express();
  app.use((req, _res, next) => {
    req.session = session;
    next();
  });
  app.locals.orderCollection = {
    find(filter) {
      const selected = rows.filter((row) => {
        const networkMatches = !filter.payment_network || (typeof filter.payment_network === "string"
          ? row.payment_network === filter.payment_network
          : !["Pi Network", "Pi Testnet"].includes(row.payment_network));
        const paidMatches = filter.paid === undefined || (typeof filter.paid === "boolean" ? row.paid === filter.paid : row.paid !== true);
        const cancelledMatches = filter.cancelled === undefined || (typeof filter.cancelled === "boolean" ? row.cancelled === filter.cancelled : row.cancelled !== true);
        return networkMatches && paidMatches && cancelledMatches;
      });
      return {
        sort() {
          return {
            async *[Symbol.asyncIterator]() {
              yield* selected;
            },
          };
        },
      };
    },
  };
  const router = express.Router();
  handlers.default(router);
  app.use("/admin", router);
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/admin/payments/export?network=${network}&status=${status}`,
    );
    const bytes = new Uint8Array(await response.arrayBuffer());
    return {
      status: response.status,
      headers: { "Cache-Control": response.headers.get("cache-control"), "Content-Type": response.headers.get("content-type"), "Content-Disposition": response.headers.get("content-disposition") },
      prefix: Array.from(bytes.slice(0, 3)),
      content: new TextDecoder().decode(bytes),
    };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
};

test("only the verified owner can download separate Mainnet and Testnet records", async () => {
  const previous = process.env.ADMIN_PI_UID;
  process.env.ADMIN_PI_UID = "owner";
  try {
    const rows = [
      {
        pi_payment_id: "m1",
        payment_network: "Pi Network",
        paid: true,
        payment_amount_pi: 10,
      },
      {
        pi_payment_id: "t1",
        payment_network: "Pi Testnet",
        paid: true,
        payment_amount_pi: 10,
      },
      { pi_payment_id: "old", paid: true },
    ];
    assert.equal((await invoke({}, "mainnet", rows)).status, 401);
    assert.equal(
      (await invoke({ currentUser: { uid: "stranger" } }, "mainnet", rows))
        .status,
      403,
    );
    const mainnet = await invoke(
      { currentUser: { uid: "owner" } },
      "mainnet",
      rows,
    );
    assert.equal(mainnet.status, 200);
    assert.match(mainnet.content, /"m1"/);
    assert.doesNotMatch(mainnet.content, /"t1"|"old"/);
    assert.equal(mainnet.headers["Cache-Control"], "no-store");
    const testnet = await invoke(
      { currentUser: { uid: "owner" } },
      "testnet",
      rows,
    );
    assert.match(testnet.content, /"t1"/);
    assert.doesNotMatch(testnet.content, /"m1"|"old"/);
    const unknown = await invoke(
      { currentUser: { uid: "owner" } },
      "unknown",
      rows,
    );
    assert.match(unknown.content, /"old"/);
    assert.doesNotMatch(unknown.content, /"m1"|"t1"/);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_PI_UID;
    else process.env.ADMIN_PI_UID = previous;
  }
});

test("CSV exports every matching record beyond the 25-row ledger page, with honest filters and UTF-8", async () => {
  const previous = process.env.ADMIN_PI_UID;
  process.env.ADMIN_PI_UID = "owner";
  try {
    const rows = Array.from({ length: 83 }, (_, index) => ({
      pi_payment_id: `payment-${index}`,
      payment_network: "Pi Network", paid: true,
      product_name: 'Gold; Äther "Elite"', payment_amount_pi: 1.5,
    }));
    rows.push(
      { pi_payment_id: "pending", payment_network: "Pi Network", paid: false },
      { pi_payment_id: "cancelled", payment_network: "Pi Network", paid: true, cancelled: true },
      { pi_payment_id: "test-payment", payment_network: "Pi Testnet", paid: true },
      { pi_payment_id: "legacy", paid: true },
    );
    const owner = { currentUser: { uid: "owner" } };
    const confirmed = await invoke(owner, "mainnet", rows, "confirmed");
    assert.equal(confirmed.status, 200);
    assert.equal((confirmed.content.match(/"payment-\d+"/g) || []).length, 83);
    assert.match(confirmed.content, /"payment-82"/);
    assert.doesNotMatch(confirmed.content, /"pending"|"cancelled"|"test-payment"|"legacy"/);
    assert.match(confirmed.content, /"Gold; Äther ""Elite"""/);
    assert.deepEqual(confirmed.prefix, [0xef, 0xbb, 0xbf]);
    assert.match(confirmed.headers["Content-Type"], /text\/csv; charset=utf-8/);
    assert.match(confirmed.headers["Content-Disposition"], /attachment;.*mainnet-confirmed\.csv/);
    const pending = await invoke(owner, "mainnet", rows, "pending");
    assert.match(pending.content, /"pending"/);
    assert.doesNotMatch(pending.content, /"payment-\d+"|"cancelled"/);
    const cancelled = await invoke(owner, "mainnet", rows, "cancelled");
    assert.match(cancelled.content, /"cancelled"/);
    assert.doesNotMatch(cancelled.content, /"payment-\d+"|"pending"/);
    const all = await invoke(owner, "all", rows);
    assert.equal(all.status, 200);
    assert.match(all.content, /"legacy"/);
    assert.match(all.content, /"test-payment"/);
    assert.equal((await invoke(owner, "mainnet", rows, "invalid")).status, 400);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_PI_UID;
    else process.env.ADMIN_PI_UID = previous;
  }
});
