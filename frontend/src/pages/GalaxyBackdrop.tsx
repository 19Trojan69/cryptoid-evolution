import { requestGameFrame, cancelGameFrame } from '../lib/frameScheduler';
import { memo, useEffect, useRef, useState } from 'react';
import { GALAXY_REGION_HEIGHT } from './galaxyModel';
import { galaxyScenery, galaxySceneryAsset } from './galaxyScenery';

const SCENE_HEIGHT = GALAXY_REGION_HEIGHT / 10;

const Scene = memo(function Scene({ id, index, previous }: { id: string; index: number; previous?: string }) {
  const node = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!node.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      const frame = requestGameFrame(() => setNear(true));
      return () => cancelGameFrame(frame);
    }
    const observer = new IntersectionObserver(entries => setNear(entries.some(entry => entry.isIntersecting)), { rootMargin: '300px' });
    observer.observe(node.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={node} className="galaxy-art-scene" data-scene={id} data-near={near}
    style={{ top: index * SCENE_HEIGHT, height: `calc(${SCENE_HEIGHT}px + var(--galaxy-blend))` }}>
    {near && <>
      {/* Continue the exact crop of the preceding region under this region's first scene. */}
      {previous && <img className="galaxy-art-continuation" style={{ top: -SCENE_HEIGHT }} data-scene={previous}
        src={galaxySceneryAsset(previous)} alt="" width="1024" height="1536" decoding="async" draggable={false} />}
      <img className={index > 0 || previous ? 'galaxy-art-fade-in' : undefined} data-scene={id}
        src={galaxySceneryAsset(id)} alt="" width="1024" height="1536" decoding="async" draggable={false} />
    </>}
  </div>;
});

export default memo(function GalaxyBackdrop({ region }: { region: number }) {
  const previous = galaxyScenery[region + 1]?.at(-1);
  return <div className="galaxy-backdrop" aria-hidden="true">
    {galaxyScenery[region].map((id, index) => <Scene key={`${index}:${id}`} id={id} index={index} previous={index === 0 ? previous : undefined} />)}
  </div>;
});
