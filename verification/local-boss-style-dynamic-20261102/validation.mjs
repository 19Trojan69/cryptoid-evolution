const check = (ok, message) => { if (!ok) throw Error(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function compareDynamicSnapshots(control, leaves, expected) {
  check(control.canonicalMarkup === leaves.canonicalMarkup, 'All non-target markup, geometry and SVG references must match');
  if (expected.falling || expected.absent) {
    check(control.engines.length === 0 && leaves.engines.length === 0 && control.lights.length === 0 && leaves.lights.length === 0,
      'No new consumers during fall or absence');
    return { engines: 0, lights: 0 };
  }
  check(control.engines.length > 0 && control.engines.length <= 16 && control.lights.length > 0 && control.lights.length <= 32, 'Bounded real consumers');
  check(control.engines.length === leaves.engines.length && control.lights.length === leaves.lights.length, 'Identical consumer counts');
  check(control.rootThrust === expected.thrust && leaves.rootThrust === '', 'Original root formula and removed candidate variable');
  check(control.svgCharge !== '' && Number(control.svgCharge) === expected.charge && leaves.svgCharge === '', 'Original charge formula and removed candidate variable');
  check(control.firing === expected.firing && leaves.firing === expected.firing, 'Original firing class must follow every update');
  control.engines.forEach((c, i) => {
    const l = leaves.engines[i];
    check(c.inlineHeight === '' && l.inlineHeight.endsWith('px'), 'Direct height only at existing candidate engines');
    check(Math.abs(parseFloat(l.inlineHeight) - parseFloat(expected.thrust)) <= Math.max(1, parseFloat(expected.thrust)) * 1e-6,
      'Candidate height must reflect the current nested model values: ' + JSON.stringify({ inline: l.inlineHeight,
        expected: expected.thrust, nativeControl: c.computedHeight, nativeCandidate: l.computedHeight }));
    check(c.computedHeight === l.computedHeight, 'Exactly equal native heights');
  });
  control.lights.forEach((c, i) => {
    const l = leaves.lights[i], wanted = expected.firing && c.kind === 'boss-special-muzzle' ? 1 : .25 + expected.charge * .75;
    check(c.kind === l.kind && c.inlineOpacity === '' && l.inlineOpacity !== '', 'Direct opacity only at matching existing consumers');
    check(Math.abs(Number(l.inlineOpacity) - wanted) <= 1e-6, 'Candidate consumers must receive every changed charge/firing context');
    check(same(c.native, l.native), 'Exactly equal native opacity, fill and stroke including firing override');
  });
  return { engines: control.engines.length, lights: control.lights.length };
}
