export const reflectionBlendSelector = '.diagnostic-flat-scene .sector-boss .hull-reflection';
export function reflectionBlendCss(normal) {
  return normal ? reflectionBlendSelector + ' { mix-blend-mode: normal !important; }\n'
    : '/* Original screen blend retained; both boss overlays remain visible and unmasked. */\n';
}
