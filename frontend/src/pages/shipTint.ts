// Preserve luminance, panel seams and neutral reflections on every paint.
export function tintShipPixels(data: Uint8ClampedArray, target: readonly number[], accent?: readonly number[]) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 20) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const brightness = .2126 * r + .7152 * g + .0722 * b;
    if (b > r * 1.18 && b > g * 1.12 && brightness < 140) continue;
    const saturation = Math.max(r,g,b) - Math.min(r,g,b);
    const identityPixel = accent && saturation > 28 && brightness > 45 && (
      accent[0] > accent[1] * 1.5 ? r > g * 1.25 && r > b * 1.15 :
      accent[1] > accent[0] ? g > r * 1.08 && g > b * 1.1 : r > b * 1.25 && g > b * 1.12 && r > g * .95);
    const palette = identityPixel ? accent : target;
    const luminance = Math.max(1, .2126 * palette[0] + .7152 * palette[1] + .0722 * palette[2]);
    const lightness = Math.max(.8, Math.min(1.06, .64 + .36 * luminance / 190));
    const reflection = Math.pow(Math.max(0, (brightness - 115) / 140), 2) * .68;
    const tone = 255 * Math.pow(brightness / 255, .92) * lightness;
    const strength = brightness < 32 ? .48 : .88;
    for (let channel = 0; channel < 3; channel++) {
      const metal = tone * (.24 + .76 * palette[channel] / luminance);
      const reflected = metal * (1 - reflection) + Math.min(255, tone + 15) * reflection;
      data[i + channel] = Math.round(data[i + channel] * (1 - strength) + reflected * strength);
    }
  }
}
