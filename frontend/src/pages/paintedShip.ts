import { useEffect, useState, type CSSProperties } from "react";
import { allPlayerColors, type PlayerColorId } from "./shipFleet";
import { shipEvolutionAsset, type ShipStage } from "./shipEvolution";
import { shipVisualCenter } from "./shipVisualCenter";
import { tintShipPixels } from './shipTint';

const cache = new Map<string, string>();
const pendingPaints = new Map<string, Promise<string>>();
const sourceImages = new Map<string, Promise<HTMLImageElement>>();
const visualCenters = new Map<string, { x: number; y: number }>();
const shipImage = (url: string) => {
  let pending = sourceImages.get(url);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 240;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context) {
          context.drawImage(image, 0, 0, 240, 240);
          visualCenters.set(url, shipVisualCenter(context.getImageData(0, 0, 240, 240).data, 240, 240));
        }
        resolve(image);
      };
      image.onerror = reject;
      image.src = url;
    });
    sourceImages.set(url, pending);
  }
  return pending;
};

// Apply this to the owner of a .ship-visual, including any future shielded ship.
// The whole visual moves together, so the engine exhaust stays on its nozzles.
export const useShipVisualOffset = (index: number, stage: ShipStage): CSSProperties => {
  const url = shipEvolutionAsset(index, stage);
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void shipImage(url).then(() => { if (active) setReadyUrl(url); }).catch(() => {});
    return () => { active = false; };
  }, [url]);
  const center = visualCenters.get(url);
  const ready = readyUrl === url || center !== undefined;
  return {
    "--ship-visual-offset-x": `${ready ? center?.x ?? 0 : 0}%`,
    "--ship-visual-offset-y": `${ready ? center?.y ?? 0 : 0}%`,
  } as CSSProperties;
};

const renderPaintedSprite = async (index: number, colorId: PlayerColorId, stage: ShipStage) => {
  const key = `${index}:${stage}:${colorId}`;
  if (cache.has(key)) return cache.get(key)!;
  const url = shipEvolutionAsset(index, stage);
  const image = await shipImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 240;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(image, 0, 0, 240, 240);
  const pixels = context.getImageData(0, 0, 240, 240);
  const hex = allPlayerColors.find(color => color.id === colorId)?.glow ?? "#a8b3c2";
  const target = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  tintShipPixels(pixels.data, target);
  context.putImageData(pixels, 0, 0);
  // Blob encoding can run off the main thread; large base64 strings are avoided.
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Ship encoding failed')), 'image/png'));
  const paintedUrl = URL.createObjectURL(blob);
  cache.set(key, paintedUrl);
  return paintedUrl;
};

const createPaintedSprite = (index: number, colorId: PlayerColorId, stage: ShipStage): Promise<string> => {
  const key = `${index}:${stage}:${colorId}`;
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const existing = pendingPaints.get(key);
  if (existing) return existing;
  const pending = renderPaintedSprite(index, colorId, stage).finally(() => pendingPaints.delete(key));
  pendingPaints.set(key, pending);
  return pending;
};

export const usePaintedShipStyle = (index: number, colorId: PlayerColorId, stage: ShipStage = 1): CSSProperties => {
  const key = `${index}:${stage}:${colorId}`;
  const [url, setUrl] = useState(() => cache.get(key));
  useEffect(() => {
    let active = true;
    const cached = cache.get(key);
    if (cached) return;
    void createPaintedSprite(index, colorId, stage).then(result => { if (active) setUrl(result); }).catch(() => {});
    return () => { active = false; };
  }, [key, index, colorId, stage]);
  const painted = cache.get(key) === url ? url : cache.get(key);
  return painted
    ? { backgroundImage: `url(${painted})`, backgroundPosition: "center", backgroundSize: "100% 100%", filter: "none" }
    : { backgroundImage: `url(${shipEvolutionAsset(index, stage)})`, backgroundPosition: "center", backgroundSize: "100% 100%", filter: "grayscale(1)" };
};
