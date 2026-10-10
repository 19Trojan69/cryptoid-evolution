import { Router } from "express";
import { randomUUID } from "node:crypto";
import { armorBonusFromPaid, findOffer, hangarCatalog } from "../hangarCatalog";
import "../types/session";
import { isAdminMode } from "../adminAccess";
import { isTestnetWeaponPurchaseEnabled } from "../paymentPolicy";
import { rewardNetwork } from "../rewardNetwork";
import { loadPlayerSave } from "./progress";
import { publicSave } from "../playerSave";
import { syncWeaponStock, WEAPON_CHARGE_MS } from "../weaponStock";

const offersOf = (kind: string) => hangarCatalog.filter(item => item.kind === kind).map(item => item.id);
const isTestnetRequest = (req: any) => String(req.headers?.["x-cryptoid-app-network"] || "").toLowerCase() === "testnet";
const weaponEnabledForRequest = (req: any, offer: typeof hangarCatalog[number]) =>
  offer.kind === "weapon" && (!isTestnetRequest(req) || isTestnetWeaponPurchaseEnabled(offer));

export default function mountHangarEndpoints(router: Router) {
  router.get("/catalog", (_req, res) => res.json({ offers: hangarCatalog }));

  router.get("/inventory", async (req, res) => {
    const uid = req.session.currentUser?.uid;
    if (!uid) return res.status(401).json({ error: "Sign in first" });
    if (isAdminMode(req)) return res.json({
      ownedWeapons: offersOf("weapon"), ownedArmor: offersOf("armor"), ownedShipUpgrades: offersOf("ship_upgrade"),
      consumables: offersOf("power").map(id => ({ id, count: 1 })),
      equippedWeapon: req.session.adminLoadout?.weapon ?? null,
      selectedPower: req.session.adminLoadout?.power ?? null,
      adminPreview: true,
    });
    try {
      const orders = req.app.locals.orderCollection;
      const users = req.app.locals.userCollection;
      const paid = await orders.find({ user: uid, paid: true }).project({ product_id: 1, consumed_at: 1 }).toArray();
      const ownedWeapons = hangarCatalog.filter(item => weaponEnabledForRequest(req, item) && paid.some((order: any) => order.product_id === item.id)).map(item => item.id);
      const ownedArmor = hangarCatalog.filter(item => item.kind === "armor" && paid.some((order: any) => order.product_id === item.id)).map(item => item.id);
      const ownedShipUpgrades = hangarCatalog.filter(item => item.kind === "ship_upgrade" && paid.some((order: any) => order.product_id === item.id)).map(item => item.id);
       const consumables = hangarCatalog.filter(item => item.kind === "power").map(item => ({ id: item.id, count: paid.filter((order: any) => order.product_id === item.id && !order.consumed_at).length }));
      const user = await users.findOne({ uid });
      const stock = await syncWeaponStock(users, orders, uid, rewardNetwork(req));
      return res.json({ weaponStock: stock.balances, ownedWeapons, ownedArmor, ownedShipUpgrades, consumables, equippedWeapon: ownedWeapons.includes(user?.loadout?.weapon) ? user.loadout.weapon : null, selectedPower: consumables.some(item => item.id === user?.loadout?.power && item.count > 0) ? user.loadout.power : null });
    } catch (error) { return res.status(503).json({ error: "Inventory unavailable" }); }
  });

  router.post('/weapon/activate', async (req, res) => {
    const uid = req.session.currentUser?.uid;
    if (!uid || isAdminMode(req)) return res.status(403).json({ error: 'account_required' });
    const { runId, level, requestId } = req.body || {};
    const offer = hangarCatalog.find(item => item.kind === 'weapon' && item.level === level);
    const network = rewardNetwork(req), key = `playerByNetwork.${network}`, stockKey = `weaponStockByNetwork.${network}`;
    if (network !== 'testnet' || !isTestnetWeaponPurchaseEnabled(offer) || typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) return res.status(400).json({ error: 'invalid_activation' });
    try {
      const users = req.app.locals.userCollection, orders = req.app.locals.orderCollection;
      await syncWeaponStock(users, orders, uid, network);
      for (let attempt = 0; attempt < 8; attempt++) {
        const user = await users.findOne({ uid }), save = user?.playerByNetwork?.[network], stock = user?.weaponStockByNetwork?.[network];
        if (!save || !stock || save.activeRunId !== runId || save.lastStart?.runMeta?.id !== runId || Date.now() - save.lastStart.runMeta.startedAt > 8 * 60 * 60 * 1000) return res.status(409).json({ error: 'run_replaced' });
        const prior = stock.activations[requestId];
        if (prior) {
          if (prior.level !== level || prior.runId !== runId) return res.status(409).json({ error: 'activation_conflict' });
          return res.json({ remainingMs: Math.max(0, save.mission?.snapshot.weaponTimers[level] || 0), weaponStock: stock.balances });
        }
        if (!save.mission?.combat) return res.status(409).json({ error: 'save_before_activation' });
        if (save.mission.snapshot.weaponTimers[level] > 0) return res.status(409).json({ error: 'weapon_already_active' });
        if (!offer || (stock.balances[offer.id] || 0) < 1) return res.status(409).json({ error: 'weapon_stock_empty' });
        const snapshot = { ...save.mission.snapshot, weaponTimers: [...save.mission.snapshot.weaponTimers], paidWeaponLevel: level, paidWeaponMs: WEAPON_CHARGE_MS, weaponSource: 'paid' };
        snapshot.weaponTimers[level] = WEAPON_CHARGE_MS;
        const unlocked = [...new Set([...(save.lastStart.runMeta.unlockedWeaponLevels || [1]), level])];
        const result = await users.updateOne({ uid, [`${key}.activeRunId`]: runId, [`${key}.version`]: save.version, [`${stockKey}.revision`]: stock.revision }, {
          $set: { [`${key}.mission.snapshot`]: snapshot, [`${key}.lastStart.runMeta.unlockedWeaponLevels`]: unlocked, [`${key}.lastStart.unlockedWeaponLevels`]: unlocked, [`${stockKey}.activations.${requestId}`]: { level, runId } },
          $inc: { [`${key}.version`]: 1, [`${stockKey}.revision`]: 1, [`${stockKey}.balances.${offer.id}`]: -1 },
        });
        if (result.modifiedCount) {
          const sessionRun = req.session.scoreRun;
          if (sessionRun && sessionRun.id === runId) sessionRun.unlockedWeaponLevels = unlocked;
          return res.json({ remainingMs: WEAPON_CHARGE_MS, weaponStock: { ...stock.balances, [offer.id]: stock.balances[offer.id] - 1 } });
        }
      }
      return res.status(409).json({ error: 'inventory_changed' });
    } catch { return res.status(503).json({ error: 'activation_unavailable' }); }
  });

  router.post("/equip", async (req, res) => {
    const uid = req.session.currentUser?.uid;
    if (!uid) return res.status(401).json({ error: "Sign in first" });
    const { weapon, power } = req.body ?? {};
    const weaponOffer = weapon === null ? null : typeof weapon === "string" ? findOffer(weapon) : undefined;
    if ((weapon !== null && (!weaponOffer || weaponOffer.kind !== "weapon" || (!isAdminMode(req) && !weaponEnabledForRequest(req, weaponOffer)))) || (power !== null && (typeof power !== "string" || findOffer(power)?.kind !== "power"))) return res.status(400).json({ error: "Invalid loadout" });
    if (isAdminMode(req)) {
      req.session.adminLoadout = { weapon, power };
      return res.json({ equippedWeapon: weapon, selectedPower: power, adminPreview: true });
    }
    try {
      const orders = req.app.locals.orderCollection;
      if (weapon && !await orders.findOne({ user: uid, product_id: weapon, paid: true })) return res.status(403).json({ error: "Weapon not owned" });
      if (power && !await orders.findOne({ user: uid, product_id: power, paid: true, consumed_at: { $exists: false } })) return res.status(403).json({ error: "Power-up not in inventory" });
      await req.app.locals.userCollection.updateOne({ uid }, { $set: { loadout: { weapon, power } } });
      return res.json({ equippedWeapon: weapon, selectedPower: power });
    } catch (error) { return res.status(503).json({ error: "Could not save loadout" }); }
  });

  router.post("/start", async (req, res) => {
    const uid = req.session.currentUser?.uid;
    if (!uid) return res.status(401).json({ error: "Sign in first" });
    const requestedSector = req.body?.sector ?? 1;
    if (!Number.isInteger(requestedSector) || requestedSector < 1 || requestedSector > 500) return res.status(400).json({ error: "Invalid level" });
    if (isAdminMode(req)) {
      const stage = req.body?.shipStage ?? 1;
      if (!Number.isInteger(stage) || stage < 1 || stage > 3) return res.status(400).json({ error: "Invalid ship stage" });
      const weapon = findOffer(req.session.adminLoadout?.weapon ?? "");
      const power = findOffer(req.session.adminLoadout?.power ?? "");
      req.session.scoreRun = null;
      return res.json({ armorBonus: 3, weaponLevel: weapon?.kind === "weapon" ? weapon.level : 1,
        unlockedWeaponLevels: [1, 2, 3, 4, 5], ownedShipUpgrades: offersOf("ship_upgrade"),
        powerUp: power?.kind === "power" ? power.powerUp : null, scoreRunId: null,
        startSector: requestedSector, shipStage: stage, adminPreview: true });
    }
    if (requestedSector !== 1) return res.status(403).json({ error: "Level selection requires admin mode" });
    try {
      const users = req.app.locals.userCollection;
      const orders = req.app.locals.orderCollection;
      const network = rewardNetwork(req), key = `playerByNetwork.${network}`;
      const save = await loadPlayerSave(users, uid, network);
      const { action, version, startKey } = req.body || {};
      if (!["new", "resume"].includes(action) || !Number.isSafeInteger(version) || typeof startKey !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(startKey)) return res.status(400).json({ error: "Choose new mission or resume" });
      // A lost response can be retried with the same key without consuming again.
      if (save.startKey === startKey && save.lastStart && save.activeRunId) {
        req.session.scoreRun = save.lastStart.runMeta;
        return res.json({ ...save.lastStart, profile: publicSave(save) });
      }
      const resume = action === "resume";
      if (resume && !save.mission) return res.status(409).json({ error: "No saved mission" });
      const mission = resume ? save.mission : null;
      const rulesVersion = resume ? mission?.rulesVersion ?? 1 : req.body.rulesVersion === 2 ? 2 : 1;
      const scoreRun = save.startKey === startKey && save.activeRunId
        ? { id: save.activeRunId, startedAt: Date.now(), scoreBase: mission?.snapshot.score || 0, shardsBase: mission?.snapshot.shards || 0 }
        : { id: randomUUID(), startedAt: Date.now(), scoreBase: mission?.snapshot.score || 0, shardsBase: mission?.snapshot.shards || 0 };
      let user;
      if (save.startKey !== startKey) {
        if (save.version !== version) return res.status(409).json({ error: "Save changed on another device" });
        const selectedPower = (await users.findOne({ uid }, { projection: { loadout: 1 } }))?.loadout?.power || null;
        const powerOrder = !resume && selectedPower ? await orders.findOne({ user: uid, product_id: selectedPower, paid: true, consumed_at: { $exists: false } }) : null;
        user = await users.findOneAndUpdate({ uid, [`${key}.version`]: version, ...(resume ? {} : { "loadout.power": selectedPower }) }, { $set: {
          [`${key}.activeRunId`]: scoreRun.id, [`${key}.startKey`]: startKey, [`${key}.lastStart`]: null, [`${key}.combatSequence`]: 0,
          [`${key}.mission`]: mission, [`${key}.legacyImported`]: true,
          [`${key}.creditedShards`]: resume ? mission?.snapshot.shards || 0 : 0,
          [`${key}.creditedDestroyed`]: resume ? mission?.snapshot.destroyed || 0 : 0,
          [`${key}.pendingPower`]: resume ? null : selectedPower,
          [`${key}.pendingPowerOrderId`]: powerOrder?._id || null,
          [`rewardRunId.${network}`]: scoreRun.id,
          ...(resume ? {} : { [`rewardEventKeys.${network}`]: [], "loadout.power": null }),
        }, $inc: { [`${key}.version`]: 1 } }, { returnDocument: "before" });
        if (!user) return res.status(409).json({ error: "Save changed on another device" });
      } else user = await users.findOne({ uid });
      const weapon = findOffer(user?.loadout?.weapon);
      const owned = weapon?.kind === "weapon" && await orders.findOne({ user: uid, product_id: weapon.id, paid: true });
      const enabledWeaponOffers = hangarCatalog.filter(item => weaponEnabledForRequest(req, item));
      const paidWeapons = await orders.find({ user: uid, paid: true, product_id: { $in: enabledWeaponOffers.map(item => item.id) } }).project({ product_id: 1 }).toArray();
      const paidArmor = await orders.find({ user: uid, paid: true, product_id: { $in: hangarCatalog.filter(item => item.kind === "armor").map(item => item.id) } }).project({ product_id: 1 }).toArray();
      const paidShipUpgrades = await orders.find({ user: uid, paid: true, product_id: { $in: hangarCatalog.filter(item => item.kind === "ship_upgrade").map(item => item.id) } }).project({ product_id: 1 }).toArray();
       const armorBonus = armorBonusFromPaid(paidArmor.map((order: any) => order.product_id));
       const unlockedWeaponLevels = [1, ...enabledWeaponOffers.filter(item => paidWeapons.some((order: any) => order.product_id === item.id)).map(item => item.kind === "weapon" ? item.level : 1)];
      const pending = await loadPlayerSave(users, uid, network);
      const selected = findOffer(pending.pendingPower);
      // Reserve one specific order in the atomic start claim. Concurrent retries
      // must never fall through to a different consumable order.
      const consumed = !resume && selected?.kind === "power" && pending.pendingPowerOrderId
        ? await orders.findOne({ user: uid, _id: pending.pendingPowerOrderId, consumed_run_id: scoreRun.id }) || await orders.findOneAndUpdate({ user: uid, _id: pending.pendingPowerOrderId, product_id: selected.id, paid: true, consumed_at: { $exists: false } }, { $set: { consumed_at: new Date(), consumed_run_id: scoreRun.id } }, { returnDocument: "before" }) || await orders.findOne({ user: uid, _id: pending.pendingPowerOrderId, consumed_run_id: scoreRun.id }) : null;
      const runMeta = { ...scoreRun, rulesVersion, unlockedWeaponLevels };
      const result = { ...(!mission ? { badgeMetrics: 1 } : {}), rulesVersion, combat: mission?.combat ?? null, armorBonus, weaponLevel: owned && weapon?.kind === "weapon" ? weapon.level : 1, unlockedWeaponLevels, ownedShipUpgrades: paidShipUpgrades.map((order: any) => order.product_id), powerUp: consumed && selected?.kind === "power" ? selected.powerUp : null, scoreRunId: scoreRun.id, startSector: mission?.sector || 1, startPhase: mission?.phase || "normal", checkpoint: mission?.snapshot || null, adminPreview: false, runMeta };
      const written = await users.updateOne({ uid, [`${key}.activeRunId`]: scoreRun.id }, { $set: { [`${key}.lastStart`]: result }, $addToSet: { [`${key}.usedShipSkins`]: pending.skin } });
      if (!written.matchedCount) return res.status(409).json({ error: "Run replaced on another device" });
      req.session.scoreRun = runMeta;
      return res.json({ ...result, profile: publicSave(await loadPlayerSave(users, uid, network)) });
    } catch (error) { return res.status(503).json({ error: "Could not start mission" }); }
  });
}

