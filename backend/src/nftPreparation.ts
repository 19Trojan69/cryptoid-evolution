import { createHash } from "node:crypto";
import type { Router } from "express";
import { BOSS_NAMES } from "./bossNames";
import { arcadeRankIds, arcadeStickerAlbumName } from "./galaxyArcadeStickerSchema";
import { BOSS_NFT_PREVIEW_ART_REVISION, bossNftEditions, retroNftTerms } from "./nftCollectionTerms";
import { premiumBossCard, premiumBossEditions } from "./premiumBossNft";
import { retroNftScenes } from "./retroNftScenes";
import { rewardNetwork } from "./rewardNetwork";
import { shipNftCatalog } from "./shipNftEligibility";

type Acquisition =
  | { kind: "boss_victory"; bossId: number; minimumWins: number }
  | { kind: "boss_purchase"; bossId: number; minimumWins: number; requiresBossReached: true }
  | { kind: "ship"; shipId: string; stage: number; proof: string; requiresProductId: string | null }
  | { kind: "retro_purchase"; level: number; rank: number; requiredTokenTraits: readonly string[] };

export type PreparedNftCard = {
  id: string;
  collection: "bosses" | "ships" | "retro";
  edition: string;
  maxSupply: number;
  price: { currency: "Pi" | "Shards"; amount: number | null; nftIncluded: boolean };
  productId: string | null;
  metadataUri: null;
  acquisition: Acquisition;
  artwork: { network: "testnet"; ownerOnly: true; path: string; design: "referenced" | "silhouette" };
  metadataDraft: {
    name: string;
    description: string | null;
    image: null;
    external_url: string;
    attributes: { trait_type: string; value: string | number }[];
  };
};

const home = "https://www.cryptoid-evolution.app/";
const preview = (path: string, design: "referenced" | "silhouette" = "referenced") =>
  ({ network: "testnet", ownerOnly: true, path, design } as const);

export const baseBossArtworkIds = BOSS_NAMES.flatMap((_name, index) =>
  Object.keys(bossNftEditions).map(edition => `${BOSS_NFT_PREVIEW_ART_REVISION}:${edition}:${index + 1}`));

