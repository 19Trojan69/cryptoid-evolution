import { useEffect, useState, type CSSProperties } from "react";
import { allPlayerColors, type PlayerColorId } from "./shipFleet";
import { shipEvolutionAsset, type ShipStage } from "./shipEvolution";
import { shipVisualCenter } from "./shipVisualCenter";
import { namedShipAccent } from './shipIdentityColor';
import { paintShipMaterial } from './shipMaterial';
import { ResourceCache } from './resourceCache';
import { resourceTimingEnabled as isCombatProbeEnabled } from './performanceDiagnostics';

const cache = new ResourceCache<string>(48, 24 * 1024 * 1024, url => URL.revokeObjectURL(url));
const pendingPaints = new Map<string, Promise<string>>();
const preparationProbe = { jobsStarted: 0, jobsFinished: 0, queueWaitMaxMs: 0,
  materialTotalMs: 0, materialMaxMs: 0, encodeTotalMs: 0, decodeTotalMs: 0,
  sourceWorkTotalMs: 0, sourceWorkMaxMs: 0 };
const sourceImages = new ResourceCache<Promise<HTMLImageElement>>(8, Infinity);
// Eviction from the ready-source LRU does not stop an unresolved Image load.
// Share that load until it settles; do not keep a second completed-image cache.
const pendingSources = new Map<string, Promise<HTMLImageElement>>();
const readySources = new WeakSet<Promise<HTMLImageElement>>();
const visualCenters = new Map<string, { x: number; y: number }>();
const shipImage = (url: string) => {
  let pending = sourceImages.get(url);
  if (!pending) {
    pending = pendingSources.get(url);
    if (pending) sourceImages.set(url, pending);
  }
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        image.onload = image.onerror = null;
        const timed = isCombatProbeEnabled();
        const sourceStarted = timed ? performance.now() : 0;
        let canvas: HTMLCanvasElement | undefined;
        try {
          // The center belongs to the source URL, not its evictable Image.
          // An already known center needs no second readback surface.
          if (!visualCenters.has(url)) {
            canvas = document.createElement("canvas");
            canvas.width = canvas.height = 240;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            try {
              if (context) {
                context.drawImage(image, 0, 0, 240, 240);
                visualCenters.set(url, shipVisualCenter(context.getImageData(0, 0, 240, 240).data, 240, 240));
              }
            } catch { /* Preserve the optional visual offset fallback for a tainted image. */ }
          }
          resolve(image);
        } catch (error) { reject(error); }
        finally { if (canvas) canvas.width = canvas.height = 0; if (timed) { const work = performance.now() - sourceStarted; preparationProbe.sourceWorkTotalMs += work; preparationProbe.sourceWorkMaxMs = Math.max(preparationProbe.sourceWorkMaxMs, work); } }
      };
      image.onerror = () => { image.onload = image.onerror = null; reject(new Error('Ship image unavailable')); };
      image.src = url;
    });
    sourceImages.set(url, pending);
    pendingSources.set(url, pending);
    const current = pending;
    const settled = () => { if (pendingSources.get(url) === current) pendingSources.delete(url); };
    void current.then(() => { readySources.add(current); settled(); }, settled);
    void current.catch(() => { if (sourceImages.get(url) === current) sourceImages.delete(url); });
  }
  return pending;
};

// Ready images use the existing eight-source cache; pending URLs share one load.
export const preloadHullSources = (urls: readonly string[]) => {
  for (const url of [...new Set(urls)].slice(0, 7)) void shipImage(url).catch(() => {});
};

