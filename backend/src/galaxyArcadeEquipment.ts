import { arcadeShipArtworkSize, arcadeStickerImage, type ArcadeFlightShip } from "./galaxyArcadeStickerSchema";
import { shipColors, standardShips } from "./playerSave";

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const pngPrefix = "data:image/png;base64,";

export function readArcadeFlightShip(raw: unknown): ArcadeFlightShip | null {
  if (typeof raw !== "string" || raw.length > 25_000) return null;
  try {
    const { modelId, stage, colorId, name, artwork } = JSON.parse(raw) as Partial<ArcadeFlightShip>;
    if (typeof modelId !== "string" || !standardShips.includes(modelId)
      || (stage !== 1 && stage !== 2 && stage !== 3)
      || typeof colorId !== "string" || !shipColors.includes(colorId)
      || typeof name !== "string" || !name.trim() || name.length > 160
      || typeof artwork !== "string" || !arcadeStickerImage.test(artwork)) return null;

    const header = Buffer.from(artwork.slice(pngPrefix.length, pngPrefix.length + 44), "base64");
    if (header.length < 24 || !header.subarray(0, 8).equals(pngSignature)
      || header.readUInt32BE(8) !== 13 || header.toString("ascii", 12, 16) !== "IHDR") return null;
    const width = header.readUInt32BE(16), height = header.readUInt32BE(20);
    if (width < 1 || height < 1 || width > arcadeShipArtworkSize || height > arcadeShipArtworkSize) return null;
    return { modelId, stage, colorId, name, artwork };
  } catch { return null; }
}

export function arcadeEquipmentStartup(ship: ArcadeFlightShip | null) {
  if (!ship) return "";
  return `
    const equipped = ${JSON.stringify(ship).replace(/</g, "\\u003c")};
    CryptoidMinigames.connectEquipment({ getEquippedShip: () => equipped });
    CE.activeShip = await CE.equipment.snapshot();
  `;
}
