import { useLayoutEffect, useRef, useState } from 'react';
import type { PlayerColorId } from './shipFleet';
import { loadShipArtwork } from './shipArtwork';

type Props = { src: string; name: string; color?: PlayerColorId; silhouette?: boolean; loadingLabel?: string; errorLabel?: string };

export default function ShipPortrait({ src, name, color, silhouette = false, loadingLabel, errorLabel }: Props) {
  return <ShipPortraitCanvas key={`${src}:${color}:${silhouette}`} src={src} name={name} color={color} silhouette={silhouette} loadingLabel={loadingLabel} errorLabel={errorLabel} />;
}

function ShipPortraitCanvas({ src, name, color, silhouette, loadingLabel, errorLabel }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useLayoutEffect(() => {
    let current = true;
    const previous = canvas.current;
    previous?.getContext('2d')?.clearRect(0, 0, previous.width, previous.height);
    void loadShipArtwork(src,color).then(art => {
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
    }, () => { if (current) setFailed(true); });
    return () => { current = false; };
  }, [src, color, silhouette]);
  return <><canvas ref={canvas} className="collection-ship-portrait" role="img" aria-label={name}
    aria-busy={!ready && !failed} data-ready={ready} data-silhouette={silhouette} style={{ visibility: ready ? 'visible' : 'hidden' }} />
    {!ready && loadingLabel && <span className="ship-preview-status" role="status">{failed ? errorLabel ?? loadingLabel : loadingLabel}</span>}</>;
}
