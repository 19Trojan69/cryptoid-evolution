import { Router } from "express";
import { findOffer, hangarCatalog } from "../hangarCatalog";
import "../types/session";

export default function mountHangarEndpoints(router: Router) {
  router.get("/catalog", (_req, res) => res.json({ offers: hangarCatalog }));

  router.get("/inventory", async (req, res) => {
    const uid = req.session.currentUser?.uid;
    if (!uid) return res.status(401).json({ error: "Sign in first" });
    try {
      const orders = req.app.locals.orderCollection;
      const users = req.app.locals.userCollection;
      const paid = await orders.find({ user: uid, paid: true }).project({ product_id: 1, consumed_at: 1 }).toArray();
      const ownedWeapons = hangarCatalog.filter(item => item.kind === "weapon" && paid.some((order: any) => order.product_id === item.id)).map(item => item.id);
      const consumables = hangarCatalog.filter(item => item.kind === "power").map(item => ({ id: item.id, count: paid.filter((order: any) => order.product_id === item.id && !order.consumed_at).length }));
      const user = await users.findOne({ uid });
      return res.json({ ownedWeapons, consumables, equippedWeapon: ownedWeapons.includes(user?.loadout?.weapon) ? user.loadout.weapon : null, selectedPower: consumables.some(item => item.id === user?.loadout?.power && item.count > 0) ? user.loadout.power : null });
    } catch (error) { return res.status(503).json({ error: "Inventory unavailable" }); }
  });

  router.post("/equip", async (req, res) => {
    const uid = req.session.currentUser?.uid;
    if (!uid) return res.status(401).json({ error: "Sign in first" });
    const { weapon, power } = req.body ?? {};
    if ((weapon !== null && (typeof weapon !== "string" || findOffer(weapon)?.kind !== "weapon")) || (power !== null && (typeof power !== "string" || findOffer(power)?.kind !== "power"))) return res.status(400).json({ error: "Invalid loadout" });
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
    try {
      const users = req.app.locals.userCollection;
      const orders = req.app.locals.orderCollection;
      // An atomic pop ensures only one concurrent start uses the selected bonus.
      const user = await users.findOneAndUpdate({ uid }, { $set: { "loadout.power": null } }, { returnDocument: "before" });
      const weapon = findOffer(user?.loadout?.weapon);
      const owned = weapon?.kind === "weapon" && await orders.findOne({ user: uid, product_id: weapon.id, paid: true });
      const paidWeapons = await orders.find({ user: uid, paid: true, product_id: { $in: hangarCatalog.filter(item => item.kind === "weapon").map(item => item.id) } }).project({ product_id: 1 }).toArray();
      const unlockedWeaponLevels = [1, ...hangarCatalog.filter(item => item.kind === "weapon" && paidWeapons.some((order: any) => order.product_id === item.id)).map(item => item.kind === "weapon" ? item.level : 1)];
      const selected = findOffer(user?.loadout?.power);
      const consumed = selected?.kind === "power" ? await orders.findOneAndUpdate({ user: uid, product_id: selected.id, paid: true, consumed_at: { $exists: false } }, { $set: { consumed_at: new Date() } }, { returnDocument: "before" }) : null;
      return res.json({ weaponLevel: owned && weapon?.kind === "weapon" ? weapon.level : 1, unlockedWeaponLevels, powerUp: consumed && selected?.kind === "power" ? selected.powerUp : null });
    } catch (error) { return res.status(503).json({ error: "Could not start mission" }); }
  });
}
