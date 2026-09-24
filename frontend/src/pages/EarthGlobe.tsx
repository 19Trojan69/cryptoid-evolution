import { memo, useEffect, useRef } from "react";

// Prograde surface rotation: 360 degrees in one sidereal day, not a spinning flat image.
export const SIDEREAL_DAY_MS = 86_164_090;
export const earthTurn = (timestamp: number) => ((timestamp % SIDEREAL_DAY_MS) + SIDEREAL_DAY_MS) % SIDEREAL_DAY_MS / SIDEREAL_DAY_MS;

const SIZE = 320;
const EarthGlobe = ({ paused = false }: { paused?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: false });
    if (!context) return;
    const map = new Image();
    let timer: number | undefined;
    let disposed = false;
    map.onload = () => {
      if (disposed) return;
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = map.width;
      sourceCanvas.height = map.height;
      const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
      if (!sourceContext) return;
      sourceContext.drawImage(map, 0, 0);
      const source = sourceContext.getImageData(0, 0, map.width, map.height).data;
      const image = context.createImageData(SIZE, SIZE);
      const coordinates: { index: number; longitude: number; sourceY: number; shade: number }[] = [];
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        const dx = (x + .5 - SIZE / 2) / (SIZE / 2);
        const dy = (y + .5 - SIZE / 2) / (SIZE / 2);
        const radiusSq = dx * dx + dy * dy;
        if (radiusSq > 1) continue;
        const depth = Math.sqrt(1 - radiusSq);
        const longitude = Math.atan2(dx, depth) / (Math.PI * 2);
        const sourceY = Math.min(map.height - 1, Math.max(0, Math.floor((.5 + Math.asin(dy) / Math.PI) * map.height)));
        const shade = Math.max(.2, Math.min(1, .34 + .66 * Math.max(0, depth * .83 - dx * .48 - dy * .12)));
        coordinates.push({ index: (y * SIZE + x) * 4, longitude, sourceY, shade });
      }
      const draw = () => {
        if (disposed) return;
        // The texture advances eastward; only its surface moves across the sphere.
        const phase = earthTurn(Date.now());
        for (const pixel of coordinates) {
          const u = ((.5 + pixel.longitude - phase) % 1 + 1) % 1;
          const sourceIndex = (pixel.sourceY * map.width + Math.floor(u * map.width)) * 4;
          for (let channel = 0; channel < 3; channel++) image.data[pixel.index + channel] = Math.round(source[sourceIndex + channel] * pixel.shade);
          image.data[pixel.index + 3] = 255;
        }
        context.putImageData(image, 0, 0);
      };
      draw();
      if (!paused) timer = window.setInterval(draw, 10_000);
    };
    map.src = "/planets/earth-map.jpg";
    return () => { disposed = true; if (timer !== undefined) window.clearInterval(timer); map.onload = null; };
  }, [paused]);
  return <canvas ref={canvasRef} width={SIZE} height={SIZE} className="earth-globe-canvas" role="img" aria-label="Slowly rotating Earth" />;
};

export default memo(EarthGlobe);
