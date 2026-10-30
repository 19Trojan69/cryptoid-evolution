import assert from 'node:assert/strict';
export const reflectionHide = '.diagnostic-flat-scene .sector-boss .hull-reflection { display: none !important; }\n';
export function reflectionCss(source, enabled) {
  assert.equal(source.split(reflectionHide).length, 2, 'Exactly the previous reflection hide rule');
  assert.ok(source.includes('mask-image: none !important;'));
  assert.ok(source.includes('-webkit-mask-image: none !important;'));
  if (!enabled) return source;
  // Remove the diagnostic hiding rule, restoring the original cascade rather
  // than inventing a different opacity, mask, blend, animation or display rule.
  const changed = source.replace(reflectionHide, '');
  assert.equal(reflectionHide + changed, source, 'Only the leading reflection hiding rule may be removed');
  return changed;
}