export function nftPreparationManifest(bossStories: ReadonlyMap<string, string> = new Map()) {
  const bosses = BOSS_NAMES.flatMap((name, index): PreparedNftCard[] => {
    const bossId = index + 1;
    const number = String(bossId).padStart(2, "0");
    const standard = (Object.keys(bossNftEditions) as (keyof typeof bossNftEditions)[]).map((edition): PreparedNftCard => {
      const terms = bossNftEditions[edition];
      const free = edition === "victory";
      return {
        id: `boss-${number}-${edition}`,
        collection: "bosses",
        edition,
        maxSupply: terms.supply,
        price: { currency: "Pi", amount: "pricePi" in terms ? terms.pricePi : 0, nftIncluded: false },
        productId: null,
        metadataUri: null,
        acquisition: free
          ? { kind: "boss_victory", bossId, minimumWins: 1 }
          : { kind: "boss_purchase", bossId, minimumWins: 0, requiresBossReached: true },
        artwork: preview(`/admin/nft-collection/bosses/${bossId}/${edition}`),
        metadataDraft: {
          name: `${name} · ${terms.name}`,
          description: bossStories.get(`${BOSS_NFT_PREVIEW_ART_REVISION}:${edition}:${bossId}`) ?? null,
          image: null,
          external_url: home,
          attributes: [{ trait_type: "Collection", value: "Bosses" }, { trait_type: "Boss", value: name }, { trait_type: "Edition", value: terms.name }],
        },
      };
    });
    const premium = (Object.keys(premiumBossEditions) as (keyof typeof premiumBossEditions)[]).map((edition): PreparedNftCard => {
      const card = premiumBossCard(bossId, edition)!;
      return {
        id: card.id,
        collection: "bosses",
        edition,
        maxSupply: card.supply,
        price: { currency: "Pi", amount: card.pricePi, nftIncluded: false },
        productId: null,
        metadataUri: null,
        acquisition: { kind: "boss_purchase", bossId, minimumWins: card.requiredWins, requiresBossReached: true },
        artwork: preview(`/admin/nft-collection/bosses/${bossId}/${edition}`, card.showFullPreview ? "referenced" : "silhouette"),
        metadataDraft: {
          name: `${name} · ${card.name}`,
          description: card.story,
          image: null,
          external_url: home,
          attributes: [{ trait_type: "Collection", value: "Bosses" }, { trait_type: "Boss", value: name }, { trait_type: "Edition", value: card.name }],
        },
      };
    });
    return [...standard, ...premium];
  });

  const ships: PreparedNftCard[] = shipNftCatalog.map(card => ({
    id: card.id,
    collection: "ships",
    edition: card.edition.toLowerCase(),
    maxSupply: card.maxSupply,
    price: { currency: card.stage === 1 ? "Shards" : "Pi", amount: card.stage === 1 ? card.standardPriceShards : card.upgradePricePi, nftIncluded: true },
    productId: card.productId,
    metadataUri: null,
    acquisition: { kind: "ship", shipId: card.shipId, stage: card.stage, proof: card.acquisition, requiresProductId: card.requiresProductId },
    artwork: preview(`/admin/nft-collection/ships/${card.shipId}/${card.edition.toLowerCase()}`),
    metadataDraft: {
      name: `${card.name} · ${card.edition}`,
      description: card.story,
      image: null,
      external_url: home,
      attributes: [{ trait_type: "Collection", value: "Ships" }, { trait_type: "Ship", value: card.name }, { trait_type: "Edition", value: card.edition }, { trait_type: "Livery", value: card.livery }],
    },
  }));

  const retro = Object.entries(retroNftScenes).flatMap(([level, scene]): PreparedNftCard[] => {
    if (!scene) return [];
    return arcadeRankIds.map((edition, index): PreparedNftCard => {
      const terms = retroNftTerms[edition];
      const rank = index + 1;
      const rankName = edition[0].toUpperCase() + edition.slice(1);
      return {
        id: `retro-${level.padStart(3, "0")}-${edition}`,
        collection: "retro",
        edition,
        maxSupply: terms.supply,
        price: { currency: "Pi", amount: terms.pricePi, nftIncluded: false },
        productId: null,
        metadataUri: null,
        acquisition: { kind: "retro_purchase", level: Number(level), rank, requiredTokenTraits: ["modelId", "stage", "colorId"] },
        artwork: preview(`/admin/nft-collection/retro/${level}/${edition}`),
        metadataDraft: {
          name: `${scene.title} · ${rankName}`,
          description: `${arcadeStickerAlbumName} · ${scene.title} · ${rankName}`,
          image: null,
          external_url: home,
          attributes: [{ trait_type: "Collection", value: arcadeStickerAlbumName }, { trait_type: "Mini game", value: scene.title }, { trait_type: "Rank", value: rankName }, { trait_type: "Level", value: Number(level) }],
        },
      };
    });
  });

  const cards = [...bosses, ...ships, ...retro];
  const summary = {
    total: cards.length,
    bosses: bosses.length,
    ships: ships.length,
    retro: retro.length,
    missingImageUris: cards.filter(card => !card.metadataDraft.image).length,
    missingMetadataUris: cards.filter(card => !card.metadataUri).length,
    missingDescriptions: cards.filter(card => !card.metadataDraft.description).length,
    unlinkedNftProducts: cards.filter(card => card.price.currency === "Pi" && (card.price.amount ?? 0) > 0 && !card.productId).length,
    silhouetteDesigns: cards.filter(card => card.artwork.design === "silhouette").length,
  };
  return {
    schemaVersion: 1,
    network: "mainnet",
    phase: "preparation",
    publishable: false,
    catalogHash: createHash("sha256").update(JSON.stringify(cards)).digest("hex"),
    summary,
    cards,
  } as const;
}

// The parent Admin router performs the verified-owner authorization.
export function mountNftPreparation(router: Router) {
  router.get("/nft-preparation", async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (rewardNetwork(req) !== "mainnet") return res.status(403).json({ error: "mainnet_admin_required" });
    if (req.query.download !== undefined && req.query.download !== "1") {
      return res.status(400).json({ error: "invalid_preparation_request" });
    }
    try {
      const collection = req.app.locals.bossNftPreviewCollection;
      if (!collection) return res.status(503).json({ error: "nft_preparation_unavailable" });
      const documents = await collection.find({ _id: { $in: baseBossArtworkIds } }, {
        projection: { _id: 1, story: 1 },
      }).toArray();
      const stories = new Map<string, string>();
      for (const document of documents) {
        if (typeof document._id === "string" && typeof document.story === "string" && document.story.trim()) {
          stories.set(document._id, document.story);
        }
      }
      const manifest = nftPreparationManifest(stories);
      if (req.query.download === "1") {
        res.setHeader("Content-Disposition", 'attachment; filename="cryptoid-evolution-nft-preparation.json"');
        return res.json(manifest);
      }
      return res.json({
        schemaVersion: manifest.schemaVersion,
        phase: manifest.phase,
        publishable: manifest.publishable,
        catalogHash: manifest.catalogHash,
        summary: manifest.summary,
      });
    } catch { return res.status(503).json({ error: "nft_preparation_unavailable" }); }
  });
}
