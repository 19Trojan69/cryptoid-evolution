import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import SignIn from "../components/SignIn";

import { useAuth } from "../hooks/useAuth";
import { usePayments } from "../hooks/usePayments";
import { axiosClient } from "../lib/axiosClient.ts";
import { BEST_SCORE_KEY, HIGHEST_SECTOR_KEY, TOTAL_DESTROYED_KEY } from "./GamePage.tsx";
import { allPlayerColors, buyShipVariant, EXTRA_STARTER_PRICE, fleetCount, playerColors, playerSkins, readShipFleet, repaintStarter, savedShipColors, selectedShip, shardBalance, SHARD_BALANCE_KEY, SHIP_COLOR_KEY, SHIP_COLORS_KEY, SHIP_FLEET_KEY, SHIP_OWNED_KEY, SHIP_SKIN_KEY, shipNozzleStyle, spriteStyle, type PlayerColorId } from "./shipFleet";
import PaintedShip from "./PaintedShip";
import TermsDialog from "../components/TermsDialog";
import { hangarCatalog } from "../../../backend/src/hangarCatalog";
import { primeGameAudio } from "./gameAudio";
import Starfield from "./Starfield";
import { languages, useLocale, type Locale } from "../i18n";
import EarthGlobe from "./EarthGlobe";
import { requestGameFullscreen } from "./gameFullscreen";
import { powerUpSymbols, type PowerUpType } from "./powerUps";
import { CONTROL_HAND_KEY, readControlHand, type ControlHand } from "./controlPreferences";

type Offer = { id: string; kind: "weapon" | "power"; name: string; description: string; pricePi: number };
type Inventory = { ownedWeapons: string[]; consumables: { id: string; count: number }[]; equippedWeapon: string | null; selectedPower: string | null };
type Leader = { rank: number; username: string; score: number };

const shopTabs = [
  ["hangar", "Hangar", "◇"],
  ["shop", "Shop", "▱"],
  ["weapons", "Weapons", "⌁"],
  ["powers", "Power-ups", "✦"],
  ["progress", "Progress", "↗"],
  ["leaders", "Top 100", "#"],
] as const;

