export const MUSIC_STORAGE_KEY = "cryptoid_home_music";
export const MUSIC_VOLUME_KEY = "cryptoid_music_volume";
export type MusicVolume = "quiet" | "balanced" | "loud";
export const musicLevels: Record<MusicVolume, number> = { quiet: .06, balanced: .11, loud: .18 };
export const readMusicVolume = (): MusicVolume => {
  const saved = localStorage.getItem(MUSIC_VOLUME_KEY);
  return saved === "balanced" || saved === "loud" ? saved : "quiet";
};
