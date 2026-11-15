import { createDecipheriv } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Router } from "express";
import { arcadeRankIds } from "../galaxyArcadeStickerSchema";
import { retroNftScenes } from "../retroNftScenes";
import { rewardNetwork } from "../rewardNetwork";
import { isPremiumBossEdition, premiumBossCard, premiumBossEligibility } from "../premiumBossNft";
import { BOSS_STICKER_COUNT } from "../rewardRules";
import { shipNftCatalog } from "../shipNftEligibility";
import { BOSS_NFT_PREVIEW_ART_REVISION } from "./bossNftPreview";
import { packagedShipNftPreview } from "./shipNftPreview";

const retroArtDirectory = () => process.env.VERCEL
  ? join(process.cwd(), "backend", "retro-nft-previews")
  : join(__dirname, "../../retro-nft-previews");

export function mountAdminNftCollection(router: Router) {
  // Mounted behind the same Pi-owner check as the other admin routes.
  router.get("/nft-collection/:collection/:item/:edition", async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (!req.testnetSave || rewardNetwork(req) !== "testnet")
      return res.status(404).json({ error: "not_found" });

    const user = req.session.currentUser;
    const accessToken = /^Bearer\s+(\S+)$/i.exec(req.get("authorization") ?? "")?.[1];
    if (!accessToken || accessToken !== user?.accessToken)
      return res.status(401).json({ error: "not_authenticated" });

    const { collection, item, edition } = req.params;
    try {
      if (collection === "bosses" && isPremiumBossEdition(edition)) {
        const card = /^[1-9][0-9]?$/.test(item) && premiumBossCard(Number(item), edition);
        if (!card) return res.status(404).json({ error: "not_found" });
        const account = await req.app.locals.userCollection.findOne(
          { uid: user.uid },
          { projection: { _id: 0, [`rewardsByNetwork.testnet.bossWins.${item}`]: 1 } },
        );
        if (!account) return res.status(401).json({ error: "not_authenticated" });
        const eligibility = premiumBossEligibility(card.bossId, edition, account.rewardsByNetwork?.testnet);
        if (!card.showFullPreview) return res.json({ ...eligibility, design: "silhouette" });

        const artDirectory = process.env.VERCEL
          ? join(process.cwd(), "backend", "premium-boss-nft-previews")
          : join(__dirname, "../../premium-boss-nft-previews");
        const key = process.env.PREMIUM_NFT_ART_KEY;
        if (!key || !/^[0-9a-f]{64}$/i.test(key))
          return res.status(503).json({ error: "artwork_unavailable" });
        const packed = await readFile(join(artDirectory, `${card.id}.webp.enc`));
        const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), packed.subarray(0, 12));
        decipher.setAAD(Buffer.from(card.id));
        decipher.setAuthTag(packed.subarray(12, 28));
        const artwork = Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString("base64");
        if (!artwork.startsWith("UklGR") || artwork.length > 600_000)
          return res.status(503).json({ error: "artwork_unavailable" });
        return res.json({ ...eligibility, design: "illustration", artwork: `data:image/webp;base64,${artwork}` });
      }
      const scene = /^[1-9][0-9]{0,2}$/.test(item) ? retroNftScenes[Number(item)] : undefined;
      let webp: string | undefined;
      let story: string | undefined;

      if (collection === "bosses" && (edition === "victory" || edition === "holo")
          && /^[1-9][0-9]?$/.test(item) && Number(item) <= BOSS_STICKER_COUNT) {
        const art = await req.app.locals.bossNftPreviewCollection.findOne({
          _id: `${BOSS_NFT_PREVIEW_ART_REVISION}:${edition}:${item}`,
        }, { projection: { _id: 0, story: 1, webp: 1 } });
        webp = art?.webp;
        story = art?.story;
      } else if (collection === "ships") {
        const card = shipNftCatalog.find(card => card.shipId === item && card.edition.toLowerCase() === edition);
        if (!card) return res.status(404).json({ error: "not_found" });
        webp = await packagedShipNftPreview(card);
        story = card.story;
      } else if (collection === "retro" && scene && arcadeRankIds.some(rank => rank === edition)) {
        webp = (await readFile(join(retroArtDirectory(), `${scene.artwork}.webp`))).toString("base64");
      } else {
        return res.status(404).json({ error: "not_found" });
      }

      if (typeof webp !== "string" || !webp.startsWith("UklGR") || webp.length > 180_000)
        return res.status(503).json({ error: "artwork_unavailable" });

      return res.json({ artwork: `data:image/webp;base64,${webp}`, ...(typeof story === "string" && { story }) });
    } catch {
      return res.status(503).json({ error: "artwork_unavailable" });
    }
  });
}
