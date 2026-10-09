import { verifiedBlockBadges } from "../pilotRules";
import { Router } from "express";
import { awardBlock, awardBonusMedal, awardBossSticker, awardChain, emptyRewardProgress, reachLevel, readRewardProgress, rewardRank } from "../rewardRules";
import { isAdminMode } from "../adminAccess";
import { rewardNetwork } from "../rewardNetwork";
import "../types/session";
import { missionAfter, publicSave, readSnapshot } from "../playerSave";
import { validRunScore } from "../leaderboardRules";
import { restoreScoreRun } from "../restoreScoreRun";

type RewardEvent = { runId: string; kind: "block" | "chain" | "boss" | "bonus"; level: number; stage: number; hits?: number; save?: unknown };

export default function mountRewardEndpoints(router: Router) {
  router.get("/me", async (req, res) => {
    const uid = req.session.currentUser?.uid;
    if (!uid) return res.status(401).json({ error: "Sign in first" });
    const network = rewardNetwork(req);
    try {
      const user = await req.app.locals.userCollection.findOne({ uid }, { projection: { [`rewardsByNetwork.${network}`]: 1 } });
      const stored = user?.rewardsByNetwork?.[network];
      return res.json({ network, progress: stored ? readRewardProgress(JSON.stringify(stored)) : emptyRewardProgress() });
    } catch { return res.status(503).json({ error: "Rewards unavailable" }); }
  });

  router.post("/event", async (req, res) => {
    if (isAdminMode(req)) return res.status(403).json({ error: "Admin tests do not earn rewards" });
    const uid = req.session.currentUser?.uid;
    let run;
    try { run = await restoreScoreRun(req); }
    catch { return res.status(503).json({ error: "Could not restore active run" }); }
    const network = rewardNetwork(req);
    const event = req.body as RewardEvent;
    if (!uid || !run || event?.runId !== run.id || Date.now() - run.startedAt > 8 * 60 * 60 * 1000) return res.status(403).json({ error: "No active signed-in run" });
    if (!Number.isInteger(event.level) || event.level < 1 || event.level > 50 || !["block", "chain", "boss", "bonus"].includes(event.kind) ||
      (event.kind === "block" ? !Number.isInteger(event.stage) || event.stage < (event.level - 1) * 10 + 1 || event.stage > event.level * 10 - 1 : event.stage !== (event.kind === "chain" ? event.level * 10 - 1 : event.level * 10)) ||
      (event.kind === "bonus" && (!Number.isInteger(event.hits) || event.hits! < 0 || event.hits! > 12))) return res.status(400).json({ error: "Invalid reward event" });

    const key = event.kind === "block" ? `block:${event.stage}` : `${event.kind}:${event.level}`;
    const snapshot = event.save === undefined ? null : readSnapshot(event.save);
    if (event.save !== undefined && (!snapshot || !validRunScore(snapshot.score - (run.scoreBase || 0), run.startedAt, Date.now()) || snapshot.shards < (run.shardsBase || 0) || snapshot.shards - (run.shardsBase || 0) > 100 + (Date.now() - run.startedAt) / 1000 * 100)) return res.status(400).json({ error: "invalid_save" });
    if (snapshot && run.unlockedWeaponLevels && !run.unlockedWeaponLevels.includes(snapshot.paidWeaponLevel)) return res.status(400).json({ error: "weapon_not_owned" });
    try {
      const users = req.app.locals.userCollection;
      // The run-scoped event key and version keep retries and concurrent updates idempotent.
      for (let attempt = 0; attempt < 5; attempt++) {
        const playerKey = `playerByNetwork.${network}`;
        const user = await users.findOne({ uid }, { projection: { [`rewardsByNetwork.${network}`]: 1, [`rewardVersion.${network}`]: 1, [`rewardRunId.${network}`]: 1, [`rewardEventKeys.${network}`]: 1, [playerKey]: 1, [`badgeEvidenceByNetwork.${network}`]:1 } });
        if (user?.rewardRunId?.[network] !== run.id) return res.status(403).json({ error: "Run has been replaced" });
        const stored = user.rewardsByNetwork?.[network];
        const progress = stored ? readRewardProgress(JSON.stringify(stored)) : emptyRewardProgress();
        const completed: string[] = Array.isArray(user.rewardEventKeys?.[network]) ? user.rewardEventKeys[network] : [];
        const player = user.playerByNetwork?.[network];
        if (snapshot && player?.activeRunId !== run.id) return res.status(409).json({ error: "run_replaced" });
        if (completed.includes(key)) return res.json({ progress, awarded: false, ...(player ? { save: publicSave(player) } : {}) });
        const prerequisite = event.kind === "block" ? event.stage % 10 === 1 ? event.level > 1 ? `bonus:${event.level - 1}` : null : `block:${event.stage - 1}`
          : event.kind === "chain" ? `block:${event.stage}` : event.kind === "boss" ? `chain:${event.level}` : `boss:${event.level}`;
        if (prerequisite && !completed.includes(prerequisite)) return res.status(409).json({ error: "Finish the previous stage first" });
        let next = event.kind === "boss"
          ? reachLevel(awardBossSticker(progress, event.level).progress, Math.min(500, event.stage + 1))
          : event.kind === "chain" ? awardChain(progress, event.level).progress
          : event.kind === "block" ? awardBlock(progress, event.level, event.stage % 10 || 10)
          : awardBonusMedal(progress, event.level, event.hits!).progress;
        // A saved ninth block opens the boss. Persist its chain prerequisite
        // in the same write so another device can resume immediately.
        const closesChain = !!snapshot && event.kind === "block" && event.stage % 10 === 9;
        if (closesChain) next = awardChain(next, event.level).progress;
        const version = user.rewardVersion?.[network] as number | undefined;
        const previous = player?.mission?.snapshot;
        const heartLimit = Math.max(3 + (player?.lastStart?.armorBonus || 0), previous?.hearts || 0) + (event.kind === "boss" ? 1 : 0);
        if (snapshot && snapshot.hearts > heartLimit) return res.status(400).json({ error: "invalid_lives" });
        if (snapshot && (snapshot.shards < (previous?.shards || 0) || snapshot.score < (previous?.score || 0) || snapshot.destroyed < (previous?.destroyed || 0)
          || previous?.damageCount !== undefined && (snapshot.damageCount === undefined || snapshot.damageCount < previous.damageCount)
          || previous?.comboTotal !== undefined && (snapshot.comboTotal === undefined || snapshot.comboTotal < previous.comboTotal))) return res.status(400).json({ error: "save_regressed" });
        const deltaShards = snapshot ? snapshot.shards - (player.creditedShards ?? previous?.shards ?? 0) : 0;
        const deltaDestroyed = snapshot ? snapshot.destroyed - (player.creditedDestroyed ?? previous?.destroyed ?? 0) : 0;
        if (deltaShards < 0 || deltaDestroyed < 0) return res.status(400).json({ error: "save_regressed" });
        const mission = snapshot ? missionAfter(event, snapshot) : null;
        const badgeEvidence = verifiedBlockBadges(player,event,snapshot);
        if (mission) mission.rulesVersion = run.rulesVersion ?? 1;
        const result = await users.updateOne({ uid, [`rewardRunId.${network}`]: run.id, [`rewardEventKeys.${network}`]: { $ne: key },
          [`rewardVersion.${network}`]: version === undefined ? { $exists: false } : version,
          ...(snapshot ? { [`${playerKey}.activeRunId`]: run.id, [`${playerKey}.version`]: player.version } : {}) },
        { $set: { ...(event.kind === "boss" ? { [`badgeEvidenceByNetwork.${network}.bossDefeats`]: Math.max(user.badgeEvidenceByNetwork?.[network]?.bossDefeats || 0, Object.values(progress.bossWins).reduce((sum,n)=>sum+n,0)) + 1 } : {}), ...Object.fromEntries(Object.keys(badgeEvidence).map(id=>[`badgeEvidenceByNetwork.${network}.${id}`,true])), [`rewardsByNetwork.${network}`]: next, [`rewardVersion.${network}`]: (version ?? 0) + 1,
          ...(snapshot ? { [`${playerKey}.mission`]: mission, [`${playerKey}.creditedShards`]: snapshot.shards, [`${playerKey}.creditedDestroyed`]: snapshot.destroyed, [`${playerKey}.updatedAt`]: new Date().toISOString() } : {}) },
          ...(snapshot ? { $max: { [`${playerKey}.highestSector`]: mission?.sector || event.stage }, $inc: { [`${playerKey}.balance`]: deltaShards, [`${playerKey}.totalShardsEarned`]: deltaShards, [`${playerKey}.totalDestroyed`]: deltaDestroyed, [`${playerKey}.version`]: 1 } } : {}), $addToSet: { [`rewardEventKeys.${network}`]: closesChain ? { $each: [key, `chain:${event.level}`] } : key } });
        if (result.modifiedCount) return res.json({ network, progress: next, awarded: true, rank: rewardRank(next), ...(snapshot ? { save: publicSave({ ...player, balance: player.balance + deltaShards, totalShardsEarned: (player.totalShardsEarned || 0) + deltaShards, totalDestroyed: (player.totalDestroyed || 0) + deltaDestroyed, highestSector: Math.max(player.highestSector || 1, mission?.sector || event.stage), version: player.version + 1, mission }) } : {}) });
      }
      return res.status(409).json({ error: "Reward update busy; retry" });
    } catch { return res.status(503).json({ error: "Could not save reward" }); }
  });
}
