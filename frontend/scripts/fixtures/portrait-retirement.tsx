// Native-browser verification entry. This file is never imported by the game.
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import BossPortrait from '../../src/pages/BossPortrait';
import ShipPortrait from '../../src/pages/ShipPortrait';
import GalaxyBossArt from '../../src/pages/GalaxyBossArt';
import { loadBossArtwork } from '../../src/pages/bossArtwork';
import { loadShipArtwork } from '../../src/pages/shipArtwork';
import { shipEvolutionAsset } from '../../src/pages/shipEvolution';

type Kind = 'boss' | 'ship' | 'galaxy';
const root = createRoot(document.getElementById('root')!);
const retained: HTMLCanvasElement[] = [];
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
let kind: Kind, id = 2, silhouette = false;
const source = () => shipEvolutionAsset(id - 2, 1);
const artwork = () => kind === 'ship' ? loadShipArtwork(source(), 'grey') : loadBossArtwork(id, kind === 'boss' ? 1200 : 256);

(window as any).portraitTest = {
  mount(next: { kind: Kind; id: number; silhouette?: boolean }) {
    kind = next.kind; id = next.id; silhouette = !!next.silhouette;
    flushSync(() => root.render(kind === 'boss' ? <BossPortrait key={`${kind}:${id}:${silhouette}`} id={id} silhouette={silhouette} />
      : kind === 'ship' ? <ShipPortrait key={`${kind}:${id}:${silhouette}`} src={source()} name="Native portrait test" color="grey" silhouette={silhouette} />
      : <GalaxyBossArt key={`${kind}:${id}`} id={id} defeated />));
    // Deliberately retain detached view elements: GC cannot hide a missing release.
    retained.push(document.querySelector('#root canvas')!);
  },
  async settle() { await artwork(); await nextFrame(); await nextFrame(); },
  async capture() {
    const canvas = document.querySelector<HTMLCanvasElement>('#root canvas')!;
    const shared = await artwork();
    return { width: canvas.width, height: canvas.height, pixels: canvas.toDataURL('image/png'),
      sharedWidth: shared.width, sharedHeight: shared.height, ready: canvas.closest('[data-ready]')?.getAttribute('data-ready') };
  },
  unmount() { flushSync(() => root.render(null)); },
  retired() { return retained.map(canvas => ({ width: canvas.width, height: canvas.height })); },
  async shared() { const art = await artwork(); return { width: art.width, height: art.height, pixels: art.toDataURL('image/png') }; },
};
