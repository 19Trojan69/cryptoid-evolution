import assert from "node:assert/strict";
import { after, test } from "node:test";
import express from "express";
import { isAdminUid } from "../build/adminAccess.js";
import hangarHandlers from "../build/handlers/hangar.js";
import userHandlers from "../build/handlers/users.js";

const mountHangarEndpoints = hangarHandlers.default;
const mountUserEndpoints = userHandlers.default;

const previousUid = process.env.ADMIN_PI_UID;
process.env.ADMIN_PI_UID = "verified-owner-uid";
after(() => { if (previousUid === undefined) delete process.env.ADMIN_PI_UID; else process.env.ADMIN_PI_UID = previousUid; });

const route = (mount, method, path) => {
  const router = express.Router();
  mount(router);
  return router.stack.find(layer => layer.route?.path === path).route.stack.find(layer => layer.method === method).handle;
};

const invoke = async (handler, session, body = {}) => {
  let status = 200;
  let result;
  const res = {
    status(code) { status = code; return this; },
    json(value) { result = value; return this; },
  };
  await handler({ session, body, app: { locals: {} } }, res);
  return { status, result };
};

test("only the configured verified UID is allowed", () => {
  assert.equal(isAdminUid("verified-owner-uid"), true);
  assert.equal(isAdminUid("another-uid"), false);
  process.env.ADMIN_PI_UID = "";
  assert.equal(isAdminUid("verified-owner-uid"), false);
  process.env.ADMIN_PI_UID = "verified-owner-uid";
});

test("admin toggle rejects another Pi account and clears an active run", async () => {
  const toggle = route(mountUserEndpoints, "post", "/admin-mode");
  const stranger = { currentUser: { uid: "another-uid" } };
  assert.equal((await invoke(toggle, stranger, { enabled: true })).status, 403);
  const owner = { currentUser: { uid: "verified-owner-uid" }, scoreRun: { id: "old-run" } };
  assert.deepEqual((await invoke(toggle, owner, { enabled: true })).result, { canAdmin: true, adminMode: true });
  assert.equal(owner.scoreRun, null);
});

test("admin previews all inventory and starts a selected level without orders or score run", async () => {
  const session = { currentUser: { uid: "verified-owner-uid" }, adminMode: true };
  const inventory = await invoke(route(mountHangarEndpoints, "get", "/inventory"), session);
  assert.equal(inventory.result.ownedShipUpgrades.length, 40);
  const equip = await invoke(route(mountHangarEndpoints, "post", "/equip"), session, { weapon: "weapon_plasma", power: "start_emp" });
  assert.equal(equip.status, 200);
  const start = await invoke(route(mountHangarEndpoints, "post", "/start"), session, { sector: 500, shipStage: 2 });
  assert.equal(start.result.startSector, 500);
  assert.equal(start.result.shipStage, 2);
  assert.equal(start.result.weaponLevel, 5);
  assert.equal(start.result.powerUp, "emp");
  assert.equal(start.result.scoreRunId, null);
  assert.equal(session.scoreRun, null);
});

test("normal mode cannot jump to a level or claim admin inventory", async () => {
  const session = { currentUser: { uid: "verified-owner-uid" }, adminMode: false };
  const start = await invoke(route(mountHangarEndpoints, "post", "/start"), session, { sector: 2 });
  assert.equal(start.status, 403);
});
