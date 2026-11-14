import { arcadeRankIds } from '../../../backend/src/galaxyArcadeStickerSchema.ts';

type RetroNftPreview = { title: string; image: string };
type ArcadeRank = typeof arcadeRankIds[number];

const retroNftPreviews: Partial<Record<`${number}_${ArcadeRank}`, RetroNftPreview>> = {
  '55_platinum': { title: 'Docking Maneuver', image: '/nft/retro/docking-maneuver.webp' },
  '90_gold': { title: 'Phase Rings', image: '/nft/retro/phase-rings.webp' },
  '190_diamond': { title: 'Convoy Escort', image: '/nft/retro/convoy-escort.webp' },
};

export const retroNftPreviewCount = Object.keys(retroNftPreviews).length;

export function retroNftPreviewFor(sticker: { level: number; rank: number }): RetroNftPreview | undefined {
  const rank = arcadeRankIds[sticker.rank - 1];
  return rank && retroNftPreviews[`${sticker.level}_${rank}`];
}
