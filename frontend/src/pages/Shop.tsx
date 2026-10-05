import { bossCardAvailable } from './cardAvailability';
import CardReveal from './CardReveal';
import { availableShipCards, unseenShipCards, type CardReward } from './cardRevealRules';
import { acknowledgeCard, readCardReveals } from './cardRevealMemory';
import { primeCardSound } from './cardSound';
import Collection from "./Collection";
import SystemSettings, { applySavedDisplaySettings, type SettingsSection } from "./SystemSettings";
import { useCallback, useEffect, useRef, useState } from "react";
import QuickAccessMenu, { type QuickAction } from "../components/QuickAccessMenu";
import type { GuideTopic } from "./GameGuide";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import PiPrice from "../components/PiPrice";
import SignIn from "../components/SignIn";

import { useAuth } from "../hooks/useAuth";
import { accountSelection, loadAccountSave, localInventory, mutateAccountInventory, type AccountSave } from "../lib/accountSave";
import { usePayments } from "../hooks/usePayments";
import { axiosClient } from "../lib/axiosClient.ts";
import { BEST_SCORE_KEY, HIGHEST_SECTOR_KEY, TOTAL_DESTROYED_KEY } from "./GamePage.tsx";
import { allPlayerColors, buyShipVariant, standardShipPrice, fleetCount, playerColors, playerSkins, readShipFleet, savedShipColors, selectedShip, shardBalance, shipSaveNetwork, testnetStandardHullAvailable, ADMIN_SHIP_COLOR_KEY, ADMIN_SHIP_SKIN_KEY, ADMIN_SHIP_STAGE_KEY, ADMIN_START_SECTOR_KEY, SHARD_BALANCE_KEY, SHIP_COLOR_KEY, SHIP_COLORS_KEY, SHIP_FLEET_KEY, SHIP_OWNED_KEY, SHIP_SKIN_KEY, type ShipFleet } from "./shipFleet";
import { ownedShipStage, shipEvolutionAsset, type ShipStage } from "./shipEvolution";
import { shipPreviewPlacement } from "./shipPreviewPlacement";
import ShipSelectionPanel from "./ShipSelectionPanel";
import TermsDialog from "../components/TermsDialog";
import { hangarCatalog } from "../../../backend/src/hangarCatalog";
import { isTestnetWeaponPurchaseEnabled } from "../../../backend/src/paymentPolicy";
import { primeGameAudio } from "./gameAudio";
import { EFFECTS_VOLUME_KEY, MUSIC_STORAGE_KEY, MUSIC_VOLUME_KEY, readEffectsVolume, readMusicVolume, resetAudioVolumeDefaults } from "./musicPreferences";
import { handoffGameMusic, MusicPlayer } from "./musicPlayback";
import Starfield from "./Starfield";
import HomeCombatPreview from "./HomeCombatPreview";
import GameGuide from "./GameGuide";
import WeaponTutorial from "./WeaponTutorial";
import WeaponPurchase from './WeaponPurchase';
import WeaponPreview from './WeaponPreview';
import BossPortrait from "./BossPortrait";
import BossDossier from './BossDossier';
import { bossDossierLabel } from './bossLore';
import { bossName } from './bossNames';
import { useLocale } from "../i18n";
import EarthGlobe from "./EarthGlobe";
import EarthNetwork from "./EarthNetwork";
import { requestGameFullscreen } from "./gameFullscreen";
import { MAX_DIFFICULTY_LEVEL } from "./levelDifficulty";
import { powerUpSymbols, type PowerUpType } from "./powerUps";
import { BOSS_STICKER_COUNT, CHAIN_MILESTONES, emptyRewardProgress, rankForLevel, readRewardProgress, REWARD_PROGRESS_KEY, rewardRank, type RewardProgress } from "./rewardProgress";

type Offer = { id: string; kind: "weapon" | "power" | "armor" | "ship_upgrade"; name: string; description: string; pricePi: number; shipIndex?: number; stage?: 2 | 3 };
type Inventory = { weaponStock?: Record<string, number>; ownedWeapons: string[]; ownedArmor: string[]; ownedShipUpgrades?: string[]; consumables: { id: string; count: number }[]; equippedWeapon: string | null; selectedPower: string | null };
type Leader = { rank: number; username: string; score: number; serviceRank: { name: string; symbol: string } };
const collectionLabel = (locale: string) => locale.startsWith("de") ? "Sammelkarten" : "Card collection";
const HOME_STAR_POSITION = { x: .5, y: .8 };

const shopTabs = [
  ["hangar", "Hangar", "◇"],
  ["shop", "Shop", "▱"],
  ["weapons", "Weapons", "⌁"],
  ["powers", "Power-ups", "✦"],
  ["progress", "Progress", "↗"],
  ["rewards", "Rewards", "✧"],
  ["leaders", "Top 100", "#"],
] as const;

const powerTypeForOffer = (offerId: string): PowerUpType => offerId.includes("shield") ? "shield" : offerId.includes("rapid") ? "rapid" : offerId.includes("bomb") ? "bomb" : offerId.includes("emp") ? "emp" : "overdrive";
const adminFleet: ShipFleet = Object.fromEntries(playerSkins.map(skin => [skin.id, Object.fromEntries(playerColors.map(color => [color.id, 1]))])) as ShipFleet;

const PowerPreview = ({ offerId }: { offerId: string }) => {
  const { t } = useLocale();
  const type = powerTypeForOffer(offerId);
  return <div className={`offer-preview power-preview power-preview-${type}`} aria-hidden="true">
    <span className="preview-grid" />
    <span className="power-preview-orbit"><i>{powerUpSymbols[type]}</i></span>
    <span className="power-preview-wave" />
    <small>{t("Energy core")}</small>
  </div>;
};

