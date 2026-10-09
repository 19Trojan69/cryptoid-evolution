import { bestRunField, bestRunValue, careerField, careerValue, runLevel, scoreField, scoreValue } from "../scoreRules";
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
    const network = rewardNetwork(req), rules = req.query?.rules === "1" ? 1 : 2, field = scoreField(rules, network);
    const career = req.query?.sort === "career" || req.query?.rules === undefined, order = career ? careerField(network) : field;
    try {
      const leaders = await req.app.locals.userCollection.find({ [order]: { $gt: 0 } })
        .project({ _id: 0, username: 1, [order]: 1, [bestRunField(network)]: 1, [`bestScoreV2.${network}`]: 1, [`rewardsByNetwork.${network}.highestLevel`]: 1 })
        .sort({ [order]: -1, uid: 1 }).limit(TOP_LIMIT).toArray();
      return res.json({ network, leaders: leaders.map((entry: any, index: number) => {
        const highestStage = entry.rewardsByNetwork?.[network]?.highestLevel ?? 1;
        return { rank: index + 1, username: entry.username, score: career ? careerValue(entry, network) : scoreValue(entry, rules, network),
          runLevel: career ? bestRunValue(entry, network).level : rules === 2 && bestRunValue(entry, network).score === scoreValue(entry, rules, network) ? bestRunValue(entry, network).level : null,
          ...(career ? { careerScore: careerValue(entry, network), bestRun: bestRunValue(entry, network) } : {}),
          profileLevel: Math.ceil(highestStage / 10), serviceRank: rankForLevel(highestStage) };
      }) });
    } catch { return res.status(503).json({ error: "Leaderboard unavailable" }); }
  });

  router.get("/me", async (req, res) => {
    const uid = req.session.currentUser?.uid;
    if (!uid) return res.status(401).json({ error: "Sign in first" });
    try {
      const network = rewardNetwork(req);
      const user = await req.app.locals.userCollection.findOne({ uid }, { projection: { bestScore: 1, bestScoreV2: 1, [careerField(network)]: 1, [bestRunField(network)]: 1 } });
      return res.json({ network, bestScore: scoreValue(user, req.query?.rules === "1" ? 1 : 2, network), legacyBestScore: user?.bestScore ?? 0,
        careerScore: careerValue(user, network), bestRun: bestRunValue(user, network) });
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
      const player = userBefore.playerByNetwork?.[network];
      if (player?.activeRunId !== run.id) return res.status(409).json({ error: "Run already completed or replaced" });
      if (final && req.body.finished === true) {
        const snapshot = readSnapshot(req.body.save);
        const wonCampaign = player.mission === null && userBefore.rewardEventKeys?.[network]?.includes("bonus:50");
        if (!snapshot || snapshot.score !== req.body.score || snapshot.hearts !== 0 && !wonCampaign ||
          snapshot.score < (player.mission?.snapshot.score || 0) || snapshot.destroyed < (player.creditedDestroyed || 0) ||
          snapshot.shards < (player.creditedShards || 0) || snapshot.shards - (run.shardsBase || 0) > 100 + (Date.now() - run.startedAt) / 1000 * 100)
          return res.status(400).json({ error: "Invalid final save" });
        const level = runLevel(player, userBefore.rewardEventKeys?.[network]);
        const previousBest = bestRunValue(userBefore, network);
        const nextCareer = careerValue(userBefore, network) + snapshot.score;
        if (!Number.isSafeInteger(nextCareer)) return res.status(400).json({ error: "Career score limit reached" });
        const result = await users.updateOne({ uid, [`${key}.activeRunId`]: run.id, [`${key}.version`]: player.version }, {
          $max: { [field]: req.body.score },
          $set: { [`${key}.mission`]: null, [`${key}.activeRunId`]: null, [`${key}.lastFinishedRunId`]: run.id, [`${key}.updatedAt`]: new Date().toISOString(), [`${key}.creditedShards`]: snapshot.shards, [`${key}.creditedDestroyed`]: snapshot.destroyed,
            ...(snapshot.score > previousBest.score || snapshot.score === previousBest.score && previousBest.level === null && snapshot.score > 0 ? { [bestRunField(network)]: { score: snapshot.score, level } } : {}) },
          $inc: { [careerField(network)]: snapshot.score, [`${key}.balance`]: snapshot.shards - (player.creditedShards || 0), [`${key}.totalShardsEarned`]: snapshot.shards - (player.creditedShards || 0), [`${key}.totalDestroyed`]: snapshot.destroyed - (player.creditedDestroyed || 0), [`${key}.version`]: 1 },
        });
        if (!result.modifiedCount) return res.status(409).json({ error: "Save changed; retry" });
      } else await users.updateOne({ uid, [`rewardRunId.${network}`]: run.id, [`${key}.activeRunId`]: run.id }, { $max: { [field]: req.body.score } });
      if (final) req.session.scoreRun = null;
      const user = await req.app.locals.userCollection.findOne({ uid }, { projection: { bestScore: 1, bestScoreV2: 1, [careerField(network)]: 1, [bestRunField(network)]: 1 } });
      return res.json({ bestScore: scoreValue(user, run.rulesVersion ?? 1, network), careerScore: careerValue(user, network), bestRun: bestRunValue(user, network) });
    } catch { return res.status(503).json({ error: "Could not save score" }); }
  };
  router.post("/checkpoint", (req, res) => { void saveScore(req, res, false); });
  router.post("/score", (req, res) => { void saveScore(req, res, true); });
}
