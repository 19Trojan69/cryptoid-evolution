import assert from 'node:assert/strict';
import { stripTypeScriptTypes } from 'node:module';
import { HELPER } from './transform.mjs';

export async function verifyPlayerMuzzleFidelity({ page, guard }) {
  await guard();
  const helper = stripTypeScriptTypes(HELPER);
  const result = await page.evaluate(helper => {
    const write = new Function(helper + ';return setLocalPlayerMuzzle;')();
    const host = document.querySelector('.player-ship'), leaf = host?.querySelector('.player-muzzle-flash');
    if (!host || !leaf) throw Error('Original mounted player and muzzle required');
    const nodes = [host, ...host.querySelectorAll('*')];
    const originalHostStyle = host.style.cssText, originalLeafStyle = leaf.style.cssText;
    const animations = document.getAnimations().map(a => ({ a, startTime: a.startTime, rate: a.playbackRate }));
    const properties = ['opacity', 'height', 'width', 'transform', 'filter', 'color', 'background-image',
      'mask-image', '-webkit-mask-image', 'box-shadow', 'z-index', 'visibility', 'display', 'clip-path'];
    const snapshot = () => nodes.map(node => {
      const c = getComputedStyle(node), r = node.getBoundingClientRect();
      return { style: properties.map(p => c.getPropertyValue(p)), box: [r.x, r.y, r.width, r.height] };
    });
    const same = (a, b, reason) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw Error(reason); };
    const originalComputed = snapshot(), cases = [];
    try {
      for (const value of ['0', '.01', '.1', '.375', '.75', '1', '.5', '0']) {
        leaf.style.removeProperty('--muzzle-light'); host.style.setProperty('--muzzle-light', value);
        const control = snapshot();
        host.style.removeProperty('--muzzle-light'); write(host, value);
        same(snapshot(), control, 'Computed style or geometry differs at ' + value);
        if (host.style.getPropertyValue('--muzzle-light') !== '') throw Error('Variable leaked back to player root');
        if (leaf.style.getPropertyValue('--muzzle-light') !== value) throw Error('Leaf has a stale value');
        cases.push({ value, computedConsumersAndGeometryEqual: true });
      }
      const probe = document.createElement('div'); probe.className = 'player-ship'; document.body.append(probe);
      try {
        write(probe, '.4');
        if (probe.style.getPropertyValue('--muzzle-light') !== '.4') throw Error('Missing-consumer fallback lost');
        let target = document.createElement('i'); target.className = 'player-muzzle-flash'; probe.append(target);
        write(probe, '.6');
        if (probe.style.getPropertyValue('--muzzle-light') !== '' || target.style.getPropertyValue('--muzzle-light') !== '.6') throw Error('Late consumer/fallback cleanup failed');
        target.remove(); target = document.createElement('i'); target.className = 'player-muzzle-flash'; probe.append(target);
        write(probe, '.2');
        if (target.style.getPropertyValue('--muzzle-light') !== '.2') throw Error('Replaced consumer is stale');
        const next = probe.cloneNode(true); document.body.append(next);
        try { write(next, '.3'); if (next.querySelector('.player-muzzle-flash').style.getPropertyValue('--muzzle-light') !== '.3') throw Error('New host uses stale owner'); }
        finally { next.remove(); }
      } finally { probe.remove(); }
    } finally { host.style.cssText = originalHostStyle; leaf.style.cssText = originalLeafStyle; }
    same(snapshot(), originalComputed, 'Original computed presentation not restored');
    const current = [host, ...host.querySelectorAll('*')];
    if (current.length !== nodes.length || current.some((n, i) => n !== nodes[i])) throw Error('Mounted player nodes replaced');
    const now = document.getAnimations();
    if (now.length !== animations.length || animations.some(x => !now.includes(x.a) || x.a.startTime !== x.startTime || x.a.playbackRate !== x.rate)) throw Error('Native animation identity/timing changed');
    return { cases, testedExistingNodes: nodes.length, mountedNodesRetained: true,
      missingConsumerFallback: true, fallbackRemovedOnConsumerMount: true,
      replacedLeafAndNewHostVerified: true, nativeAnimationIdentityAndTimingRetained: true,
      originalComputedPresentationRestored: true, fullPixelIdentityMeasured: false };
  }, helper);
  await guard(); assert.equal(result.cases.length, 8); return result;
}
