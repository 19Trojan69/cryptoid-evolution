import type { OwnedResource } from '../core/resources.ts';
import { ResourceCancelled } from '../core/resources.ts';

export type Texture = { source: CanvasImageSource; width: number; height: number; sourceCrop?: boolean };
export type ImageSpec = Readonly<{ url: string; maxWidth: number; maxHeight: number; maxEncodedBytes: number }>;
export type TextureDecoder = 'bitmap' | 'bitmap-medium' | 'bitmap-high' | 'bitmap-padded' | 'image' | 'blob-image';
const paddedSize = (width: number, height: number) => ({ width: 2 ** Math.ceil(Math.log2(width)), height: 2 ** Math.ceil(Math.log2(height)) });
export const imageReservation = (spec: ImageSpec, decoder: TextureDecoder) => {
  const padded = paddedSize(spec.maxWidth, spec.maxHeight);
  return spec.maxWidth * spec.maxHeight * 4 + spec.maxEncodedBytes * 2 + (decoder === 'bitmap-padded' ? padded.width * padded.height * 4 : 0);
};

/** Original encoded bytes only: no repaint, PNG encoding or data URLs. The
 * direct-image path is a reference control. Fetched paths can abort a held
 * network request while retaining admission through any native decode. */
export async function loadTexture(spec: ImageSpec, signal: AbortSignal, decoder: TextureDecoder): Promise<OwnedResource<Texture>> {
  if (!/^\/ships\/[a-zA-Z0-9_./-]+$/.test(spec.url) || spec.url.includes('..')
    || ![spec.maxWidth, spec.maxHeight, spec.maxEncodedBytes].every(n => Number.isSafeInteger(n) && n > 0)) throw new TypeError('Invalid original image specification');
  if (signal.aborted) throw new ResourceCancelled();
  let source: HTMLImageElement | ImageBitmap, width: number, height: number, dispose: () => void, ownedBytes = 0, sourceCrop = false;
  if (decoder === 'image') {
    const image = await decodeImage(spec.url);
    source = image; width = image.naturalWidth; height = image.naturalHeight; dispose = () => image.removeAttribute('src');
  } else {
    const response = await fetch(spec.url, { signal, credentials: 'same-origin' });
    if (!response.ok) throw new Error('Original image unavailable');
    const blob = await response.blob();
    if (blob.size > spec.maxEncodedBytes) throw new RangeError('Unexpected encoded image size');
    if (signal.aborted) throw new ResourceCancelled();
    if (decoder.startsWith('bitmap') && typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(blob);
      width = bitmap.width; height = bitmap.height;
      if (decoder === 'bitmap-padded') {
        // Allocation-shape experiment only: preserve every source pixel and
        // add transparent padding; never resize or lower the artwork resolution.
        const padded = paddedSize(width, height);
        let envelope: ImageBitmap;
        try { envelope = await createImageBitmap(bitmap, 0, 0, padded.width, padded.height); }
        finally { bitmap.close(); }
        source = envelope; ownedBytes = envelope.width * envelope.height * 4; sourceCrop = true; dispose = () => envelope.close();
      } else { source = bitmap; dispose = () => bitmap.close(); }
    } else {
      const url = URL.createObjectURL(blob);
      let image: HTMLImageElement;
      try { image = await decodeImage(url); } finally { URL.revokeObjectURL(url); }
      source = image; width = image.naturalWidth; height = image.naturalHeight; dispose = () => image.removeAttribute('src');
    }
  }
  if (width > spec.maxWidth || height > spec.maxHeight || width < 1 || height < 1) {
    dispose(); throw new RangeError('Unexpected original image dimensions');
  }
  let disposed = false;
  return { value: { source, width, height, sourceCrop }, bytes: ownedBytes || width * height * 4,
    dispose: () => { if (disposed) return; dispose(); disposed = true; } };
}

async function decodeImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  try { await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Original image decode failed')); image.src = url; }); }
  catch (error) { image.removeAttribute('src'); throw error; }
  finally { image.onload = image.onerror = null; }
  return image;
}
