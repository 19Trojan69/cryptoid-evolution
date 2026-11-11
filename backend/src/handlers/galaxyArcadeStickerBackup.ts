import type { Router } from "express";
import type { Collection, Document } from "mongodb";
import { galaxyArcadeStationCount, galaxyArcadeStationIndex } from "../galaxyArcade";
import { arcadeRankIds, arcadeStickerSlot, type ArcadeStickerBackup } from "../galaxyArcadeStickerSchema";
import { shipColors, standardShips } from "../playerSave";
import { rewardNetwork } from "../rewardNetwork";
import { reachedArcadeLevel, verifiedArcadeUser } from "./galaxyArcadeAccess";

const backupField = "testnetRetroStickerBackup";
const maxStickerCount = galaxyArcadeStationCount * arcadeRankIds.length;

function readSticker(raw: unknown): ArcadeStickerBackup | null {
  if (!raw || typeof raw !== "object") return null;
  const { level, rank, modelId, stage, colorId } = raw as Partial<ArcadeStickerBackup>;
  if (typeof level !== "number" || galaxyArcadeStationIndex(String(level)) < 0
    || typeof rank !== "number" || !Number.isInteger(rank) || rank < 1 || rank > arcadeRankIds.length
    || typeof modelId !== "string" || !standardShips.includes(modelId)
    || (stage !== 1 && stage !== 2 && stage !== 3)
    || typeof colorId !== "string" || !shipColors.includes(colorId)) return null;
  return { level, rank, modelId, stage, colorId };
}

export default function mountGalaxyArcadeStickerBackup(router: Router) {
  router.all("/stickers", async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (!req.testnetSave || rewardNetwork(req) !== "testnet") return res.status(404).json({ error: "not_found" });
    if (req.method !== "GET" && req.method !== "PUT") return res.status(405).json({ error: "method_not_allowed" });
    const user = verifiedArcadeUser(req);
    if (!user) return res.status(401).json({ error: "not_authenticated" });

    const users: Collection = req.app.locals.userCollection;
    const query = { _id: user._id, uid: user.uid };
    const projection = { [backupField]: 1 };
    try {
      let account: Document | null;
      if (req.method === "PUT") {
        if (req.body?.owner !== user.uid) return res.status(403).json({ error: "account_mismatch" });
        const input: unknown = req.body.stickers;
        if (!Array.isArray(input) || input.length === 0 || input.length > maxStickerCount)
          return res.status(400).json({ error: "invalid_stickers" });

        const stickers = new Map<string, ArcadeStickerBackup>();
        for (const entry of input) {
          const sticker = readSticker(entry);
          if (!sticker || stickers.has(arcadeStickerSlot(sticker)))
            return res.status(400).json({ error: "invalid_stickers" });
          stickers.set(arcadeStickerSlot(sticker), sticker);
        }
        const reached = await reachedArcadeLevel(req, user.uid);
        if ([...stickers.values()].some(sticker => sticker.level > reached))
          return res.status(403).json({ error: "level_locked" });

        // Preserve the first saved ship for each earned slot, including concurrent uploads.
        const fields = Object.fromEntries([...stickers].map(([slot, sticker]) => {
          const path = `${backupField}.${slot}`;
          return [path, { $ifNull: [`$${path}`, { $literal: sticker }] }];
        }));
        account = await users.findOneAndUpdate(query, [{ $set: fields }], { projection, returnDocument: "after" });
      } else {
        account = await users.findOne(query, { projection });
      }
      if (!account) return res.status(410).json({ error: "account_deleted" });
      const stickers = Object.values(account[backupField] ?? {}).map(readSticker).filter(sticker => sticker !== null);
      return res.json({ owner: user.uid, stickers });
    } catch {
      return res.status(503).json({ error: "stickers_unavailable" });
    }
  });
}