const Shop = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, t } = useLocale();
  const piPrice = (amount: number, testnet = false) => <PiPrice amount={amount} locale={locale} testnet={testnet} />;
  const [activePanel, setActivePanel] = useState<"how" | "progress" | null>(null);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [quickGroup, setQuickGroup] = useState<string | null>(() => location.state?.openQuickMenu ? "mission" : null);
  const [settingsSection, setSettingsSection] = useState<SettingsSection | undefined>();
  const [guideTopic, setGuideTopic] = useState<GuideTopic>("controls");
  const [quickTarget, setQuickTarget] = useState<string | null>(null);
  const closeQuickMenu = useCallback(() => setQuickGroup(null), []);
  const [shopView, setShopView] = useState<"hangar" | "shop" | "weapons" | "powers" | "progress" | "rewards" | "leaders" | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [newCards,setNewCards]=useState<CardReward[]>([]);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [selectedBoss, setSelectedBoss] = useState<number | null>(null);
  const returnToMenu = () => { setShopView(null); setSystemMenuOpen(false); setActivePanel(null); setTermsOpen(false); setQuickTarget(null); setQuickGroup("mission"); };
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [leaderRules, setLeaderRules] = useState<1 | 2>(2);
  const [leadersStatus, setLeadersStatus] = useState<"loading" | "ready" | "error">("loading");
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(() => localStorage.getItem(MUSIC_STORAGE_KEY) !== "off");
  const [musicNeedsTap, setMusicNeedsTap] = useState(false);
  const musicEnabledRef = useRef(musicEnabled);
  const [musicVolume, setMusicVolume] = useState(readMusicVolume);
  const [effectsVolume, setEffectsVolume] = useState(readEffectsVolume);
  useEffect(() => { resetAudioVolumeDefaults(); }, []);
  const homeMusicRef = useRef<MusicPlayer | null>(null);
  const musicHandedOffRef = useRef(false);
  useEffect(() => {
    const music = new MusicPlayer("/audio/light-the-void.mp3", readMusicVolume());
    homeMusicRef.current = music;
    let active = true;
    const start = () => {
      if (!musicEnabledRef.current) return;
      void music.play().then(ok => { if (active && musicEnabledRef.current) setMusicNeedsTap(!ok && !music.playing); });
    };
    const resumeOnGesture = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(".home-music-toggle")) return;
      start();
    };
    document.addEventListener("pointerdown", resumeOnGesture, true);
    document.addEventListener("pointerup", resumeOnGesture, true);
    document.addEventListener("touchend", resumeOnGesture, true);
    document.addEventListener("keydown", resumeOnGesture, true);
    const resumeWhenVisible = () => { if (!document.hidden) start(); };
    window.addEventListener("pageshow", resumeWhenVisible);
    document.addEventListener("visibilitychange", resumeWhenVisible);
    start();
    return () => {
      active = false;
      document.removeEventListener("pointerdown", resumeOnGesture, true);
      document.removeEventListener("pointerup", resumeOnGesture, true);
      document.removeEventListener("touchend", resumeOnGesture, true);
      document.removeEventListener("keydown", resumeOnGesture, true);
      window.removeEventListener("pageshow", resumeWhenVisible);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
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
    if (musicEnabledRef.current && musicNeedsTap) {
      void homeMusicRef.current?.play().then(ok => setMusicNeedsTap(!ok));
      return;
    }
    const next = !musicEnabledRef.current;
    musicEnabledRef.current = next;
    localStorage.setItem(MUSIC_STORAGE_KEY, next ? "on" : "off");
    setMusicEnabled(next);
    if (next) void homeMusicRef.current?.play().then(ok => setMusicNeedsTap(!ok));
    else { homeMusicRef.current?.pause(); setMusicNeedsTap(false); }
  };
  const musicLabel = t(musicEnabled ? musicNeedsTap ? "Tap for music" : "Music on" : "Music off");
  useEffect(() => {
    if (shopView !== "leaders" && shopView !== "progress") return;
    let current = true;
    if (shopView === "leaders") {
      axiosClient.get<{ leaders: Leader[] }>(`/leaderboard/top?rules=${leaderRules}`).then(({ data }) => {
        if (!Array.isArray(data?.leaders)) throw new Error("Invalid leaderboard response");
        if (current) { setLeaders(data.leaders); setLeadersStatus("ready"); }
      }).catch(() => { if (current) setLeadersStatus("error"); });
    }
    axiosClient.get<{ bestScore: number }>(`/leaderboard/me?rules=${shopView === "leaders" ? leaderRules : 2}`).then(({ data }) => { if (current) setPersonalBest(data.bestScore); }).catch(() => { if (current) setPersonalBest(null); });
    return () => { current = false; };
  }, [shopView, leaderRules]);
  useEffect(applySavedDisplaySettings, []);
  useEffect(() => {
    if (!systemMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { setSystemMenuOpen(false); } };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [systemMenuOpen]);
  useEffect(() => {
    if (!shopView) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !document.querySelector('dialog.boss-dossier[open]')) setShopView(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [shopView, leaderRules]);
  const [records] = useState(() => ({ bestScore: Number(localStorage.getItem(BEST_SCORE_KEY) || 0), highestSector: Number(localStorage.getItem(HIGHEST_SECTOR_KEY) || 0), totalDestroyed: Number(localStorage.getItem(TOTAL_DESTROYED_KEY) || 0) }));
  const [rewardProgress, setRewardProgress] = useState<RewardProgress>(emptyRewardProgress);
  const [rewardStatus, setRewardStatus] = useState<"loading" | "ready" | "error">("loading");
  const [rewardOwner, setRewardOwner] = useState<string | null>(null);
  const [rewardNetwork, setRewardNetwork] = useState<"testnet" | "mainnet">(() => window.location.hostname.includes("testnet") ? "testnet" : "mainnet");
  const latestRewardLevel = Math.max(1, ...Object.keys(rewardProgress.linkedBlocks ?? {}).map(Number));
  const {
    user, canAdmin, adminMode, setAdminPreview, isAuthenticated, showSignIn, signIn, signOut,
    closeSignIn, requireAuth, isLoading: isAuthLoading, authReady, authError,
  } = useAuth();
  useEffect(() => { setSelectedBoss(null); }, [shopView, user?.uid]);
  useEffect(() => {
    if (!user) {
      setRewardProgress(readRewardProgress(localStorage.getItem(REWARD_PROGRESS_KEY)));
      setRewardOwner(null);
      setRewardStatus("ready");
      return;
    }
    let active = true;
    setRewardStatus("loading");
    axiosClient.get<{ progress: RewardProgress; network: "testnet" | "mainnet" }>("/rewards/me")
      .then(({ data }) => { if (active) { setRewardProgress(data.progress); setRewardNetwork(data.network); setRewardOwner(user.uid); setRewardStatus("ready"); } })
      .catch(() => { if (active) setRewardStatus("error"); });
    return () => { active = false; };
  }, [user?.uid, shopView === "rewards"]);
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
  const [accountState, setAccountState] = useState<{ owner: string; save: AccountSave } | null>(null);
  const [accountError, setAccountError] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [importConfirmed, setImportConfirmed] = useState(false);
  const account = user && !adminMode && accountState?.owner === user.uid ? accountState.save : null;
  const visibleFleet = adminMode ? adminFleet : account?.fleet ?? fleet;
  const [shards, setShards] = useState(() => shardBalance(localStorage.getItem(SHARD_BALANCE_KEY)));
  const displayedShards = account?.balance ?? shards;
  const displayedRecords = user && !adminMode ? { highestSector: account?.highestSector || 1, totalDestroyed: account?.totalDestroyed || 0 } : records;
  const accountUid = user?.uid;
  useEffect(() => {
    if (!accountUid || adminMode) return;
    let active = true;
    void loadAccountSave().then(save => {
      if (!active) return;
      setAccountState({ owner: accountUid, save }); setAccountError("");
      const choice = accountSelection(save); setSelected(choice); setPreviewSkin(choice.skin); setPreviewColor(choice.color);
    }).catch(() => { if (active) setAccountError("Save unavailable. Local data is unchanged; account purchases are locked until connected."); });
    return () => { active = false; };
  }, [accountUid, adminMode]);
  const accountCommand = async (command: object) => {
    if (!account || !user || accountBusy) return;
    setAccountBusy(true); setAccountError("");
    try {
      const save = await mutateAccountInventory(account, command);
      setAccountState({ owner: user.uid, save });
      setSelected(accountSelection(save));
      const acquired=availableShipCards(playerSkins,save.fleet,save.usedShipSkins||[],[]).filter(card=>card.ship&&!fleetCount(account.fleet as ShipFleet,card.ship as typeof playerSkins[number]['id']));
      if(acquired.length)setNewCards(unseenShipCards(acquired,readCardReveals(user.uid)));

      setHangarMessage("Saved to your Pi account.");
    } catch {
      setAccountError("Not confirmed. Refresh inventory. Confirmed purchases will not be repeated.");
      try { const save = await loadAccountSave(); setAccountState({ owner: user.uid, save }); } catch { /* No local fallback for account balances. */ }
    } finally { setAccountBusy(false); }
  };
  const [hangarMessage, setHangarMessage] = useState<string | { ship: string; color: string; status: string; count?: number }>("");
  const hangarMessageText = typeof hangarMessage === "string" ? t(hangarMessage) : `${hangarMessage.ship} · ${t(hangarMessage.color)} · ${t(hangarMessage.status)}${hangarMessage.count ? ` ×${hangarMessage.count}` : ""}`;
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
  }, [adminMode, user?.uid]);
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
    primeCardSound();
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
    primeCardSound();
    if (adminMode) return;
    if (previewFocusStage !== 1) return;
    if (!testnetStandardHullAvailable(previewSkin.id)) { setHangarMessage("MAINNET READY"); return; }
    if (user) {
      if (!account) { setAccountError("Account save is loading or unavailable."); return; }
      void accountCommand({ action: "buy", skin: previewSkin.id, color: previewColor.id }); return;
    }
    const currentFleet = readShipFleet(localStorage.getItem(SHIP_FLEET_KEY), localStorage.getItem(SHIP_OWNED_KEY), localStorage.getItem(SHIP_COLORS_KEY));
    const currentBalance = shardBalance(localStorage.getItem(SHARD_BALANCE_KEY));
    setShards(currentBalance);
    const purchase = buyShipVariant(previewSkin.id, previewColor.id, currentFleet, currentBalance);
    if (!purchase) { setHangarMessage("Not enough Shards yet. Earn them by defeating Cryptoids."); return; }
    localStorage.setItem(SHIP_FLEET_KEY, JSON.stringify(purchase.fleet));
    localStorage.setItem(SHARD_BALANCE_KEY, String(purchase.balance));
    setFleet(purchase.fleet);
    if(!fleetCount(currentFleet,previewSkin.id))setNewCards(unseenShipCards([{key:`${previewSkin.id}-1`,ship:previewSkin.id,stage:1}],readCardReveals('guest')));

    setShards(purchase.balance);
    setHangarMessage({ ship: previewSkin.name, color: previewColor.name, status: "Owned", count: fleetCount(purchase.fleet, previewSkin.id, previewColor.id) });
  };
  const equipShip = (skin: typeof playerSkins[number], color: typeof allPlayerColors[number]) => {
    // Only a variant already in the fleet can become the active ship.
    if (!fleetCount(visibleFleet, skin.id, color.id)) return;
    if (adminMode) {
      sessionStorage.setItem(ADMIN_SHIP_SKIN_KEY, skin.id);
      sessionStorage.setItem(ADMIN_SHIP_COLOR_KEY, color.id);
      setSelected({ skin, color });
      setHangarMessage({ ship: skin.name, color: color.name, status: "Admin center" });
      return;
    }
    if (user) {
      if (!account) { setAccountError("Account save is loading or unavailable."); return; }
      void accountCommand({ action: "select", skin: skin.id, color: color.id }); return;
    }
    localStorage.setItem(SHIP_SKIN_KEY, skin.id);
    localStorage.setItem(SHIP_COLOR_KEY, color.id);
    const nextColors = { ...savedShipColors(localStorage.getItem(SHIP_COLORS_KEY)), [skin.id]: color.id };
    localStorage.setItem(SHIP_COLORS_KEY, JSON.stringify(nextColors));
    setSelected({ skin, color });
    setHangarMessage({ ship: skin.name, color: color.name, status: "EQUIPPED" });
  };
  const toggleAdmin = async () => {
    try { await setAdminPreview(!adminMode); setAdminError(""); }
    catch { setAdminError("Could not change admin mode. Sign in again."); }
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("pi_signin") !== "1") return;
    if (url.searchParams.get("return_to") === "admin") sessionStorage.setItem("cryptoid_pi_return_to", "/admin");
    url.searchParams.delete("pi_signin");
    url.searchParams.delete("return_to");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    void signIn();
  }, [signIn]);

  const { orderProduct, isLoading, paymentDiagnostic, activeProductId, paymentStatus } = usePayments({
    isAuthenticated,
    onRequireAuth: requireAuth,
  });
  const refreshInventory = async () => {
    try {
      const { data } = await axiosClient.get<Inventory>("/hangar/inventory");
      if (!Array.isArray(data.ownedWeapons) || !Array.isArray(data.ownedArmor) || !Array.isArray(data.consumables)) throw new Error("Invalid inventory");

      if(user&&!adminMode&&account){
        const before=availableShipCards(playerSkins,account.fleet,account.usedShipSkins||[],inventory?.ownedShipUpgrades||[]).map(c=>c.key);
        const acquired=availableShipCards(playerSkins,account.fleet,account.usedShipSkins||[],data.ownedShipUpgrades||[]).filter(c=>!before.includes(c.key));
        if(acquired.length)setNewCards(unseenShipCards(acquired,readCardReveals(user.uid)));
      }
      setInventory(data);
    }
    catch { setLoadoutMessage('Connect your Pi account to see your saved loadout.'); }
  };
  useEffect(() => { axiosClient.get<{ offers: Offer[] }>("/hangar/catalog").then(({ data }) => {
    if (!Array.isArray(data.offers)) throw new Error("Invalid catalog");
    setOffers(data.offers);
    setCatalogReady(true);
  }).catch(() => setLoadoutMessage('Hangar catalog unavailable. Try again when the server is online.')); }, []);
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    axiosClient.get<Inventory>("/hangar/inventory").then(({ data }) => {
      if (!Array.isArray(data.ownedWeapons) || !Array.isArray(data.ownedArmor) || !Array.isArray(data.consumables)) throw new Error("Invalid inventory");
      if (active) setInventory(data);
    }).catch(() => { if (active) setLoadoutMessage('Connect your Pi account to see your saved loadout.'); });
    return () => { active = false; };
  }, [isAuthenticated, adminMode]);
  const equip = async (weapon: string | null, power: string | null) => {
    if (!isAuthenticated) { requireAuth(); return; }
    try {
      await axiosClient.post("/hangar/equip", { weapon, power });
      await refreshInventory();
      setLoadoutMessage('Loadout saved for the next mission.');
    } catch { setLoadoutMessage('Could not save loadout. Please retry.'); }
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

  useEffect(() => {
    if (!shopView || !quickTarget) return;
    const frame = requestAnimationFrame(() => { const target = document.querySelector<HTMLElement>(`.shop-modal ${quickTarget}`); if (target) { target.scrollIntoView({ behavior: "instant", block: "start" }); target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); } });
    return () => cancelAnimationFrame(frame);
  }, [shopView, quickTarget, rewardStatus]);

  const openQuickAction = (action: QuickAction) => {
    closeQuickMenu();
    setQuickTarget(null);
    const guides: Partial<Record<QuickAction, GuideTopic>> = { overview: "overview", visuals: "visuals", "guide-controls": "controls", route: "route", combat: "survival", boosts: "boosts", earnings: "earnings", collection: "collection" };
    if (guides[action]) { setGuideTopic(guides[action]); setActivePanel("how"); return; }
    const settings: Partial<Record<QuickAction, SettingsSection>> = { language: "language", controls: "controls", audio: "audio", display: "display", vibration: "display" };
    if (settings[action]) { setSettingsSection(settings[action]); setSystemMenuOpen(true); return; }
    const fleetViews: Partial<Record<QuickAction, NonNullable<typeof shopView>>> = { hangar: "hangar", shop: "shop", upgrades: "shop", colors: "hangar", weapons: "weapons", armor: "weapons", powers: "powers", progress: "progress", rewards: "rewards", leaders: "leaders", ranks: "rewards", bosses: "rewards", medals: "rewards", chains: "rewards" };
    const view = fleetViews[action];
    if (view) {
      if (view === "hangar" || view === "shop") { setPreviewSkin(selected.skin); setPreviewColor(selected.color); setPreviewFocusStage(1); }
      if (view === "leaders") setLeadersStatus("loading");
      const targets: Partial<Record<QuickAction, string>> = { upgrades: ".ship-evolution-stages", colors: ".ship-one-colors", armor: ".hangar-offer-armor", ranks: "#reward-ranks", bosses: "#reward-bosses", medals: "#reward-medals", chains: "#reward-chains" };
      setQuickTarget(targets[action] ?? null);
      setShopView(view); return;
    }
    if (action === "play") enterGame();
    else if (action === "signin") signIn();
    else if (action === "signout") { setInventory(null); void signOut(); }
    else if (action === "admin") navigate("/admin");
    else if (action === "exit-admin") void toggleAdmin();
    else if (action === "privacy") navigate("/privacy");
    else if (action === "terms") setTermsOpen(true);
  };

  const homePaused = Boolean(newCards.length || collectionOpen || shopView || systemMenuOpen || activePanel || termsOpen || quickGroup || showSignIn);
  return (
    <main className="app-shell landing-shell" data-home-paused={homePaused} onPointerDownCapture={primeCardSound}>
      {newCards[0] && <CardReveal key={user?.uid ?? "guest"} reward={newCards[0]} remaining={newCards.length} onContinue={()=>{acknowledgeCard(user?.uid??"guest",newCards[0].key);setNewCards(cards=>cards.slice(1));}}/>}
      {collectionOpen && <Collection key={user?.uid ?? "guest"} uid={user?.uid} onClose={() => setCollectionOpen(false)} />}
      <Header
        user={user}
        serviceRank={user && rewardStatus === "ready" && rewardOwner === user.uid ? rankForLevel(rewardProgress.highestLevel) : undefined}
        canAdmin={canAdmin}
        adminMode={adminMode}
        onToggleAdmin={() => { void toggleAdmin(); }}
        onSignIn={signIn}
        onSignOut={() => { setInventory(null); void signOut(); }}
        onSendTestNotification={onSendTestNotification}
        isLoading={isAuthLoading}
        authPending={!authReady}
        onOpenQuickAccess={() => setQuickGroup(current => current === null ? "mission" : null)}
        quickAccessOpen={quickGroup !== null}
      />
      {adminError && <p role="alert" className="hangar-message">{t(adminError)}</p>}
      {authError && <p role="alert" className="hangar-message">{t(authError)}</p>}
      {accountError && <p role="alert" className="hangar-message">{t(accountError)}</p>}
      {adminMode && <div className="admin-preview-banner" role="status">{t("Admin test mode: purchases and records are not saved.")}</div>}

      <section className="hero-section" onClick={event => { if (window.matchMedia("(min-width: 701px)").matches && !(event.target as HTMLElement).closest("button, a, input, select, label")) requestGameFullscreen(); }}>
        <button className="wide-fullscreen-control home-fullscreen-control" type="button" onClick={requestGameFullscreen} aria-label={t("Full screen")} title={t("Full screen")}>⛶</button>
        <button className="home-music-toggle" type="button" data-state={musicEnabled ? "on" : "off"} aria-pressed={musicEnabled} aria-label={musicLabel} title={musicLabel} onClick={toggleHomeMusic}><span className="home-music-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" />{musicEnabled ? <><path d="M16 9a4 4 0 0 1 0 6" /><path d="M19 6a8 8 0 0 1 0 12" /></> : <path d="m17 9 5 6m0-6-5 6" />}</svg></span></button>
        <Starfield sector={1} player={HOME_STAR_POSITION} paused={homePaused} />
        <div className="home-deep-space" aria-hidden="true"><span className="home-far-planet home-far-planet-gas" /><span className="home-far-planet home-far-planet-saturn" /><span className="home-far-planet home-far-moon" /><span className="home-black-hole"><i /></span></div>
        <HomeCombatPreview defender={{ sprite: selected.skin.sprite, color: selected.color.id, stage: selectedStage }} paused={homePaused} />
        <div className="hero-copy">
          <p className="eyebrow"><span className="signal-dot" /> {t("Mission control online")}</p>
          <h1><span className="home-title-word">Cryptoid</span><span className="home-title-evolution">Evolution</span></h1>
          <p className="hero-tagline">{t("Defend Earth.")}<span>{t("Evolve your power.")}</span></p>
          <p className="hero-description">{t('Build your streak, master the grid, and become the force Earth needs.')}</p>
          {adminMode && <div className="admin-level-picker" aria-label={t("Admin test start")}><label>{t("Level")} <select value={Math.floor((startSector - 1) / 10) + 1} onChange={event => setStartSector((Number(event.target.value) - 1) * 10 + (startSector - 1) % 10 + 1)}>{Array.from({ length: MAX_DIFFICULTY_LEVEL / 10 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label><label>{t("Start at")} <select value={(startSector - 1) % 10 + 1} onChange={event => setStartSector((Math.floor((startSector - 1) / 10) * 10) + Number(event.target.value))}>{Array.from({ length: 9 }, (_, index) => <option key={index} value={index + 1}>{t("Block")} {index + 1}</option>)}<option value="10">{t("Boss")}</option></select></label></div>}
          <div className="hero-actions">
            <div className="home-launch">
              <button className="button button-primary home-play-button" type="button" onClick={enterGame}>{t("Play")} <span className="button-glyph" aria-hidden="true">→</span></button>
            </div>
          </div>
          <button className="collection-home-button" type="button" disabled={!authReady} onClick={() => setCollectionOpen(true)}>✧ {collectionLabel(locale)}</button>
        </div>
        <div className="planet-stage" aria-label={t("Planet status")}>
          <div className="planet"><EarthGlobe paused={homePaused} /><EarthNetwork /></div>
          <span className="orbit-status">{t('ORBITAL DEFENSE ACTIVE')}</span>
        </div>
        <div className="stage-label home-region-label"><span className="stage-label-value">01</span><span>{t('Genesis sector')}</span></div>
        <footer className="home-footer">
          <button type="button" className="text-button terms-entry" onClick={() => setTermsOpen(true)}>{t("Terms of service")}</button>
        </footer>
      </section>

      {quickGroup !== null && <QuickAccessMenu onClose={closeQuickMenu} onAction={openQuickAction} signedIn={Boolean(user)} canAdmin={Boolean(canAdmin)} adminMode={adminMode} username={user?.username} busy={isAuthLoading || !authReady} />}

      {systemMenuOpen && <div className="system-menu-overlay" role="dialog" aria-modal="true" aria-labelledby="system-menu-title">
        <section className="system-menu-panel">
          <button className="text-button menu-return" type="button" onClick={returnToMenu}>← {t("Back to quick access")}</button>
          <button className="close-button" type="button" onClick={() => setSystemMenuOpen(false)} aria-label={t('Close menu')}>×</button>
          <p className="eyebrow">{t('SYSTEM / SETTINGS')}</p>
          <div className="system-menu-title-row"><h2 id="system-menu-title">{t('System menu')}</h2><button className="system-guide-link" type="button" onClick={() => { setSystemMenuOpen(false); setGuideTopic("controls"); setActivePanel('how'); }}><span className="boss-sticker-silhouette" aria-hidden="true"><BossPortrait id={id} /></span>{t('Game guide')}</button></div>
          <SystemSettings key={settingsSection ?? "overview"} compactMobile idPrefix="home" initialSection={settingsSection} musicVolume={musicVolume} effectsVolume={effectsVolume} changeMusicVolume={changeMusicVolume} changeEffectsVolume={changeEffectsVolume} />
        </section>
      </div>}

      {shopView && <div className="shop-overlay" role="dialog" aria-modal="true" aria-label={t('Shop and hangar')}>
        <div className="shop-modal">
        <div className="shop-modal-header"><button className="text-button menu-return" type="button" onClick={returnToMenu}>← {t("Back to quick access")}</button><strong>{t(shopTabs.find(([view]) => view === shopView)?.[1] ?? "Shop / Hangar")}</strong><button className="close-button" type="button" onClick={() => setShopView(null)} aria-label={t('Close shop')}>×</button></div>
          <div className="shop-modal-body">
      {shopView === "progress" && <section className="dashboard-grid" aria-label={t('Player overview')}>
        {user && <p className="admin-account-id">{t("Pi account ID:")}<code>{user.uid}</code></p>}
        <article className="status-card progress-card">
          <div className="card-heading"><span>{t('YOUR PROGRESS')}</span><span className="card-icon">↗</span></div>
          <div className="progress-row"><strong>{t("Best")} {personalBest ?? records.bestScore}</strong><span>{t("Sector")} {String(displayedRecords.highestSector).padStart(2, "0")}</span></div>
          <div className="progress-track"><span style={{ width: `${Math.min(100, (personalBest ?? records.bestScore) / 10)}%` }} /></div>
          <button className="text-button" type="button" onClick={() => setActivePanel("progress")}>{t("My Progress")} <span>→</span></button>
        </article>
        <article className="status-card streak-card">
          <div className="card-heading"><span>{t('ACTIVE STREAK')}</span><span className="flame">✦</span></div>
          <strong className="streak-number">{displayedRecords.totalDestroyed} <small>{t("asteroids")}</small></strong>
          <p>{t('Total destroyed across all missions.')}</p>
        </article>
      </section>}

      {shopView === "rewards" && <section className="dashboard-grid rewards-dashboard" aria-label={t("Rewards")}>
        <p className="reward-network-notice" role="note">{rewardNetwork === "testnet" ? t("TESTNET REWARDS: Your progress here is for testing only. It will not transfer to Mainnet. Mainnet rewards start from zero and are saved permanently to your account.") : t("MAINNET REWARDS: Your collection starts from zero here and is saved permanently to your account. Testnet progress is separate.")}</p>
        {user ? <p className="reward-account">@{user.username} · {t("Account rewards")}</p> : <p className="reward-account">{t("Sign in to save rewards to your Pi account. Earlier local awards remain on this device.")}</p>}
        {user && rewardStatus === "loading" && <p role="status">{t("Loading rewards…")}</p>}
        {user && rewardStatus === "error" && <p role="alert">{t("Rewards unavailable. Open this tab again to retry.")}</p>}
        {(!user || (rewardStatus === "ready" && rewardOwner === user.uid)) && <>
        <article className="status-card reward-collection">
          <div className="card-heading"><span>{t("RANK & COLLECTION")}</span><span className="card-icon">✦</span></div>
          <div className="reward-rank-current"><span aria-hidden="true">{rankForLevel(rewardProgress.highestLevel).symbol}</span><div><small>{t("Current service rank")} · {t("Level")} {rewardProgress.highestLevel}/500</small><h3>{t(rewardRank(rewardProgress))}</h3></div></div>
          <p>{Object.keys(rewardProgress.bossWins).filter(id=>bossCardAvailable(Number(id))).length}/{BOSS_STICKER_COUNT} {t("Boss stickers")} · {rewardProgress.completedChains.length} {t("Chains")} · {rewardProgress.perfectBonuses} {t("Perfect bonus rounds")}</p>
          <div id="reward-ranks" className="reward-rank-path" aria-label={t("Service ranks")}>{[1, 11, 51, 101, 201, 301, 401, 500].map(level => { const tier = rankForLevel(level); return <span key={level} className={rewardProgress.highestLevel >= level ? "earned" : ""}><b aria-hidden="true">{tier.symbol}</b><small>{t(tier.name)}<br />{t("Level")} {level}</small></span>; })}</div>
          <h4>{t("Linked Blocks")} · {t("Level")} {latestRewardLevel}</h4>
          <div className="reward-blocks" aria-label={t("Linked Blocks")}>{Array.from({ length: 9 }, (_, index) => <span key={index} className={index < (rewardProgress.linkedBlocks?.[latestRewardLevel] ?? 0) ? "earned" : ""}>{index + 1}</span>)}</div>
          <div id="reward-chains" className="reward-milestones" aria-label={t("Chain milestones")}>{CHAIN_MILESTONES.map(target => <span key={target} className={rewardProgress.completedChains.length >= target ? "earned" : ""} title={`${target} ${t("Chains")}`}>◆ {target}</span>)}</div>
          <h4 id="reward-bosses">{t("Boss stickers")}</h4>
          <div className="boss-sticker-grid">{Array.from({ length: BOSS_STICKER_COUNT }, (_, index) => {
            const id = index + 1;
            const available = bossCardAvailable(id);
            const stars = available ? rewardProgress.bossWins[id] ?? 0 : 0;
            return <button type="button" key={id} disabled={!stars} onClick={() => setSelectedBoss(id)} className={`boss-sticker${stars ? " boss-sticker-earned" : ""}`} title={t("Boss {id}: {status}", { id, status: stars ? t("{stars}/3 stars", {stars}) : !available ? t("MAINNET READY") : t("Not defeated yet") })} aria-haspopup={stars ? 'dialog' : undefined} aria-label={`${bossName(id)} · ${t("Boss {id}: {status}", { id, status: stars ? t("{stars}/3 stars", {stars}) : !available ? t("MAINNET READY") : t("Locked") })}`}>
              {stars ? <BossPortrait id={id} /> : <span className="boss-sticker-silhouette" aria-hidden="true"><BossPortrait id={id} /></span>}
              <small>#{String(id).padStart(2, "0")} · {bossName(id)}</small>{!!stars && <b>{"★".repeat(stars)}</b>}
              {!available && <small>{t("MAINNET READY")}</small>}{!!stars && <span className="boss-sticker-open">{bossDossierLabel(locale)}</span>}
            </button>;
          })}</div>
          {selectedBoss !== null && bossCardAvailable(selectedBoss) && <BossDossier id={selectedBoss} stars={rewardProgress.bossWins[selectedBoss] ?? 0} onClose={() => setSelectedBoss(null)} />}
          <h4 id="reward-medals">{t("Bonus medals")}</h4>
          <p>{Object.values(rewardProgress.bonusMedals).filter(medal => medal === "gold").length} {t("Gold")} · {Object.values(rewardProgress.bonusMedals).filter(medal => medal === "silver").length} {t("Silver")} · {Object.values(rewardProgress.bonusMedals).filter(medal => medal === "bronze").length} {t("Bronze")}</p>
          <div className="reward-medal-grid">{Object.entries(rewardProgress.bonusMedals).map(([level, medal]) => <span key={level} className={`reward-medal reward-medal-${medal}`}>✦ <b>{t("Level")} {level}</b> · {t(medal)}</span>)}</div>
          <small>{user ? t("Awards are saved to your Pi account immediately. Admin test runs do not count.") : t("Local awards on this device. Sign in for account rewards.")}</small>
        </article>
        </>}
      </section>}

      {shopView === "leaders" && <section className="leaderboard-section" aria-labelledby="leaders-heading">
        <p className="eyebrow">{t("GLOBAL RECORDS")}</p>
        <h2 id="leaders-heading">{t("Top 100")}</h2>
        <div className="modal-actions">{([2, 1] as const).map(rule => <button className="button button-secondary" type="button" key={rule} aria-pressed={leaderRules === rule} onClick={() => { setLeadersStatus("loading"); setLeaderRules(rule); }}>{t(rule === 2 ? "Expanded levels" : "Previous records")}</button>)}</div>
        <p>{t("Each signed-in Pi player appears once with their highest completed run. Guests keep a local best on this device.")}</p>
        {personalBest !== null && <p className="leaderboard-personal">{t("Your personal best")}: <strong>{personalBest}</strong></p>}
        {leadersStatus === "loading" && <p role="status">{t("Loading scores…")}</p>}
        {leadersStatus === "error" && <p role="status">{t("Leaderboard unavailable. Try again later.")}</p>}
        {leadersStatus === "ready" && (leaders.length ? <div className="leaderboard-scroll"><table><thead><tr><th>#</th><th>{t("Player")} · {t("Service rank")}</th><th>{t("Best score")}</th></tr></thead><tbody>{leaders.map(entry => <tr key={entry.rank}><td>{entry.rank}</td><td><div className="leader-identity"><strong>@{entry.username}</strong><span className="leader-rank"><b aria-hidden="true">{entry.serviceRank?.symbol ?? "◇"}</b><small>{t(entry.serviceRank?.name ?? "Rookie")}</small></span></div></td><td>{entry.score.toLocaleString(locale)}</td></tr>)}</tbody></table></div> : <p>{t("No records yet. Complete a mission to be first.")}</p>)}
      </section>}

      {(shopView === "hangar" || shopView === "shop") && <section className={`ship-selector ship-selector-${shopView}`} aria-labelledby="hangar-heading">
        {user && !adminMode && <div className="hangar-message" role="status">
          {account ? <>{t("Account inventory saved")} · {new Date(account.updatedAt).toLocaleString(locale)}. {account.mission && <>{t("Resume available at section {section} ({phase}).", { section: account.mission.sector, phase: t(account.mission.phase === "normal" ? "Block" : account.mission.phase === "boss" ? "Boss" : "Bonus round") })}</>}</> : t("Loading account save…")}
          {account && account.version === 0 && !account.legacyImported && <div>
            <p>{t("You can import local Shards and Standard ships once, before your first account game. Pi purchases and records are excluded. Otherwise, local items stay on this device.")}</p>
            <label><input type="checkbox" checked={importConfirmed} onChange={e => setImportConfirmed(e.target.checked)} />{t("Assign this local inventory to my Pi account.")}</label>
            <button type="button" className="button button-secondary" disabled={!importConfirmed || accountBusy} onClick={() => { void accountCommand({ action: "import", confirm: true, ...localInventory() }); }}>{t("Import local inventory once")}</button>
          </div>}
        </div>}
        <div className="ship-panel-heading"><div><p className="eyebrow">{t(shopView === "hangar" ? "YOUR HANGAR" : "SHIP SHOP")}</p><h2 id="hangar-heading">{t(shopView === "hangar" ? "Your fleet" : "Available ships")}</h2></div><strong className="shard-balance">◆ {displayedShards} <small>{t("Shards")}</small></strong></div>
        <p className="testnet-shop-notice" role="note">{shipSaveNetwork === "testnet" ? t("TESTNET SHARDS: Earn and spend Shards on available Standard ships here for testing. Shards and ship purchases do not transfer to Mainnet; there you start from zero.") : t("MAINNET SHARDS: Shards and ship purchases start from zero here. Testnet balances and ships are separate.")}</p>
        <p className="testnet-shop-notice">{shipSaveNetwork === "testnet" ? t("Testnet: Grey Scout is free; nine Standard hulls cost Shards. Other hulls are locked until Mainnet.") : t("Grey Scout is free; nine Standard hulls cost Shards. Other hulls are currently locked.")}</p>
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
              const status = total ? `${t("Owned")} ×${total}` : testnetStandardHullAvailable(skin.id) ? t("Not owned") : shipSaveNetwork === "testnet" ? t("MAINNET READY") : t("Locked");
              return <button className={`ship-search-result${previewSkin.id === skin.id ? " ship-search-selected" : ""}`} key={skin.id} type="button" onClick={() => chooseSearchResult(skin)}>
                <span className="ship-search-thumb" aria-hidden="true"><img src={shipEvolutionAsset(skin.sprite, 1)} alt="" loading="lazy" decoding="async" style={shipPreviewPlacement(skin.sprite, 1)} /></span>
                <span className="ship-search-result-name"><strong>{skin.name}</strong><small>{t("STANDARD")} · {status}</small>{shopView === "shop" && <small className="ship-search-price">◆ {standardShipPrice(skin).toLocaleString(locale)} {t("Shards")}{skin.price === 0 ? " · " + t("Additional ship") : ""}</small>}<small>{t("Open for variants and levels")}</small></span><span className="ship-search-arrow" aria-hidden="true">›</span>
              </button>;
            })}
            {matchingShipOptions.length === 0 && <p className="ship-search-empty">{t("No matching ships.")}</p>}
          </div>}
        </div>
        <ShipSelectionPanel view={shopView} skin={previewSkin} color={previewColor} focusStage={previewFocusStage} ownedStage={previewStage} fleet={visibleFleet} shards={displayedShards} locale={locale} adminPreview={adminMode}
          offers={offers.filter(offer => offer.kind === "ship_upgrade")}
          selectedSkinId={selected.skin.id} selectedColorId={selected.color.id} message={hangarMessageText} t={t}
          onStageChange={stage => { setPreviewFocusStage(stage); if (adminMode) { setAdminStage(stage); sessionStorage.setItem(ADMIN_SHIP_STAGE_KEY, String(stage)); } setHangarMessage(""); }}
          onColorChange={color => { setPreviewColor(color); if (shopView === "hangar") equipShip(previewSkin, color); else setHangarMessage(""); }}
          onBuyStandard={purchasePreview}
          onEquipPreview={() => equipShip(previewSkin, previewColor)}
          onOpenShop={() => { setPreviewFocusStage(1); setShopView("shop"); }} />
      </section>}

      {(shopView === "weapons" || shopView === "powers") && <section className="upgrade-section" aria-labelledby="upgrade-heading">
        <div className="section-heading"><div><p className="eyebrow">{t('POWER LAB')}</p><h2 id="upgrade-heading">{t('Weapons and start power-ups')}</h2></div><span className="section-line" /></div>
        <p className="testnet-shop-notice">{shipSaveNetwork === "testnet" ? t("Testnet: Twin Laser and Rapid Twin can be bought with Test-Pi. Triple Laser and Plasma purchases are locked.") : t("Pi purchases are currently locked. Collect weapon upgrades in game.")}</p>
        <p>{shipSaveNetwork === "testnet" ? t("1 minute per charge") : t("The single laser is free. Collect other weapons as power-ups during the mission.")}</p>
        {shopView === "weapons" && <WeaponTutorial />}
        {([shopView === "weapons" ? "weapon" : "power"] as const).map(kind => <div key={kind} className="hangar-offers"><h3>{t(kind === "weapon" ? "Time-limited weapons" : "One-mission start bonuses")}</h3><div className="hangar-offer-grid">
          {offers.filter(offer => offer.kind === kind).map(offer => {
            const count = inventory?.consumables.find(item => item.id === offer.id)?.count ?? 0;
            const testnetWeaponEnabled = kind !== "weapon" || shipSaveNetwork === "testnet" && isTestnetWeaponPurchaseEnabled(offer);
            const owned = kind === "weapon" ? testnetWeaponEnabled && (inventory?.weaponStock?.[offer.id] || 0) > 0 : count > 0;
            const selected = kind === "weapon" ? false : inventory?.selectedPower === offer.id;
            const lockedWeapon = kind === "weapon" && !testnetWeaponEnabled;
            return <article key={offer.id} className={`hangar-offer hangar-offer-${kind}${selected ? " hangar-offer-selected" : ""}`}>{kind === "weapon" ? <WeaponPreview offerId={offer.id} sprite={selectedShip().skin.sprite} color={selectedShip().color.id} /> : <PowerPreview offerId={offer.id} />}<h4>{t(offer.name)}</h4><p>{t(offer.description)}</p><span className="offer-purchase-price">{lockedWeapon || kind === "power" ? <>{t("Planned price")}: {piPrice(offer.pricePi)}</> : piPrice(offer.pricePi, true)}</span><span>{lockedWeapon ? shipSaveNetwork === "testnet" ? t("MAINNET READY") : t("Currently locked") : kind === "weapon" ? t("1 minute per charge") : t("MAINNET READY")}</span><strong>{lockedWeapon ? t("Locked") : selected ? t("EQUIPPED") : owned ? kind === "power" ? `${count} ${t("AVAILABLE")}` : t("Owned — activate in game") : kind === "power" ? t("Locked") : t("NOT OWNED")}</strong>{lockedWeapon && <p className="testnet-shop-notice">{shipSaveNetwork === "testnet" ? t("Available only as a weapon pickup on Testnet.") : t("Available only as a weapon pickup.")}</p>}<div>
              {owned && kind === "power" ? <button className="button button-secondary" type="button" disabled={Boolean(selected)} onClick={() => equip(null, offer.id)}>{t(selected ? "Selected" : "Equip for next mission")}</button> : null}
              {kind === "weapon" && !lockedWeapon && <WeaponPurchase id={offer.id} price={offer.pricePi} count={inventory?.weaponStock?.[offer.id] || 0} pending={isLoading && activeProductId === offer.id} status={activeProductId === offer.id ? paymentStatus : undefined} diagnostic={activeProductId === offer.id ? paymentDiagnostic : undefined} disabled={adminMode || isLoading || !catalogReady} onBuy={(quantity, total) => { void orderProduct(`Cryptoid ${offer.name} · ${quantity} × 60s · Test-Pi`, total, { productId: offer.id, quantity, weaponModel: 2 }, async () => { setLoadoutMessage("purchase confirmed."); await refreshInventory(); }); }} />}
            </div></article>;
          })}
        </div></div>)}
        {shopView === "weapons" && <div className="hangar-offers"><h3>{t("Permanent armor")}</h3><p>{t("Armor is always active from mission start, needs no shield and remains yours across all future missions. Each upgrade adds to your maximum hearts.")}</p><div className="hangar-offer-grid">
          {offers.filter(offer => offer.kind === "armor").map(offer => { const owned = inventory?.ownedArmor.includes(offer.id); return <article key={offer.id} className={`hangar-offer hangar-offer-armor${owned ? " hangar-offer-selected" : ""}`}><div className="offer-preview power-preview power-preview-shield" aria-hidden="true"><span className="preview-grid" /><span className="power-preview-orbit"><i>♥</i></span><small>{t("Permanent hull")}</small></div><h4>{t(offer.name)}</h4><p>{t(offer.description)}</p><span className="offer-purchase-price">{t("Planned price")}: {piPrice(offer.pricePi)}</span><span>{owned ? t("Permanent · every mission") : t("MAINNET READY")}</span><strong>{owned ? t("OWNED") : t("Locked")}</strong></article>; })}
        </div></div>}
        {inventory?.equippedWeapon && <p className="testnet-shop-notice">{t("An older weapon selection is saved but no longer activates automatically. Every mission starts with the single laser.")}</p>}
        {inventory?.selectedPower && <button className="text-button" type="button" onClick={() => equip(inventory.equippedWeapon, null)}>{t('Save bonus for a later mission')}</button>}
        {paymentDiagnostic && !activeProductId && <p className="testnet-shop-notice" role="alert"><strong>{t("Payment diagnostics:")}</strong> {t("Payment could not be confirmed. Check your account and retry.")}</p>}
        {loadoutMessage && <p role="status">{t(loadoutMessage)}</p>}
      </section>}
          </div>
        </div>
      </div>}

      {activePanel === "how" && <GameGuide initialTopic={guideTopic} backLabel="Back to quick access" onClose={returnToMenu} />}
      {activePanel === "progress" && <div className="info-panel" role="dialog" aria-modal="true" aria-labelledby="info-title">
        <div className="info-panel-content">
          <button className="text-button menu-return" type="button" onClick={returnToMenu}>← {t("Back to quick access")}</button>
          <button className="close-button" type="button" onClick={() => setActivePanel(null)} aria-label={t('Close')}>×</button>
          <p className="eyebrow">{t("MISSION LOG")}</p>
          <h2 id="info-title">{t("Your Progress")}</h2>
          <p>{t("Your best score is {score}, your highest sector is {sector}, and you have destroyed {destroyed} Cryptoids.", { score: personalBest ?? records.bestScore, sector: displayedRecords.highestSector, destroyed: displayedRecords.totalDestroyed })}</p>
          <button className="button button-primary" type="button" onClick={() => setActivePanel(null)}>{t("Close")}</button>
        </div>
      </div>}

      {showSignIn && <SignIn onSignIn={signIn} onModalClose={closeSignIn} onBack={() => { closeSignIn(); returnToMenu(); }} disabled={isAuthLoading} />}
      {termsOpen && <TermsDialog onClose={() => setTermsOpen(false)} onBack={returnToMenu} />}
    </main>
  );
};

export default Shop;
