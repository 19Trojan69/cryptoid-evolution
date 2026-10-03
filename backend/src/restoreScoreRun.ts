import type { Request } from "express";
import "./types/session";
import { rewardNetwork } from "./rewardNetwork";

// Pi's proxy may drop cookies between requests. Only server-stored metadata
// for this authenticated user's current run can restore a missing session.
export async function restoreScoreRun(req: Request) {
  if (req.session.scoreRun) return req.session.scoreRun;
  const uid = req.session.currentUser?.uid;
  const runId = req.body?.runId;
  if (!uid || typeof runId !== "string") return null;
  const network = rewardNetwork(req);
  const user = await req.app.locals.userCollection.findOne({ uid }, {
    projection: { [`playerByNetwork.${network}`]: 1, [`rewardRunId.${network}`]: 1 },
  });
  const player = user?.playerByNetwork?.[network];
  const run = player?.lastStart?.runMeta;
  const age = Date.now() - run?.startedAt;
  if (player?.activeRunId !== runId || user?.rewardRunId?.[network] !== runId ||
      run?.id !== runId || !Number.isFinite(age) || age < 0 || age > 8 * 60 * 60 * 1000) return null;
  req.session.scoreRun = run;
  return run;
}
