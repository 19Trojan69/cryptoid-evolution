import type { OwnedResource } from '../core/resources.ts';
import { ResourceCancelled } from '../core/resources.ts';

export type Texture = { source: CanvasImageSource; width: number; height: number };
export type ImageSpec = Readonly<{ url: string; maxWidth: number; maxHeight: number; maxEncodedBytes: number }>;
export const imageReservation = (spec: ImageSpec) => spec.maxWidth * spec.maxHeight * 4;

/** No PNG encoding, data URLs, material repaint or global texture cache. Each
 * returned decoded image has one disposer owned by the admission pool. */
export async function loadTexture(spec: ImageSpec, signal: AbortSignal): Promise<OwnedResource<Texture>> {
  if (!/^\/ships\/[a-zA-Z0-9_./-]+$/.test(spec.url) || spec.url.includes('..')
    || ![spec.maxWidth, spec.maxHeight, spec.maxEncodedBytes].every(n => Number.isSafeInteger(n) && n > 0)) throw new TypeError('Invalid original image specification');
  if (signal.aborted) throw new ResourceCancelled();
  const response = await fetch(spec.url, { signal, credentials: 'same-origin' });
  if (!response.ok) throw new Error('Original image unavailable');
  const blob = await response.blob();
  if (blob.size > spec.maxEncodedBytes) throw new RangeError('Unexpected encoded image size');
  if (signal.aborted) throw new ResourceCancelled();
  let source: HTMLImageElement | ImageBitmap, width: number, height: number, dispose: () => void;
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob);
    source = bitmap; width = bitmap.width; height = bitmap.height;
    dispose = () => bitmap.close();
  } else {
    const url = URL.createObjectURL(blob), image = new Image();
    try {
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Original image decode failed')); image.src = url; });
    } catch (error) { image.removeAttribute('src'); throw error; }
    finally { URL.revokeObjectURL(url); image.onload = image.onerror = null; }
    source = image; width = image.naturalWidth; height = image.naturalHeight;
    dispose = () => image.removeAttribute('src');
  }
  if (width > spec.maxWidth || height > spec.maxHeight || width < 1 || height < 1) {
    dispose(); throw new RangeError('Unexpected original image dimensions');
  }
  let disposed = false;
  return { value: { source, width, height }, bytes: width * height * 4,
    dispose: () => { if (disposed) return; dispose(); disposed = true; } };
}
