export const MOTION_STORAGE_KEY = 'cryptoid_reduced_effects';
export type SettingsSection = 'language' | 'controls' | 'audio' | 'display';
export const applySavedDisplaySettings = () => {
  document.documentElement.dataset.motion = localStorage.getItem(MOTION_STORAGE_KEY) === '1' ? 'reduced' : 'standard';
};
