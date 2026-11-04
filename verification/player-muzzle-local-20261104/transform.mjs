import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const CONTROLLER_SHA256 = '6b500123cb1443bbcb52809f0dbd06520ea0aee02a550ec346ab5ce1f186f277';
export const ORIGINAL_CALL = 'playerShipRef.current?.style.setProperty("--muzzle-light", ';
export const LOCAL_CALL = 'playerShipRef.current && setLocalPlayerMuzzle(playerShipRef.current, ';
export const HELPER = `const localPlayerMuzzles = new WeakMap<HTMLElement, { leaf: HTMLElement | null; fallback: boolean }>();
function setLocalPlayerMuzzle(host: HTMLElement, value: string) {
  let entry = localPlayerMuzzles.get(host);
  if (!entry) { entry = { leaf: null, fallback: false }; localPlayerMuzzles.set(host, entry); }
  if (!entry.leaf?.isConnected || !host.contains(entry.leaf)) entry.leaf = host.querySelector<HTMLElement>('.player-muzzle-flash');
  if (!entry.leaf) { host.style.setProperty('--muzzle-light', value); entry.fallback = true; return; }
  entry.leaf.style.setProperty('--muzzle-light', value);
  if (entry.fallback) { host.style.removeProperty('--muzzle-light'); entry.fallback = false; }
}
`;
export const digest = value => createHash('sha256').update(value).digest('hex');
export function transformController(code, original, condition) {
  assert.equal(digest(original), CONTROLLER_SHA256, 'Exact original controller required');
  assert.ok(['control', 'leaf'].includes(condition));
  assert.equal(code.split(ORIGINAL_CALL).length, 2, 'One original muzzle writer');
  assert.equal(code.includes('localPlayerMuzzles'), false);
  if (condition === 'control') return code;
  const changed = HELPER + code.replace(ORIGINAL_CALL, LOCAL_CALL);
  assert.equal(changed.slice(HELPER.length).replace(LOCAL_CALL, ORIGINAL_CALL), code,
    'Only the existing muzzle-light write destination changes; complete source restores exactly');
  return changed;
}
export function proof(code, original, condition) {
  const changed = transformController(code, original, condition);
  return { version: 1, condition, originalControllerSha256: digest(original),
    incomingVirtualControllerSha256: digest(code), compiledVirtualControllerSha256: digest(changed),
    nativeVariableNameAndFormulaRetained: true, onlyExistingMuzzleConsumerTargeted: true,
    weakOwnerCache: condition === 'leaf', missingConsumerRetainsOriginalRootFallback: true,
    newTimers: false, newAnimationFrames: false, newGlobalListeners: false,
    gameOrAnimationClocksChanged: false, sourceGameFilesEdited: false,
    physicalDeviceAccepted: false, whiteScreenFixed: false };
}
