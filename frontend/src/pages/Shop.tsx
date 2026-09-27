import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import SignIn from "../components/SignIn";

import { useAuth } from "../hooks/useAuth";
import { usePayments } from "../hooks/usePayments";
import { axiosClient } from "../lib/axiosClient.ts";
import { BEST_SCORE_KEY, HIGHEST_SECTOR_KEY, TOTAL_DESTROYED_KEY } from "./GamePage.tsx";
import { allPlayerColors, buyShipVariant, EXTRA_STARTER_PRICE, fleetCount, playerColors, playerSkins, readShipFleet, savedShipColors, selectedShip, shardBalance, SHARD_BALANCE_KEY, SHIP_COLOR_KEY, SHIP_COLORS_KEY, SHIP_FLEET_KEY, SHIP_OWNED_KEY, SHIP_SKIN_KEY, shipNozzleStyle, spriteStyle, type PlayerColorId } from "./shipFleet";
import PaintedShip from "./PaintedShip";
import { ownedShipStage } from "./shipEvolution";
import TermsDialog from "../components/TermsDialog";
import { hangarCatalog } from "../../../backend/src/hangarCatalog";
import { primeGameAudio } from "./gameAudio";
import { DEFAULT_EFFECTS_VOLUME, DEFAULT_MUSIC_VOLUME, EFFECTS_VOLUME_KEY, MUSIC_STORAGE_KEY, MUSIC_VOLUME_KEY, resetAudioVolumeDefaults } from "./musicPreferences";
import { MusicPlayer } from "./musicPlayback";
import MusicVolumeSlider from "./MusicVolumeSlider";
import Starfield from "./Starfield";
import { languages, useLocale, type Locale } from "../i18n";
import EarthGlobe from "./EarthGlobe";
import EarthNetwork from "./EarthNetwork";
import { requestGameFullscreen } from "./gameFullscreen";
import { powerUpSymbols, type PowerUpType } from "./powerUps";
import { CONTROL_HAND_KEY, CONTROL_SENSITIVITY_KEY, CONTROL_ZONE_KEY, SHIP_START_KEY, readControlHand, readControlSensitivity, readControlZone, readShipStart, type ControlHand, type ControlSensitivity, type ControlZone, type ShipStart } from "./controlPreferences";

type Offer = { id: string; kind: "weapon" | "power" | "armor" | "ship_upgrade"; name: string; description: string; pricePi: number; shipIndex?: number; stage?: 2 | 3 };
type Inventory = { ownedWeapons: string[]; ownedArmor: string[]; ownedShipUpgrades?: string[]; consumables: { id: string; count: number }[]; equippedWeapon: string | null; selectedPower: string | null };
type Leader = { rank: number; username: string; score: number };

const shopTabs = [
  ["hangar", "Hangar", "◇"],
  ["shop", "Shop", "▱"],
  ["weapons", "Weapons", "⌁"],
  ["powers", "Power-ups", "✦"],
  ["progress", "Progress", "↗"],
  ["leaders", "Top 100", "#"],
] as const;

const powerTypeForOffer = (offerId: string): PowerUpType => offerId.includes("shield") ? "shield" : offerId.includes("rapid") ? "rapid" : offerId.includes("bomb") ? "bomb" : offerId.includes("emp") ? "emp" : "overdrive";
const MOTION_STORAGE_KEY = "cryptoid_reduced_effects";

const WeaponPreview = ({ offerId, sprite, color }: { offerId: string; sprite: number; color: PlayerColorId }) => {
  const shotCount = offerId.includes("triple") || offerId.includes("plasma") ? 3 : 2;
  return <div className={`offer-preview weapon-preview${offerId.includes("rapid") ? " weapon-preview-rapid" : ""}${offerId.includes("plasma") ? " weapon-preview-plasma" : ""}`} aria-hidden="true">
    <span className="preview-grid" />
    <span className="preview-ship"><PaintedShip sprite={sprite} color={color} /></span>
    <span className="preview-volley">{Array.from({ length: shotCount }, (_, index) => <i key={index} style={{ "--shot-offset": `${(index - (shotCount - 1) / 2) * 19}px`, "--shot-delay": `${index * -.12}s` } as CSSProperties} />)}</span>
    <small>LIVE FIRE TEST</small>
  </div>;
};

const PowerPreview = ({ offerId }: { offerId: string }) => {
  const type = powerTypeForOffer(offerId);
  return <div className={`offer-preview power-preview power-preview-${type}`} aria-hidden="true">
    <span className="preview-grid" />
    <span className="power-preview-orbit"><i>{powerUpSymbols[type]}</i></span>
    <span className="power-preview-wave" />
    <small>ENERGY CORE</small>
  </div>;
};

