import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const originalCssFramePacingBlob = '5d9cc3e5b40792277d9813b2953196affbc0eaf3';
const normalizedSha256 = '8e08da3d503cbfcd9104d3809ef7c8ce214e9053bda15b030fa3ddc5cd152010';
const registerLine = '      const target = (animation.effect as KeyframeEffect | null)?.target;';
const discoverLine = '    const target = event.target as Element | null;';
const registerGuard = registerLine + "\n      if (target?.closest('.sector-boss .hull-mini-explosion')) return;";
const discoverGuard = discoverLine + "\n    if (target?.closest('.sector-boss .hull-mini-explosion')) return;";
export function keepBossMiniAuthoredNativePlayback(source) {
  assert.equal(createHash('sha256').update(source.replace(/\r\n/g,'\n').trimEnd()).digest('hex'), normalizedSha256,
    'Exact original cssFramePacing text required (line endings/final newline normalized only)');
  assert.equal(source.split(registerLine).length,2);assert.equal(source.split(discoverLine).length,2);
  const changed=source.replace(registerLine,registerGuard).replace(discoverLine,discoverGuard);
  assert.equal(restoreBossMiniPacing(changed),source,'Only boss-mini discovery/registration guards change');
  return changed;
}
export function restoreBossMiniPacing(source) {
  assert.equal(source.split(registerGuard).length,2);assert.equal(source.split(discoverGuard).length,2);
  return source.replace(registerGuard,registerLine).replace(discoverGuard,discoverLine);
}
