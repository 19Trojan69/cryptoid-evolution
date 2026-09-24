import { Router, type Request, type Response } from "express";
import { TOP_LIMIT, validRunScore } from "../leaderboardRules";
import "../types/session";

export default function mountLeaderboardEndpoints(router: Router) {
  router.get("/top", async (req, res) => {
    try {
      const leaders = await req.app.locals.userCollection.find({ bestScore: { $gt: 0 } })
        .project({ _id: 0, username: 1, bestScore: 1 })
        .sort({ bestScore: -1, uid: 1 }).limit(TOP_LIMIT).toArray();
      return res.json({ leaders: leaders.map((entry: { username: string; bestScore: number }, index: number) => ({ rank: index + 1, username: entry.username, score: entry.bestScore })) });
    } catch { return res.status(503).json({ error: "Leaderboard unavailable" }); }
  });

  router.get("/me", async (req, res) => {
    const uid = req.session.currentUser?.uid;
    if (!uid) return res.status(401).json({ error: "Sign in first" });
    try {
      const user = await req.app.locals.userCollection.findOne({ uid }, { projection: { bestScore: 1 } });
      return res.json({ bestScore: user?.bestScore ?? 0 });
    } catch { return res.status(503).json({ error: "Personal record unavailable" }); }
  });

  const saveScore = async (req: Request, res: Response, final: boolean) => {
    const uid = req.session.currentUser?.uid;
    const run = req.session.scoreRun;
    if (!uid || !run || req.body?.runId !== run.id) return res.status(403).json({ error: "No active signed-in run" });
    if (!validRunScore(req.body?.score, run.startedAt, Date.now())) return res.status(400).json({ error: "Invalid score" });
    try {
      await req.app.locals.userCollection.updateOne({ uid }, { $max: { bestScore: req.body.score } });
      if (final) req.session.scoreRun = null;
      const user = await req.app.locals.userCollection.findOne({ uid }, { projection: { bestScore: 1 } });
      return res.json({ bestScore: user?.bestScore ?? req.body.score });
    } catch { return res.status(503).json({ error: "Could not save score" }); }
  };
  router.post("/checkpoint", (req, res) => { void saveScore(req, res, false); });
  router.post("/score", (req, res) => { void saveScore(req, res, true); });
}
