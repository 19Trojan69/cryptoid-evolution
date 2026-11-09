import type { Router, Request } from "express";
import { galaxyArcadeStationIndex } from "../galaxyArcade";
import { rewardNetwork } from "../rewardNetwork";
import "../types/session";

export const galaxyArcadeRatingField = "testnetGalaxyArcadeRatings";

function ratingUser(req: Request) {
  const token = /^Bearer\s+(\S+)$/i.exec(req.get("authorization") ?? "")?.[1];
  const user = req.session.currentUser;
  return token && user?.uid && user.accessToken === token ? user : null;
}

export default function mountGalaxyArcadeRatings(router: Router) {
  router.all("/:level/rating", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!req.testnetSave || rewardNetwork(req) !== "testnet" || galaxyArcadeStationIndex(req.params.level) < 0)
      return res.status(404).json({ error: "not_found" });
    if (req.method !== "GET" && req.method !== "PUT")
      return res.status(405).json({ error: "method_not_allowed" });

    const users = req.app.locals.userCollection;
    const field = `${galaxyArcadeRatingField}.${req.params.level}`;
    const user = ratingUser(req);
    try {
      if (req.method === "PUT") {
        if (!user) return res.status(401).json({ error: "not_authenticated" });
        const stars = req.body?.stars;
        if (!Number.isInteger(stars) || stars < 1 || stars > 5)
          return res.status(400).json({ error: "invalid_rating" });
        // One bounded field per station on the verified user's existing document.
        // An account deleted concurrently cannot be recreated by a rating.
        const written = await users.updateOne({ _id: user._id, uid: user.uid }, { $set: { [field]: stars } });
        if (written.matchedCount !== 1) return res.status(410).json({ error: "account_deleted" });
      }
      const [summary, own] = await Promise.all([
        users.aggregate([
          { $match: { [field]: { $in: [1, 2, 3, 4, 5] } } },
          { $group: { _id: null, count: { $sum: 1 }, average: { $avg: `$${field}` } } },
        ]).next(),
        user ? users.findOne({ _id: user._id, uid: user.uid }, { projection: { [field]: 1 } }) : null,
      ]);
      return res.json({
        count: summary?.count ?? 0,
        average: summary?.average ?? null,
        own: own?.[galaxyArcadeRatingField]?.[req.params.level] ?? null,
      });
    } catch {
      return res.status(503).json({ error: "rating_unavailable" });
    }
  });
}
