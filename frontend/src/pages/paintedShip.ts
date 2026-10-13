import { useEffect, useState, type CSSProperties } from "react";
import { allPlayerColors, type PlayerColorId } from "./shipFleet";
import { shipEvolutionAsset, type ShipStage } from "./shipEvolution";
import { shipVisualCenter } from "./shipVisualCenter";
import { namedShipAccent } from './shipIdentityColor';
import { paintShipMaterialAsync } from './shipMaterialAsync';
import { ResourceCache } from './resourceCache';

const cache = new ResourceCache<string>(48, 24 * 1024 * 1024, url => URL.revokeObjectURL(url));
const pendingPaints = new Map<string, Promise<string>>();
const sourceImages = new ResourceCache<Promise<HTMLImageElement>>(8, Infinity);
const visualCenters = new Map<string, { x: number; y: number }>();
const shipImage = (url: string) => {
  let pending = sourceImages.get(url);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      let settled=false;
      const timer=window.setTimeout(()=>fail(new Error('Ship image timed out')),20_000);
      const fail=(error:unknown)=>{if(settled)return;settled=true;window.clearTimeout(timer);image.onload=image.onerror=null;image.src='';reject(error);};
      image.onload = async () => {
        try { await image.decode?.(); } catch(error) { fail(error); return; }
        if(settled)return;
        settled=true;window.clearTimeout(timer);
        image.onload = image.onerror = null;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 240;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        try {
          if (context && !visualCenters.has(url)) {
            context.drawImage(image, 0, 0, 240, 240);
            visualCenters.set(url, shipVisualCenter(context.getImageData(0, 0, 240, 240).data, 240, 240));
          }
        } catch { /* A tainted canvas must not leave the image promise pending. */ }
        finally { canvas.width = canvas.height = 0; }
        resolve(image);
      };
      image.onerror = () => fail(new Error('Ship image unavailable'));
      image.src = url;
    });
    sourceImages.set(url, pending);
    const current=pending;void current.catch(()=>{if(sourceImages.get(url)===current)sourceImages.delete(url);});
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
  const cached = cache.get(key);
  if (cached) return cached;
  const url = shipEvolutionAsset(index, stage);
  const image = await shipImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  try {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const hex = allPlayerColors.find(color => color.id === colorId)?.glow ?? "#a8b3c2";
    const target = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
    await paintShipMaterialAsync({data:pixels.data,width:canvas.width,height:canvas.height,target,accent:namedShipAccent(index)});
    context.putImageData(pixels, 0, 0);
    // Blob encoding can run off the main thread; large base64 strings are avoided.
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Ship encoding failed')), 'image/png'));
    const paintedUrl = URL.createObjectURL(blob);
    try {
      const ready = new Image(); ready.src = paintedUrl;
      if (ready.decode) await ready.decode();
      else await new Promise<void>((resolve, reject) => { ready.onload = () => resolve(); ready.onerror = () => reject(new Error('Ship decode failed')); if (ready.complete && ready.naturalWidth) resolve(); });
    } catch (error) { URL.revokeObjectURL(paintedUrl); throw error; }
    cache.set(key, paintedUrl, blob.size + canvas.width * canvas.height * 4);
    return paintedUrl;
  } finally { canvas.width = canvas.height = 0; }
};

// Yield between variants so a new formation cannot start many pixel jobs in
// one microtask burst. No rendering quality or source resolution is reduced.
let paintTail: Promise<unknown> = Promise.resolve();

const createPaintedSprite = (index: number, colorId: PlayerColorId, stage: ShipStage): Promise<string> => {
  const key = `${index}:${stage}:${colorId}`;
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const existing = pendingPaints.get(key);
  if (existing) return existing;
  const pending = paintTail.then(() => new Promise<void>(resolve => window.setTimeout(resolve, 0)))
    .then(() => {if(!cache.retained(key))throw new Error('Ship preparation cancelled');return renderPaintedSprite(index, colorId, stage);}).finally(() => pendingPaints.delete(key));
  paintTail = pending.catch(() => {});
  pendingPaints.set(key, pending);
  return pending;
};

export type ShipResource = {sprite:number;color:PlayerColorId;stage:ShipStage};
export function preparePaintedShips(ships:readonly ShipResource[]) {
  const unique=new Map(ships.map(ship=>[`${ship.sprite}:${ship.stage}:${ship.color}`,ship]));
  const releases=[...unique.keys()].map(key=>cache.retain(key));
  let released=false;
  return {
    ready:Promise.all([...unique.values()].map(ship=>createPaintedSprite(ship.sprite,ship.color,ship.stage))),
    isReady:()=>[...unique.keys()].every(key=>cache.get(key)!==undefined),
    release:()=>{if(released)return;released=true;for(const release of releases)release();},
  };
}

export const usePaintedShipStyle = (index: number, colorId: PlayerColorId, stage: ShipStage = 1): CSSProperties => {
  const key = `${index}:${stage}:${colorId}`;
  const [url, setUrl] = useState(() => cache.get(key));
  useEffect(() => {
    let active = true;
    const release = cache.retain(key);
    const cached = cache.get(key);
    if (cached) setUrl(cached);
    else void createPaintedSprite(index, colorId, stage).then(result => { if (active) setUrl(result); }).catch(() => {});
    return () => { active = false; release(); };
  }, [key, index, colorId, stage]);
  const painted = cache.get(key) === url ? url : cache.get(key);
  return painted
    ? { backgroundImage: `url(${painted})`, "--ship-surface-mask": `url(${painted})`, backgroundPosition: "center", backgroundSize: "100% 100%", filter: "none" } as CSSProperties
    : { backgroundImage: `url(${shipEvolutionAsset(index, stage)})`, "--ship-surface-mask": `url(${shipEvolutionAsset(index, stage)})`, backgroundPosition: "center", backgroundSize: "100% 100%", filter: "none" } as CSSProperties;
};

export const paintedShipResourceStats = () => ({ painted: cache.size, estimatedBytes: cache.bytes, sources: sourceImages.size, pending: pendingPaints.size });
