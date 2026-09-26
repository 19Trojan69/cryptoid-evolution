export const MUSIC_STORAGE_KEY = "cryptoid_home_music";
export const MUSIC_VOLUME_KEY = "cryptoid_music_volume";
export type MusicVolume = 25 | 50 | 75 | 100;
// Percentages scale a calibrated music ceiling so effects remain clearly audible.
const MUSIC_MAX_GAIN = .08;
export const musicGain = (level: MusicVolume) => MUSIC_MAX_GAIN * level / 100;
export const readMusicVolume = (): MusicVolume => {
  const saved = Number(localStorage.getItem(MUSIC_VOLUME_KEY));
  return saved === 50 || saved === 75 || saved === 100 ? saved : 25;
};
