import { arcadeRankIds } from '../../../backend/src/galaxyArcadeStickerSchema.ts';
import { retroNftScenes } from '../../../backend/src/retroNftScenes.ts';

export const retroNftPreviewCount = Object.keys(retroNftScenes).length * arcadeRankIds.length;

export function retroNftPreviewFor({ level, rank }: { level: number; rank: number }) {
  const rankId = arcadeRankIds[rank - 1];
  const scene = retroNftScenes[level];
  if (!rankId || !scene) return;
  return { title: scene.title, artworkPath: `/admin/nft-collection/retro/${level}/${rankId}`, rankId };
}