export const useHullSourceReady = (url: string | undefined) => {
  const [loadedUrl, setLoadedUrl] = useState<string | undefined>(() => {
    const pending = url ? sourceImages.get(url) : undefined;
    return pending && readySources.has(pending) ? url : undefined;
  });
  useEffect(() => {
    if (!url) return;
    let active = true;
    void shipImage(url).then(() => { if (active) setLoadedUrl(url); }, () => {});
    return () => { active = false; };
  }, [url]);
  return !!url && loadedUrl === url;
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
  const checkRetained = () => {
    if (cache.retained(key)) return;
    // Remove the cancelled promise before rejecting so a new consumer cannot
    // inherit it during the rejection/finally microtasks.
    pendingPaints.delete(key);
    throw new Error('Ship preparation cancelled');
  };
  const url = shipEvolutionAsset(index, stage);
  const image = await shipImage(url);
  checkRetained();
  const timed = isCombatProbeEnabled();
  const materialStarted = timed ? performance.now() : 0;
  const canvas = document.createElement("canvas");
  try {
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const hex = allPlayerColors.find(color => color.id === colorId)?.glow ?? "#a8b3c2";
    const target = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
    paintShipMaterial(pixels.data, canvas.width, canvas.height, target, namedShipAccent(index));
    context.putImageData(pixels, 0, 0);
    const encodingStarted = timed ? performance.now() : 0;
    if (timed) { const work = encodingStarted - materialStarted; preparationProbe.materialTotalMs += work; preparationProbe.materialMaxMs = Math.max(preparationProbe.materialMaxMs, work); }
    // Blob encoding can run off the main thread; large base64 strings are avoided.
    const decodedBytes = canvas.width * canvas.height * 4;
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Ship encoding failed')), 'image/png'));
    // The completed Blob owns its pixels. Do not retain a second full painting
    // surface while the replacement image waits for load/decode.
    canvas.width = canvas.height = 0;
    checkRetained();
    const decodingStarted = timed ? performance.now() : 0;
    if (timed) preparationProbe.encodeTotalMs += decodingStarted - encodingStarted;
    const paintedUrl = URL.createObjectURL(blob);
    // A Blob URL is not decoded merely because encoding finished. Keep the
    // already-loaded source hull until the replacement is ready for display.
    try {
      const decoded = new Image();
      await new Promise<void>((resolve, reject) => {
        decoded.onload = () => { decoded.onload = decoded.onerror = null; resolve(); };
        decoded.onerror = () => { decoded.onload = decoded.onerror = null; reject(new Error('Painted ship image unavailable')); };
        decoded.src = paintedUrl;
      });
      checkRetained();
      if (typeof decoded.decode === 'function') await decoded.decode();
      checkRetained();
      if (timed) preparationProbe.decodeTotalMs += performance.now() - decodingStarted;
    } catch (error) { URL.revokeObjectURL(paintedUrl); throw error; }
    cache.set(key, paintedUrl, blob.size + decodedBytes);
    return paintedUrl;
  } finally { if (canvas.width || canvas.height) canvas.width = canvas.height = 0; }
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
  const timed = isCombatProbeEnabled();
  const queuedAt = timed ? performance.now() : 0;
  let started = false;
  const pending = paintTail.then(() => new Promise<void>(resolve => window.setTimeout(resolve, 0)))
    .then(() => {
      if (!cache.retained(key)) {
        // Nobody can display this queued variant anymore. Remove it now so a
        // newly mounted consumer can request a fresh job rather than inherit
        // a cancelled promise. Never cancel a pinned/on-screen consumer.
        if (pendingPaints.get(key) === pending) pendingPaints.delete(key);
        throw new Error('Ship preparation cancelled');
      }
      if (timed) { started = true; preparationProbe.jobsStarted++; preparationProbe.queueWaitMaxMs = Math.max(preparationProbe.queueWaitMaxMs, performance.now() - queuedAt); }
      return renderPaintedSprite(index, colorId, stage);
    }).finally(() => { if (timed && started) preparationProbe.jobsFinished++; if (pendingPaints.get(key) === pending) pendingPaints.delete(key); });
  paintTail = pending.catch(() => {});
  pendingPaints.set(key, pending);
  return pending;
};

export type PreparedHull = { sprite: number; color: PlayerColorId; stage?: ShipStage };
export const retainPreparedHulls = (hulls: readonly PreparedHull[]) => {
  const unique = new Map<string, PreparedHull>();
  for (const hull of hulls) unique.set(`${hull.sprite}:${hull.stage ?? 1}:${hull.color}`, hull);
  const selected = [...unique.entries()].slice(0, 12);
  const releases = selected.map(([key]) => cache.retain(key));
  // The existing serial queue, shader, Blob decoder and cache do all work.
  // Cancellation releases only preparation pins; mounted consumers keep theirs.
  const settled = Promise.all(selected.map(([, hull]) =>
    createPaintedSprite(hull.sprite, hull.color, hull.stage ?? 1).then(() => true, () => false)));
  let released = false;
  return { settled, release() { if (released) return; released = true; releases.forEach(release => release()); } };
};

export const usePreparedHullReady = (index: number, colorId: PlayerColorId, stage: ShipStage = 1) => {
  const prepared = cache.get(`${index}:${stage}:${colorId}`);
  // A decoded prepared hull is ready even if its raw-source LRU entry was evicted.
  const sourceReady = useHullSourceReady(prepared ? undefined : shipEvolutionAsset(index, stage));
  return !!prepared || sourceReady;
};

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

export const paintedShipResourceStats = () => ({ painted: cache.size, estimatedBytes: cache.bytes, sources: sourceImages.size, pending: pendingPaints.size, retained: cache.retainedEntries, retainCount: cache.retainCount, sourceRetained: sourceImages.retainedEntries, sourceRetainCount: sourceImages.retainCount, ...preparationProbe });
