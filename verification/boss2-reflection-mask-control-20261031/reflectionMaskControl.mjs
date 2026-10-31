export const reflectionMaskSelector = '.diagnostic-flat-scene .sector-boss .hull-reflection';
export function reflectionMaskCss(unmasked) {
  return unmasked
    ? reflectionMaskSelector + ' { mask-image: none !important; -webkit-mask-image: none !important; }\n'
    : '/* Original reflection image mask retained; heat remains unmasked. */\n';
}
