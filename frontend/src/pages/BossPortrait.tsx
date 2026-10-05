import { memo, useEffect, useRef, useState } from 'react';
import { bossName } from './bossNames';
import { loadBossArtwork } from './bossArtwork';
import './bossPortrait.css';

/** Same composited model as the downloadable card, including every mounted turret. */
export default memo(function BossPortrait({ id, silhouette = false }: { id: number; silhouette?: boolean }) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false), [ready, setReady] = useState(false);
  useEffect(() => {
    const element = root.current;
    if (!element || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '180px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let current = true;
    setReady(false);
    // Clear previous pixels immediately when browsing from an unlocked to a locked card.
    const output = canvas.current;
    output?.getContext('2d')?.clearRect(0, 0, output.width, output.height);
    if (!visible) return;
    void loadBossArtwork(id, 1200).then(art => {
      if (!current || !canvas.current) return;
      const target = canvas.current;
      target.width = art.width; target.height = art.height;
      const context = target.getContext('2d');
      if (!context) return;
      context.drawImage(art, 0, 0);
      if (silhouette) {
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = '#858585';
        context.fillRect(0, 0, target.width, target.height);
        context.globalCompositeOperation = 'source-over';
      }
      Object.assign(target.dataset, art.dataset);
      setReady(true);
    }, () => { /* No old model or hull-only fallback may expose incorrect artwork. */ });
    return () => { current = false; };
  }, [id, silhouette, visible]);
  return <div ref={root} className="boss-portrait" role="img" aria-label={bossName(id)} aria-busy={!ready}
    data-boss-id={id} data-silhouette={silhouette} data-ready={ready}>
    <canvas ref={canvas} className="boss-portrait-composite" aria-hidden="true" style={{ visibility: ready ? 'visible' : 'hidden' }} />
  </div>;
});
