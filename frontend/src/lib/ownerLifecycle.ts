import { installOwnerLifecycleCapture } from './ownerLifecycleCapture.mjs';
import { shipSaveNetwork } from '../pages/shipFleet';
let authorized = false;
let installed = false;
// Call only with fresh server session results, never with a storage/UI flag.
export function updateOwnerLifecycleAccess(canAdmin: boolean) {
  authorized = shipSaveNetwork === 'testnet' && canAdmin === true;
  if (!authorized || installed) return;
  try {
    installOwnerLifecycleCapture(() => authorized, __CRYPTOID_BUILD__);
    installed = true;
  } catch { /* Optional observation must never fail authentication/gameplay. */ }
}
