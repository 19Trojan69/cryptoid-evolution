export const heatFillSelector = '.diagnostic-flat-scene .sector-boss .boss-static-heat .hull-hotspot > b';
export function heatFillCss(flat) {
  return flat ? heatFillSelector + ' { background-image: none !important; background-color: #ff7928 !important; }\n'
    : '/* Original inner static heat gradients retained; heat mask removed and reflection hidden. */\n';
}
