import { memo, useEffect, useRef } from "react";

// Prograde surface rotation: 360 degrees in one sidereal day, not a spinning flat image.
export const SIDEREAL_DAY_MS = 86_164_090;
export const earthTurn = (timestamp: number) => ((timestamp % SIDEREAL_DAY_MS) + SIDEREAL_DAY_MS) % SIDEREAL_DAY_MS / SIDEREAL_DAY_MS;

const MIN_SIZE = 256;
const MAX_SIZE = 448;
const canvasSize = (canvas: HTMLCanvasElement) => {
  const displayed = canvas.getBoundingClientRect().width;
  const pixels = Math.ceil(displayed * (window.devicePixelRatio || 1) / 64) * 64;
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, pixels || MIN_SIZE));
};
const EarthGlobe = ({ paused = false }: { paused?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pauseRef = useRef(paused);
  useEffect(() => { pauseRef.current = paused; }, [paused]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: false });
    if (!canvas || !context) return;
    const map = new Image();
    let timer: number | undefined;
    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;
    map.onload = () => {
      if (disposed) return;
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = map.width;
      sourceCanvas.height = map.height;
      const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
      if (!sourceContext) return;
      sourceContext.drawImage(map, 0, 0);
      const source = sourceContext.getImageData(0, 0, map.width, map.height).data;
      let size = 0;
      let image: ImageData;
      let target: Uint32Array;
      let longitude: Float32Array;
      let sourceY: Uint16Array;
      let shade: Float32Array;
      let count = 0;
      const prepare = (nextSize: number) => {
        if (nextSize === size) return false;
        size = nextSize;
        canvas.width = canvas.height = size;
        image = context.createImageData(size, size);
        const capacity = size * size;
        target = new Uint32Array(capacity);
        longitude = new Float32Array(capacity);
        sourceY = new Uint16Array(capacity);
        shade = new Float32Array(capacity);
        count = 0;
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          const dx = (x + .5 - size / 2) / (size / 2);
          const dy = (y + .5 - size / 2) / (size / 2);
          const radiusSq = dx * dx + dy * dy;
          if (radiusSq > 1) continue;
          const depth = Math.sqrt(1 - radiusSq);
          target[count] = (y * size + x) * 4;
          longitude[count] = Math.atan2(dx, depth) / (Math.PI * 2);
          sourceY[count] = Math.min(map.height - 1, Math.max(0, Math.floor((.5 + Math.asin(dy) / Math.PI) * map.height)));
          shade[count] = Math.max(.27, Math.min(1, .41 + .68 * Math.max(0, depth * .83 - dx * .48 - dy * .12)));
          count++;
        }
        return true;
      };
      const draw = (initial = false) => {
        if (disposed || !initial && (pauseRef.current || document.hidden)) return;
        // The texture advances eastward; only its surface moves across the sphere.
        const phase = earthTurn(Date.now());
        for (let i = 0; i < count; i++) {
          const u = ((.5 + longitude[i] - phase) % 1 + 1) % 1;
          const sourceIndex = (sourceY[i] * map.width + Math.floor(u * map.width)) * 4;
          const index = target[i];
          for (let channel = 0; channel < 3; channel++) image.data[index + channel] = Math.round(source[sourceIndex + channel] * shade[i]);
          image.data[index + 3] = 255;
        }
        context.putImageData(image, 0, 0);
      };
      prepare(canvasSize(canvas));
      draw(true);
      resizeObserver = new ResizeObserver(() => {
        if (prepare(canvasSize(canvas))) draw(true);
      });
      resizeObserver.observe(canvas);
      timer = window.setInterval(draw, 10_000);
    };
    map.src = "/planets/earth-map-hd.jpg";
    return () => { disposed = true; if (timer !== undefined) window.clearInterval(timer); resizeObserver?.disconnect(); map.onload = null; };
  }, []);
  return <canvas ref={canvasRef} width={MIN_SIZE} height={MIN_SIZE} className="earth-globe-canvas" role="img" aria-label="Slowly rotating Earth" />;
};

export default memo(EarthGlobe);
