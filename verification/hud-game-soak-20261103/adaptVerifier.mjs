import assert from 'node:assert/strict';
import { adaptVerifier as adaptUntreated, VERIFIER_SHA256 } from '../reactor-line-load-20261103/adaptVerifier.mjs';
export { VERIFIER_SHA256 };
const once=(text,before,after)=>{assert.equal(text.split(before).length,2,'One exact candidate-only insertion');return text.replace(before,after);};
export function adaptVerifier(original,originalUrl,workload) {
  const base=adaptUntreated(original,originalUrl,workload);
  const entry="  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();";
  const treatment=entry+`
  await page.addStyleTag({content:'@media (max-width:700px){.game-hud{backdrop-filter:none;}}'});
  result.targetedHudCandidate={version:1,oneRuleInjected:true,onlyProperty:'backdrop-filter',
    maxWidth:700,expectedValue:'none',servedFilesUnchanged:true,physicalDevice:false,
    pixelIdentityClaimed:false,memoryReductionMeasured:false,whiteScreenFixed:false};
`;
  const first="    const first = await observe(); if (clockProbe) probeFirst = first; verifyActive(first, first);";
  const proof=first+`
    const hudBackdrop=await page.locator('.game-hud').evaluate(node=>getComputedStyle(node).backdropFilter);
    assert.equal(hudBackdrop,'none','The actual candidate game must use the single reviewed HUD rule');
    row.targetedHudCandidate={backdropFilter:hudBackdrop,extraSetupInspectorRead:true};
`;
  let changed=once(base,entry,treatment);changed=once(changed,first,proof);
  assert.equal(changed.replace(treatment,entry).replace(proof,first),base,
    'All preexisting clock/document/pause/input/report/failure gates stay byte-identical');
  return changed;
}
