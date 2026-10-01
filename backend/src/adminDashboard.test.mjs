import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import handlers from "../build/handlers/admin.js";
import access from "../build/adminAccess.js";
import receipt from "../build/paymentReceipt.js";
import { createRequire } from "node:module";
const axios = createRequire(import.meta.url)("axios");

async function withApp(session, locals, run) {
  const previous = process.env.ADMIN_PI_UID;
  process.env.ADMIN_PI_UID = "owner";
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.session = session;
    next();
  });
  Object.assign(app.locals, locals);
  const router = express.Router();
  handlers.default(router);
  app.use(router);
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const request = (path, body) =>
      fetch(
        `http://127.0.0.1:${server.address().port}${path}`,
        body === undefined
          ? {}
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            },
      );
    await run(request);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (previous === undefined) delete process.env.ADMIN_PI_UID;
    else process.env.ADMIN_PI_UID = previous;
  }
}

test("all dashboard routes require verified ownership, including downloads and writes", async () => {
  for (const [session, expected] of [
    [{}, 401],
    [{ currentUser: { uid: "stranger" } }, 403],
  ]) {
    await withApp(session, {}, async (request) => {
      for (const [path, body] of [
        ["/status"],
        ["/payments"],
        ["/payments/export"],
        ["/start", {}],
        ["/payments/id/refresh", {}],
        ["/payments/id/valuation", {}],
      ]) {
        const response = await request(path, body);
        assert.equal(response.status, expected, path);
        assert.equal(response.headers.get("cache-control"), "no-store");
      }
    });
  }
});

test("boss and bonus tests expose the full fleet without creating orders, rewards or score runs", async () => {
  const session = { currentUser: { uid: "owner" }, scoreRun: { id: "old" } };
  const noWrites = new Proxy(
    {},
    {
      get() {
        throw new Error("A test must not access purchases");
      },
    },
  );
  await withApp(session, { orderCollection: noWrites }, async (request) => {
    for (const phase of ["boss", "bonus"]) {
      const response = await request("/start", {
        sector: 500,
        phase,
        shipStage: 3,
        weaponLevel: 5,
        power: "start_emp",
      });
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.startPhase, phase);
      assert.equal(data.startSector, 500);
      assert.equal(data.shipStage, 3);
      assert.equal(data.weaponLevel, 5);
      assert.equal(data.powerUp, "emp");
      assert.equal(data.ownedShipUpgrades.length, 40);
      assert.equal(data.scoreRunId, null);
      assert.equal(session.scoreRun, null);
    }
    for (const body of [
      { sector: 501 },
      { sector: 10 },
      { sector: 9, phase: "boss" },
      { sector: 1, shipStage: 4 },
      { sector: 1, weaponLevel: 6 },
      { sector: 1, power: "weapon_plasma" },
    ]) {
      assert.equal((await request("/start", body)).status, 400);
    }
    assert.equal(
      (await request("/start", { sector: 499, phase: "normal" })).status,
      200,
    );
  });
});

test("EUR valuation requires a confirmed Mainnet receipt and uses its actual timestamp", async () => {
  const received = new Date("2026-09-28T10:15:00Z");
  let order = {
    pi_payment_id: "p1",
    paid: true,
    payment_network: "Pi Network",
    payment_amount_pi: 10,
    wallet_received_at: received,
  };
  let saved;
  const orders = {
    async findOne(filter) {
      return order.paid && order.payment_network === filter.payment_network
        ? order
        : null;
    },
    async updateOne(_filter, update) {
      saved = update.$set;
    },
  };
  await withApp(
    { currentUser: { uid: "owner" } },
    { orderCollection: orders },
    async (request) => {
      const body = {
        eurPerPi: 0.25,
        source: "Historical receipt",
        receiptNumber: "CE-001",
      };
      assert.equal((await request("/payments/p1/valuation", body)).status, 200);
      assert.equal(saved.valuation.eurAmount, 2.5);
      assert.equal(saved.valuation.at, received);
      order = { ...order, payment_network: "Pi Testnet" };
      assert.equal((await request("/payments/p1/valuation", body)).status, 409);
      order = {
        ...order,
        payment_network: "Pi Network",
        wallet_received_at: null,
      };
      assert.equal((await request("/payments/p1/valuation", body)).status, 409);
      assert.equal(
        (await request("/payments/p1/valuation", { ...body, eurPerPi: -1 }))
          .status,
        400,
      );
    },
  );
});

test("cookie-free admin intent restores privileges only after checking the verified owner", async () => {
  const previous = process.env.ADMIN_PI_UID;
  process.env.ADMIN_PI_UID = "owner";
  try {
    for (const [uid, expected] of [
      [undefined, 401],
      ["stranger", 403],
      ["owner", 200],
    ]) {
      const req = {
        headers: { "x-cryptoid-admin-test": "1" },
        session: uid ? { currentUser: { uid }, adminMode: false } : {},
      };
      let status = 200,
        next = false;
      await access.restoreAdminPreview(
        req,
        {
          status(code) {
            status = code;
            return this;
          },
          json() {},
        },
        () => {
          next = true;
        },
      );
      assert.equal(status, expected);
      assert.equal(next, expected === 200);
      if (expected === 200) assert.equal(req.session.adminMode, true);
    }
  } finally {
    if (previous === undefined) delete process.env.ADMIN_PI_UID;
    else process.env.ADMIN_PI_UID = previous;
  }
});

