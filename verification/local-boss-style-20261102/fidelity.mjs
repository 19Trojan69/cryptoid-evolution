import assert from 'node:assert/strict';
export function pausedLocalStyleFidelity(condition, host = window) {
  const check = (v, m) => { if (!v) throw Error(m); };
  check(['control', 'leaves'].includes(condition), 'Declared built condition');
  const state = host.__crossDeviceTest?.inspect();
  check(state?.status === 'paused' && state.technicalPause === false && !host.document.hidden, 'Real foreground pause');
  const root = host.document.querySelector('.sector-boss'), svg = root?.querySelector('.boss-special-weapon');
  const engines = root ? [...root.querySelectorAll('.boss-engine-flame')] : [];
  const lights = svg ? [...svg.querySelectorAll('.boss-special-conductor, .boss-special-muzzle')] : [];
  check(root && svg && engines.length > 0 && engines.length <= 16 && lights.length > 0 && lights.length <= 32, 'Original bounded consumers');
  const conductor = lights.find(n => n.classList.contains('boss-special-conductor')); check(conductor, 'Existing nonfiring conductor');
  const nodes = [root, svg, ...engines, ...lights], css = nodes.map(n => n.style.cssText), originalClass = svg.getAttribute('class');
  const read = () => ({ heights: engines.map(n => host.getComputedStyle(n).height), opacities: lights.map(n => host.getComputedStyle(n).opacity) });
  const before = read(), animations = root.getAnimations({ subtree: true }).map(a => ({ a, start: a.startTime, rate: a.playbackRate }));
  check(animations.length <= 512, 'Bounded native animations');
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b), restore = () => nodes.forEach((n, i) => n.style.cssText = css[i]);
  const thrust = condition === 'control' ? root.style.getPropertyValue('--boss-thrust') : engines[0].style.height;
  const charge = condition === 'control' ? Number(svg.style.getPropertyValue('--weapon-charge')) : (Number(conductor.style.opacity) - .25) / .75;
  check(thrust.endsWith('px') && Number.isFinite(parseFloat(thrust)), 'Built numeric thrust declaration');
  check(Number.isFinite(charge) && charge >= 0 && charge <= 1, 'Built finite bounded charge');
  const firing = svg.classList.contains('boss-special-weapon-firing');
  if (condition === 'control') {
    check(engines.every(n => n.style.height === '') && lights.every(n => n.style.opacity === ''), 'Original inherited declaration scope');
  } else {
    check(root.style.getPropertyValue('--boss-thrust') === '' && svg.style.getPropertyValue('--weapon-charge') === '', 'No broad variable declaration');
    check(engines.every(n => n.style.height === thrust) && lights.every(n => n.style.opacity !== ''), 'Built direct consumer declarations');
  }
  try {
    if (condition === 'control') {
      root.style.removeProperty('--boss-thrust'); svg.style.removeProperty('--weapon-charge');
      engines.forEach(n => n.style.height = thrust);
      lights.forEach(n => n.style.opacity = String(firing && n.classList.contains('boss-special-muzzle') ? 1 : .25 + charge * .75));
    } else {
      root.style.setProperty('--boss-thrust', thrust); svg.style.setProperty('--weapon-charge', String(charge));
      engines.forEach(n => n.style.removeProperty('height')); lights.forEach(n => n.style.removeProperty('opacity'));
    }
    check(same(before, read()), 'Exactly same native computed heights and opacities after declaration redistribution');
    restore(); check(same(before, read()), 'Original native outputs restored');
    const after = root.getAnimations({ subtree: true });
    check(after.length === animations.length && animations.every(r => after.includes(r.a)
      && r.a.startTime === r.start && r.a.playbackRate === r.rate), 'Native animation identities, starts and rates retained');
    check(nodes.every((n, i) => n.style.cssText === css[i]), 'Original inline declarations restored');
    check(svg.getAttribute('class') === originalClass, 'Original firing class retained');
    return { condition, engines: engines.length, chargeConsumers: lights.length, computedOutputs: before,
      originalInlineDeclarationsRestored: true, sameNativeComputedValues: true, sameNativeAnimationsStartsAndRates: true,
      originalFiringClassRetained: true, onlyWhilePaused: true, appOrAnimationClocksWritten: false, newTimersOrFrames: false };
  } finally { restore(); }
}
export async function verifyLocalStyleFidelity({ page, guard, condition }) {
  await guard('paused'); const proof = await page.evaluate(pausedLocalStyleFidelity, condition); await guard('paused');
  for (const k of ['originalInlineDeclarationsRestored', 'sameNativeComputedValues', 'sameNativeAnimationsStartsAndRates',
    'originalFiringClassRetained', 'onlyWhilePaused']) assert.equal(proof[k], true);
  return proof;
}