const Shop = () => {
  const navigate = useNavigate();
  const { locale, automatic, choose, t } = useLocale();
  const [activePanel, setActivePanel] = useState<"how" | "progress" | null>(null);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [reducedEffects, setReducedEffects] = useState(() => localStorage.getItem(MOTION_STORAGE_KEY) === "1");
  const [controlHand, setControlHand] = useState<ControlHand>(readControlHand);
  const [controlSensitivity, setControlSensitivity] = useState<ControlSensitivity>(readControlSensitivity);
  const [controlZone, setControlZone] = useState<ControlZone>(readControlZone);
  const [shipStart, setShipStart] = useState<ShipStart>(readShipStart);
  const [shopView, setShopView] = useState<"hangar" | "shop" | "weapons" | "powers" | "progress" | "leaders" | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [leadersStatus, setLeadersStatus] = useState<"loading" | "ready" | "error">("loading");
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const musicEnabledRef = useRef(true);
  // Entering the homescreen starts a fresh session with music enabled.
  useEffect(() => { localStorage.setItem(MUSIC_STORAGE_KEY, "on"); }, []);
  const [musicVolume, setMusicVolume] = useState(DEFAULT_MUSIC_VOLUME);
  const [effectsVolume, setEffectsVolume] = useState(DEFAULT_EFFECTS_VOLUME);
  useEffect(() => { resetAudioVolumeDefaults(); }, []);
  const homeMusicRef = useRef<MusicPlayer | null>(null);
  useEffect(() => {
    const music = new MusicPlayer("/audio/home-galactic-chain.mp3", DEFAULT_MUSIC_VOLUME);
    homeMusicRef.current = music;
    const start = () => { if (musicEnabledRef.current) void music.play(); };
    const resumeOnGesture = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(".home-music-toggle")) return;
      start();
    };
    document.addEventListener("pointerdown", resumeOnGesture, true);
    document.addEventListener("pointerup", resumeOnGesture, true);
    document.addEventListener("touchend", resumeOnGesture, true);
    document.addEventListener("keydown", resumeOnGesture, true);
    start();
    return () => {
      document.removeEventListener("pointerdown", resumeOnGesture, true);
      document.removeEventListener("pointerup", resumeOnGesture, true);
      document.removeEventListener("touchend", resumeOnGesture, true);
      document.removeEventListener("keydown", resumeOnGesture, true);
      music.close();
      if (homeMusicRef.current === music) homeMusicRef.current = null;
    };
  }, []);
  useEffect(() => { if (homeMusicRef.current) homeMusicRef.current.setVolume(musicVolume); }, [musicVolume]);
  const changeEffectsVolume = (value: number) => {
    localStorage.setItem(EFFECTS_VOLUME_KEY, String(value));
    setEffectsVolume(value);
  };
  const changeMusicVolume = (value: number) => {
    localStorage.setItem(MUSIC_VOLUME_KEY, String(value));
    setMusicVolume(value);
  };
  const toggleHomeMusic = () => {
    const next = !musicEnabledRef.current;
    musicEnabledRef.current = next;
    localStorage.setItem(MUSIC_STORAGE_KEY, next ? "on" : "off");
    setMusicEnabled(next);
    if (next) void homeMusicRef.current?.play();
    else homeMusicRef.current?.pause();
  };
  const musicLabel = t(musicEnabled ? "Music on" : "Music off");
  useEffect(() => {
    if (shopView !== "leaders" && shopView !== "progress") return;
    let current = true;
    if (shopView === "leaders") {
      axiosClient.get<{ leaders: Leader[] }>("/leaderboard/top").then(({ data }) => {
        if (!Array.isArray(data?.leaders)) throw new Error("Invalid leaderboard response");
        if (current) { setLeaders(data.leaders); setLeadersStatus("ready"); }
      }).catch(() => { if (current) setLeadersStatus("error"); });
    }
    axiosClient.get<{ bestScore: number }>("/leaderboard/me").then(({ data }) => { if (current) setPersonalBest(data.bestScore); }).catch(() => { if (current) setPersonalBest(null); });
    return () => { current = false; };
  }, [shopView]);
  useEffect(() => {
    document.documentElement.dataset.motion = reducedEffects ? "reduced" : "standard";
    localStorage.setItem(MOTION_STORAGE_KEY, reducedEffects ? "1" : "0");
  }, [reducedEffects]);
  useEffect(() => { localStorage.setItem(CONTROL_HAND_KEY, controlHand); }, [controlHand]);
  useEffect(() => { localStorage.setItem(CONTROL_SENSITIVITY_KEY, controlSensitivity); }, [controlSensitivity]);
  useEffect(() => { localStorage.setItem(CONTROL_ZONE_KEY, controlZone); }, [controlZone]);
  useEffect(() => { localStorage.setItem(SHIP_START_KEY, shipStart); }, [shipStart]);
  useEffect(() => { if (!systemMenuOpen) setLanguageMenuOpen(false); }, [systemMenuOpen]);
  useEffect(() => {
    if (!systemMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { if (languageMenuOpen) setLanguageMenuOpen(false); else setSystemMenuOpen(false); } };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [systemMenuOpen, languageMenuOpen]);
  useEffect(() => {
    if (!shopView) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setShopView(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [shopView]);
  const [records] = useState(() => ({ bestScore: Number(localStorage.getItem(BEST_SCORE_KEY) || 0), highestSector: Number(localStorage.getItem(HIGHEST_SECTOR_KEY) || 0), totalDestroyed: Number(localStorage.getItem(TOTAL_DESTROYED_KEY) || 0) }));
  const [selected, setSelected] = useState(selectedShip);
  const [previewSkin, setPreviewSkin] = useState(() => selectedShip().skin);
  const [previewColor, setPreviewColor] = useState(() => selectedShip().color);
  const [fleet, setFleet] = useState(() => readShipFleet(localStorage.getItem(SHIP_FLEET_KEY), localStorage.getItem(SHIP_OWNED_KEY), localStorage.getItem(SHIP_COLORS_KEY)));
  const [shards, setShards] = useState(() => shardBalance(localStorage.getItem(SHARD_BALANCE_KEY)));
  const [hangarMessage, setHangarMessage] = useState("");
  const [offers, setOffers] = useState<Offer[]>(() => [...hangarCatalog]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const selectedStage = ownedShipStage(selected.skin.sprite, inventory?.ownedShipUpgrades);
  const previewStage = ownedShipStage(previewSkin.sprite, inventory?.ownedShipUpgrades);
  const [loadoutMessage, setLoadoutMessage] = useState("");
  const previewCount = fleetCount(fleet, previewSkin.id, previewColor.id);
  const enterGame = () => { primeGameAudio(); requestGameFullscreen(); navigate("/game"); };

  const purchasePreview = () => {
    const currentFleet = readShipFleet(localStorage.getItem(SHIP_FLEET_KEY), localStorage.getItem(SHIP_OWNED_KEY), localStorage.getItem(SHIP_COLORS_KEY));
    const currentBalance = shardBalance(localStorage.getItem(SHARD_BALANCE_KEY));
    setShards(currentBalance);
    const purchase = buyShipVariant(previewSkin.id, previewColor.id, currentFleet, currentBalance);
    if (!purchase) { setHangarMessage(t("Not enough Shards yet. Earn them by defeating Cryptoids.")); return; }
    localStorage.setItem(SHIP_FLEET_KEY, JSON.stringify(purchase.fleet));
    localStorage.setItem(SHARD_BALANCE_KEY, String(purchase.balance));
    setFleet(purchase.fleet);
    setShards(purchase.balance);
    setHangarMessage(`${previewSkin.name} · ${previewColor.name} · ${t("Owned")} ×${fleetCount(purchase.fleet, previewSkin.id, previewColor.id)}`);
  };
  const equipShip = (skin: typeof playerSkins[number], color: typeof allPlayerColors[number]) => {
    // Only a variant already in the fleet can become the active ship.
    if (!fleetCount(fleet, skin.id, color.id)) return;
    localStorage.setItem(SHIP_SKIN_KEY, skin.id);
    localStorage.setItem(SHIP_COLOR_KEY, color.id);
    const nextColors = { ...savedShipColors(localStorage.getItem(SHIP_COLORS_KEY)), [skin.id]: color.id };
    localStorage.setItem(SHIP_COLORS_KEY, JSON.stringify(nextColors));
    setSelected({ skin, color });
    setHangarMessage(`${skin.name} · ${t(color.name)} · ${t("EQUIPPED")}`);
  };
  const {
    user,
    isAuthenticated,
    showSignIn,
    signIn,
    signOut,
    closeSignIn,
    requireAuth,
    isLoading: isAuthLoading,
  } = useAuth();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("pi_signin") !== "1") return;
    url.searchParams.delete("pi_signin");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    void signIn();
  }, [signIn]);

  const { orderProduct, isLoading } = usePayments({
    isAuthenticated,
    onRequireAuth: requireAuth,
  });
  const refreshInventory = async () => {
    try {
      const { data } = await axiosClient.get<Inventory>("/hangar/inventory");
      if (!Array.isArray(data.ownedWeapons) || !Array.isArray(data.ownedArmor) || !Array.isArray(data.consumables)) throw new Error("Invalid inventory");
      setInventory(data);
    }
    catch { setLoadoutMessage(t('Connect your Pi account to see your saved loadout.')); }
  };
  useEffect(() => { axiosClient.get<{ offers: Offer[] }>("/hangar/catalog").then(({ data }) => {
    if (!Array.isArray(data.offers)) throw new Error("Invalid catalog");
    setOffers(data.offers);
    setCatalogReady(true);
  }).catch(() => setLoadoutMessage(t('Hangar catalog unavailable. Try again when the server is online.'))); }, []);
  useEffect(() => {
    if (!isAuthenticated) return;
    axiosClient.get<Inventory>("/hangar/inventory").then(({ data }) => {
      if (!Array.isArray(data.ownedWeapons) || !Array.isArray(data.ownedArmor) || !Array.isArray(data.consumables)) throw new Error("Invalid inventory");
      setInventory(data);
    }).catch(() => setLoadoutMessage(t('Connect your Pi account to see your saved loadout.')));
  }, [isAuthenticated]);
  const equip = async (weapon: string | null, power: string | null) => {
    if (!isAuthenticated) { requireAuth(); return; }
    try {
      await axiosClient.post("/hangar/equip", { weapon, power });
      await refreshInventory();
      setLoadoutMessage(t('Loadout saved for the next mission.'));
    } catch { setLoadoutMessage(t('Could not save loadout. Please retry.')); }
  };

  const onSendTestNotification = () => {
    const notification = {
      title: "Test Notification",
      body: "This is a test notification",
      user_uid: user?.uid,
      subroute: "/shop",
    };
    axiosClient.post("/notifications/send", { notifications: [notification] });
  };

  return (
    <main className="app-shell landing-shell">
      <Header
        user={user}
        onSignIn={signIn}
        onSignOut={() => { setInventory(null); void signOut(); }}
        onSendTestNotification={onSendTestNotification}
        isLoading={isAuthLoading}
      />

      <section className="hero-section">
        <button className="home-music-toggle" type="button" data-state={musicEnabled ? "playing" : "off"} aria-pressed={musicEnabled} aria-label={musicLabel} title={musicLabel} onClick={toggleHomeMusic}><span className="home-music-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" />{musicEnabled ? <><path d="M16 9a4 4 0 0 1 0 6" /><path d="M19 6a8 8 0 0 1 0 12" /></> : <path d="m17 9 5 6m0-6-5 6" />}</svg></span></button>
        <Starfield sector={1} player={{ x: .5, y: .8 }} paused={false} />
        <div className="home-deep-space" aria-hidden="true"><span className="home-far-planet home-far-planet-gas" /><span className="home-far-planet home-far-planet-saturn" /><span className="home-far-planet home-far-moon" /><span className="home-black-hole"><i /></span></div>
        <div className="hero-copy">
          <p className="eyebrow"><span className="signal-dot" /> {t("Mission control online")}</p>
          <h1><span className="home-title-word">Cryptoid</span><span className="home-title-evolution">Evolution</span></h1>
          <p className="hero-tagline">Defend Earth. <span>Evolve your power.</span></p>
          <p className="hero-description">{t('Build your streak, master the grid, and become the force Earth needs.')}</p>
          <div className="home-mission-brief" aria-label={t("Your Progress")}><span className="home-mission-marker" aria-hidden="true">◆</span><span><small>{t("Genesis sector")} · {t("EQUIPPED")}</small><strong>{selected.skin.name} <em>· {t(selected.color.name)} · {selectedStage === 1 ? "STANDARD" : selectedStage === 2 ? "ADVANCED" : "ELITE"}</em></strong></span>{records.bestScore > 0 && <span className="home-mission-best"><small>{t("Best score")}</small><strong>{records.bestScore.toLocaleString()}</strong></span>}</div>
          <div className="hero-actions">
            <div className="home-launch">
              <div className="home-launch-bay" role="img" aria-label={`${selected.skin.name} · ${t(selected.color.name)}`}>
                <span className="home-launch-target home-launch-target-left" aria-hidden="true" />
                <span className="home-launch-target home-launch-target-right" aria-hidden="true" />
                <span className="home-launch-shot home-launch-shot-left" aria-hidden="true" />
                <span className="home-launch-shot home-launch-shot-right" aria-hidden="true" />
                <div className={`home-defense-ship${selected.color.id === "grey" ? " home-defense-grey" : ""}`} style={{ "--ship-glow": selected.color.glow, ...shipNozzleStyle(selected.skin.sprite) } as CSSProperties}><i style={{ ...spriteStyle(selected.skin.sprite), opacity: selectedStage === 1 ? 1 : 0 }} /><PaintedShip sprite={selected.skin.sprite} color={selected.color.id} stage={selectedStage} /><span className="home-thrust home-thrust-left" /><span className="home-thrust home-thrust-right" /></div>
              </div>
              <button className="button button-primary home-play-button" type="button" onClick={enterGame}>{t("Play")} <span className="button-glyph" aria-hidden="true">→</span></button>
            </div>
            <button className="button button-secondary" type="button" onClick={() => { setPreviewSkin(selected.skin); setPreviewColor(selected.color); setShopView("hangar"); }}>{t('Shop / Hangar')} <span className="button-glyph" aria-hidden="true">◇</span></button>
            <button className="button button-secondary" type="button" onClick={() => { setLeadersStatus("loading"); setShopView("leaders"); }}>{t('Top 100')} <span className="button-glyph" aria-hidden="true">⌁</span></button>
            <button className="button button-secondary" type="button" onClick={() => setSystemMenuOpen(true)}>{t('System menu')} <span className="button-glyph" aria-hidden="true">⚙</span></button>
          </div>
        </div>
        <div className="planet-stage" aria-label="Cryptoid Evolution planet status">
          <div className="planet"><EarthGlobe /><EarthNetwork /></div>
          <div className="home-crossfire" aria-hidden="true"><i className="home-crossfire-shot home-crossfire-shot-a" /><i className="home-crossfire-shot home-crossfire-shot-b" /><i className="home-crossfire-impact" /></div>
          <div className="home-intercept" aria-hidden="true"><i className="home-intercept-bolt home-intercept-bolt-a" /><i className="home-intercept-bolt home-intercept-bolt-b" /><i className="home-intercept-flash" /></div>
          <div className="home-raid" aria-hidden="true">{[2, 3, 0].map((sprite, index) => <span className={`home-raid-ship home-raid-ship-${index + 1}`} key={sprite}><b /><i style={spriteStyle(sprite)} /></span>)}</div>
          <span className="orbit-status">{t('ORBITAL DEFENSE ACTIVE')}</span>
          <div className="stage-label"><span className="stage-label-value">01</span><span>{t('Genesis sector')}</span></div>
        </div>
        <footer className="home-footer">
          <button type="button" className="text-button terms-entry" onClick={() => setTermsOpen(true)}>Nutzungsbedingungen / Terms of Service</button>
          <span className="home-developer-credit">Developed by Marc Wolf / 19Trojan69</span>
        </footer>
      </section>

      {systemMenuOpen && <div className="system-menu-overlay" role="dialog" aria-modal="true" aria-labelledby="system-menu-title">
        <section className="system-menu-panel">
          <button className="close-button" type="button" onClick={() => setSystemMenuOpen(false)} aria-label={t('Close menu')}>×</button>
          <p className="eyebrow">{t('SYSTEM / SETTINGS')}</p>
          <h2 id="system-menu-title">{t('System menu')}</h2>
          <div className="system-menu-section">
            <div className="system-menu-heading"><strong>{t('Language')}</strong><small>{t('Current language')}: {languages[locale]}</small></div>
            <div className="language-dropdown" data-open={languageMenuOpen ? "true" : "false"}>
              <div className="language-actions">
                <button type="button" className="language-trigger language-auto" aria-pressed={automatic} aria-expanded={languageMenuOpen} aria-controls="language-options" onClick={() => { choose(null); setLanguageMenuOpen(true); }}>
                  <span aria-hidden="true">◎</span><b>{t('Automatic (device language)')}</b><i aria-hidden="true">⌄</i>
                </button>
                <button type="button" className="language-trigger language-change" aria-pressed={!automatic} aria-expanded={languageMenuOpen} aria-controls="language-options" onClick={() => setLanguageMenuOpen(open => !open)}>
                  <span aria-hidden="true">{locale.toUpperCase()}</span><b>{t('Change')}</b><i aria-hidden="true">⌄</i>
                </button>
              </div>
              {languageMenuOpen && <div id="language-options" className="language-menu" role="group" aria-label={t('Language')}>
                {Object.entries(languages).map(([code, label]) => <button type="button" className="language-option" key={code} aria-pressed={!automatic && locale === code} onClick={() => { choose(code as Locale); setLanguageMenuOpen(false); }}><span aria-hidden="true">{code.toUpperCase()}</span><b>{label}</b></button>)}
              </div>}
            </div>
          </div>
          <div className="system-menu-section system-quick-settings">
            <div className="system-menu-heading"><strong>{t('Controls')}</strong><small>{t('Move with one thumb; activate power-ups with the other.')}</small></div>
            <button className="system-setting" type="button" aria-pressed={controlHand === "right"} onClick={() => setControlHand("right")}><span aria-hidden="true">◁</span><b>{t('Right-handed controls')}</b></button>
            <button className="system-setting" type="button" aria-pressed={controlHand === "left"} onClick={() => setControlHand("left")}><span aria-hidden="true">▷</span><b>{t('Left-handed controls')}</b></button>
            <div className="control-choice-group" role="group" aria-label={t('Touch sensitivity')}>
              <strong>{t('Touch sensitivity')}</strong>
              {(["gentle", "normal", "fast"] as const).map(value => <button key={value} className="system-setting" type="button" aria-pressed={controlSensitivity === value} onClick={() => setControlSensitivity(value)}><b>{t(value === "gentle" ? "Gentle" : value === "normal" ? "Normal" : "Fast")}</b></button>)}
            </div>
            <div className="control-choice-group" role="group" aria-label={t('Control area')}>
              <strong>{t('Control area')}</strong>
              {(["compact", "normal", "wide"] as const).map(value => <button key={value} className="system-setting" type="button" aria-pressed={controlZone === value} onClick={() => setControlZone(value)}><b>{t(value === "compact" ? "Compact" : value === "normal" ? "Normal" : "Wide")}</b></button>)}
            </div>
            <div className="control-choice-group" role="group" aria-label={t('Ship start position')}>
              <strong>{t('Ship start position')}</strong>
              {(["higher", "normal", "lower"] as const).map(value => <button key={value} className="system-setting" type="button" aria-pressed={shipStart === value} onClick={() => setShipStart(value)}><b>{t(value === "higher" ? "Higher" : value === "normal" ? "Normal" : "Lower")}</b></button>)}
            </div>
          </div>
          <div className="system-menu-section system-quick-settings">
            <div className="system-menu-heading"><strong>{t('Music volume')}</strong></div>
            <MusicVolumeSlider id="home-music-volume" label={t('Music volume')} value={musicVolume} onChange={changeMusicVolume} />
            <MusicVolumeSlider id="home-effects-volume" label={t('Effects volume')} value={effectsVolume} onChange={changeEffectsVolume} />
          </div>
          <div className="system-menu-section system-quick-settings">
            <div className="system-menu-heading"><strong>{t('Display')}</strong></div>
            <button className="system-setting" type="button" onClick={() => requestGameFullscreen()}><span aria-hidden="true">⛶</span><b>{t('Full screen')}</b></button>
            <button className="system-setting" type="button" aria-pressed={reducedEffects} onClick={() => setReducedEffects(value => !value)}><span aria-hidden="true">◌</span><b>{t(reducedEffects ? 'Reduced effects' : 'Standard effects')}</b></button>
            <button className="system-setting" type="button" onClick={() => { setSystemMenuOpen(false); setActivePanel('how'); }}><span aria-hidden="true">?</span><b>{t('Open game guide')}</b></button>
          </div>
        </section>
      </div>}

      {shopView && <div className="shop-overlay" role="dialog" aria-modal="true" aria-label={t('Shop and hangar')}>
        <div className="shop-modal">
        <div className="shop-modal-header"><strong>{t(shopTabs.find(([view]) => view === shopView)?.[1] ?? "Shop / Hangar")}</strong><button className="close-button" type="button" onClick={() => setShopView(null)} aria-label={t('Close shop')}>×</button></div>
          <nav className="shop-tabs" aria-label={t('Shop sections')}>
            {shopTabs.map(([view, label, glyph]) => <button className={`shop-tab shop-tab-${view}`} key={view} type="button" aria-pressed={shopView === view} onClick={() => { if (view === "leaders") setLeadersStatus("loading"); if (view === "hangar") { setPreviewSkin(selected.skin); setPreviewColor(selected.color); } setShopView(view); }}><span aria-hidden="true">{glyph}</span><b>{t(label)}</b></button>)}
          </nav>
          <div className="shop-modal-body">
      {shopView === "progress" && <section className="dashboard-grid" aria-label={t('Player overview')}>
        <article className="status-card progress-card">
          <div className="card-heading"><span>{t('YOUR PROGRESS')}</span><span className="card-icon">↗</span></div>
          <div className="progress-row"><strong>{t("Best")} {personalBest ?? records.bestScore}</strong><span>{t("Sector")} {String(records.highestSector).padStart(2, "0")}</span></div>
          <div className="progress-track"><span style={{ width: `${Math.min(100, (personalBest ?? records.bestScore) / 10)}%` }} /></div>
          <button className="text-button" type="button" onClick={() => setActivePanel("progress")}>{t("My Progress")} <span>→</span></button>
        </article>
        <article className="status-card streak-card">
          <div className="card-heading"><span>{t('ACTIVE STREAK')}</span><span className="flame">✦</span></div>
          <strong className="streak-number">{records.totalDestroyed} <small>{t("asteroids")}</small></strong>
          <p>{t('Total destroyed across all missions.')}</p>
        </article>
      </section>}

      {shopView === "leaders" && <section className="leaderboard-section" aria-labelledby="leaders-heading">
        <p className="eyebrow">{t("GLOBAL RECORDS")}</p>
        <h2 id="leaders-heading">{t("Top 100")}</h2>
        <p>{t("Each signed-in Pi player appears once with their highest completed run. Guests keep a local best on this device.")}</p>
        {personalBest !== null && <p className="leaderboard-personal">{t("Your personal best")}: <strong>{personalBest}</strong></p>}
        {leadersStatus === "loading" && <p role="status">{t("Loading scores…")}</p>}
        {leadersStatus === "error" && <p role="status">{t("Leaderboard unavailable. Try again later.")}</p>}
        {leadersStatus === "ready" && (leaders.length ? <div className="leaderboard-scroll"><table><thead><tr><th>#</th><th>{t("Player")}</th><th>{t("Best score")}</th></tr></thead><tbody>{leaders.map(entry => <tr key={entry.rank}><td>{entry.rank}</td><td>{entry.username}</td><td>{entry.score.toLocaleString(locale)}</td></tr>)}</tbody></table></div> : <p>{t("No records yet. Complete a mission to be first.")}</p>)}
      </section>}

      {(shopView === "hangar" || shopView === "shop") && <section className={`ship-selector ship-selector-${shopView}`} aria-labelledby="hangar-heading">
        <p className="eyebrow">{t(shopView === "hangar" ? "YOUR HANGAR" : "SHIP SHOP")}</p>
        <h2 id="hangar-heading">{t(shopView === "hangar" ? "Your fleet" : "Available ships")}</h2>
        <p>{t(shopView === "hangar" ? "Only ships in your fleet are shown here. Choose an owned type and color variant for your next mission." : "Choose a ship type to compare its stages. Advanced and Elite are permanent Pi upgrades; colors stay separate.")}</p>
        <strong className="shard-balance">◆ {shards} {t("Shards")}</strong><span className="shard-help">{t("Defeats earn Shards by enemy class: light 2, medium 4–5, elite 6, heavy 8, boss 16. Bonus targets earn 1 each, plus an immediate completion reward. Your Shards are saved at mission end.")}</span>
        {shopView === "shop" && <button className="evolution-jump" type="button" onClick={() => document.getElementById("ship-evolution-heading")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span aria-hidden="true">✦</span> {t("Discover Advanced & Elite for Pi")} <span aria-hidden="true">↓</span></button>}
        <div className="ship-picker" role="group" aria-label={t("Ship hull")}>
          {playerSkins.filter(skin => shopView === "shop" || fleetCount(fleet, skin.id) > 0).map(skin => { const total = fleetCount(fleet, skin.id); const shown = skin.id === selected.skin.id ? selected.color : allPlayerColors.find(color => fleetCount(fleet, skin.id, color.id)) ?? playerColors[0]; return <button key={skin.id} className={`ship-choice${total === 0 ? " ship-unowned" : ""}`} type="button" aria-pressed={previewSkin.id === skin.id} onClick={() => { setPreviewSkin(skin); setPreviewColor(shown); if (shopView === "hangar") equipShip(skin, shown); else setHangarMessage(""); }}>
            <span className="ship-preview"><PaintedShip sprite={skin.sprite} color={shown.id} stage={ownedShipStage(skin.sprite, inventory?.ownedShipUpgrades)} /></span><span>{skin.name}</span><small>{total ? `${t("Owned")} ×${total}` : t("Not owned")}</small>
          </button>; })}
        </div>
        {shopView === "shop" && <div className="hangar-offers ship-evolution-offers">
          <h3 id="ship-evolution-heading">{previewSkin.name} · {t("Ship evolution")}</h3>
          <p>{t("Standard uses Shards. Advanced and Elite unlock permanently with Pi; Elite requires Advanced.")}</p>
          <div className="evolution-route" aria-label={t("Three ship stages")}>
            <span className={fleetCount(fleet, previewSkin.id) ? "stage-owned" : ""}><b>01</b> STANDARD <small>◆ {previewSkin.price || EXTRA_STARTER_PRICE}</small></span>
            <span className={previewStage >= 2 ? "stage-owned" : ""}><b>02</b> ADVANCED <small>π</small></span>
            <span className={previewStage >= 3 ? "stage-owned" : ""}><b>03</b> ELITE <small>π</small></span>
          </div>
          <div className="hangar-offer-grid">
            {offers.filter(offer => offer.kind === "ship_upgrade" && offer.shipIndex === previewSkin.sprite).map(offer => {
              const owned = inventory?.ownedShipUpgrades?.includes(offer.id) ?? false;
              const prerequisite = offer.stage !== 3 || (inventory?.ownedShipUpgrades?.includes(`ship_${String((offer.shipIndex ?? 0) + 1).padStart(2, "0")}_stage_2`) ?? false);
              const hasHull = fleetCount(fleet, previewSkin.id) > 0;
              const upgradeName = `${previewSkin.name} · ${offer.stage === 2 ? "Advanced" : "Elite"}`;
              return <article key={offer.id} className={`hangar-offer hangar-offer-ship${owned ? " hangar-offer-selected" : ""}`}>
                <div className="offer-preview weapon-preview" aria-hidden="true"><span className="preview-grid" /><span className="preview-ship"><PaintedShip sprite={previewSkin.sprite} color="silver" stage={offer.stage ?? 1} /></span><small>{offer.stage === 2 ? "ADVANCED" : "ELITE"}</small></div>
                <h4>{upgradeName}</h4><p>{t(offer.description)}</p><span>{offer.pricePi} π · {t("Permanent unlock")}</span>
                <strong>{owned ? t("OWNED") : !hasHull ? t("Buy hull with Shards first") : prerequisite ? t("NOT OWNED") : t("Requires Stage 2")}</strong>
                {!owned && <button className="button button-primary" type="button" disabled={isLoading || !catalogReady || !inventory || !hasHull || !prerequisite} onClick={() => orderProduct(`Cryptoid ${upgradeName} · permanent ship evolution`, offer.pricePi, { productId: offer.id }, () => { setHangarMessage(`${upgradeName} ${t("purchase confirmed.")}`); void refreshInventory(); })}>{t("Buy with π")}</button>}
              </article>;
            })}
          </div>
        </div>}
        <h3 className="hangar-variant-title">{previewSkin.name} · {t("Color variants")}</h3>
        <div className="ship-picker ship-variants" role="group" aria-label={t("Ship paint")}>
          {allPlayerColors.filter(color => (shopView === "shop" && playerColors.some(current => current.id === color.id)) || fleetCount(fleet, previewSkin.id, color.id) > 0).map(color => { const count = fleetCount(fleet, previewSkin.id, color.id); return <button key={color.id} className={`ship-choice variant-choice${count ? "" : " ship-unowned"}`} type="button" aria-pressed={previewColor.id === color.id} onClick={() => { setPreviewColor(color); if (shopView === "hangar") equipShip(previewSkin, color); else setHangarMessage(""); }}>
            <span className="ship-preview"><PaintedShip sprite={previewSkin.sprite} color={color.id} stage={previewStage} /></span>
            <span className="metal-swatch" style={{ "--paint": color.glow } as CSSProperties} />
            <span>{t(color.name)}</span><small>{count ? `${t("Owned")} ×${count}` : t("Not owned")}</small>
          </button>; })}
        </div>
        <p className="hangar-selection">{shopView === "hangar" ? t("EQUIPPED") : t("Preview:")} <strong>{previewSkin.name} · {t(previewColor.name)}</strong> · {previewStage === 1 ? "STANDARD" : previewStage === 2 ? "ADVANCED" : "ELITE"} · {previewCount ? `${t("Owned")} ×${previewCount}` : t("Not owned")}{shopView === "shop" && selected.skin.id === previewSkin.id && selected.color.id === previewColor.id && <span> · {t("EQUIPPED")}</span>}</p>
        {shopView === "shop" && <div className="hangar-actions"><button className="button button-primary hangar-action" type="button" onClick={purchasePreview} disabled={shards < (previewSkin.price || EXTRA_STARTER_PRICE)}>{t("Buy another for")} ◆ {previewSkin.price || EXTRA_STARTER_PRICE}</button></div>}
        {shopView === "shop" && shards < (previewSkin.price || EXTRA_STARTER_PRICE) && <span className="shard-help">◆ {(previewSkin.price || EXTRA_STARTER_PRICE) - shards} {t("more Shards needed")}</span>}
        {hangarMessage && <p className="hangar-message" role="status">{hangarMessage}</p>}
      </section>}

      {(shopView === "weapons" || shopView === "powers") && <section className="upgrade-section" aria-labelledby="upgrade-heading">
        <div className="section-heading"><div><p className="eyebrow">{t('POWER LAB')}</p><h2 id="upgrade-heading">{t('Weapons and start power-ups')}</h2></div><span className="section-line" /></div>
        <p>{t('Standard laser is free. Bought weapons remain owned and start automatically for 5 minutes per mission. Bought start extras are consumed when the mission begins; tap the labeled button with your other thumb to activate them. Nova Bomb clears visible enemies and deals 18 boss damage; EMP freezes enemies for 7 seconds. Collected shields and weapon upgrades activate immediately. Pi prices are separate from ship Shards.')}</p>
        {([shopView === "weapons" ? "weapon" : "power"] as const).map(kind => <div key={kind} className="hangar-offers"><h3>{t(kind === "weapon" ? "Time-limited weapons" : "One-mission start bonuses")}</h3><div className="hangar-offer-grid">
          {offers.filter(offer => offer.kind === kind).map(offer => {
            const count = inventory?.consumables.find(item => item.id === offer.id)?.count ?? 0;
            const owned = kind === "weapon" ? inventory?.ownedWeapons.includes(offer.id) : count > 0;
            const selected = kind === "weapon" ? inventory?.equippedWeapon === offer.id : inventory?.selectedPower === offer.id;
            return <article key={offer.id} className={`hangar-offer hangar-offer-${kind}${selected ? " hangar-offer-selected" : ""}`}>{kind === "weapon" ? <WeaponPreview offerId={offer.id} sprite={selectedShip().skin.sprite} color={selectedShip().color.id} /> : <PowerPreview offerId={offer.id} />}<h4>{t(offer.name)}</h4><p>{t(offer.description)}</p><span>{t(kind === "weapon" ? "5 minutes per mission · starts at mission start" : "Consumed at mission start")} · {offer.pricePi} π</span><strong>{selected ? t("EQUIPPED") : owned ? kind === "power" ? `${count} ${t("AVAILABLE")}` : t("OWNED") : t("NOT OWNED")}</strong><div>
              {owned ? <button className="button button-secondary" type="button" disabled={Boolean(selected)} onClick={() => equip(kind === "weapon" ? offer.id : inventory?.equippedWeapon ?? null, kind === "power" ? offer.id : inventory?.selectedPower ?? null)}>{t(selected ? "Selected" : "Equip for next mission")}</button> : null}
              {(kind === "power" || !owned) && <button className="button button-primary" type="button" disabled={isLoading || !catalogReady} onClick={() => orderProduct(`Cryptoid ${offer.name} · ${kind === "weapon" ? "5 minutes per mission" : offer.id === "start_bomb" || offer.id === "start_emp" ? "one use per mission" : "60 seconds when activated"}`, offer.pricePi, { productId: offer.id }, () => { setLoadoutMessage(`${offer.name} ${t("purchase confirmed.")}`); void refreshInventory(); })}>{t("Buy with π")}</button>}
            </div></article>;
          })}
        </div></div>)}
        {shopView === "weapons" && <div className="hangar-offers"><h3>{t("Permanent armor")}</h3><p>{t("Armor is always active from mission start, needs no shield and remains yours across all future missions. Each upgrade adds to your maximum hearts.")}</p><div className="hangar-offer-grid">
          {offers.filter(offer => offer.kind === "armor").map(offer => { const owned = inventory?.ownedArmor.includes(offer.id); return <article key={offer.id} className={`hangar-offer hangar-offer-armor${owned ? " hangar-offer-selected" : ""}`}><div className="offer-preview power-preview power-preview-shield" aria-hidden="true"><span className="preview-grid" /><span className="power-preview-orbit"><i>♥</i></span><small>PERMANENT HULL</small></div><h4>{t(offer.name)}</h4><p>{t(offer.description)}</p><span>{t("Permanent · every mission")} · {offer.pricePi} π</span><strong>{owned ? t("OWNED") : t("NOT OWNED")}</strong><div>{!owned && <button className="button button-primary" type="button" disabled={isLoading || !catalogReady || !inventory} onClick={() => orderProduct(`Cryptoid ${offer.name} · permanent armor`, offer.pricePi, { productId: offer.id }, () => { setLoadoutMessage(`${offer.name} ${t("purchase confirmed.")}`); void refreshInventory(); })}>{t("Buy with π")}</button>}</div></article>; })}
        </div></div>}
        {inventory?.equippedWeapon && <button className="text-button" type="button" onClick={() => equip(null, inventory.selectedPower)}>{t('Use free standard laser')}</button>}
        {inventory?.selectedPower && <button className="text-button" type="button" onClick={() => equip(inventory.equippedWeapon, null)}>{t('Save bonus for a later mission')}</button>}
        {loadoutMessage && <p role="status">{loadoutMessage}</p>}
      </section>}
          </div>
        </div>
      </div>}

      {activePanel && <div className="info-panel" role="dialog" aria-modal="true" aria-labelledby="info-title">
        <div className="info-panel-content">
          <button className="close-button" type="button" onClick={() => setActivePanel(null)} aria-label={t('Close')}>×</button>
          <p className="eyebrow">{activePanel === "how" ? "FIELD GUIDE" : "MISSION LOG"}</p>
          <h2 id="info-title">{activePanel === "how" ? t("How to Play") : t("Your Progress")}</h2>
          <p>{activePanel === "how" ? t("Move your ship with the arrow keys or WASD; on touchscreens, drag it in the lower playfield. Your laser fires automatically. Dodge diving Cryptoids and collect power-ups. Shield absorbs a hit and Overdrive briefly strengthens your shots. You begin with three hearts. Only a perfect bonus round with 12 hits restores one previously lost heart.") : t("Your best score is {score}, your highest sector is {sector}, and you have destroyed {destroyed} Cryptoids.").replace("{score}", String(personalBest ?? records.bestScore)).replace("{sector}", String(records.highestSector)).replace("{destroyed}", String(records.totalDestroyed))}</p>
          {activePanel === "how" && <p>{t("Each completed section links one fictional block; three blocks award Shards. Strong bonus rounds increase the chain reward.")}</p>}
          <button className="button button-primary" type="button" onClick={() => { setActivePanel(null); if (activePanel === "how") enterGame(); }}>{t("Enter mission")} <span>↗</span></button>
        </div>
      </div>}

      {showSignIn && <SignIn onSignIn={signIn} onModalClose={closeSignIn} disabled={isAuthLoading} />}
      {termsOpen && <TermsDialog onClose={() => setTermsOpen(false)} />}
    </main>
  );
};

export default Shop;
