import { arcadeShipArtworkSize, arcadeStickerImage, type ArcadeFlightShip } from '../../../backend/src/galaxyArcadeStickerSchema.ts';
import type { GalaxyEquipment } from './galaxyData';
import { loadShipArtwork } from './shipArtwork';
import { selectedShipStage, shipEvolutionAsset, type ShipStage } from './shipEvolution';
import { allPlayerColors, playerSkins } from './shipFleet';

const stageNames = ['Standard', 'Advanced', 'Elite'] as const;

export async function prepareArcadeFlightShip(equipment: GalaxyEquipment, translate: (name: string) => string, previewStage?: ShipStage): Promise<ArcadeFlightShip> {
  const skin = playerSkins.find(entry => entry.id === equipment.skin);
  const color = allPlayerColors.find(entry => entry.id === equipment.color);
  if (!skin || !color) throw new Error('Selected arcade ship is unavailable');

  const stage = previewStage ?? selectedShipStage(skin.sprite, equipment.upgrades, equipment.shipStage);
  const source = await loadShipArtwork(shipEvolutionAsset(skin.sprite, stage), color.id);
  // The arcade draws its hulls at this pixel resolution. Send just the painted
  // sprite through the same-tab form so the isolated document needs no network.
  const scale = arcadeShipArtworkSize / Math.max(source.width, source.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Arcade ship canvas is unavailable');
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const artwork = canvas.toDataURL('image/png');
    if (!arcadeStickerImage.test(artwork)) throw new Error('Arcade ship artwork is unavailable');
    return { modelId: skin.id, stage, colorId: color.id, name: [skin.name, translate(stageNames[stage - 1]), translate(color.name)].join(' · '), artwork };
  } finally {
    canvas.width = canvas.height = 0;
  }
}