test("Mainnet and Testnet bind independent verified owner UIDs", async () => {
  const saved = { ...process.env };
  delete process.env.ADMIN_PI_UID;
  delete process.env.ADMIN_PI_TESTNET_UID;
  process.env.PI_API_KEY = "main-app";
  process.env.PI_TESTNET_API_KEY = "test-app";
  const bindings = new Map();
  const adminCollection = {
    async updateOne(filter, update) {
      if (!bindings.has(filter._id))
        bindings.set(filter._id, update.$setOnInsert);
    },
    async findOne(filter) {
      return bindings.get(filter._id);
    },
  };
  try {
    for (const network of ["mainnet", "testnet"]) {
      const req = {
        headers: { "x-cryptoid-app-network": network },
        session: { currentUser: { uid: network, username: "19Trojan69" } },
        app: { locals: { adminCollection } },
      };
      assert.equal(await access.canAdmin(req), true);
      req.session.currentUser.uid = "other";
      assert.equal(await access.canAdmin(req), false);
    }
    assert.equal(bindings.size, 2);
  } finally {
    for (const key of [
      "ADMIN_PI_UID",
      "ADMIN_PI_TESTNET_UID",
      "PI_API_KEY",
      "PI_TESTNET_API_KEY",
    ]) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});

test("receipt timestamp comes from the matching successful blockchain transaction", async () => {
  const original = axios.get;
  const txid = "a".repeat(64);
  let calls = 0;
  try {
    axios.get = async (url, options) => {
      calls++;
      assert.equal(url, `https://api.testnet.minepi.com/transactions/${txid}`);
      assert.equal(options.maxRedirects, 0);
      return {
        data: {
          hash: txid,
          successful: true,
          created_at: "2026-09-28T10:15:00Z",
        },
      };
    };
    const payment = {
      network: "Pi Testnet",
      status: { transaction_verified: true },
      transaction: { txid },
      created_at: "2026-09-28T09:00:00Z",
    };
    const result = await receipt.readPaymentReceipt(payment);
    assert.equal(
      result.wallet_received_at.toISOString(),
      "2026-09-28T10:15:00.000Z",
    );
    assert.deepEqual(
      await receipt.readPaymentReceipt({ ...payment, network: "unknown" }),
      {},
    );
    assert.deepEqual(
      await receipt.readPaymentReceipt({
        ...payment,
        transaction: { txid: "https://attacker.test" },
      }),
      {},
    );
    assert.equal(calls, 1);
    axios.get = async () => ({
      data: {
        hash: "b".repeat(64),
        successful: true,
        created_at: "2026-09-28T10:15:00Z",
      },
    });
    assert.deepEqual(await receipt.readPaymentReceipt(payment), {});
    axios.get = async () => {
      throw new Error("Unavailable");
    };
    assert.deepEqual(await receipt.readPaymentReceipt(payment), {});
  } finally {
    axios.get = original;
  }
});

test("payment refresh verifies identity, network and completion before backfilling evidence", async () => {
  const api = createRequire(import.meta.url)("../build/services/platformAPIClient.js").default;
  const original = api.get;
  let writes = 0;
  let payment = {
    identifier: "p1", user_uid: "buyer", direction: "user_to_app", amount: 10,
    network: "Pi Network", metadata: { productId: "weapon_twin" },
    status: { developer_completed: true, transaction_verified: true },
    transaction: { txid: "legacy-tx" },
  };
  const order = { pi_payment_id: "p1", user: "buyer", product_id: "weapon_twin", paid: true, txid: "legacy-tx" };
  const orders = {
    async findOne() { return order; },
    async updateOne(_filter, update) { writes++; assert.equal(update.$set.paid, undefined); },
  };
  try {
    api.get = async () => ({ data: payment });
    await withApp({ currentUser: { uid: "owner" } }, { orderCollection: orders }, async request => {
      assert.equal((await request("/payments/p1/refresh", { network: "mainnet" })).status, 200);
      assert.equal(writes, 1);
      for (const patch of [{ user_uid: "stranger" }, { network: "Pi Testnet" }, { metadata: { productId: "weapon_plasma" } }, { status: { developer_completed: false, transaction_verified: true } }]) {
        const correct = payment; payment = { ...correct, ...patch };
        assert.equal((await request("/payments/p1/refresh", { network: "mainnet" })).status, 409);
        payment = correct;
      }
      assert.equal(writes, 1);
    });
  } finally { api.get = original; }
});
