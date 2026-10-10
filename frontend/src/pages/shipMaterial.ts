import { tintShipPixels } from './shipTint.ts';

/** Baked once per cached variant, never during a game frame. Original alpha,
 * hull bounds and glass survive; local relief reveals existing armor facets.
 */
export function paintShipMaterial(data: Uint8ClampedArray, width: number, height: number, target: readonly number[], accent?: readonly number[]) {
  const source = data.slice();
  const light = (offset: number) => .2126 * source[offset] + .7152 * source[offset + 1] + .0722 * source[offset + 2];
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = (y * width + x) * 4;
    if (source[i + 3] < 20) continue;
    const r = source[i], g = source[i + 1], b = source[i + 2];
    if (b > r * 1.18 && b > g * 1.12 && light(i) < 140) continue;
    const center = light(i);
    const left = i - 4, right = i + 4, top = i - width * 4, bottom = i + width * 4;
    const solid = source[left + 3] >= 100 && source[right + 3] >= 100 && source[top + 3] >= 100 && source[bottom + 3] >= 100;
    const local = solid ? (light(left) + light(right) + light(top) + light(bottom)) / 4 : center;
    const relief = Math.max(-12, Math.min(14, (center - local) * .32));
    const directional = 1.035 + (1 - x / width) * .035 - y / height * .04;
    const rim = !solid && center > 35 ? 7 : 0;
    for (let channel = 0; channel < 3; channel++) data[i + channel] = source[i + channel] * directional + relief + rim;
  }
  tintShipPixels(data, target, accent);
}
