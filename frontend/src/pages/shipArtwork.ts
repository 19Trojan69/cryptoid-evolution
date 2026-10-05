import { loadCardImage } from './bossArtwork';

const cache = new Map<string, Promise<HTMLCanvasElement>>();
/** Centre visible pixels, not asymmetric transparent padding in a source sprite. */
export function loadShipArtwork(src: string): Promise<HTMLCanvasElement> {
  const existing = cache.get(src);
  if (existing) return existing;
  const task = loadCardImage(src).then(image => {
    const source = document.createElement('canvas');
    source.width = image.width; source.height = image.height;
    const context = source.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas unavailable');
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, source.width, source.height);
    let left = source.width, top = source.height, right = -1, bottom = -1;
    for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
      if (data[(y * source.width + x) * 4 + 3]) {
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
    if (right < left) throw new Error('Empty ship artwork');
    const width = right - left + 1, height = bottom - top + 1;
    const margin = Math.max(4, Math.ceil(Math.max(width, height) * .035));
    const output = document.createElement('canvas');
    output.width = width + margin * 2; output.height = height + margin * 2;
    const target = output.getContext('2d');
    if (!target) throw new Error('Canvas unavailable');
    target.drawImage(source, left, top, width, height, margin, margin, width, height);
    source.width = 0; source.height = 0;
    return output;
  });
  cache.set(src, task);
  while (cache.size > 20) cache.delete(cache.keys().next().value!);
  void task.catch(() => { if (cache.get(src) === task) cache.delete(src); });
  return task;
}
