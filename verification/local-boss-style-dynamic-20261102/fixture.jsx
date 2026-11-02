// Standalone component-input test. No game controller, gameplay clock, auth,
// backend, account, capture session or live-game frame scheduler is started.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import Control from 'qa-local-style:control';
import Leaves from 'qa-local-style:leaves';
import { createSectorBoss, BOSS_ENTRY_MS } from '../../frontend/src/pages/sectorBoss';
import { coreInterval } from '../../frontend/src/pages/bossCore';
import { engineFlamePercent } from '../../frontend/src/pages/shipRealism';
import { compareDynamicSnapshots } from './validation.mjs';
import '../../frontend/src/index.css';

const check = (ok, message) => { if (!ok) throw Error(message); };
const entries = Object.entries({ control: Control, leaves: Leaves }).map(([condition, View]) => {
  const shell = document.createElement('div'); shell.className = 'game-shell';
  const field = document.createElement('div'); field.className = 'game-field';
  Object.assign(field.style, { position: 'relative', width: '430px', height: '825px' });
  const container = document.createElement('div'); field.append(container); shell.append(field); document.body.append(shell);
  return { condition, View, container, root: null, originalNodes: null, animations: [] };
});
let boss = null, now = 20000, fall = null;
// Detached fixture-only CSSOM parser: the same engine serializes the expected
// current px input. No tolerance is added to the actual native height check.
const expectedHeightStyle = document.createElement('i').style;
const stats = { dynamicCases: 0, fallingCases: 0, absentCases: 0, sameNodeChecks: 0,
  retainedNativeAnimationChecks: 0, retainedStartedAnimationChecks: 0, enginesChecked: 0, lightsChecked: 0 };

