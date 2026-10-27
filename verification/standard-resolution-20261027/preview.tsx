// Local component fixture only. Never imported by an application route/build.
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import * as CurrentImpact from '../../frontend/src/pages/CanvasEffects';
import * as ReferenceImpact from 'standard-impact-reference';
import * as PreviousImpact from 'standard-impact-previous';
import CurrentRock from '../../frontend/src/pages/BonusRockLayer';
import ReferenceRock from 'standard-rock-reference';
import PreviousRock from 'standard-rock-previous';
import CurrentBoss from '../../frontend/src/pages/BossWeaponsView';
import ReferenceBoss from 'standard-boss-reference';
import PreviousBoss from 'standard-boss-previous';
import { createSectorBoss, moveSectorBoss } from '../../frontend/src/pages/sectorBoss';
import { weaponCanvasSize } from '../../frontend/src/pages/bossWeaponRenderer';
import { preloadBossWeapons } from '../../frontend/src/pages/bossWeaponTextures';
import { retainPreparedHulls } from '../../frontend/src/pages/paintedShip';
import { staticHullAsset } from '../../frontend/src/pages/staticHullAssets';
import { gameRenderScale } from '../../frontend/src/pages/renderResolution';

const variants = [
  { name: 'reference', impact: ReferenceImpact, Rock: ReferenceRock, Boss: ReferenceBoss },
  { name: 'candidate', impact: CurrentImpact, Rock: CurrentRock, Boss: CurrentBoss },
  { name: 'previous', impact: PreviousImpact, Rock: PreviousRock, Boss: PreviousBoss },
];
const root = createRoot(document.getElementById('root')!);
const held = new Set<HTMLCanvasElement>();
let plan: ReturnType<typeof retainPreparedHulls> | undefined;
let props: any;
const pieces = <div>{Array.from({ length: 4 }, (_, i) => <i key={i} style={{
  clipPath: `polygon(${i % 2 * 50}% ${Math.floor(i / 2) * 50}%,${i % 2 * 50 + 50}% ${Math.floor(i / 2) * 50}%,${i % 2 * 50 + 50}% ${Math.floor(i / 2) * 50 + 50}%,${i % 2 * 50}% ${Math.floor(i / 2) * 50 + 50}%)`,
  transformOrigin: `${i % 2 * 50 + 25}% ${Math.floor(i / 2) * 50 + 25}%`,
  '--fragment-x': `${(i % 2 ? 1 : -1) * 85}px`, '--fragment-y': `${(i < 2 ? -1 : 1) * 95}px`,
  '--fragment-spin': `${(i % 2 ? 1 : -1) * 240}deg`, '--fragment-delay': `${i * 7}ms`,
} as any} />)}</div>;

function render() {
  const { width, height, paused, empty, boss, id, age, kind } = props;
  const rocks = empty ? [] : [{ id: 1, x: width * .35, y: height * .6, radius: 25, rotation: .4, seed: 2, hitMs: 110 }];
  const effects = empty ? [] : [{ id: 2, x: width * .6, y: height * .7, radius: 25, seed: 3, age, points: 25, final: true }];
  flushSync(() => root.render(<>{variants.map(({ name, impact, Rock, Boss }) => {
    const { CanvasEffectLayer, CanvasImpact } = impact;
    return <section key={name} data-variant={name} className="game-shell" data-effects-paused={paused}
      style={{ position: 'absolute', left: 0, top: 0, width, height, opacity: name === 'candidate' ? 1 : 0 }}>
      <CanvasEffectLayer enabled>
        {!empty && kind === 'impact' && <CanvasImpact effect={{ id, kind: 'explosion', x: width * .5, y: height * .45, debrisSize: 50, sprite: 0, debrisColor: 'gold', shipStage: 1 }}
          debris={pieces} original={<div data-original={name}>Original effect fallback</div>} />}
      </CanvasEffectLayer>
      <Rock width={width} height={height} rocks={kind === 'rock' ? rocks : []} effects={kind === 'rock' ? effects : []} />
      <div className="sector-boss" style={{ position: 'absolute', width: boss.width, height: boss.height, left: '20%', top: '20%' }}>
        <Boss boss={boss} frozen={paused} />
      </div>
    </section>;
  })}</>));
  for (const c of document.querySelectorAll<HTMLCanvasElement>('canvas')) held.add(c);
}
async function prepare(value: any) {
  const { width, height } = value;
  props = { paused: false, empty: false, id: 1, age: 90, kind: 'impact', ...value,
    boss: moveSectorBoss(createSectorBoss(value.stage || 10, width, 96, height), 10000, width, height) };
  plan ??= retainPreparedHulls([{ sprite: 0, color: 'gold', stage: 1 }]);
  if (!(await plan.settled).every(Boolean)) throw Error('Fixture original hull is not ready');
  const hull = staticHullAsset(0, 'gold', 1)!.url;
  await Promise.all([preloadBossWeapons(props.boss.config), ...variants.map(v => v.impact.prepareCanvasImpactResources(hull, 62.5))]);
}
async function digest(c: HTMLCanvasElement) {
  if (!c.width || !c.height) return 'released';
  const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map(v => v.toString(16).padStart(2, '0')).join('');
}
async function inspect() {
  const rows = [];
  for (const { name, impact } of variants) {
    const host = document.querySelector(`[data-variant="${name}"]`)!;
    const canvases: any = {};
    for (const selector of ['normal-effects-surface', 'bonus-rock-layer', 'boss-weapons-canvas']) {
      const c = host.querySelector<HTMLCanvasElement>('.' + selector)!;
      const box = c.getBoundingClientRect();
      canvases[selector] = { pixels: [c.width, c.height], css: [box.x, box.y, box.width, box.height],
        hash: await digest(c), nonempty: !!(c.width && c.height) && c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data.some(v => v > 0) };
    }
    rows.push({ name, canvases, resources: impact.canvasEffectResources() });
  }
  return { rows, scale: gameRenderScale(window.devicePixelRatio), size: weaponCanvasSize(props.boss),
    field: [props.width, props.height], deviceRatio: window.devicePixelRatio };
}
(window as any).__standard = {
  prepare, mount: render, inspect,
  ready: () => variants.every(v => v.impact.canvasEffectResources().registeredEffects === (props?.kind === 'impact' && !props?.empty ? 1 : 0))
    && [...document.querySelectorAll<HTMLCanvasElement>('.boss-weapons-canvas')].every(c => !c.hidden && c.width > 1),
  update: (value: any) => { props = { ...props, ...value }; render(); },
  damage: (destroyed = false) => { props.boss = { ...props.boss, weaponClock: 10050,
    turrets: props.boss.turrets.map((g: any, i: number) => ({ ...g, a: .2 + i * .1, health: destroyed ? 0 : g.maxHealth * .4, lastFired: 10000, firedBarrels: [0] })) }; render(); },
  lose: () => document.querySelector('[data-variant="candidate"] .normal-effects-surface')!.dispatchEvent(new Event('contextlost')),
  unmount: () => { flushSync(() => root.render(null)); plan?.release(); plan = undefined;
    return { allReleased: [...held].every(c => c.width === 0 && c.height === 0),
      stats: variants.map(v => v.impact.canvasEffectResources()) }; },
};
