import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import SignIn from "../components/SignIn";

import { useAuth } from "../hooks/useAuth";
import { usePayments } from "../hooks/usePayments";
import { axiosClient } from "../lib/axiosClient.ts";
import { BEST_SCORE_KEY, HIGHEST_SECTOR_KEY, TOTAL_DESTROYED_KEY } from "./GamePage.tsx";
import { allPlayerColors, buyShipVariant, EXTRA_STARTER_PRICE, fleetCount, playerColors, playerSkins, readShipFleet, savedShipColors, selectedShip, shardBalance, testnetStandardHullAvailable, ADMIN_SHIP_COLOR_KEY, ADMIN_SHIP_SKIN_KEY, ADMIN_SHIP_STAGE_KEY, ADMIN_START_SECTOR_KEY, SHARD_BALANCE_KEY, SHIP_COLOR_KEY, SHIP_COLORS_KEY, SHIP_FLEET_KEY, SHIP_OWNED_KEY, SHIP_SKIN_KEY, type PlayerColorId, type ShipFleet } from "./shipFleet";
import PaintedShip from "./PaintedShip";
import { ownedShipStage, shipEvolutionAsset, type ShipStage } from "./shipEvolution";
import { shipPreviewPlacement } from "./shipPreviewPlacement";
import ShipSelectionPanel from "./ShipSelectionPanel";
import TermsDialog from "../components/TermsDialog";
import { hangarCatalog } from "../../../backend/src/hangarCatalog";
import { primeGameAudio } from "./gameAudio";
import { EFFECTS_VOLUME_KEY, MUSIC_STORAGE_KEY, MUSIC_VOLUME_KEY, readEffectsVolume, readMusicVolume, resetAudioVolumeDefaults } from "./musicPreferences";
import { handoffGameMusic, MusicPlayer } from "./musicPlayback";
import MusicVolumeSlider from "./MusicVolumeSlider";
import Starfield from "./Starfield";
import HomeCombatPreview from "./HomeCombatPreview";
import GameGuide from "./GameGuide";
import { languages, useLocale, type Locale } from "../i18n";
import EarthGlobe from "./EarthGlobe";
import EarthNetwork from "./EarthNetwork";
import { requestGameFullscreen } from "./gameFullscreen";
import { MAX_DIFFICULTY_LEVEL } from "./levelDifficulty";
import { powerUpSymbols, type PowerUpType } from "./powerUps";
import { CONTROL_HAND_KEY, CONTROL_SENSITIVITY_KEY, CONTROL_ZONE_KEY, SHIP_START_KEY, readControlHand, readControlSensitivity, readControlZone, readShipStart, type ControlHand, type ControlSensitivity, type ControlZone, type ShipStart } from "./controlPreferences";
import { BOSS_STICKER_COUNT, CHAIN_MILESTONES, readRewardProgress, REWARD_PROGRESS_KEY, rewardRank } from "./rewardProgress";

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
const TESTNET_PAID_WEAPON_IDS = new Set(["weapon_twin", "weapon_rapid_twin"]);
const adminFleet: ShipFleet = Object.fromEntries(playerSkins.map(skin => [skin.id, Object.fromEntries(playerColors.map(color => [color.id, 1]))])) as ShipFleet;

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
  const [musicEnabled, setMusicEnabled] = useState(() => localStorage.getItem(MUSIC_STORAGE_KEY) !== "off");
  const musicEnabledRef = useRef(musicEnabled);
  const [musicVolume, setMusicVolume] = useState(readMusicVolume);
  const [effectsVolume, setEffectsVolume] = useState(readEffectsVolume);
  useEffect(() => { resetAudioVolumeDefaults(); }, []);
  const homeMusicRef = useRef<MusicPlayer | null>(null);
  const musicHandedOffRef = useRef(false);
  useEffect(() => {
    const music = new MusicPlayer("/audio/home-galactic-chain.mp3", readMusicVolume());
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
      if (!musicHandedOffRef.current) music.close();
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
  const [rewardProgress] = useState(() => readRewardProgress(localStorage.getItem(REWARD_PROGRESS_KEY)));
  const {
    user, canAdmin, adminMode, setAdminPreview, isAuthenticated, showSignIn, signIn, signOut,
    closeSignIn, requireAuth, isLoading: isAuthLoading,
  } = useAuth();
  const [adminError, setAdminError] = useState("");
  const [startSector, setStartSector] = useState(1);
  const [selected, setSelected] = useState(selectedShip);
  const [previewSkin, setPreviewSkin] = useState(() => selectedShip().skin);
  const [previewColor, setPreviewColor] = useState(() => selectedShip().color);
  const [previewFocusStage, setPreviewFocusStage] = useState<ShipStage>(1);
  const [adminStage, setAdminStage] = useState<ShipStage>(() => {
    const saved = Number(sessionStorage.getItem(ADMIN_SHIP_STAGE_KEY));
    return saved === 2 || saved === 3 ? saved : 1;
  });
  const [shipQuery, setShipQuery] = useState("");
  const [shipSearchOpen, setShipSearchOpen] = useState(false);
  const shipSearchRef = useRef<HTMLDivElement>(null);
  const [fleet, setFleet] = useState(() => readShipFleet(localStorage.getItem(SHIP_FLEET_KEY), localStorage.getItem(SHIP_OWNED_KEY), localStorage.getItem(SHIP_COLORS_KEY)));
  const visibleFleet = adminMode ? adminFleet : fleet;
  const [shards, setShards] = useState(() => shardBalance(localStorage.getItem(SHARD_BALANCE_KEY)));
  const [hangarMessage, setHangarMessage] = useState("");
  const [offers, setOffers] = useState<Offer[]>(() => [...hangarCatalog]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const selectedStage = adminMode ? adminStage : ownedShipStage(selected.skin.sprite, inventory?.ownedShipUpgrades);
  const previewStage = ownedShipStage(previewSkin.sprite, inventory?.ownedShipUpgrades);
  const [loadoutMessage, setLoadoutMessage] = useState("");
  const shipSearchOptions = playerSkins.filter(skin => shopView === "shop" || fleetCount(visibleFleet, skin.id) > 0);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const current = selectedShip();
      setSelected(current);
      setPreviewSkin(current.skin);
      setPreviewColor(current.color);
      setInventory(null);
    });
    return () => { active = false; };
  }, [adminMode]);
  const matchingShipOptions = shipSearchOptions.filter(skin =>
    skin.name.toLocaleLowerCase(locale).includes(shipQuery.trim().toLocaleLowerCase(locale)));
  const shipResultsVisible = shipSearchOpen;
  useEffect(() => { setShipQuery(""); setShipSearchOpen(shopView === "shop"); if (shopView === "shop") setPreviewFocusStage(adminMode ? adminStage : 1); }, [shopView, adminMode, adminStage]);
  useEffect(() => {
    if (!shipSearchOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !shipSearchRef.current?.contains(event.target)) setShipSearchOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [shipSearchOpen]);
  const chooseSearchResult = (skin: typeof playerSkins[number]) => {
    const color = skin.id === selected.skin.id ? selected.color : allPlayerColors.find(item => fleetCount(visibleFleet, skin.id, item.id)) ?? playerColors[0];
    setPreviewSkin(skin);
    setPreviewColor(color);
    setPreviewFocusStage(adminMode ? adminStage : 1);
    setShipQuery("");
    setShipSearchOpen(false);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    if (shopView === "hangar") equipShip(skin, color);
    else setHangarMessage("");
  };
  const enterGame = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    if (adminMode) sessionStorage.setItem(ADMIN_START_SECTOR_KEY, String(Number.isInteger(startSector) ? Math.min(MAX_DIFFICULTY_LEVEL, Math.max(1, startSector)) : 1));
    else sessionStorage.removeItem(ADMIN_START_SECTOR_KEY);
    if (musicEnabledRef.current && homeMusicRef.current) {
      handoffGameMusic(homeMusicRef.current);
      musicHandedOffRef.current = true;
    }
    primeGameAudio(); requestGameFullscreen(); navigate("/game");
  };

  const purchasePreview = () => {
    if (adminMode) return;
    if (previewFocusStage !== 1) return;
    if (!testnetStandardHullAvailable(previewSkin.id)) { setHangarMessage("MAINNET READY"); return; }
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
    if (!fleetCount(visibleFleet, skin.id, color.id)) return;
    if (adminMode) {
      sessionStorage.setItem(ADMIN_SHIP_SKIN_KEY, skin.id);
      sessionStorage.setItem(ADMIN_SHIP_COLOR_KEY, color.id);
      setSelected({ skin, color });
      setHangarMessage(`${skin.name} · ${t(color.name)} · Admin-Testauswahl`);
      return;
    }
    localStorage.setItem(SHIP_SKIN_KEY, skin.id);
    localStorage.setItem(SHIP_COLOR_KEY, color.id);
    const nextColors = { ...savedShipColors(localStorage.getItem(SHIP_COLORS_KEY)), [skin.id]: color.id };
    localStorage.setItem(SHIP_COLORS_KEY, JSON.stringify(nextColors));
    setSelected({ skin, color });
    setHangarMessage(`${skin.name} · ${t(color.name)} · ${t("EQUIPPED")}`);
  };
  const toggleAdmin = async () => {
    try { await setAdminPreview(!adminMode); setAdminError(""); }
    catch { setAdminError("Admin-Modus konnte nicht geändert werden. Bitte erneut anmelden."); }
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("pi_signin") !== "1") return;
    url.searchParams.delete("pi_signin");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    void signIn();
  }, [signIn]);

  const { orderProduct, isLoading, paymentDiagnostic } = usePayments({
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
    let active = true;
    axiosClient.get<Inventory>("/hangar/inventory").then(({ data }) => {
      if (!Array.isArray(data.ownedWeapons) || !Array.isArray(data.ownedArmor) || !Array.isArray(data.consumables)) throw new Error("Invalid inventory");
      if (active) setInventory(data);
    }).catch(() => { if (active) setLoadoutMessage(t('Connect your Pi account to see your saved loadout.')); });
    return () => { active = false; };
  }, [isAuthenticated, adminMode]);
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
        canAdmin={canAdmin}
        adminMode={adminMode}
        onToggleAdmin={() => { void toggleAdmin(); }}
        onSignIn={signIn}
        onSignOut={() => { setInventory(null); void signOut(); }}
        onSendTestNotification={onSendTestNotification}
        isLoading={isAuthLoading}
      />
      {adminError && <p role="alert" className="hangar-message">{adminError}</p>}
      {adminMode && <div className="admin-preview-banner" role="status">Admin-Testmodus aktiv · Käufe und Rekorde werden nicht gespeichert.</div>}

      <section className="hero-section">
        <button className="home-music-toggle" type="button" data-state={musicEnabled ? "playing" : "off"} aria-pressed={musicEnabled} aria-label={musicLabel} title={musicLabel} onClick={toggleHomeMusic}><span className="home-music-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" />{musicEnabled ? <><path d="M16 9a4 4 0 0 1 0 6" /><path d="M19 6a8 8 0 0 1 0 12" /></> : <path d="m17 9 5 6m0-6-5 6" />}</svg></span></button>
        <Starfield sector={1} player={{ x: .5, y: .8 }} paused={false} />
        <div className="home-deep-space" aria-hidden="true"><span className="home-far-planet home-far-planet-gas" /><span className="home-far-planet home-far-planet-saturn" /><span className="home-far-planet home-far-moon" /><span className="home-black-hole"><i /></span></div>
        <div className="hero-copy">
          <p className="eyebrow"><span className="signal-dot" /> {t("Mission control online")}</p>
          <h1><span className="home-title-word">Cryptoid</span><span className="home-title-evolution">Evolution</span></h1>
          <p className="hero-tagline">Defend Earth. <span>Evolve your power.</span></p>
          <p className="hero-description">{t('Build your streak, master the grid, and become the force Earth needs.')}</p>
          {adminMode && <div className="admin-level-picker" aria-label="Admin-Teststart"><label>Level <select value={Math.floor((startSector - 1) / 10) + 1} onChange={event => setStartSector((Number(event.target.value) - 1) * 10 + (startSector - 1) % 10 + 1)}>{Array.from({ length: MAX_DIFFICULTY_LEVEL / 10 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label><label>Start bei <select value={(startSector - 1) % 10 + 1} onChange={event => setStartSector((Math.floor((startSector - 1) / 10) * 10) + Number(event.target.value))}>{Array.from({ length: 9 }, (_, index) => <option key={index} value={index + 1}>Block {index + 1}</option>)}<option value="10">Boss</option></select></label></div>}
          <HomeCombatPreview defender={{ sprite: selected.skin.sprite, color: selected.color.id, stage: selectedStage }} />
          <div className="hero-actions">
            <div className="home-launch">
              <button className="button button-primary home-play-button" type="button" onClick={enterGame}>{t("Play")} <span className="button-glyph" aria-hidden="true">→</span></button>
            </div>
            <button className="button button-secondary" type="button" onClick={() => { setPreviewSkin(selected.skin); setPreviewColor(selected.color); setShopView("hangar"); }}>{t('Shop / Hangar')} <span className="button-glyph" aria-hidden="true">◇</span></button>
            <button className="button button-secondary" type="button" onClick={() => { setLeadersStatus("loading"); setShopView("leaders"); }}>{t('Top 100')} <span className="button-glyph" aria-hidden="true">⌁</span></button>
            <button className="button button-secondary" type="button" onClick={() => setSystemMenuOpen(true)}>{t('System menu')} <span className="button-glyph" aria-hidden="true">⚙</span></button>
          </div>
        </div>
        <div className="planet-stage" aria-label="Cryptoid Evolution planet status">
          <div className="planet"><EarthGlobe /><EarthNetwork /></div>
          <span className="orbit-status">{t('ORBITAL DEFENSE ACTIVE')}</span>
          <div className="stage-label"><span className="stage-label-value">01</span><span>{t('Genesis sector')}</span></div>
        </div>
        <footer className="home-footer">
          <button type="button" className="text-button terms-entry" onClick={() => setTermsOpen(true)}>Nutzungsbedingungen / Terms of Service</button>
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
        {user && <p className="admin-account-id">Pi-Konto-ID: <code>{user.uid}</code></p>}
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
        <article className="status-card reward-collection">
          <div className="card-heading"><span>RANG & SAMMLUNG</span><span className="card-icon">✦</span></div>
          <h3>{rewardRank(rewardProgress)}</h3>
          <p>{Object.keys(rewardProgress.bossWins).length}/{BOSS_STICKER_COUNT} Boss-Sticker · {rewardProgress.completedChains.length} Chains · {rewardProgress.perfectBonuses} perfekte Bonusrunden</p>
          <div className="reward-milestones" aria-label="Chain-Meilensteine">{CHAIN_MILESTONES.map(target => <span key={target} className={rewardProgress.completedChains.length >= target ? "earned" : ""} title={`${target} Chains`}>◆ {target}</span>)}</div>
          <h4>Boss-Sticker</h4>
          <div className="boss-sticker-grid">{Array.from({ length: BOSS_STICKER_COUNT }, (_, index) => {
            const id = index + 1;
            const stars = rewardProgress.bossWins[id] ?? 0;
            return <div key={id} className={`boss-sticker${stars ? " boss-sticker-earned" : ""}`} title={`Boss ${id}: ${stars ? `${stars} Stern${stars > 1 ? "e" : ""}` : "noch nicht besiegt"}`} aria-label={`Boss ${id}: ${stars ? `${stars} von 3 Sternen` : "noch gesperrt"}`}>
              {stars ? <img src={`/ships/bosses/boss_${String(id).padStart(2, "0")}.webp`} alt="" loading="lazy" /> : <span aria-hidden="true">?</span>}
              <small>#{String(id).padStart(2, "0")}</small>{!!stars && <b>{"★".repeat(stars)}</b>}
            </div>;
          })}</div>
          <h4>Bonus-Medaillen</h4>
          <p>{Object.values(rewardProgress.bonusMedals).filter(medal => medal === "gold").length} Gold · {Object.values(rewardProgress.bonusMedals).filter(medal => medal === "silver").length} Silber · {Object.values(rewardProgress.bonusMedals).filter(medal => medal === "bronze").length} Bronze</p>
          <small>Sticker und Abzeichen werden auf diesem Gerät gespeichert. Admin-Testläufe zählen nicht.</small>
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
        <div className="ship-panel-heading"><div><p className="eyebrow">{t(shopView === "hangar" ? "YOUR HANGAR" : "SHIP SHOP")}</p><h2 id="hangar-heading">{t(shopView === "hangar" ? "Your fleet" : "Available ships")}</h2></div><strong className="shard-balance">◆ {shards} <small>{t("Shards")}</small></strong></div>
        <p className="testnet-shop-notice">Testnet: Grey Scout kostenlos, 9 Standardtypen für Shards. MAINNET READY = hier noch gesperrt.</p>
        <details className="ship-earnings"><summary>{t("How to earn Shards")}</summary><p>{t("At level 1, defeats earn Shards by enemy class: light 2, medium 4–5, elite 6, heavy 8, boss 16. Rewards grow with level. Bonus targets earn 1 each, plus a completion reward that grows with level. Your Shards are saved at mission end.")}</p></details>
        <label className="ship-search-label" htmlFor="ship-search">{t("Find a ship")} <small>{matchingShipOptions.length}/{shipSearchOptions.length}</small></label>
        <div className="ship-search-wrap" ref={shipSearchRef}>
          <div className="ship-search-control">
            <input id="ship-search" className="ship-search" type="search" value={shipQuery} onFocus={() => setShipSearchOpen(true)} onChange={event => { setShipQuery(event.target.value); setShipSearchOpen(true); }} onKeyDown={event => { if (event.key === "Escape") { setShipSearchOpen(false); event.currentTarget.blur(); } else if (event.key === "Enter") { event.currentTarget.blur(); } else if (event.key === "ArrowDown" && shipResultsVisible) { event.preventDefault(); shipSearchRef.current?.querySelector<HTMLButtonElement>(".ship-search-result")?.focus(); } }} placeholder={t("Search ship name")} aria-expanded={shipResultsVisible} aria-controls="ship-search-results" autoComplete="off" />
            <button className="ship-search-toggle" type="button" aria-label={t("Show ships")} aria-expanded={shipSearchOpen} aria-controls="ship-search-results" onClick={() => setShipSearchOpen(open => !open)}><span aria-hidden="true">⌄</span></button>
          </div>
          {shipResultsVisible && <div className="ship-search-results" id="ship-search-results" role="group" aria-label={t("Available ships")}>
            {matchingShipOptions.map(skin => {
              const total = fleetCount(visibleFleet, skin.id);
              const status = total ? `${t("Owned")} ×${total}` : testnetStandardHullAvailable(skin.id) ? `◆ ${skin.price || EXTRA_STARTER_PRICE} ${t("Shards")}` : "MAINNET READY";
              return <button className={`ship-search-result${previewSkin.id === skin.id ? " ship-search-selected" : ""}`} key={skin.id} type="button" onClick={() => chooseSearchResult(skin)}>
                <span className="ship-search-thumb" aria-hidden="true"><img src={shipEvolutionAsset(skin.sprite, 1)} alt="" loading="lazy" decoding="async" style={shipPreviewPlacement(skin.sprite, 1)} /></span>
                <span className="ship-search-result-name"><strong>{skin.name}</strong><small>{t("STANDARD")} · {status}</small><small>{t("Open for variants and levels")}</small></span><span className="ship-search-arrow" aria-hidden="true">›</span>
              </button>;
            })}
            {matchingShipOptions.length === 0 && <p className="ship-search-empty">{t("No matching ships.")}</p>}
          </div>}
        </div>
        <ShipSelectionPanel view={shopView} skin={previewSkin} color={previewColor} focusStage={previewFocusStage} ownedStage={previewStage} fleet={visibleFleet} shards={shards} adminPreview={adminMode}
          offers={offers.filter(offer => offer.kind === "ship_upgrade")}
          selectedSkinId={selected.skin.id} selectedColorId={selected.color.id} message={hangarMessage} t={t}
          onStageChange={stage => { setPreviewFocusStage(stage); if (adminMode) { setAdminStage(stage); sessionStorage.setItem(ADMIN_SHIP_STAGE_KEY, String(stage)); } setHangarMessage(""); }}
          onColorChange={color => { setPreviewColor(color); if (shopView === "hangar") equipShip(previewSkin, color); else setHangarMessage(""); }}
          onBuyStandard={purchasePreview}
          onEquipPreview={() => equipShip(previewSkin, previewColor)}
          onOpenShop={() => { setPreviewFocusStage(1); setShopView("shop"); }} />
      </section>}

      {(shopView === "weapons" || shopView === "powers") && <section className="upgrade-section" aria-labelledby="upgrade-heading">
        <div className="section-heading"><div><p className="eyebrow">{t('POWER LAB')}</p><h2 id="upgrade-heading">{t('Weapons and start power-ups')}</h2></div><span className="section-line" /></div>
        <p className="testnet-shop-notice">Testnet: Doppellaser und Schneller Doppellaser mit Test-Pi. Dreifachlaser und Plasma = MAINNET READY / GESPERRT.</p>
        <p>Der Standardlaser ist kostenlos. Gekaufte Testnet-Waffen werden erst während der Mission über den Waffen-Button aktiviert und laufen zwei Minuten. Dreifachlaser und Plasma können im Testnet nur über eingesammelte Waffen-Power-ups erreicht werden.</p>
        {([shopView === "weapons" ? "weapon" : "power"] as const).map(kind => <div key={kind} className="hangar-offers"><h3>{t(kind === "weapon" ? "Time-limited weapons" : "One-mission start bonuses")}</h3><div className="hangar-offer-grid">
          {offers.filter(offer => offer.kind === kind).map(offer => {
            const count = inventory?.consumables.find(item => item.id === offer.id)?.count ?? 0;
            const testnetWeaponEnabled = kind !== "weapon" || TESTNET_PAID_WEAPON_IDS.has(offer.id);
            const owned = kind === "weapon" ? testnetWeaponEnabled && inventory?.ownedWeapons.includes(offer.id) : count > 0;
            const selected = kind === "weapon" ? false : inventory?.selectedPower === offer.id;
            const lockedWeapon = kind === "weapon" && !testnetWeaponEnabled;
            return <article key={offer.id} className={`hangar-offer hangar-offer-${kind}${selected ? " hangar-offer-selected" : ""}`}>{kind === "weapon" ? <WeaponPreview offerId={offer.id} sprite={selectedShip().skin.sprite} color={selectedShip().color.id} /> : <PowerPreview offerId={offer.id} />}<h4>{t(offer.name)}</h4><p>{t(offer.description)}</p><span>{lockedWeapon ? "MAINNET READY" : kind === "weapon" ? `${t("2 minutes after activation")} · ${offer.pricePi} Test-Pi` : "MAINNET READY"}</span><strong>{lockedWeapon ? "GESPERRT" : selected ? t("EQUIPPED") : owned ? kind === "power" ? `${count} ${t("AVAILABLE")}` : "IM SPIEL VERFÜGBAR" : kind === "power" ? "GESPERRT" : t("NOT OWNED")}</strong>{lockedWeapon && <p className="testnet-shop-notice">Im Testnet nur als eingesammeltes Waffen-Power-up verfügbar.</p>}<div>
              {owned && kind === "power" ? <button className="button button-secondary" type="button" disabled={Boolean(selected)} onClick={() => equip(null, offer.id)}>{t(selected ? "Selected" : "Equip for next mission")}</button> : null}
              {!adminMode && kind === "weapon" && !lockedWeapon && !owned && <button className="button button-primary" type="button" disabled={isLoading || !catalogReady} onClick={() => orderProduct(`Cryptoid ${offer.name} · 2 minutes after activation · Test-Pi`, offer.pricePi, { productId: offer.id }, () => { setLoadoutMessage(`${offer.name} ${t("purchase confirmed.")}`); void refreshInventory(); })}>Mit Test-Pi kaufen</button>}
            </div></article>;
          })}
        </div></div>)}
        {shopView === "weapons" && <div className="hangar-offers"><h3>{t("Permanent armor")}</h3><p>{t("Armor is always active from mission start, needs no shield and remains yours across all future missions. Each upgrade adds to your maximum hearts.")}</p><div className="hangar-offer-grid">
          {offers.filter(offer => offer.kind === "armor").map(offer => { const owned = inventory?.ownedArmor.includes(offer.id); return <article key={offer.id} className={`hangar-offer hangar-offer-armor${owned ? " hangar-offer-selected" : ""}`}><div className="offer-preview power-preview power-preview-shield" aria-hidden="true"><span className="preview-grid" /><span className="power-preview-orbit"><i>♥</i></span><small>PERMANENT HULL</small></div><h4>{t(offer.name)}</h4><p>{t(offer.description)}</p><span>{owned ? t("Permanent · every mission") : "MAINNET READY"}</span><strong>{owned ? t("OWNED") : "GESPERRT"}</strong></article>; })}
        </div></div>}
        {inventory?.equippedWeapon && <p className="testnet-shop-notice">Hinweis: Eine ältere Vorauswahl ist gespeichert, wird im Spiel aber nicht mehr automatisch aktiviert. Jede Mission beginnt mit dem Standardlaser.</p>}
        {inventory?.selectedPower && <button className="text-button" type="button" onClick={() => equip(inventory.equippedWeapon, null)}>{t('Save bonus for a later mission')}</button>}
        {paymentDiagnostic && <p className="testnet-shop-notice" role="alert"><strong>Zahlungsdiagnose:</strong> {paymentDiagnostic}</p>}
        {loadoutMessage && <p role="status">{loadoutMessage}</p>}
      </section>}
          </div>
        </div>
      </div>}

      {activePanel === "how" && <GameGuide onClose={() => setActivePanel(null)} onStart={() => { setActivePanel(null); enterGame(); }} />}
      {activePanel === "progress" && <div className="info-panel" role="dialog" aria-modal="true" aria-labelledby="info-title">
        <div className="info-panel-content">
          <button className="close-button" type="button" onClick={() => setActivePanel(null)} aria-label={t('Close')}>×</button>
          <p className="eyebrow">{t("MISSION LOG")}</p>
          <h2 id="info-title">{t("Your Progress")}</h2>
          <p>{t("Your best score is {score}, your highest sector is {sector}, and you have destroyed {destroyed} Cryptoids.").replace("{score}", String(personalBest ?? records.bestScore)).replace("{sector}", String(records.highestSector)).replace("{destroyed}", String(records.totalDestroyed))}</p>
          <button className="button button-primary" type="button" onClick={() => setActivePanel(null)}>{t("Close")}</button>
        </div>
      </div>}

      {showSignIn && <SignIn onSignIn={signIn} onModalClose={closeSignIn} disabled={isAuthLoading} />}
      {termsOpen && <TermsDialog onClose={() => setTermsOpen(false)} />}
    </main>
  );
};

export default Shop;
