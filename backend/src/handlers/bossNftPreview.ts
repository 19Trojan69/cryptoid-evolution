import type { Request, Router } from "express";
import type { Collection } from "mongodb";
import { canAdmin } from "../adminAccess";
import { BOSS_NFT_PREVIEW_PAGE_SIZE as pageSize } from "../nftPreviewLimits";
import { rewardNetwork } from "../rewardNetwork";
import { BOSS_STICKER_COUNT, readRewardProgress } from "../rewardRules";
import "../types/session";

export const BOSS_NFT_PREVIEW_ART_REVISION = "weapon-clearance-20261112";
const interestField = "testnetBossHoloInterest";
const maxPage = Math.ceil(BOSS_STICKER_COUNT / pageSize);
const progressProjection = {
  "rewardsByNetwork.testnet.bossWins": 1,
  [interestField]: 1,
};

type PreviewAccount = {
  uid: string;
  rewardsByNetwork?: { testnet?: unknown };
  testnetBossHoloInterest?: number[];
};

function verifiedUser(req: Request) {
  const token = /^Bearer\s+(\S+)$/i.exec(req.get("authorization") ?? "")?.[1];
  const user = req.session.currentUser;
  return token && user?.uid && user.accessToken === token ? user : null;
}

const confirmedWins = (account: PreviewAccount) =>
  readRewardProgress(JSON.stringify(account.rewardsByNetwork?.testnet ?? {})).bossWins;

export default function mountBossNftPreview(router: Router) {
  router.use((req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (!req.testnetSave || rewardNetwork(req) !== "testnet")
      return res.status(404).json({ error: "not_found" });
    if (!verifiedUser(req)) return res.status(401).json({ error: "not_authenticated" });
    next();
  });

  router.get("/", async (req, res) => {
    const user = req.session.currentUser!;
    const edition = req.query.edition ?? "victory";
    const rawPage = req.query.page ?? "1";
    const page = typeof rawPage === "string" && /^[1-9][0-9]*$/.test(rawPage) ? Number(rawPage) : 0;
    if ((edition !== "victory" && edition !== "holo") || page < 1 || page > maxPage)
      return res.status(400).json({ error: "invalid_gallery_filter" });

    try {
      const users: Collection<PreviewAccount> = req.app.locals.userCollection;
      const account = await users.findOne({ _id: user._id, uid: user.uid }, { projection: progressProjection });
      if (!account) return res.status(410).json({ error: "account_deleted" });
      const wins = confirmedWins(account);
      const offset = (page - 1) * pageSize;
      const bossIds = Array.from({ length: Math.min(pageSize, BOSS_STICKER_COUNT - offset) }, (_, index) => offset + index + 1)
        .filter(id => Boolean(wins[id]));
      const canSeeCounts = edition === "holo" && await canAdmin(req);
      const interestSummary = canSeeCounts ? await users.aggregate<{ id: number; count: number }>([
        { $match: { [interestField]: { $exists: true } } },
        { $unwind: `$${interestField}` },
        { $group: { _id: `$${interestField}`, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, id: "$_id", count: 1 } },
      ]).toArray() : undefined;
      const response = { owner: user.uid, total: Object.keys(wins).length, pageSize, ...(interestSummary && { interestSummary }) };
      if (!bossIds.length) return res.json({ ...response, cards: [] });

      const artIds = bossIds.map(id => `${BOSS_NFT_PREVIEW_ART_REVISION}:${edition}:${id}`);
      const artwork: Array<{ _id: string; story: string; webp: string }> =
        await req.app.locals.bossNftPreviewCollection.find(
          { _id: { $in: artIds } },
          { projection: { story: 1, webp: 1 } },
        ).toArray();
      const artById = new Map(artwork.map(art => [art._id, art]));
      const interested: number[] = Array.isArray(account[interestField]) ? account[interestField] : [];
      const cards = bossIds.map((id, index) => {
        const art = artById.get(artIds[index]);
        if (typeof art?.story !== "string" || typeof art.webp !== "string" ||
            !art.webp.startsWith("UklGR") || art.webp.length > 100_000)
          throw new Error("Gallery artwork unavailable");
        return {
          id, story: art.story, webp: art.webp, defeated: true,
          interested: edition === "holo" && interested.includes(id),
        };
      });
      return res.json({ ...response, cards });
    } catch {
      return res.status(503).json({ error: "gallery_unavailable" });
    }
  });

  router.put("/holo/:id/interest", async (req, res) => {
    const user = req.session.currentUser!;
    const id = /^[1-9][0-9]*$/.test(req.params.id) ? Number(req.params.id) : 0;
    const { owner, interested } = req.body ?? {};
    if (id < 1 || id > BOSS_STICKER_COUNT || typeof interested !== "boolean")
      return res.status(400).json({ error: "invalid_interest" });
    if (owner !== user.uid) return res.status(403).json({ error: "account_mismatch" });

    try {
      const users: Collection<PreviewAccount> = req.app.locals.userCollection;
      const accountKey = { _id: user._id, uid: user.uid };
      const account = await users.findOne(accountKey, { projection: progressProjection });
      if (!account) return res.status(410).json({ error: "account_deleted" });
      if (!confirmedWins(account)[id]) return res.status(403).json({ error: "boss_not_defeated" });

      const result = await users.updateOne(accountKey, interested
        ? { $addToSet: { [interestField]: id } }
        : { $pull: { [interestField]: { $eq: id } } });
      if (!result.matchedCount) return res.status(410).json({ error: "account_deleted" });
      return res.json({ owner: user.uid, id, interested, changed: result.modifiedCount > 0 });
    } catch {
      return res.status(503).json({ error: "interest_unavailable" });
    }
  });
}
