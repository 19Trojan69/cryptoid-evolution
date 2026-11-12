import type { Router } from "express";
import { BOSS_STICKER_COUNT, readRewardProgress } from "./rewardRules";
import { rewardNetwork } from "./rewardNetwork";

export const BOSS_NFT_ART_COLLECTION = "boss_nft_preview_art";
const pageSize = 6;
const maxPage = Math.ceil(BOSS_STICKER_COUNT / pageSize);

type BossPreviewArt = { _id: string; story: string; webp: string };

export function mountBossNftGallery(router: Router) {
  router.get("/boss-nfts", async (req, res) => {
    // This route is mounted after the shared Pi owner check in the admin router.
    const uid = req.session.currentUser!.uid;
    const network = rewardNetwork(req);
    const edition = req.query.edition ?? "victory";
    const rawPage = req.query.page ?? "1";
    const page = typeof rawPage === "string" && /^[1-9][0-9]*$/.test(rawPage) ? Number(rawPage) : 0;
    if ((edition !== "victory" && edition !== "holo") || page < 1 || page > maxPage) {
      return res.status(400).json({ error: "invalid_gallery_filter" });
    }

    try {
      const user = await req.app.locals.userCollection.findOne(
        { uid },
        { projection: { _id: 0, [`rewardsByNetwork.${network}.bossWins`]: 1 } },
      );
      const stored = user?.rewardsByNetwork?.[network];
      const wins = readRewardProgress(JSON.stringify(stored ?? {})).bossWins;
      const bossIds = Object.keys(wins).map(Number).sort((a, b) => a - b);
      const offset = (page - 1) * pageSize;
      const selected = bossIds.slice(offset, offset + pageSize);
      if (!selected.length) return res.json({ total: bossIds.length, pageSize, cards: [] });

      const artworkIds = selected.map(id => edition + ":" + id);
      const documents: BossPreviewArt[] = await req.app.locals.bossNftPreviewCollection.find(
        { _id: { $in: artworkIds } },
        { projection: { story: 1, webp: 1 } },
      ).toArray();
      const byId = new Map(documents.map(art => [art._id, art]));
      const cards = selected.map((id, index) => {
        const art = byId.get(artworkIds[index]);
        if (typeof art?.story !== "string" || typeof art.webp !== "string" ||
            !art.webp.startsWith("UklGR") || art.webp.length > 100_000) {
          throw new Error("Gallery artwork unavailable");
        }
        return { id, story: art.story, webp: art.webp };
      });
      return res.json({ total: bossIds.length, pageSize, cards });
    } catch {
      return res.status(503).json({ error: "gallery_unavailable" });
    }
  });
}
