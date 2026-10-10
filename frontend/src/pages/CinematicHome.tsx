import type { ReactNode } from "react";
import { useLocale } from "../i18n";
import ServiceBadge from "../components/ServiceBadge";
import BlockchainIcon from "../components/BlockchainIcon";
import HomeEarthNetwork from "./HomeEarthNetwork";
import "./cinematicHome.css";

type Props = {
  paused: boolean; busy: boolean; rankName?: string; musicEnabled: boolean; musicLabel: string;
  onPlay: () => void; onCareer: () => void; onCards: () => void; onCommunity: () => void;
  onTerms: () => void; onSound: () => void; onFullscreen: () => void; children?: ReactNode;
};

export default function CinematicHome({paused,busy,rankName,musicEnabled,musicLabel,onPlay,onCareer,onCards,onCommunity,onTerms,onSound,onFullscreen,children}: Props) {
  const {t}=useLocale();
  return <section className="cinematic-home-content" aria-labelledby="cinematic-home-title">
    <div className="cinematic-scene">
      <div className="cinematic-art" aria-hidden="true">
        <img src="/home/cinematic-earth-fleet.webp" width={1225} height={1284} alt="" draggable={false} fetchPriority="high" decoding="async"/>
        <HomeEarthNetwork paused={paused}/>
      </div>
      <div className="cinematic-copy">
        <p className="cinematic-eyebrow"><span className="signal-dot" aria-hidden="true"/>{t("Mission control online")}</p>
        <h1 id="cinematic-home-title"><span>Cryptoid</span><span>Evolution</span></h1>
        <p className="cinematic-tagline">{t("Defend Earth.")}<span>{t("Evolve your power.")}</span></p>
        {children}
      </div>
      <button className="cinematic-fullscreen" type="button" onClick={onFullscreen} aria-label={t("Full screen")} title={t("Full screen")}>⛶</button>
    </div>
    <div className="cinematic-actions">
      <button className="cinematic-play" type="button" disabled={busy} onClick={onPlay}>{t("Play")}<span aria-hidden="true">→</span></button>
      <button className="cinematic-career" type="button" onClick={onCareer}>
        {rankName?<ServiceBadge name={rankName} size="large"/>:<BlockchainIcon kind="career"/>}
        <span className="cinematic-career-copy"><strong>{t("Your career")}</strong><span>{rankName?t(rankName):t("Service rank & progress")}</span><b>{t("View progress")} <i aria-hidden="true">→</i></b></span>
      </button>
      <div className="cinematic-shortcuts">
        <button className="cinematic-cards" type="button" disabled={busy} onClick={onCards}><BlockchainIcon kind="collection"/><span>{t("Card collection")}</span><i aria-hidden="true">→</i></button>
        <button className="cinematic-community" type="button" onClick={onCommunity}><BlockchainIcon kind="feedback"/><span>{t("Community")}</span><i aria-hidden="true">→</i></button>
      </div>
    </div>
    <footer className="cinematic-footer">
      <button className="cinematic-terms" type="button" onClick={onTerms}>{t("Terms of service")}</button>
      <button className="home-music-toggle cinematic-sound" type="button" data-state={musicEnabled?"on":"off"} aria-pressed={musicEnabled} aria-label={musicLabel} title={musicLabel} onClick={onSound}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/>{musicEnabled?<><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6a8 8 0 0 1 0 12"/></>:<path d="m17 9 5 6m0-6-5 6"/>}</svg>
      </button>
    </footer>
  </section>;
}
