import { useEffect, useRef, useState } from 'react';
import { loadBossArtwork } from './bossArtwork';
import { bossName } from './bossNames';

/** Small copies of the actual hull + current turrets; no invented fallback art. */
export default function GalaxyBossArt({ id, defeated, large = false }: { id: number; defeated: boolean; large?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void loadBossArtwork(id, large ? 800 : 256).then(art => {
      if (!active || !canvas.current) return;
      const target = canvas.current;
      target.width = art.width; target.height = art.height;
      const context = target.getContext('2d');
      if (!context) return;
      context.drawImage(art, 0, 0);
      Object.assign(target.dataset, art.dataset);
      setReady(true);
    }, () => {});
    return () => { active = false; };
  }, [id, large]);
  return <canvas ref={canvas} className="galaxy-boss-art" role="img" aria-label={bossName(id)} aria-busy={!ready} data-ready={ready} data-silhouette={!defeated} />;
}
