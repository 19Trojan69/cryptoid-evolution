import assert from 'node:assert/strict';
import { verifyPlayerMuzzleFidelity } from '../player-muzzle-local-20261104/fidelity.mjs';

export async function verifyMuzzleScope({page, guard}) {
  await guard();
  const actualCompiledPath = await page.evaluate(() => {
    const host = document.querySelector('.player-ship'), leaf = host?.querySelector('.player-muzzle-flash');
    if (!host || !leaf) throw Error('Mounted original player and muzzle required');
    return {root: host.style.getPropertyValue('--muzzle-light'), leaf: leaf.style.getPropertyValue('--muzzle-light'), consumers: host.querySelectorAll('.player-muzzle-flash').length};
  });
  assert.equal(actualCompiledPath.root, '');
  assert.equal(actualCompiledPath.consumers, 1);
  assert.notEqual(actualCompiledPath.leaf, '');
  assert.ok(Number.isFinite(Number(actualCompiledPath.leaf)));
  const existingFidelity = await verifyPlayerMuzzleFidelity({page, guard});
  const reach = await page.evaluate(() => {
    const host = document.querySelector('.player-ship'), leaf = host?.querySelector('.player-muzzle-flash');
    if (!host || !leaf || leaf.childElementCount !== 0) throw Error('Existing single childless consumer required');
    const nodes = [host, ...host.querySelectorAll('*')];
    const originalHost = host.style.cssText, originalLeaf = leaf.style.cssText;
    const count = () => nodes.filter(n => {
      const value = getComputedStyle(n).getPropertyValue('--muzzle-light').trim();
      return value !== '' && Number(value) === .375;
    }).length;
    try {
      leaf.style.removeProperty('--muzzle-light'); host.style.setProperty('--muzzle-light', '.375');
      const rootReach = count();
      host.style.removeProperty('--muzzle-light'); leaf.style.setProperty('--muzzle-light', '.375');
      const leafReach = count();
      return {nodes: nodes.length, rootReach, leafReach,
        nativeStyleRecalculationsMeasured: false, nativeCacheEntriesMeasured: false, memorySavingsMeasured: false};
    } finally {host.style.cssText = originalHost; leaf.style.cssText = originalLeaf;}
  });
  await guard();
  assert.equal(reach.rootReach, reach.nodes);
  assert.equal(reach.leafReach, 1);
  assert.ok(reach.rootReach > reach.leafReach);
  return {actualCompiledPath, existingFidelity, computedVariableReach: reach, performedOnlyDuringRegularPause: true};
}