function canonicalMarkup(container) {
  if (!container.firstElementChild) return '';
  const clone = container.firstElementChild.cloneNode(true), all = [clone, ...clone.querySelectorAll('*')];
  const ids = all.filter(n => n.id).map((n, index) => [n.id, 'qa-id-' + index]).sort((a, b) => b[0].length - a[0].length);
  clone.style.removeProperty('--boss-thrust');
  for (const n of clone.querySelectorAll('.boss-engine-flame')) n.style.removeProperty('height');
  const svg = clone.querySelector('.boss-special-weapon');
  if (svg) svg.style.removeProperty('--weapon-charge');
  for (const n of clone.querySelectorAll('.boss-special-conductor, .boss-special-muzzle')) {
    n.style.removeProperty('opacity'); if (n.style.cssText === '') n.removeAttribute('style');
  }
  const value = n => n.nodeType === Node.TEXT_NODE ? n.textContent : [n.tagName,
    [...n.attributes].map(a => [a.name, ids.reduce((v, [id, replacement]) => v.split(id).join(replacement), a.value)])
      .sort((a, b) => a[0].localeCompare(b[0])), [...n.childNodes].map(value)];
  return JSON.stringify(value(clone));
}
function snapshot(e, stable) {
  const hull = e.container.firstElementChild, svg = hull?.querySelector('.boss-special-weapon');
  const engines = hull ? [...hull.querySelectorAll('.boss-engine-flame')] : [];
  const lights = svg ? [...svg.querySelectorAll('.boss-special-conductor, .boss-special-muzzle')] : [];
  if (stable) {
    check(hull === e.originalNodes.hull && svg === e.originalNodes.svg, 'Existing hull and memoized SVG stay mounted through nested input updates');
    check(engines.every((n, i) => n === e.originalNodes.engines[i]) && lights.every((n, i) => n === e.originalNodes.lights[i]),
      'Existing flame and memoized charge-consumer nodes stay mounted');
    check(JSON.stringify([...svg.querySelectorAll('[id]')].map(n => n.id)) === e.originalNodes.ids, 'Native SVG references remain stable within each mounted component');
    stats.sameNodeChecks++;
  }
  const animations = hull?.getAnimations({ subtree: true }) ?? [];
  if (stable) for (const old of e.animations) if (old.a.effect?.target?.isConnected && old.a.playState !== 'finished' && old.a.playState !== 'idle') {
    check(animations.includes(old.a) && old.a.startTime === old.start && old.a.playbackRate === old.rate,
      'An ongoing original native animation cannot be replaced or retimed by a prop update');
    stats.retainedNativeAnimationChecks++; if (old.start !== null) stats.retainedStartedAnimationChecks++;
  }
  e.animations = animations.map(a => ({ a, start: a.startTime, rate: a.playbackRate }));
  if (!stable && svg) e.originalNodes = { hull, svg, engines, lights, ids: JSON.stringify([...svg.querySelectorAll('[id]')].map(n => n.id)) };
  return { canonicalMarkup: canonicalMarkup(e.container), rootThrust: hull?.style.getPropertyValue('--boss-thrust') ?? '',
    svgCharge: svg?.style.getPropertyValue('--weapon-charge') ?? '', firing: !!svg?.classList.contains('boss-special-weapon-firing'),
    engines: engines.map(n => ({ inlineHeight: n.style.height, computedHeight: getComputedStyle(n).height })),
    lights: lights.map(n => { const s = getComputedStyle(n); return {
      kind: n.classList.contains('boss-special-muzzle') ? 'boss-special-muzzle' : 'boss-special-conductor',
      inlineOpacity: n.style.opacity, native: { opacity: s.opacity, fill: s.fill, stroke: s.stroke },
    }; }) };
}
function render(expected, stable = false) {
  now += 16;
  for (const e of entries) flushSync(() => e.root.render(React.createElement(e.View,
    { boss: fall ? null : boss, fall, ready: true, light: .25, now, fallDurationMs: 5000, title: 'Boss' })));
  const pair = entries.map(e => snapshot(e, stable)), checked = compareDynamicSnapshots(...pair, expected);
  stats.enginesChecked += checked.engines; stats.lightsChecked += checked.lights;
}
function start(id) {
  for (const e of entries) { if (e.root) flushSync(() => e.root.unmount());
    e.root = createRoot(e.container, { identifierPrefix: e.condition + '-' }); e.originalNodes = null; e.animations = []; }
  boss = createSectorBoss(id * 10, 430, 90, 825); boss.y = 220; boss.core = { elapsed: 0, volley: 0 }; fall = null;
}
function step({ exposed, volley, elapsed, thrust, flightElapsed }, stable) {
  // Keep boss/core identities unchanged: the real view must observe changing
  // nested scalars even when its memoized artwork is retained.
  boss.turrets.forEach(t => t.health = exposed ? 0 : 1);
  boss.core.elapsed = elapsed; boss.core.volley = volley;
  boss.core.lastShotColor = volley ? '#e19c52' : undefined;
  boss.elapsed = flightElapsed; boss.visualMotion = { thrust };
  const expected = { charge: exposed ? Math.min(1, elapsed / coreInterval(boss)) : 0,
    firing: exposed && volley > 0 && elapsed < 180,
    thrust: String(6 + boss.height * engineFlamePercent(thrust, flightElapsed < BOSS_ENTRY_MS ? 'launch' : 'idle') / 100) + 'px' };
  expectedHeightStyle.height = expected.thrust; expected.canonicalThrust = expectedHeightStyle.height;
  render(expected, stable); stats.dynamicCases++;
}
window.__localStyleDynamic = {
  runModel(id) {
    start(id); let index = 0;
    for (const [exposed, volley, elapsed] of [[false, 0, 0], [true, 0, 0], [true, 0, 450], [true, 0, 1800],
      [true, 1, 0], [true, 1, 90], [true, 1, 179], [true, 1, 180], [true, 1, 18000]])
      for (const [thrust, flightElapsed] of [[0, 0], [.15, BOSS_ENTRY_MS - 1], [.75, BOSS_ENTRY_MS], [1, 60000]])
        step({ exposed, volley, elapsed, thrust, flightElapsed }, index++ > 0);
    fall = { id: 1, x: 215, y: 220, bossShipWidth: boss.width, bossHeight: boss.height,
      bossImage: boss.config.image, bossModel: boss, fireSites: boss.config.fireSites, fallDistance: 177 };
    render({ falling: true }); stats.fallingCases++;
    boss = null; fall = null; render({ absent: true }); stats.absentCases++;
    return { ...stats };
  },
  beginAnimationCheck() {
    start(2); step({ exposed: true, volley: 1, elapsed: 90, thrust: .5, flightElapsed: 60000 }, false);
    fall = { id: 1, x: 215, y: 220, bossShipWidth: boss.width, bossHeight: boss.height,
      bossImage: boss.config.image, bossModel: boss, fireSites: boss.config.fireSites, fallDistance: 177 };
    render({ falling: true });
  },
  checkAnimationUpdate() {
    // Fall has no reactor, so continuity is checked directly on the same hull
    // and ongoing native animations after real browser time has elapsed.
    for (const e of entries) {
      const before = e.container.firstElementChild, running = before.getAnimations({ subtree: true });
      check(running.length > 0, 'Original falling hull supplies real native animations');
      const records = running.map(a => ({ a, start: a.startTime, rate: a.playbackRate }));
      now += 16; flushSync(() => e.root.render(React.createElement(e.View,
        { boss: null, fall, ready: true, light: .25, now, fallDurationMs: 5000, title: 'Boss' })));
      check(e.container.firstElementChild === before, 'Falling hull retained after React update');
      const after = before.getAnimations({ subtree: true });
      for (const r of records) {
        check(after.includes(r.a) && r.a.startTime === r.start && r.a.playbackRate === r.rate, 'Started fall animations retained without retiming');
        stats.retainedNativeAnimationChecks++; if (r.start !== null) stats.retainedStartedAnimationChecks++;
      }
    }
    check(stats.retainedStartedAnimationChecks > 0, 'Continuity check includes actually started native animations');
    return { ...stats };
  },
  finish() {
    for (const e of entries) { flushSync(() => e.root.unmount()); e.root = null; e.originalNodes = null; e.animations = []; }
    boss = null; fall = null;
    check(entries.every(e => e.container.childElementCount === 0), 'Both React roots explicitly unmounted');
    return { ...stats, rootsUnmounted: true, physicalDevice: false, whiteScreenFixed: false };
  },
};
