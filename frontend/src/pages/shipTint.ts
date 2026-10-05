// Same metallic palette and preserved glass as before, without allocating a
// typed array and destructuring it once for every one of the 57,600 pixels.
export function tintShipPixels(data: Uint8ClampedArray, target: readonly number[]) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 20) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const brightness = .2126 * r + .7152 * g + .0722 * b;
    if (b > r * 1.18 && b > g * 1.12 && brightness < 115) continue;
    const strength = brightness < 58 ? .32 : .92;
    const reflection = Math.max(0, brightness - 190) * .42;
    for (let channel = 0; channel < 3; channel++) {
      const tinted = target[channel] * brightness / 155 + reflection;
      data[i + channel] = Math.min(255, Math.round(data[i + channel] * (1 - strength) + tinted * strength));
    }
  }
}
