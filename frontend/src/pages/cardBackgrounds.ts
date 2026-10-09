import { playerSkins } from './shipFleet.ts';
import type { ShipStage } from './shipEvolution.ts';

export type CardBackgroundAsset = {
  cardKey: string;
  category: 'boss' | 'standard' | 'advanced' | 'elite';
  /** Unique destination reserved for this card; not proof that an image exists. */
  plannedImage: string;
  /** Only verified, existing unique motifs belong here. */
  image: string | null;
  fallbackImage: string;
};
const legacy = ['blue-nebula', 'amber-galaxy', 'ringed-world'].map(name => `/cards/space/${name}.png`);
const playerCategories = ['standard', 'advanced', 'elite'] as const;
export const cardBackgroundAssets: readonly CardBackgroundAsset[] = [
  ...Array.from({ length: 50 }, (_, index) => ({
    cardKey: `boss-${index + 1}`, category: 'boss' as const,
    plannedImage: index < 3 ? legacy[index] : `/cards/space/unique/boss-${String(index + 1).padStart(2, '0')}.webp`,
    image: index < 3 ? legacy[index] : `/cards/space/unique/boss-${String(index + 1).padStart(2, '0')}.webp`,
    fallbackImage: legacy[index % 3],
  })),
  ...playerCategories.flatMap((category, index) => playerSkins.map(ship => ({
    cardKey: `${ship.id}-${index + 1}`, category,
    plannedImage: `/cards/space/unique/${category}-${String(ship.sprite + 1).padStart(2, '0')}.webp`,
    image: `/cards/space/unique/${category}-${String(ship.sprite + 1).padStart(2, '0')}.webp`,
    fallbackImage: legacy[(ship.sprite + index) % 3],
  }))),
];
const byKey = new Map(cardBackgroundAssets.map(asset => [asset.cardKey, asset]));
export function cardBackgroundAsset(key: string): CardBackgroundAsset {
  const asset = byKey.get(key);
  if (!asset) throw new Error(`Unknown collection card: ${key}`);
  return asset;
}
/** Shared by overview, detail, reward reveal and PNG; pending motifs keep the old backdrop.
 * A fallback never counts as a completed unique background and never affects unlock rules.
 */
export function collectionBackground(key: string): string {
  const asset = cardBackgroundAsset(key);
  return asset.image ?? asset.fallbackImage;
}
export const shipCardBackground = (id: string, stage: ShipStage) => collectionBackground(`${id}-${stage}`);
