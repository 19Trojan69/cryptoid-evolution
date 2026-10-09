import { useLayoutEffect, useRef, useState } from 'react';
import { loadShipArtwork } from './shipArtwork';

export default function ShipPortrait({ src, name, silhouette = false }: { src: string; name: string; silhouette?: boolean }) {
  return <ShipPortraitCanvas key={`${src}:${silhouette}`} src={src} name={name} silhouette={silhouette} />;
}

function ShipPortraitCanvas({ src, name, silhouette }: { src: string; name: string; silhouette: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    let current = true;
    const previous = canvas.current;
    previous?.getContext('2d')?.clearRect(0, 0, previous.width, previous.height);
    void loadShipArtwork(src).then(art => {
      if (!current || !canvas.current) return;
      const target = canvas.current;
      target.width = art.width; target.height = art.height;
      const context = target.getContext('2d');
      if (!context) return;
      context.drawImage(art, 0, 0);
      if (silhouette) {
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = '#858585'; context.fillRect(0, 0, target.width, target.height);
        context.globalCompositeOperation = 'source-over';
      }
      target.dataset.renderedSource = src;
      setReady(true);
    }, () => {});
    return () => { current = false; };
  }, [src, silhouette]);
  return <canvas ref={canvas} className="collection-ship-portrait" role="img" aria-label={name}
    aria-busy={!ready} data-ready={ready} data-silhouette={silhouette} style={{ visibility: ready ? 'visible' : 'hidden' }} />;
}
