// Standard gameplay uses at most one effect raster pixel per CSS pixel. Keep
// HUD/text, original hull assets, CSS geometry and simulation coordinates intact.
// Device density must not oversample these transient graphics by default.
export const gameRenderScale = (deviceRatio: number = 1) =>
  Number.isFinite(deviceRatio) && deviceRatio > 0 ? Math.min(1, deviceRatio) : 1;
