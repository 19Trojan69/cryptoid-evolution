import { createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import { useLocale } from "../i18n";
import { shipSaveNetwork } from "./shipFleet";
import { usePageMusic } from "./usePageMusic";

const testnet = shipSaveNetwork === "testnet";
const NftMusicContext = createContext<ReturnType<typeof usePageMusic> | null>(null);

export function NftMusicLayout() {
  // The route layout stays mounted while its NFT pages change.
  const music = usePageMusic("/audio/keep-a-light-on-piano.mp3", testnet);
  return (
    <NftMusicContext.Provider value={testnet ? music : null}>
      <Outlet />
    </NftMusicContext.Provider>
  );
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
