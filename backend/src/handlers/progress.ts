import { Router } from "express";
import { rewardNetwork } from "../rewardNetwork";
import { isAdminMode } from "../adminAccess";
import { emptyPlayerSave, legacyInventory, publicSave, shipColors, shipPrice, validSelection, type PlayerSave } from "../playerSave";

export async function loadPlayerSave(users: any, uid: string, network: string): Promise<PlayerSave> {
  const key = `playerByNetwork.${network}`;
  await users.updateOne({ uid, [key]: { $exists: false } }, { $set: { [key]: emptyPlayerSave() } });
  const user = await users.findOne({ uid }, { projection: { [key]: 1 } });
  if (!user?.playerByNetwork?.[network]) throw Error("Missing player account");
  return user.playerByNetwork[network];
}
export default function mountProgressEndpoints(router: Router) {
  router.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!req.session.currentUser) return res.status(401).json({ error: "not_authenticated" });
    if (isAdminMode(req)) return res.status(403).json({ error: "admin_tests_do_not_change_saves" });
    next();
  });
  router.get("/me", async (req, res) => {
    try { return res.json({ save: publicSave(await loadPlayerSave(req.app.locals.userCollection, req.session.currentUser!.uid, rewardNetwork(req))) }); }
    catch { return res.status(503).json({ error: "save_unavailable" }); }
  });
  router.post("/recover", async (req, res) => {
    try {
      const save = await loadPlayerSave(req.app.locals.userCollection, req.session.currentUser!.uid, rewardNetwork(req));
      if (typeof req.body?.runId !== "string") return res.status(400).json({ error: "invalid_run" });
      if ((save as any).lastFinishedRunId === req.body.runId) return res.json({ finished: true });
      if (save.activeRunId !== req.body.runId || save.lastStart?.runMeta?.id !== req.body.runId) return res.status(409).json({ error: "run_replaced" });
      if (Date.now() - save.lastStart.runMeta.startedAt > 8 * 60 * 60 * 1000) return res.status(409).json({ error: "run_expired" });
      req.session.scoreRun = save.lastStart.runMeta;
      return res.json({ recovered: true });
    } catch { return res.status(503).json({ error: "save_unavailable" }); }
  });
  router.post("/inventory", async (req, res) => {
    const uid = req.session.currentUser!.uid, network = rewardNetwork(req), key = `playerByNetwork.${network}`;
    const { action, version, skin, color } = req.body || {};
    if (!Number.isSafeInteger(version) || version < 0 || !["buy", "select", "import"].includes(action)) return res.status(400).json({ error: "invalid_command" });
    try {
      const users = req.app.locals.userCollection, save = await loadPlayerSave(users, uid, network);
      if (save.version !== version) return res.status(409).json({ error: "save_changed", save: publicSave(save) });
      let fields: Record<string, unknown> = {};
      if (action === "import") {
        if (save.legacyImported || save.version !== 0 || save.activeRunId) return res.status(409).json({ error: "import_already_closed" });
        const legacy = legacyInventory(req.body);
        if (!legacy || req.body.confirm !== true) return res.status(400).json({ error: "invalid_legacy_inventory" });
        fields = { ...legacy, legacyImported: true };
      } else if (action === "select") {
        if (!validSelection(save, skin, color)) return res.status(403).json({ error: "ship_not_owned" });
        fields = { skin, color };
      } else {
        const price = shipPrice(skin);
        if (price === null || !shipColors.includes(color)) return res.status(400).json({ error: "invalid_ship" });
        if (save.balance < price) return res.status(403).json({ error: "not_enough_shards" });
        fields = { balance: save.balance - price, totalShardsSpent: (save.totalShardsSpent || 0) + price, fleet: { ...save.fleet, [skin]: { ...save.fleet[skin], [color]: (save.fleet[skin]?.[color] || 0) + 1 } } };
      }
      const updated = { ...save, ...fields, version: version + 1, updatedAt: new Date().toISOString() };
      const result = await users.updateOne({ uid, [`${key}.version`]: version }, { $set: Object.fromEntries(Object.entries(fields).map(([k, v]) => [`${key}.${k}`, v]).concat([[`${key}.updatedAt`, updated.updatedAt]])), $inc: { [`${key}.version`]: 1 } });
      if (!result.modifiedCount) return res.status(409).json({ error: "save_changed" });
      return res.json({ save: publicSave(updated as PlayerSave) });
    } catch { return res.status(503).json({ error: "save_unavailable" }); }
  });
}
