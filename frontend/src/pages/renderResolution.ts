// Normal in-game raster resolution. Keep CSS geometry and simulation coordinates
// unchanged; high-density phones must not multiply every effect surface by 9.
export const gameRenderScale = (deviceRatio: number = 1) =>
  Number.isFinite(deviceRatio) && deviceRatio > 0 ? Math.min(1.5, deviceRatio) : 1;
