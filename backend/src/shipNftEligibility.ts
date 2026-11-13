import { hangarCatalog } from "./hangarCatalog";
import { shipColors, shipPrice, spriteForShip, standardShips, type PlayerSave } from "./playerSave";
import { ownedShipStage, type ShipStage } from "./shipLoadout";
import { shipNftEditions, shipNftLivery, shipNftMaxSupply, shipNftStories } from "./shipNftCatalog";
import { shipLiveryAssetPath, vanguardMetallic } from './shipLivery';

export { SHIP_NFT_ART_REVISION } from "./shipNftCatalog";
export const SHIP_NFT_ART_COLLECTION = "shipNftPreviewArtwork";

export const shipNftMainnetEnabled = () =>
  process.env.CRYPTOID_MAINNET_SHIP_NFTS_ENABLED === "1" &&
  process.env.VERCEL_ENV === "production" &&
  process.env.VERCEL_PROJECT_PRODUCTION_URL === "cryptoid-evolution.vercel.app";

export const shipNftOffers = hangarCatalog.filter(offer => offer.kind === "ship_upgrade");
const offersById = new Map<string, typeof shipNftOffers[number]>(shipNftOffers.map(offer => [offer.id, offer]));

export const shipNftCatalog = standardShips.flatMap(shipId => {
  const sprite = spriteForShip(shipId);
  const name = shipId.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join(" ");
  const stories = shipNftStories[shipId as keyof typeof shipNftStories];
  const metallic = shipId === 'pi-vanguard';
  const starter = shipId === "grey-scout";
  const standardPriceShards = starter ? 0 : shipPrice(shipId, true);
  return shipNftEditions.map((edition, index) => {
    const stage = (index + 1) as ShipStage;
    const number = String(sprite + 1).padStart(2, "0");
    const key = edition.toLowerCase();
    const offer = shipNftOffers.find(item => item.shipIndex === sprite && item.stage === stage);
    return {
      id: `${shipId}-${key}`, shipId, sprite, name, stage, edition, livery: metallic ? vanguardMetallic.name : shipNftLivery,
      maxSupply: shipNftMaxSupply[edition], story: stories[index],
      productId: offer?.id ?? null, upgradePricePi: offer?.pricePi ?? null,
      standardPriceShards: stage === 1 ? standardPriceShards : null,
      requiresProductId: stage === 3 ? `ship_${number}_stage_2` : null,
      acquisition: stage > 1 ? "confirmed_ship_upgrade" : starter ? "starter" : "shard_hull",
      spritePath: shipLiveryAssetPath(sprite, stage, metallic ? vanguardMetallic.id : undefined),
      backgroundPath: `cards/space/unique/${key}-${number}.webp`,
    };
  });
});

type MainnetSave = Pick<PlayerSave, "fleet" | "legacyImported" | "standardShipAcquisitions">;
export type ShipNftOrder = {
  user: string;
  product_id: string;
  paid: boolean;
  cancelled?: boolean;
  payment_network: string;
  payment_amount_pi: number;
  owner_testnet_catalog?: boolean;
  pi_payment_id: string;
  txid: string;
  completed_at: Date;
};

export function confirmedMainnetShipUpgrades(uid: string, orders: readonly ShipNftOrder[]) {
  return orders.filter(order => {
    const offer = offersById.get(order.product_id);
    return offer && order.user === uid && order.paid === true && !order.cancelled &&
      order.payment_network === "Pi Network" && !order.owner_testnet_catalog &&
      order.payment_amount_pi === offer.pricePi &&
      typeof order.pi_payment_id === "string" && /^[a-z0-9_-]{1,100}$/i.test(order.pi_payment_id) &&
      typeof order.txid === "string" && /^[a-f0-9]{64}$/i.test(order.txid) &&
      order.completed_at instanceof Date && Number.isFinite(order.completed_at.getTime());
  }).map(order => order.product_id);
}

export function shipNftStatus(card: typeof shipNftCatalog[number], save: MainnetSave | undefined, confirmedUpgrades: readonly string[]) {
  if (!ownsShipNftHull(card.shipId, save)) return "needs-hull";
  if (card.stage === 1) {
    // A non-imported save only gains hulls through server-side Shard purchases.
    // In imported saves, use the explicit receipt so a browser import alone cannot grant a card.
    return card.shipId === "grey-scout" || save?.legacyImported === false || save?.standardShipAcquisitions?.[card.shipId]
      ? "eligible" : "needs-hull-proof";
  }
  const stage = ownedShipStage(card.sprite, confirmedUpgrades);
  if (card.stage === 3 && stage < 2) return "needs-advanced";
  return stage >= card.stage ? "eligible" : "needs-purchase";
}

export function ownsShipNftHull(shipId: string, save: Pick<PlayerSave, "fleet"> | undefined) {
  return shipColors.some(color => {
    const count = save?.fleet?.[shipId]?.[color];
    return typeof count === "number" && Number.isSafeInteger(count) && count > 0;
  });
}
