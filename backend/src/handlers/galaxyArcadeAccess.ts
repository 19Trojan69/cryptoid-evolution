import type { Request, Router } from "express";
import { galaxyArcadeStationIndex, publicArcadeCatalog, publicArcadeTicket } from "../galaxyArcade";
import { galaxyProgress } from "../galaxyProgress";
import { rewardNetwork } from "../rewardNetwork";
import { readRewardProgress } from "../rewardRules";
import "../types/session";

export function verifiedArcadeUser(req: Request) {
  const token = /^Bearer\s+(\S+)$/i.exec(req.get("authorization") ?? "")?.[1];
  const user = req.session.currentUser;
  return token && user?.uid && user.accessToken === token ? user : null;
}

export async function reachedArcadeLevel(req: Request, uid: string) {
  const account = await req.app.locals.userCollection.findOne({ uid }, { projection: {
    "playerByNetwork.testnet.highestSector": 1, "rewardsByNetwork.testnet": 1,
  } });
  if (!account) return 0;
  const rewards = account.rewardsByNetwork?.testnet;
  return galaxyProgress(readRewardProgress(rewards ? JSON.stringify(rewards) : null),
    account.playerByNetwork?.testnet?.highestSector).currentLevel;
}

export default function mountGalaxyArcadeAccess(router: Router, key = process.env.CRYPTOID_GALAXY_ARCADE_KEY) {
  const isTestnetArcade = (req: Request) => req.testnetSave && rewardNetwork(req) === "testnet";

  router.get("/", async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (!isTestnetArcade(req)) return res.status(404).json({ error: "not_found" });
    const language = typeof req.query.lang === "string" ? req.query.lang : null;
    const user = verifiedArcadeUser(req);
    try {
      const level = user ? await reachedArcadeLevel(req, user.uid) : 0;
      return res.json(publicArcadeCatalog(language, user?.uid ?? null, level));
    } catch {
      return res.status(503).json({ error: "progress_unavailable" });
    }
  });

  router.post("/:level/launch", async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    const level = req.params.level;
    if (!isTestnetArcade(req) || galaxyArcadeStationIndex(level) < 0 || !key || !/^[0-9a-f]{64}$/i.test(key))
      return res.status(404).json({ error: "not_found" });
    const user = verifiedArcadeUser(req);
    if (!user) return res.status(401).json({ error: "not_authenticated" });
    try {
      if (await reachedArcadeLevel(req, user.uid) < Number(level)) return res.status(403).json({ error: "level_locked" });
      return res.json({ ticket: publicArcadeTicket(key, level) });
    } catch {
      return res.status(503).json({ error: "progress_unavailable" });
    }
  });
}
