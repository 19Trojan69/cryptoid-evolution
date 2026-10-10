import { blockFlights } from "../blockFlights";
import { readCombatCheckpoint } from "../combatCheckpoint";
import { validRunScore } from "../leaderboardRules";
import { restoreScoreRun } from "../restoreScoreRun";
import { Router } from "express";
import { rewardNetwork } from "../rewardNetwork";
import { isAdminMode } from "../adminAccess";
import { emptyPlayerSave, firstMissionSnapshot, readSnapshot, legacyInventory, publicSave, shipColors, shipPrice, validSelection, standardShips, type PlayerSave } from "../playerSave";

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
  // Presentation preferences never grant inventory, cards, rewards or progress.
  // Atomic union is independent of the version used for account transactions.
  router.post("/card-reveals", async (req, res) => {
    const ids = req.body?.ids;
    const valid = new Set([...standardShips.flatMap(ship => [1, 2, 3].map(stage => `${ship}-${stage}`)), ...Array.from({ length: 50 }, (_, i) => `boss-${i + 1}`)]);
    if (!Array.isArray(ids) || ids.length > 110 || ids.some(id => typeof id !== 'string' || !valid.has(id))) return res.status(400).json({ error: 'invalid_cards' });
    try {
      const users = req.app.locals.userCollection, uid = req.session.currentUser!.uid, network = rewardNetwork(req);
      await loadPlayerSave(users, uid, network);
      if (ids.length) await users.updateOne({ uid }, { $addToSet: { [`playerByNetwork.${network}.cardReveals`]: { $each: ids } } });
      return res.json({ saved: true });
    } catch { return res.status(503).json({ error: 'save_unavailable' }); }
  });
  router.post("/checkpoint", async (req, res) => {
    try {
      const run = await restoreScoreRun(req);
      if (!run || req.body?.runId !== run.id) return res.status(403).json({ error: "no_active_run" });
      const combat = readCombatCheckpoint(req.body.combat), snapshot = readSnapshot(req.body.save);
      if (!combat || !snapshot || snapshot.hearts < 1 || !validRunScore(snapshot.score - (run.scoreBase || 0), run.startedAt, Date.now())
        || snapshot.shards < (run.shardsBase || 0) || snapshot.shards - (run.shardsBase || 0) > 100 + (Date.now() - run.startedAt) / 1000 * 100
        || (run.unlockedWeaponLevels && !run.unlockedWeaponLevels.includes(snapshot.paidWeaponLevel))) return res.status(400).json({ error: "invalid_checkpoint" });
      if (combat.encounter === "normal") {
        const plan = blockFlights(combat.stage, run.rulesVersion ?? 1), group = combat.refs.flight;
        if (!Number.isInteger(group) || !plan[group] || !Number.isInteger(combat.refs.formationIndex)
          || combat.refs.formationIndex > plan[group] || combat.state.asteroids.length > combat.refs.formationIndex
          || combat.refs.formationOffset !== plan.slice(0, group).reduce((a, b) => a + b, 0)
          || (combat.slots !== null && combat.slots.length !== plan[group])) return res.status(400).json({ error: "invalid_flight" });
      }
      const uid = req.session.currentUser!.uid, network = rewardNetwork(req), key = `playerByNetwork.${network}`, users = req.app.locals.userCollection;
      for (let attempt = 0; attempt < 5; attempt++) {
        const save = await loadPlayerSave(users, uid, network);
        if (save.activeRunId !== run.id) return res.status(409).json({ error: "run_replaced" });
        if (combat.sequence <= ((save as any).combatSequence || 0)) return res.json({ saved: true, stale: true });
        const phase = combat.encounter === "normal" ? "normal" : combat.encounter === "bonus" ? "bonus" : "boss";
        // Completed events are authoritative for the next stage. A late request
        // may not rewind a block whose rewards were already committed.
        if (combat.stage !== (save.mission?.sector || 1) || phase !== (save.mission?.phase || "normal")) return res.status(409).json({ error: "checkpoint_stage_changed" });
        const pendingPower = save.mission?.combat ? save.mission.combat.state.pendingStartPower : save.lastStart?.powerUp;
        if (combat.state.pendingStartPower !== null && combat.state.pendingStartPower !== pendingPower) return res.status(400).json({ error: "power_not_owned" });
        if (snapshot.hearts > Math.max(3 + (save.lastStart?.armorBonus || 0), save.mission?.snapshot.hearts || 0) || snapshot.score < (save.mission?.snapshot.score || 0)
          || save.mission?.snapshot.damageCount !== undefined && (snapshot.damageCount === undefined || snapshot.damageCount < save.mission.snapshot.damageCount)
          || save.mission?.snapshot.comboTotal !== undefined && (snapshot.comboTotal === undefined || snapshot.comboTotal < save.mission.snapshot.comboTotal)
          || snapshot.shards < (save.creditedShards || 0) || snapshot.destroyed < (save.creditedDestroyed || 0)) return res.status(400).json({ error: "save_regressed" });
        const deltaShards = snapshot.shards - (save.creditedShards || 0), deltaDestroyed = snapshot.destroyed - (save.creditedDestroyed || 0);
        const mission = { ...(save.mission?.damageAtStart === undefined ? (!save.mission && save.lastStart?.badgeMetrics === 1 ? {damageAtStart:0,destroyedAtStart:0} : {}) : { damageAtStart: save.mission.damageAtStart, destroyedAtStart:save.mission.destroyedAtStart }), sector: combat.stage, phase, rulesVersion: run.rulesVersion ?? 1, snapshot, combat, savedAt: new Date().toISOString() };
        const result = await users.updateOne({ uid, [`${key}.activeRunId`]: run.id, [`${key}.version`]: save.version }, {
          $set: { [`${key}.mission`]: mission, [`${key}.combatSequence`]: combat.sequence, [`${key}.creditedShards`]: snapshot.shards, [`${key}.creditedDestroyed`]: snapshot.destroyed, [`${key}.updatedAt`]: mission.savedAt },
          $inc: { [`${key}.version`]: 1, [`${key}.balance`]: deltaShards, [`${key}.totalShardsEarned`]: deltaShards, [`${key}.totalDestroyed`]: deltaDestroyed },
        });
        if (result.modifiedCount) return res.json({ saved: true });
      }
      return res.status(409).json({ error: "save_changed" });
    } catch { return res.status(503).json({ error: "save_unavailable" }); }
  });
  router.post("/leave", async (req, res) => {
    const { runId, hearts } = req.body || {};
    if (typeof runId !== "string" || !Number.isSafeInteger(hearts) || hearts < 1 || hearts > 56) return res.status(400).json({ error: "invalid_lives" });
    const uid = req.session.currentUser!.uid, network = rewardNetwork(req), key = `playerByNetwork.${network}`;
    try {
      const users = req.app.locals.userCollection;
      for (let attempt = 0; attempt < 5; attempt++) {
        const save = await loadPlayerSave(users, uid, network);
        if (save.activeRunId !== runId || save.lastStart?.runMeta?.id !== runId || Date.now() - save.lastStart.runMeta.startedAt > 8 * 60 * 60 * 1000) return res.status(409).json({ error: "run_replaced" });
        if (hearts > Math.max(3 + (save.lastStart.armorBonus || 0), save.mission?.snapshot.hearts || 0)) return res.status(400).json({ error: "invalid_lives" });
        const mission = save.mission || { sector: 1, phase: "normal" as const, snapshot: firstMissionSnapshot(hearts), savedAt: new Date().toISOString() };
        const remaining = Math.min(mission.snapshot.hearts, hearts);
        if (save.mission && remaining === mission.snapshot.hearts) return res.json({ save: publicSave(save) });
        const updated = { ...mission, ...(remaining < (save.mission?.snapshot.hearts ?? 3 + (save.lastStart.armorBonus || 0)) ? {damageAtStart:-1} : {}), snapshot: { ...mission.snapshot, hearts: remaining }, savedAt: new Date().toISOString() };
        const result = await users.updateOne({ uid, [`${key}.activeRunId`]: runId, [`${key}.version`]: save.version }, { $set: { [`${key}.mission`]: updated, [`${key}.updatedAt`]: updated.savedAt }, $inc: { [`${key}.version`]: 1 } });
        if (result.modifiedCount) return res.json({ save: publicSave({ ...save, mission: updated, version: save.version + 1, updatedAt: updated.savedAt }) });
      }
      return res.status(409).json({ error: "save_changed" });
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
        fields = { skin, color, balance: save.balance - price, totalShardsSpent: (save.totalShardsSpent || 0) + price, fleet: { ...save.fleet, [skin]: { ...save.fleet[skin], [color]: (save.fleet[skin]?.[color] || 0) + 1 } } };
      }
      const updated = { ...save, ...fields, version: version + 1, updatedAt: new Date().toISOString() };
      const result = await users.updateOne({ uid, [`${key}.version`]: version }, { $set: Object.fromEntries(Object.entries(fields).map(([k, v]) => [`${key}.${k}`, v]).concat([[`${key}.updatedAt`, updated.updatedAt]])), $inc: { [`${key}.version`]: 1 } });
      if (!result.modifiedCount) return res.status(409).json({ error: "save_changed" });
      return res.json({ save: publicSave(updated as PlayerSave) });
    } catch { return res.status(503).json({ error: "save_unavailable" }); }
  });
}
