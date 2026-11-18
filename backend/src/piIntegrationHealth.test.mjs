import test from "node:test";
import assert from "node:assert/strict";
import health from "../build/piIntegrationHealth.js";
import { createRequire } from "node:module";
import clients from "../build/services/platformAPIClient.js";
const axios = createRequire(import.meta.url)("axios");

test("integration failures expose neither provider responses nor credentials", async () => {
  const secret = "private-api-key-and-pi-token";
  const result = await health.integrationCheck("pi", "Pi", async () => {
    throw Object.assign(Error(secret), { isAxiosError: true, config: { headers: { Authorization: secret } }, response: { status: 401, data: secret } });
  });
  assert.equal(result.status, "error");
  assert.doesNotMatch(JSON.stringify(result), /private-api-key|pi-token/);
  assert.match(result.detail, /Zugriff abgewiesen/);
});

test("a readable connection retains an unknown capability instead of inventing readiness", async () => {
  const result = await health.integrationCheck("payments", "Pi-Zahlungsdienst", async () => ({ status: "unknown", detail: "Noch kein Beleg" }));
  assert.equal(result.status, "unknown");
  assert.equal(result.detail, "Noch kein Beleg");
  assert.ok(result.responseMs >= 0);
});

test("live status uses reads only and never turns an available blockchain into NFT permission", async () => {
  const previousGet = axios.get, previousApiGet = clients.default.get, previousKey = process.env.PI_API_KEY;
  process.env.PI_API_KEY = "private-server-key";
  const calls = [];
  const readOnly = target => new Proxy(target, { get(object, property) {
    if (!(property in object)) throw Error(`Unexpected operation: ${String(property)}`);
    return object[property];
  } });
  try {
    axios.get = async url => {
      calls.push(url);
      return { data: { _embedded: { records: [{ closed_at: new Date().toISOString() }] } } };
    };
    clients.default.get = async path => {
      calls.push(path);
      return { data: { uid: "owner" } };
    };
    const report = await health.inspectPiIntegration({ get: () => undefined,
      session: { currentUser: { uid: "owner", accessToken: "private-pi-token" } },
      app: { locals: {
        databaseClient: readOnly({ db: () => readOnly({ command: async command => { calls.push(command); return { ok: 1 }; } }) }),
        adminCollection: readOnly({ findOne: async () => null }),
        userCollection: {}, orderCollection: readOnly({ findOne: async () => null }),
      } },
    });
    assert.equal(report.checks.find(check => check.id === "blockchain").status, "ok");
    assert.equal(report.checks.find(check => check.id === "piPayments").status, "unknown");
    assert.equal(report.nfts.purchasable, false);
    assert.equal(report.nfts.reservationMode, false);
    assert.equal(report.nfts.ownerReleased, false);
    assert.equal(calls.length, 3);
    assert.doesNotMatch(JSON.stringify(report), /private-server-key|private-pi-token/);
  } finally {
    axios.get = previousGet; clients.default.get = previousApiGet;
    if (previousKey === undefined) delete process.env.PI_API_KEY; else process.env.PI_API_KEY = previousKey;
  }
});
