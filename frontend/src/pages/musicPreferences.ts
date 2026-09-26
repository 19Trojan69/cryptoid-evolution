export const MUSIC_STORAGE_KEY = "cryptoid_home_music";
export const MUSIC_VOLUME_KEY = "cryptoid_music_volume";
export const EFFECTS_VOLUME_KEY = "cryptoid_effects_volume";
export const readEffectsVolume = (): number => {
  const saved = typeof localStorage === "undefined" ? null : localStorage.getItem(EFFECTS_VOLUME_KEY);
  const value = Number(saved);
  return saved !== null && Number.isFinite(value) && value >= 0 && value <= 100 ? value : 100;
};
// Volume is a percentage of the game's calibrated music mix, not the device's master volume.
const MUSIC_MAX_GAIN = .08;
export const musicGain = (percent: number) => MUSIC_MAX_GAIN * Math.max(0, Math.min(100, percent)) / 100;
export const readMusicVolume = (): number => {
  const saved = localStorage.getItem(MUSIC_VOLUME_KEY);
  if (saved === null) return 25;
  const value = Number(saved);
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : 25;
};
