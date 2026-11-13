import type { Collection } from "mongodb";
import type { Router } from "express";
import { rewardNetwork } from "../rewardNetwork";
import type { PlayerSave } from "../playerSave";
import type { ShipStage } from "../shipLoadout";
import {
  confirmedMainnetShipUpgrades, shipNftCatalog, shipNftMainnetEnabled, shipNftStatus,
  SHIP_NFT_ART_REVISION, type ShipNftOrder,
} from "../shipNftEligibility";
import "../types/session";

const pageSize = 5;
type PreviewAccount = { uid: string; playerByNetwork?: { mainnet?: Pick<PlayerSave, "fleet" | "legacyImported" | "standardShipAcquisitions"> } };
type Artwork = { _id: string; webp: string };

export default function mountShipNftPreview(router: Router, enabled = shipNftMainnetEnabled) {
  router.get("/", async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (!enabled() || rewardNetwork(req) !== "mainnet") return res.status(404).json({ error: "not_found" });
    const token = /^Bearer\s+(\S+)$/i.exec(req.get("authorization") ?? "")?.[1];
    const user = req.session.currentUser;
    if (!token || !user?.uid || token !== user.accessToken) return res.status(401).json({ error: "not_authenticated" });

    const rawStage = req.query.stage ?? "1";
    const stage = typeof rawStage === "string" && /^[1-3]$/.test(rawStage) ? Number(rawStage) as ShipStage : 0;
    const rawPage = req.query.page ?? "1";
    const page = typeof rawPage === "string" && /^[1-9][0-9]*$/.test(rawPage) ? Number(rawPage) : 0;
    const cards = shipNftCatalog.filter(card => card.stage === stage);
    if (page < 1 || page > Math.ceil(cards.length / pageSize)) {
      return res.status(400).json({ error: "invalid_gallery_filter" });
    }

    try {
      const users: Collection<PreviewAccount> = req.app.locals.userCollection;
      const account = await users.findOne({ _id: user._id, uid: user.uid }, {
        projection: { "playerByNetwork.mainnet.fleet": 1, "playerByNetwork.mainnet.legacyImported": 1, "playerByNetwork.mainnet.standardShipAcquisitions": 1 },
      });
      if (!account) return res.status(410).json({ error: "account_deleted" });
      const start = (page - 1) * pageSize;
      const selected = cards.slice(start, start + pageSize);
      const ids = selected.flatMap(card => [card.productId, card.requiresProductId].filter((id): id is string => id !== null));
      const orders: Collection<ShipNftOrder> = req.app.locals.orderCollection;
      const confirmed = ids.length === 0 ? [] : confirmedMainnetShipUpgrades(user.uid, await orders.find({
        user: user.uid, product_id: { $in: ids }, paid: true, cancelled: { $ne: true },
        payment_network: "Pi Network", owner_testnet_catalog: { $ne: true },
      }, { projection: {
        user: 1, product_id: 1, paid: 1, cancelled: 1, payment_network: 1, owner_testnet_catalog: 1,
        payment_amount_pi: 1, pi_payment_id: 1, txid: 1, completed_at: 1,
      } }).toArray());
      const statuses = selected.map(card => shipNftStatus(card, account.playerByNetwork?.mainnet, confirmed));
      const artworkId = (id: string) => `${SHIP_NFT_ART_REVISION}:${id}`;
      const eligibleArt = selected.filter((_, index) => statuses[index] === "eligible").map(card => artworkId(card.id));
      const artwork: Collection<Artwork> = req.app.locals.shipNftPreviewCollection;
      const artRows = eligibleArt.length ? await artwork.find({ _id: { $in: eligibleArt } }, { projection: { webp: 1 } }).toArray() : [];
      const artById = new Map(artRows.map(art => [art._id, art.webp]));
      return res.json({ owner: user.uid, total: cards.length, pageSize, cards: selected.map((card, index) => {
        const summary = { id: card.id, name: card.name, status: statuses[index] };
        if (summary.status !== "eligible") return summary;
        const webp = artById.get(artworkId(card.id));
        if (typeof webp !== "string" || !webp.startsWith("UklGR") || webp.length > 140_000) throw new Error("Artwork unavailable");
        return { ...summary, story: card.story, webp };
      }) });
    } catch {
      return res.status(503).json({ error: "gallery_unavailable" });
    }
  });
}