const powerTypeForOffer = (offerId: string): PowerUpType => offerId.includes("shield") ? "shield" : offerId.includes("rapid") ? "rapid" : "overdrive";
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
  const [shopView, setShopView] = useState<"hangar" | "shop" | "weapons" | "powers" | "progress" | "leaders" | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [leadersStatus, setLeadersStatus] = useState<"loading" | "ready" | "error">("loading");
  const [personalBest, setPersonalBest] = useState<number | null>(null);
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
  useEffect(() => { if (!systemMenuOpen) setLanguageMenuOpen(false); }, [systemMenuOpen]);
  useEffect(() => {
    if (!systemMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSystemMenuOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [systemMenuOpen]);
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
  const equipPreview = () => {
    if (!fleetCount(fleet, previewSkin.id, previewColor.id)) {
      if (previewSkin.price !== 0) return;
      // The issued starter can be painted for free without spending Shards.
      const repainted = repaintStarter(fleet, previewColor.id);
      setFleet(repainted);
      localStorage.setItem(SHIP_FLEET_KEY, JSON.stringify(repainted));
    }
    localStorage.setItem(SHIP_SKIN_KEY, previewSkin.id);
    localStorage.setItem(SHIP_COLOR_KEY, previewColor.id);
    const nextColors = { ...savedShipColors(localStorage.getItem(SHIP_COLORS_KEY)), [previewSkin.id]: previewColor.id };
    localStorage.setItem(SHIP_COLORS_KEY, JSON.stringify(nextColors));
    setSelected({ skin: previewSkin, color: previewColor });
    setHangarMessage(`${previewSkin.name} ${t("ready for your next mission.")}`);
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
      if (!Array.isArray(data.ownedWeapons) || !Array.isArray(data.consumables)) throw new Error("Invalid inventory");
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
      if (!Array.isArray(data.ownedWeapons) || !Array.isArray(data.consumables)) throw new Error("Invalid inventory");
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
        <Starfield sector={1} player={{ x: .5, y: .8 }} paused={false} />
        <div className="hero-copy">
          <p className="eyebrow"><span className="signal-dot" /> {t("Mission control online")}</p>
          <h1>Cryptoid <span>Evolution</span></h1>
          <p className="hero-tagline">Defend Earth.<br />Evolve your power.</p>
          <p className="hero-description">{t('Build your streak, master the grid, and become the force Earth needs.')}</p>
          <div className="hero-actions">
            <button className="button button-primary" type="button" onClick={enterGame}>{t("Play")} <span className="button-glyph" aria-hidden="true">→</span></button>
            <button className="button button-secondary" type="button" onClick={() => { setPreviewSkin(selected.skin); setPreviewColor(selected.color); setShopView("hangar"); }}>{t('Shop / Hangar')} <span className="button-glyph" aria-hidden="true">◇</span></button>
            <button className="button button-secondary" type="button" onClick={() => { setLeadersStatus("loading"); setShopView("leaders"); }}>{t('Top 100')} <span className="button-glyph" aria-hidden="true">⌁</span></button>
            <button className="button button-secondary" type="button" onClick={() => setSystemMenuOpen(true)}>{t('System menu')} <span className="button-glyph" aria-hidden="true">⚙</span></button>
          </div>
        </div>
        <div className="planet-stage" aria-label="Cryptoid Evolution planet status">
          <div className="orbit orbit-one"><span className="satellite-motion"><i className="satellite-body" /></span></div>
          <div className="orbit orbit-two"><span className="satellite-motion"><i className="satellite-body" /></span></div>
          <div className="orbit orbit-three"><span className="satellite-motion"><i className="satellite-body" /></span></div>
          <div className="planet"><EarthGlobe /></div>
          <div className={`home-defense-ship${selected.color.id === "grey" ? " home-defense-grey" : ""}`} style={{ "--ship-glow": selected.color.glow, ...shipNozzleStyle(selected.skin.sprite) } as CSSProperties}><PaintedShip sprite={selected.skin.sprite} color={selected.color.id} /><span className="home-thrust home-thrust-left" /><span className="home-thrust home-thrust-right" /></div>
          <div className="home-enemy-ship" style={{ "--ship-glow": "#ffd36b", ...shipNozzleStyle(3, true) } as CSSProperties}><i style={spriteStyle(3)} /><span className="home-enemy-thrust home-enemy-thrust-left" /><span className="home-enemy-thrust home-enemy-thrust-right" /></div>
          <div className="home-defense-laser" />
          <span className="orbit-status">{t('ORBITAL DEFENSE ACTIVE')}</span>
          <div className="stage-label"><span className="stage-label-value">01</span><span>{t('Genesis sector')}</span></div>
        </div>
        <footer className="home-footer"><button type="button" className="text-button terms-entry" onClick={() => setTermsOpen(true)}>Nutzungsbedingungen / Terms of Service</button></footer>
      </section>

      {systemMenuOpen && <div className="system-menu-overlay" role="dialog" aria-modal="true" aria-labelledby="system-menu-title">
        <section className="system-menu-panel">
          <button className="close-button" type="button" onClick={() => setSystemMenuOpen(false)} aria-label={t('Close menu')}>×</button>
          <p className="eyebrow">{t('SYSTEM / SETTINGS')}</p>
          <h2 id="system-menu-title">{t('System menu')}</h2>
          <div className="system-menu-section">
            <div className="system-menu-heading"><strong>{t('Language')}</strong><small>{t('Current language')}: {languages[locale]}</small></div>
            <div className="language-dropdown" data-open={languageMenuOpen ? "true" : "false"}>
              <button type="button" className="language-trigger" aria-expanded={languageMenuOpen} onClick={() => setLanguageMenuOpen(open => !open)}>
                <span aria-hidden="true">{automatic ? "◎" : locale.toUpperCase()}</span>
                <b>{automatic ? t('Automatic (device language)') : languages[locale]}</b>
                <i aria-hidden="true">⌄</i>
              </button>
              {languageMenuOpen && <div className="language-menu" role="group" aria-label={t('Language')}>
                <button type="button" className="language-option language-option-auto" aria-pressed={automatic} onClick={() => { choose(null); setLanguageMenuOpen(false); }}><span aria-hidden="true">◎</span><b>{t('Automatic (device language)')}</b></button>
                {Object.entries(languages).map(([code, label]) => <button type="button" className="language-option" key={code} aria-pressed={!automatic && locale === code} onClick={() => { choose(code as Locale); setLanguageMenuOpen(false); }}><span aria-hidden="true">{code.toUpperCase()}</span><b>{label}</b></button>)}
              </div>}
            </div>
          </div>
          <div className="system-menu-section system-quick-settings">
            <div className="system-menu-heading"><strong>{t('Controls')}</strong><small>{t('Move with one thumb; activate power-ups with the other.')}</small></div>
            <button className="system-setting" type="button" aria-pressed={controlHand === "right"} onClick={() => setControlHand("right")}><span aria-hidden="true">◁</span><b>{t('Right-handed controls')}</b></button>
            <button className="system-setting" type="button" aria-pressed={controlHand === "left"} onClick={() => setControlHand("left")}><span aria-hidden="true">▷</span><b>{t('Left-handed controls')}</b></button>
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
        <div className="shop-modal-header"><strong>{t("Shop / Hangar")}</strong><button className="close-button" type="button" onClick={() => setShopView(null)} aria-label={t('Close shop')}>×</button></div>
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
        <p>{t(shopView === "hangar" ? "Only ships in your fleet are shown here. Choose an owned type and color variant for your next mission." : "Choose a ship type and preview its paint variants. Each purchase adds one ship to your fleet.")}</p>
        <strong className="shard-balance">◆ {shards} {t("Shards")}</strong><span className="shard-help">{t("Earn 1 Shard per defeated Cryptoid; your Shards are saved at the end of each mission.")}</span>
        <div className="ship-picker" role="group" aria-label={t("Ship hull")}>
          {playerSkins.filter(skin => shopView === "shop" || fleetCount(fleet, skin.id) > 0).map(skin => { const total = fleetCount(fleet, skin.id); const shown = skin.id === selected.skin.id ? selected.color : allPlayerColors.find(color => fleetCount(fleet, skin.id, color.id)) ?? playerColors[0]; return <button key={skin.id} className={`ship-choice${total === 0 ? " ship-unowned" : ""}`} type="button" aria-pressed={previewSkin.id === skin.id} onClick={() => { setPreviewSkin(skin); setPreviewColor(shown); setHangarMessage(""); }}>
            <span className="ship-preview"><PaintedShip sprite={skin.sprite} color={shown.id} /></span><span>{skin.name}</span><small>{total ? `${t("Owned")} ×${total}` : t("Not owned")}</small>
          </button>; })}
        </div>
        <h3 className="hangar-variant-title">{previewSkin.name} · {t("Color variants")}</h3>
        <div className="ship-picker ship-variants" role="group" aria-label={t("Ship paint")}>
          {allPlayerColors.filter(color => (shopView === "shop" && playerColors.some(current => current.id === color.id)) || fleetCount(fleet, previewSkin.id, color.id) > 0).map(color => { const count = fleetCount(fleet, previewSkin.id, color.id); return <button key={color.id} className={`ship-choice variant-choice${count ? "" : " ship-unowned"}`} type="button" aria-pressed={previewColor.id === color.id} onClick={() => { setPreviewColor(color); setHangarMessage(""); }}>
            <span className="ship-preview"><PaintedShip sprite={previewSkin.sprite} color={color.id} /></span>
            <span className="metal-swatch" style={{ "--paint": color.glow } as CSSProperties} />
            <span>{t(color.name)}</span><small>{count ? `${t("Owned")} ×${count}` : t("Not owned")}</small>
          </button>; })}
        </div>
        <p className="hangar-selection">{t("Preview:")} <strong>{previewSkin.name} · {t(previewColor.name)}</strong> · {previewCount ? `${t("Owned")} ×${previewCount}` : t("Not owned")}{selected.skin.id === previewSkin.id && selected.color.id === previewColor.id && <span> · {t("EQUIPPED")}</span>}</p>
        <div className="hangar-actions">
          {shopView === "shop" && <button className="button button-primary hangar-action" type="button" onClick={purchasePreview} disabled={shards < (previewSkin.price || EXTRA_STARTER_PRICE)}>{t("Buy another for")} ◆ {previewSkin.price || EXTRA_STARTER_PRICE}</button>}
          {shopView === "hangar" && <button className="button button-secondary hangar-action" type="button" onClick={equipPreview} disabled={!previewCount}>{t("Equip selected variant")}</button>}
        </div>
        {shopView === "shop" && shards < (previewSkin.price || EXTRA_STARTER_PRICE) && <span className="shard-help">◆ {(previewSkin.price || EXTRA_STARTER_PRICE) - shards} {t("more Shards needed")}</span>}
        {hangarMessage && <p className="hangar-message" role="status">{hangarMessage}</p>}
      </section>}

      {(shopView === "weapons" || shopView === "powers") && <section className="upgrade-section" aria-labelledby="upgrade-heading">
        <div className="section-heading"><div><p className="eyebrow">{t('POWER LAB')}</p><h2 id="upgrade-heading">{t('Weapons and start power-ups')}</h2></div><span className="section-line" /></div>
        <p>{t('Standard laser is always free. Bought weapons remain owned, but work for 5 minutes from the start of each mission. Purchased start power-ups are consumed once a mission begins and wait at the edge of the game screen until you activate them. Bought power-ups last up to 60 seconds; collected shots and power-ups last up to 20 seconds. A shield also ends when its charge is spent. Pi prices are independent of the Shards used for ship skins.')}</p>
        {([shopView === "weapons" ? "weapon" : "power"] as const).map(kind => <div key={kind} className="hangar-offers"><h3>{t(kind === "weapon" ? "Time-limited weapons" : "One-mission start bonuses")}</h3><div className="hangar-offer-grid">
          {offers.filter(offer => offer.kind === kind).map(offer => {
            const count = inventory?.consumables.find(item => item.id === offer.id)?.count ?? 0;
            const owned = kind === "weapon" ? inventory?.ownedWeapons.includes(offer.id) : count > 0;
            const selected = kind === "weapon" ? inventory?.equippedWeapon === offer.id : inventory?.selectedPower === offer.id;
            return <article key={offer.id} className={`hangar-offer hangar-offer-${kind}${selected ? " hangar-offer-selected" : ""}`}>{kind === "weapon" ? <WeaponPreview offerId={offer.id} sprite={selectedShip().skin.sprite} color={selectedShip().color.id} /> : <PowerPreview offerId={offer.id} />}<h4>{t(offer.name)}</h4><p>{t(offer.description)}</p><span>{t(kind === "weapon" ? "5 minutes per mission · starts at mission start" : "Consumed at mission start")} · {offer.pricePi} π</span><strong>{selected ? t("EQUIPPED") : owned ? kind === "power" ? `${count} ${t("AVAILABLE")}` : t("OWNED") : t("NOT OWNED")}</strong><div>
              {owned ? <button className="button button-secondary" type="button" disabled={Boolean(selected)} onClick={() => equip(kind === "weapon" ? offer.id : inventory?.equippedWeapon ?? null, kind === "power" ? offer.id : inventory?.selectedPower ?? null)}>{t(selected ? "Selected" : "Equip for next mission")}</button> : null}
              {(kind === "power" || !owned) && <button className="button button-primary" type="button" disabled={isLoading || !catalogReady} onClick={() => orderProduct(`Cryptoid ${offer.name} · ${kind === "weapon" ? "5 minutes per mission" : "60 seconds when activated"}`, offer.pricePi, { productId: offer.id }, () => { setLoadoutMessage(`${offer.name} ${t("purchase confirmed.")}`); void refreshInventory(); })}>{t("Buy with π")}</button>}
            </div></article>;
          })}
        </div></div>)}
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
