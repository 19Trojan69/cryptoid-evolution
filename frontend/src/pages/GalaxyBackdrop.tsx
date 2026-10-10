import { memo, useEffect, useRef, useState } from 'react';
import { GALAXY_REGION_HEIGHT } from './galaxyModel';
import { galaxyScenery, galaxySceneryAsset } from './galaxyScenery';

const SCENE_HEIGHT = GALAXY_REGION_HEIGHT / 10;

const Scene = memo(function Scene({ id, index }: { id: string; index: number }) {
  const node = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!node.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      const frame = requestAnimationFrame(() => setNear(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(entries => setNear(entries.some(entry => entry.isIntersecting)), { rootMargin: '300px' });
    observer.observe(node.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={node} className="galaxy-art-scene" data-scene={id} data-near={near} style={{ top: index * SCENE_HEIGHT - 90, height: SCENE_HEIGHT + 180 }}>
    {near && <img src={galaxySceneryAsset(id)} alt="" width="1024" height="1536" decoding="async" draggable={false} />}
  </div>;
});

export default memo(function GalaxyBackdrop({ region }: { region: number }) {
  return <div className="galaxy-backdrop" aria-hidden="true">
    {galaxyScenery[region].map((id, index) => <Scene key={`${index}:${id}`} id={id} index={index} />)}
  </div>;
});
