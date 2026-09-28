// Transparent margins vary between ship images. Position the visible hull at
// the gameplay origin so a shield and its hitbox share the same center.
export const shipVisualCenter = (rgba: ArrayLike<number>, width: number, height: number) => {
  let weightedX = 0;
  let weightedY = 0;
  let visibleAlpha = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = rgba[(y * width + x) * 4 + 3];
      if (alpha <= 32) continue;
      weightedX += (x + .5) * alpha;
      weightedY += (y + .5) * alpha;
      visibleAlpha += alpha;
    }
  }
  if (!visibleAlpha) return { x: 0, y: 0 };
  return {
    x: (width / 2 - weightedX / visibleAlpha) / width * 100,
    y: (height / 2 - weightedY / visibleAlpha) / height * 100,
  };
};
