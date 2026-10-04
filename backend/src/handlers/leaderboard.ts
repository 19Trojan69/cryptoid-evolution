import { scoreField, scoreValue } from "../scoreRules";
import { Router, type Request, type Response } from "express";
import { TOP_LIMIT, validRunScore } from "../leaderboardRules";
import "../types/session";
import { isAdminMode } from "../adminAccess";
import { rankForLevel } from "../rewardRules";
import { rewardNetwork } from "../rewardNetwork";
import { readSnapshot } from "../playerSave";
import { restoreScoreRun } from "../restoreScoreRun";

export default function mountLeaderboardEndpoints(router: Router) {
  router.get("/top", async (req, res) => {
    const network = rewardNetwork(req), rules = req.query?.rules === "2" ? 2 : 1, field = scoreField(rules, network);
    try {
      const leaders = await req.app.locals.userCollection.find({ [field]: { $gt: 0 } })
        .project({ _id: 0, username: 1, [field]: 1, [`rewardsByNetwork.${network}.highestLevel`]: 1 })
        .sort({ [field]: -1, uid: 1 }).limit(TOP_LIMIT).toArray();
      return res.json({ leaders: leaders.map((entry: { username: string; bestScore: number; rewardsByNetwork?: Record<string, { highestLevel?: number }> }, index: number) => ({ rank: index + 1, username: entry.username, score: scoreValue(entry, rules, network), serviceRank: rankForLevel(entry.rewardsByNetwork?.[network]?.highestLevel ?? 1) })) });
    } catch { return res.status(503).json({ error: "Leaderboard unavailable" }); }
  });

  router.get("/me", async (req, res) => {
    const uid = req.session.currentUser?.uid;
    if (!uid) return res.status(401).json({ error: "Sign in first" });
    try {
      const user = await req.app.locals.userCollection.findOne({ uid }, { projection: { bestScore: 1, bestScoreV2: 1 } });
      return res.json({ bestScore: scoreValue(user, req.query?.rules === "2" ? 2 : 1, rewardNetwork(req)), legacyBestScore: user?.bestScore ?? 0 });
    } catch { return res.status(503).json({ error: "Personal record unavailable" }); }
  });

  const saveScore = async (req: Request, res: Response, final: boolean) => {
    if (isAdminMode(req)) return res.status(403).json({ error: "Admin tests do not count toward records" });
    const uid = req.session.currentUser?.uid;
    let run;
    try { run = await restoreScoreRun(req); }
    catch { return res.status(503).json({ error: "Could not restore active run" }); }
    if (!uid || !run || req.body?.runId !== run.id) return res.status(403).json({ error: "No active signed-in run" });
    if (!validRunScore(req.body?.score - (run.scoreBase || 0), run.startedAt, Date.now())) return res.status(400).json({ error: "Invalid score" });
    try {
      const users = req.app.locals.userCollection, network = rewardNetwork(req), field = scoreField(run.rulesVersion ?? 1, network), key = `playerByNetwork.${network}`;
      const userBefore = await users.findOne({ uid });
      if (userBefore?.rewardRunId?.[network] !== run.id) return res.status(409).json({ error: "Run replaced on another device" });
      if (final && req.body.finished === true) {
        const snapshot = readSnapshot(req.body.save), player = userBefore.playerByNetwork?.[network];
        if (!snapshot || snapshot.score !== req.body.score || !player || snapshot.destroyed < (player.creditedDestroyed || 0) || snapshot.shards < (player.creditedShards || 0) || snapshot.shards - (run.shardsBase || 0) > 100 + (Date.now() - run.startedAt) / 1000 * 100) return res.status(400).json({ error: "Invalid final save" });
        const result = await users.updateOne({ uid, [`${key}.activeRunId`]: run.id, [`${key}.version`]: player.version }, {
          $max: { [field]: req.body.score },
          $set: { [`${key}.mission`]: null, [`${key}.activeRunId`]: null, [`${key}.lastFinishedRunId`]: run.id, [`${key}.updatedAt`]: new Date().toISOString(), [`${key}.creditedShards`]: snapshot.shards, [`${key}.creditedDestroyed`]: snapshot.destroyed },
          $inc: { [`${key}.balance`]: snapshot.shards - (player.creditedShards || 0), [`${key}.totalShardsEarned`]: snapshot.shards - (player.creditedShards || 0), [`${key}.totalDestroyed`]: snapshot.destroyed - (player.creditedDestroyed || 0), [`${key}.version`]: 1 },
        });
        if (!result.modifiedCount) return res.status(409).json({ error: "Save changed; retry" });
      } else await users.updateOne({ uid, [`rewardRunId.${network}`]: run.id }, { $max: { [field]: req.body.score } });
      if (final) req.session.scoreRun = null;
      const user = await req.app.locals.userCollection.findOne({ uid }, { projection: { bestScore: 1, bestScoreV2: 1 } });
      return res.json({ bestScore: scoreValue(user, run.rulesVersion ?? 1, network) });
    } catch { return res.status(503).json({ error: "Could not save score" }); }
  };
  router.post("/checkpoint", (req, res) => { void saveScore(req, res, false); });
  router.post("/score", (req, res) => { void saveScore(req, res, true); });
}
