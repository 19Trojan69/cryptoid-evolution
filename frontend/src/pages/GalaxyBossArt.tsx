import { useEffect, useRef, useState } from 'react';
import { drawBossPortrait, loadBossArtwork } from './bossArtwork';
import { bossName } from './bossNames';

/** Small copies of the actual hull + current turrets; no invented fallback art. */
export default function GalaxyBossArt({ id, defeated, large = false }: { id: number; defeated: boolean; large?: boolean }) {
  return <GalaxyBossCanvas key={`${id}:${defeated}:${large}`} id={id} silhouette={!defeated} large={large} />;
}

function GalaxyBossCanvas({ id, silhouette, large }: { id: number; silhouette: boolean; large: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void loadBossArtwork(id, large ? 800 : 256).then(art => {
      if (!active || !canvas.current) return;
      if (drawBossPortrait(canvas.current, art, silhouette)) setReady(true);
    }, () => {});
    return () => { active = false; };
  }, [id, silhouette, large]);
  return <canvas ref={canvas} className="galaxy-boss-art" role="img" aria-label={bossName(id)} aria-busy={!ready} data-ready={ready} data-silhouette={silhouette} />;
}
