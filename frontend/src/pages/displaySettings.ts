export const MOTION_STORAGE_KEY = 'cryptoid_reduced_effects';
export type SettingsSection = 'language' | 'controls' | 'audio' | 'display';
export const readReducedEffects = () => localStorage.getItem(MOTION_STORAGE_KEY) === '1' || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
export const applySavedDisplaySettings = () => {
  document.documentElement.dataset.motion = readReducedEffects() ? 'reduced' : 'standard';
};
