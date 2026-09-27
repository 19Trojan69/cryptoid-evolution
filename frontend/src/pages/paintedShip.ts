import { useEffect, useState, type CSSProperties } from "react";
import { allPlayerColors, type PlayerColorId } from "./shipFleet";
import { shipEvolutionAsset, type ShipStage } from "./shipEvolution";

const cache = new Map<string, string>();
const sourceImages = new Map<string, Promise<HTMLImageElement>>();
const shipImage = (url: string) => sourceImages.get(url) ?? new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = url;
});

const createPaintedSprite = async (index: number, colorId: PlayerColorId, stage: ShipStage) => {
  const key = `${index}:${stage}:${colorId}`;
  if (cache.has(key)) return cache.get(key)!;
  const url = shipEvolutionAsset(index, stage);
  let pending = sourceImages.get(url);
  if (!pending) {
    pending = shipImage(url);
    sourceImages.set(url, pending);
  }
  const image = await pending;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 240;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(image, 0, 0, 240, 240);
  const pixels = context.getImageData(0, 0, 240, 240);
  const hex = allPlayerColors.find(color => color.id === colorId)?.glow ?? "#a8b3c2";
  const target = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  for (let i = 0; i < pixels.data.length; i += 4) {
    const [r, g, b, a] = pixels.data.slice(i, i + 4);
    if (a < 20) continue;
    const brightness = .2126 * r + .7152 * g + .0722 * b;
    // Preserve dark cockpit glass, guns, and engine details; tint the hull panels.
    const glass = b > r * 1.18 && b > g * 1.12 && brightness < 115;
    if (glass) continue;
    const strength = brightness < 58 ? .32 : .92;
    const reflection = Math.max(0, brightness - 190) * .42;
    for (let channel = 0; channel < 3; channel++) {
      const original = pixels.data[i + channel];
      const tinted = target[channel] * brightness / 155 + reflection;
      pixels.data[i + channel] = Math.min(255, Math.round(original * (1 - strength) + tinted * strength));
    }
  }
  context.putImageData(pixels, 0, 0);
  const paintedUrl = canvas.toDataURL("image/png");
  cache.set(key, paintedUrl);
  return paintedUrl;
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
