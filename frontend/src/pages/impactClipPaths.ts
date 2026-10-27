type Fragment = { points: readonly (readonly number[])[] };

// Each mounted impact owns these fixed local outlines. Reuse their geometry
// with the original frame transform; no image, surface or global cache is added.
export function prepareImpactClipPaths(pieces: readonly Fragment[], size: number): Path2D[] | null {
  if (typeof Path2D === 'undefined') return null;
  try {
    return pieces.map(piece => {
      const path = new Path2D();
      piece.points.forEach(([x, y], index) => index ? path.lineTo(x * size, y * size) : path.moveTo(x * size, y * size));
      path.closePath();
      return path;
    });
  } catch {
    // Optional native path preparation must not remove the original renderer.
    return null;
  }
}
