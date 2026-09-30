import { Router } from "express";
import { awardBlock, awardBonusMedal, awardBossSticker, awardChain, emptyRewardProgress, reachLevel, readRewardProgress, rewardRank } from "../rewardRules";
import { isAdminMode } from "../adminAccess";
import { rewardNetwork } from "../rewardNetwork";
import "../types/session";

type RewardEvent = { runId: string; kind: "block" | "chain" | "boss" | "bonus"; level: number; stage: number; hits?: number };

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
    const run = req.session.scoreRun;
    const network = rewardNetwork(req);
    const event = req.body as RewardEvent;
    if (!uid || !run || event?.runId !== run.id || Date.now() - run.startedAt > 8 * 60 * 60 * 1000) return res.status(403).json({ error: "No active signed-in run" });
    if (!Number.isInteger(event.level) || event.level < 1 || event.level > 50 || !["block", "chain", "boss", "bonus"].includes(event.kind) ||
      (event.kind === "block" ? !Number.isInteger(event.stage) || event.stage < (event.level - 1) * 10 + 1 || event.stage > event.level * 10 - 1 : event.stage !== (event.kind === "chain" ? event.level * 10 - 1 : event.level * 10)) ||
      (event.kind === "bonus" && (!Number.isInteger(event.hits) || event.hits! < 0 || event.hits! > 12))) return res.status(400).json({ error: "Invalid reward event" });

    const key = event.kind === "block" ? `block:${event.stage}` : `${event.kind}:${event.level}`;
    try {
      const users = req.app.locals.userCollection;
      // The run-scoped event key and version keep retries and concurrent updates idempotent.
      for (let attempt = 0; attempt < 5; attempt++) {
        const user = await users.findOne({ uid }, { projection: { [`rewardsByNetwork.${network}`]: 1, [`rewardVersion.${network}`]: 1, [`rewardRunId.${network}`]: 1, [`rewardEventKeys.${network}`]: 1 } });
        if (user?.rewardRunId?.[network] !== run.id) return res.status(403).json({ error: "Run has been replaced" });
        const stored = user.rewardsByNetwork?.[network];
        const progress = stored ? readRewardProgress(JSON.stringify(stored)) : emptyRewardProgress();
        const completed: string[] = Array.isArray(user.rewardEventKeys?.[network]) ? user.rewardEventKeys[network] : [];
        if (completed.includes(key)) return res.json({ progress, awarded: false });
        const prerequisite = event.kind === "block" ? event.stage % 10 === 1 ? event.level > 1 ? `bonus:${event.level - 1}` : null : `block:${event.stage - 1}`
          : event.kind === "chain" ? `block:${event.stage}` : event.kind === "boss" ? `chain:${event.level}` : `boss:${event.level}`;
        if (prerequisite && !completed.includes(prerequisite)) return res.status(409).json({ error: "Finish the previous stage first" });
        const next = event.kind === "boss"
          ? reachLevel(awardBossSticker(progress, event.level).progress, Math.min(500, event.stage + 1))
          : event.kind === "chain" ? awardChain(progress, event.level).progress
          : event.kind === "block" ? awardBlock(progress, event.level, event.stage % 10 || 10)
          : awardBonusMedal(progress, event.level, event.hits!).progress;
        const version = user.rewardVersion?.[network] as number | undefined;
        const result = await users.updateOne({ uid, [`rewardRunId.${network}`]: run.id, [`rewardEventKeys.${network}`]: { $ne: key },
          [`rewardVersion.${network}`]: version === undefined ? { $exists: false } : version },
        { $set: { [`rewardsByNetwork.${network}`]: next, [`rewardVersion.${network}`]: (version ?? 0) + 1 }, $addToSet: { [`rewardEventKeys.${network}`]: key } });
        if (result.modifiedCount) return res.json({ network, progress: next, awarded: true, rank: rewardRank(next) });
      }
      return res.status(409).json({ error: "Reward update busy; retry" });
    } catch { return res.status(503).json({ error: "Could not save reward" }); }
  });
}
