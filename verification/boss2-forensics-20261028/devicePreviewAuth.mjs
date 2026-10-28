// Synthetic guest capability for the protected test artifact only. No Pi identity.
export const DEVICE_OPTIONS_KEY = 'cryptoid_isolated_boss2_options_v1';
export const DEVICE_RUNS_KEY = 'cryptoid_isolated_boss2_runs_v1';
export function readDeviceOptions(storage) {
  let raw;
  try { raw = JSON.parse(storage?.getItem(DEVICE_OPTIONS_KEY) || 'null'); } catch { /* Defaults. */ }
  return { scene: raw?.scene === 'turrets' ? 'turrets' : 'reactor',
    diagnostics: raw?.diagnostics !== false, protection: raw?.protection !== false };
}
export function readDeviceRuns(storage) {
  try {
    const raw = storage?.getItem(DEVICE_RUNS_KEY);
    if (!raw || raw.length > 8192) return [];
    const values = JSON.parse(raw);
    return Array.isArray(values) ? values.filter(row => Number.isSafeInteger(row?.at) && row.at >= 0
      && ['reactor', 'turrets'].includes(row.scene) && typeof row.diagnostics === 'boolean' && typeof row.protection === 'boolean')
      .slice(-16).map(({ at, scene, diagnostics, protection }) => ({ at, scene, diagnostics, protection })) : [];
  } catch { return []; }
}
export function recordDeviceRun(storage, options, at) {
  try { storage?.setItem(DEVICE_RUNS_KEY, JSON.stringify([...readDeviceRuns(storage), { at, ...options }].slice(-16))); } catch { /* Optional. */ }
}
export function browserDeviceOptions() {
  try { return readDeviceOptions(window.sessionStorage); } catch { return readDeviceOptions(null); }
}
const noop = () => {}, done = async () => {};
export function useAuth() {
  const options = window.__deviceBossOptions || browserDeviceOptions();
  return { user: null, canAdmin: options.diagnostics, adminMode: false, isAuthenticated: false,
    showSignIn: false, isLoading: false, authReady: true, authError: '', signIn: done,
    signOut: done, refreshSession: done, closeSignIn: noop, requireAuth: noop,
    setAdminPreview: async () => { throw Error('Isolated guest test only'); } };
}
