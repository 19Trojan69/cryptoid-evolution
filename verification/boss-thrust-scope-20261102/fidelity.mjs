import assert from 'node:assert/strict';

// Short controls only, behind the existing confirmed manual pause. Reversing
// the declaration distribution uses exactly the currently rendered value.
// Everything is restored in this one task, before any profiling checkpoint.
export async function verifyThrustFidelity({ page, guard, condition }) {
  await guard('paused');
  const proof = await page.evaluate(condition => {
    const check = (value, message) => { if (!value) throw Error(message); };
    const root = document.querySelector('.sector-boss'); check(root, 'Original boss hull present');
    const engines = [...root.querySelectorAll('.boss-engine-flame')], svg = root.querySelector('.boss-special-weapon');
    check(engines.length > 0 && svg, 'Original engines and SVG retained');
    const property = '--boss-thrust';
    const nodes = [root, ...engines];
    const originals = nodes.map(node => ({ value: node.style.getPropertyValue(property),
      priority: node.style.getPropertyPriority(property), css: node.style.cssText }));
    const restore = () => nodes.forEach((node, index) => {
      const original = originals[index];
      if (original.value) node.style.setProperty(property, original.value, original.priority);
      else node.style.removeProperty(property);
    });
    const read = () => ({ rootInline: root.style.getPropertyValue(property),
      svgInherited: getComputedStyle(svg).getPropertyValue(property).trim(),
      engines: engines.map(node => ({ inline: node.style.getPropertyValue(property),
        variable: getComputedStyle(node).getPropertyValue(property).trim(), height: getComputedStyle(node).height })),
      animations: root.getAnimations({ subtree: true }).map(animation =>
        ({ animation, start: animation.startTime, rate: animation.playbackRate })) });
    let before, alternative, after;
    try {
      before = read(); const value = before.engines[0].variable;
      check(value.endsWith('px') && Number.isFinite(parseFloat(value)), 'Rendered numeric original thrust value');
      check(before.engines.every(row => row.variable === value), 'Same existing value on every engine');
      check(condition === 'control' ? before.rootInline === value && before.engines.every(row => row.inline === '')
        : before.rootInline === '' && before.engines.every(row => row.inline === value), 'Built declaration scope matches condition');
      if (condition === 'control') {
        engines.forEach(node => node.style.setProperty(property, value)); root.style.removeProperty(property);
      } else {
        root.style.setProperty(property, value); engines.forEach(node => node.style.removeProperty(property));
      }
      alternative = read();
      check(alternative.engines.every((row, i) => row.variable === before.engines[i].variable
        && row.height === before.engines[i].height), 'Exactly identical browser-computed engine values and heights');
      const retained = snapshot => snapshot.animations.length === before.animations.length
        && snapshot.animations.every(row => before.animations.some(original => original.animation === row.animation
          && original.start === row.start && original.rate === row.rate));
      check(retained(alternative), 'Redistribution preserves animation instances, start times and playback rates');
      restore(); after = read();
      check(retained(after), 'Restoration preserves animation instances, start times and playback rates');
      check(nodes.every((node, i) => node.style.cssText === originals[i].css), 'Exact original inline style text restored');
      check(after.engines.every((row, i) => row.variable === before.engines[i].variable
        && row.height === before.engines[i].height), 'Original computed engine heights restored');
      const leaf = condition === 'leaf' ? before : alternative, control = condition === 'control' ? before : alternative;
      check(leaf.svgInherited === '' && control.svgInherited === value, 'Nonconsumer SVG does not inherit leaf variable');
      return { condition, engines: engines.length, value, computedHeights: before.engines.map(row => row.height),
        sameComputedFlameHeights: true, sameNativeAnimationInstances: true, sameNativeStartsAndRates: true,
        originalInlineStylesRestored: true, nonconsumerSvgInheritanceRemovedInLeaf: true,
        onlyWhilePaused: true, appOrAnimationClocksWritten: false, newTimersOrFrames: false };
    } finally { restore(); }
  }, condition);
  await guard('paused');
  for (const key of ['sameComputedFlameHeights', 'sameNativeAnimationInstances', 'sameNativeStartsAndRates',
    'originalInlineStylesRestored', 'nonconsumerSvgInheritanceRemovedInLeaf', 'onlyWhilePaused']) assert.equal(proof[key], true);
  return proof;
}
