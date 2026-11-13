import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Collection } from "mongodb";
import type { Request, Router } from "express";
import { rewardNetwork } from "../rewardNetwork";
import { emptyPlayerSave, type PlayerSave } from "../playerSave";
import { ownedShipStage, type ShipStage } from "../shipLoadout";
import { SHIP_NFT_PREVIEW_PAGE_SIZE as pageSize } from "../nftPreviewLimits";
import { readRewardProgress } from "../rewardRules";
import {
  confirmedMainnetShipUpgrades, ownsShipNftHull, shipNftCatalog, shipNftMainnetEnabled, shipNftStatus,
  SHIP_NFT_ART_REVISION, type ShipNftOrder,
} from "../shipNftEligibility";
import "../types/session";

type PreviewAccount = { uid: string; rewardsByNetwork?: { testnet?: unknown }; playerByNetwork?: {
  mainnet?: Pick<PlayerSave, "fleet" | "legacyImported" | "standardShipAcquisitions">;
  testnet?: Pick<PlayerSave, "fleet">;
} };
type Artwork = { _id: string; webp: string };
type CatalogCard = typeof shipNftCatalog[number];

function verifiedUser(req: Request) {
  const token = /^Bearer\s+(\S+)$/i.exec(req.get("authorization") ?? "")?.[1];
  const user = req.session.currentUser;
  return token && user?.uid && token === user.accessToken ? user : null;
}

function galleryPage(query: Request["query"]) {
  const rawStage = query.stage ?? "1";
  const stage = typeof rawStage === "string" && /^[1-3]$/.test(rawStage) ? Number(rawStage) as ShipStage : 0;
  const rawPage = query.page ?? "1";
  const page = typeof rawPage === "string" && /^[1-9][0-9]*$/.test(rawPage) ? Number(rawPage) : 0;
  const cards = shipNftCatalog.filter(card => card.stage === stage);
  if (page < 1 || page > Math.ceil(cards.length / pageSize)) return null;
  const start = (page - 1) * pageSize;
  return { cards: cards.slice(start, start + pageSize), total: cards.length };
}

export default function mountShipNftPreview(router: Router, enabled = shipNftMainnetEnabled) {
  router.get("/", async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (!enabled() || rewardNetwork(req) !== "mainnet") return res.status(404).json({ error: "not_found" });
    const user = verifiedUser(req);
    if (!user) return res.status(401).json({ error: "not_authenticated" });

    const selection = galleryPage(req.query);
    if (!selection) return res.status(400).json({ error: "invalid_gallery_filter" });
    const { cards: selected, total } = selection;

    try {
      const users: Collection<PreviewAccount> = req.app.locals.userCollection;
      const account = await users.findOne({ _id: user._id, uid: user.uid }, {
        projection: { "playerByNetwork.mainnet.fleet": 1, "playerByNetwork.mainnet.legacyImported": 1, "playerByNetwork.mainnet.standardShipAcquisitions": 1 },
      });
      if (!account) return res.status(410).json({ error: "account_deleted" });
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
      return res.json({ owner: user.uid, total, pageSize, cards: selected.map((card, index) => {
        const summary = { id: card.id, name: card.name, maxSupply: card.maxSupply, status: statuses[index] };
        if (summary.status !== "eligible") return summary;
        const webp = artById.get(artworkId(card.id));
        if (typeof webp !== "string" || !webp.startsWith("UklGR") || webp.length > 140_000) throw new Error("Artwork unavailable");
        return { ...summary, story: card.story, livery: card.livery, webp };
      }) });
    } catch {
      return res.status(503).json({ error: "gallery_unavailable" });
    }
  });
}

async function packagedPreview(card: CatalogCard) {
  const base = process.env.VERCEL
    ? join(process.cwd(), "backend", "ship-nft-previews")
    : join(__dirname, "../../ship-nft-previews");
  const image = await readFile(join(base, SHIP_NFT_ART_REVISION, card.edition.toLowerCase(), `${card.shipId}.webp`));
  return image.toString("base64");
}

async function unlockedTestnetShips(cards: readonly CatalogCard[], save: Pick<PlayerSave, "fleet">,
  orders: Collection<ShipNftOrder>, uid: string) {
  const owned = cards.filter(card => ownsShipNftHull(card.shipId, save));
  const products = [...new Set(owned.flatMap(card => [card.productId, card.requiresProductId]
    .filter((id): id is string => id !== null)))];
  const upgrades = products.length ? (await orders.find({
    user: uid, product_id: { $in: products }, paid: true,
    cancelled: { $ne: true }, payment_network: "Pi Testnet",
  }, { projection: { product_id: 1 } }).toArray()).map(order => order.product_id) : [];
  return owned.filter(card => ownedShipStage(card.sprite, upgrades) >= card.stage);
}

export function mountTestnetShipNftPreview(router: Router, readArtwork = packagedPreview) {
  router.get(["/", "/progress"], async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (!req.testnetSave || rewardNetwork(req) !== "testnet") return res.status(404).json({ error: "not_found" });
    const user = verifiedUser(req);
    if (!user) return res.status(401).json({ error: "not_authenticated" });
    const progress = req.path === "/progress" || req.path === "/progress/";
    const selection = progress ? { cards: shipNftCatalog, total: shipNftCatalog.length } : galleryPage(req.query);
    if (!selection) return res.status(400).json({ error: "invalid_gallery_filter" });

    try {
      const users: Collection<PreviewAccount> = req.app.locals.userCollection;
      const account = await users.findOne({ _id: user._id, uid: user.uid }, {
        projection: { "playerByNetwork.testnet.fleet": 1, ...(progress && { "rewardsByNetwork.testnet.bossWins": 1 }) },
      });
      if (!account) return res.status(410).json({ error: "account_deleted" });
      const save = account.playerByNetwork?.testnet ?? emptyPlayerSave();
      const orders: Collection<ShipNftOrder> = req.app.locals.orderCollection;
      const unlocked = await unlockedTestnetShips(selection.cards, save, orders, user.uid);
      if (progress) {
        const wins = readRewardProgress(JSON.stringify(account.rewardsByNetwork?.testnet ?? {})).bossWins;
        return res.json({ owner: user.uid, boss: Object.keys(wins).length,
          ships: [1, 2, 3].map(stage => unlocked.filter(card => card.stage === stage).length) });
      }
      const cards = await Promise.all(unlocked.map(async card => ({
        id: card.id, name: card.name, maxSupply: card.maxSupply, status: "eligible" as const,
        story: card.story, livery: card.livery, webp: await readArtwork(card),
      })));
      return res.json({ owner: user.uid, total: selection.total, pageSize, cards });
    } catch {
      return res.status(503).json({ error: "gallery_unavailable" });
    }
  });
}
