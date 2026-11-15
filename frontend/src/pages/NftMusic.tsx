import { createContext, useContext, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useLocale } from "../i18n";
import { shipSaveNetwork } from "./shipFleet";
import { usePageMusic } from "./usePageMusic";

const testnet = shipSaveNetwork === "testnet";
const NftMusicContext = createContext<ReturnType<typeof usePageMusic> | null>(null);

export function NftMusicProvider({ active, children }: { active: boolean; children: ReactNode }) {
  const music = usePageMusic("/audio/keep-a-light-on-piano.mp3", active);
  return (
    <NftMusicContext.Provider value={active ? music : null}>
      {children}
    </NftMusicContext.Provider>
  );
}

export function NftMusicLayout() {
  // The route layout stays mounted while its NFT pages change.
  return <NftMusicProvider active={testnet}><Outlet /></NftMusicProvider>;
}

export function NftMusicButton() {
  const music = useContext(NftMusicContext);
  const { t } = useLocale();
  if (!music) return null;

  const label = music.playing ? "Music on" : music.enabled ? "Tap for music" : "Music off";
  return (
    <button
      type="button"
      className="boss-nft-home nft-music-toggle"
      data-music-toggle
      aria-pressed={music.playing}
      onClick={music.toggle}
    >
      <span aria-hidden="true">♫</span>
      {t(label)}
    </button>
  );
}
