import { Router } from "express";
import { randomUUID } from "node:crypto";
import { armorBonusFromPaid, findOffer, hangarCatalog } from "../hangarCatalog";
import "../types/session";
import { isAdminMode } from "../adminAccess";

const offersOf = (kind: string) => hangarCatalog.filter(item => item.kind === kind).map(item => item.id);

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
      const ownedWeapons = hangarCatalog.filter(item => item.kind === "weapon" && paid.some((order: any) => order.product_id === item.id)).map(item => item.id);
      const ownedArmor = hangarCatalog.filter(item => item.kind === "armor" && paid.some((order: any) => order.product_id === item.id)).map(item => item.id);
      const ownedShipUpgrades = hangarCatalog.filter(item => item.kind === "ship_upgrade" && paid.some((order: any) => order.product_id === item.id)).map(item => item.id);
       const consumables = hangarCatalog.filter(item => item.kind === "power").map(item => ({ id: item.id, count: paid.filter((order: any) => order.product_id === item.id && !order.consumed_at).length }));
      const user = await users.findOne({ uid });
      return res.json({ ownedWeapons, ownedArmor, ownedShipUpgrades, consumables, equippedWeapon: ownedWeapons.includes(user?.loadout?.weapon) ? user.loadout.weapon : null, selectedPower: consumables.some(item => item.id === user?.loadout?.power && item.count > 0) ? user.loadout.power : null });
    } catch (error) { return res.status(503).json({ error: "Inventory unavailable" }); }
  });

  router.post("/equip", async (req, res) => {
    const uid = req.session.currentUser?.uid;
    if (!uid) return res.status(401).json({ error: "Sign in first" });
    const { weapon, power } = req.body ?? {};
    if ((weapon !== null && (typeof weapon !== "string" || findOffer(weapon)?.kind !== "weapon")) || (power !== null && (typeof power !== "string" || findOffer(power)?.kind !== "power"))) return res.status(400).json({ error: "Invalid loadout" });
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
      // An atomic pop ensures only one concurrent start uses the selected bonus.
      const user = await users.findOneAndUpdate({ uid }, { $set: { "loadout.power": null } }, { returnDocument: "before" });
      const weapon = findOffer(user?.loadout?.weapon);
      const owned = weapon?.kind === "weapon" && await orders.findOne({ user: uid, product_id: weapon.id, paid: true });
      const paidWeapons = await orders.find({ user: uid, paid: true, product_id: { $in: hangarCatalog.filter(item => item.kind === "weapon").map(item => item.id) } }).project({ product_id: 1 }).toArray();
      const paidArmor = await orders.find({ user: uid, paid: true, product_id: { $in: hangarCatalog.filter(item => item.kind === "armor").map(item => item.id) } }).project({ product_id: 1 }).toArray();
      const paidShipUpgrades = await orders.find({ user: uid, paid: true, product_id: { $in: hangarCatalog.filter(item => item.kind === "ship_upgrade").map(item => item.id) } }).project({ product_id: 1 }).toArray();
       const armorBonus = armorBonusFromPaid(paidArmor.map((order: any) => order.product_id));
       const unlockedWeaponLevels = [1, ...hangarCatalog.filter(item => item.kind === "weapon" && paidWeapons.some((order: any) => order.product_id === item.id)).map(item => item.kind === "weapon" ? item.level : 1)];
      const selected = findOffer(user?.loadout?.power);
      const consumed = selected?.kind === "power" ? await orders.findOneAndUpdate({ user: uid, product_id: selected.id, paid: true, consumed_at: { $exists: false } }, { $set: { consumed_at: new Date() } }, { returnDocument: "before" }) : null;
      const scoreRun = { id: randomUUID(), startedAt: Date.now() };
      req.session.scoreRun = scoreRun;
      return res.json({ armorBonus, weaponLevel: owned && weapon?.kind === "weapon" ? weapon.level : 1, unlockedWeaponLevels, ownedShipUpgrades: paidShipUpgrades.map((order: any) => order.product_id), powerUp: consumed && selected?.kind === "power" ? selected.powerUp : null, scoreRunId: scoreRun.id, startSector: 1, adminPreview: false });
    } catch (error) { return res.status(503).json({ error: "Could not start mission" }); }
  });
}
