export const conditions = ['root', 'charge-opacity', 'thrust-height', 'both-local'];
export const pairs = Array.from({ length: 16 }, (_, i) => ({ charge: (i + 1) / 18, thrust: 12.125 + i * .53125 }));

// Serialized into the guest page only after a confirmed ordinary Home pause.
// No game/model/animation clock writes, listeners, timers, RAF or retained hook.
export function pausedSceneProbe({ condition, pairs, prefix, firingFidelity = false }, host = window) {
  const check = (value, message) => { if (!value) throw Error(message); };
  check(['root', 'charge-opacity', 'thrust-height', 'both-local'].includes(condition), 'Declared synthetic condition');
  check(Array.isArray(pairs) && pairs.length === 16, 'Exactly sixteen fixed steps');
  for (const p of pairs) check(Number.isFinite(p.charge) && p.charge >= 0 && p.charge <= 1
    && Number.isFinite(p.thrust) && p.thrust >= 6 && p.thrust <= 80, 'Bounded synthetic values');
  check(/^cryptoid-recalc-r[12]-(root|charge-opacity|thrust-height|both-local)-$/.test(prefix), 'Owned bounded timing prefix');
  const doc = host.document, state = host.__crossDeviceTest?.inspect();
  check(state?.status === 'paused' && state.technicalPause === false && !doc.hidden, 'Real foreground manual pause');
  const root = doc.querySelector('.sector-boss'), svg = root?.querySelector('.boss-special-weapon');
  const engines = root ? [...root.querySelectorAll('.boss-engine-flame')] : [];
  const lights = svg ? [...svg.querySelectorAll('.boss-special-conductor, .boss-special-muzzle')] : [];
  check(root && svg && engines.length > 0 && engines.length <= 16 && lights.length > 0 && lights.length <= 32, 'Original bounded consumers');
  const nodes = [root, svg, ...engines, ...lights], originals = nodes.map(node => node.getAttribute('style'));
  const originalCanonical = nodes.map(node => node.style.cssText);
  const originalClass = svg.getAttribute('class');
  const animations = root.getAnimations({ subtree: true }).map(animation => ({ animation, start: animation.startTime, rate: animation.playbackRate }));
  check(animations.length <= 512, 'Bounded original native animation set');
  const before = { heights: engines.map(n => host.getComputedStyle(n).height), opacities: lights.map(n => host.getComputedStyle(n).opacity) };
  const restoreStyles = () => nodes.forEach((node, i) => originals[i] === null
    ? node.removeAttribute('style') : node.setAttribute('style', originals[i]));
  const restore = () => { restoreStyles(); if (originalClass === null) svg.removeAttribute('class'); else svg.setAttribute('class', originalClass); };
  const read = () => ({ heights: engines.map(n => host.getComputedStyle(n).height), opacities: lights.map(n => host.getComputedStyle(n).opacity) });
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const opacity = (node, charge, firing) => firing && node.classList.contains('boss-special-muzzle') ? 1 : .25 + charge * .75;
  const set = (p, localCharge, localThrust, firing) => {
    if (localThrust) { root.style.removeProperty('--boss-thrust'); engines.forEach(n => n.style.setProperty('height', p.thrust + 'px')); }
    else root.style.setProperty('--boss-thrust', p.thrust + 'px');
    if (localCharge) { svg.style.removeProperty('--weapon-charge'); lights.forEach(n => n.style.setProperty('opacity', String(opacity(n, p.charge, firing)))); }
    else svg.style.setProperty('--weapon-charge', String(p.charge));
  };
  const outputs = []; let fidelityCases = 0;
  try {
    // Exercise the existing firing override separately from measured steps.
    // All four measured conditions keep the original scene class unchanged.
    if (firingFidelity) for (const firing of [false, true]) for (const charge of [0, .125, .5, .875, 1]) {
      restoreStyles(); svg.classList.toggle('boss-special-weapon-firing', firing);
      const p = { charge, thrust: 18.25 }; set(p, false, false, firing); const reference = read();
      set(p, true, true, firing); check(same(reference, read()), 'Native height/opacity equivalence including firing override'); fidelityCases++;
    }
    restore();
    const firing = svg.classList.contains('boss-special-weapon-firing');
    const localCharge = ['charge-opacity', 'both-local'].includes(condition), localThrust = ['thrust-height', 'both-local'].includes(condition);
    set({ charge: .01, thrust: 11.5 }, localCharge, localThrust, firing); read();
    for (const [i, p] of pairs.entries()) {
      host.performance.mark(prefix + i + ':start'); set(p, localCharge, localThrust, firing);
      const observed = read(); host.performance.mark(prefix + i + ':end'); outputs.push(observed);
    }
    restore(); check(same(before, read()), 'Original browser-computed outputs restored');
    const afterAnimations = root.getAnimations({ subtree: true });
    check(afterAnimations.length === animations.length && animations.every(row => afterAnimations.includes(row.animation)
      && row.animation.startTime === row.start && row.animation.playbackRate === row.rate), 'Same native animation objects, starts and rates');
    // Native SVG style synchronization during computed-style/animation reads
    // can materialize an empty style attribute. Reapply the exact original raw
    // attributes after these reads, while retaining the strict original check.
    restore();
    const restorationDifferences = nodes.map((n, i) => ({ index: i, tag: n.tagName, before: originals[i], after: n.getAttribute('style') }))
      .filter(row => row.before !== row.after).map(row => ({ ...row,
        canonicalBefore: originalCanonical[row.index], canonical: nodes[row.index].style.cssText }));
    check(restorationDifferences.length === 0, 'Exact original inline attributes restored: ' + JSON.stringify(restorationDifferences));
    check(svg.getAttribute('class') === originalClass, 'Original firing class restored');
    check(host.__crossDeviceTest.inspect().status === 'paused', 'No automatic Resume');
    return { condition, prefix, steps: pairs.length, engines: engines.length, chargeConsumers: lights.length, firing,
      outputs, firingFidelityCases: fidelityCases, originalInlineAttributesRestored: true, originalFiringClassRestored: true,
      originalComputedOutputsRestored: true, sameNativeAnimationsStartsAndRates: true,
      onlyWhilePaused: true, appOrAnimationClocksWritten: false, newAppTimersOrFrames: false };
  } finally { restore(); }
}
