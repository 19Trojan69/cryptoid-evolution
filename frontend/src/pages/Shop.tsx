import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import SignIn from "../components/SignIn";

import { useAuth } from "../hooks/useAuth";
import { usePayments } from "../hooks/usePayments";
import { axiosClient } from "../lib/axiosClient.ts";
import { BEST_SCORE_KEY, HIGHEST_SECTOR_KEY, TOTAL_DESTROYED_KEY } from "./GamePage.tsx";
import { buySkin, ownedSkins, playerColors, playerSkins, selectedShip, shardBalance, SHARD_BALANCE_KEY, SHIP_COLOR_KEY, SHIP_OWNED_KEY, SHIP_SKIN_KEY, spriteStyle } from "./shipFleet";
import { hangarCatalog } from "../../../backend/src/hangarCatalog";

type Offer = { id: string; kind: "weapon" | "power"; name: string; description: string; pricePi: number };
type Inventory = { ownedWeapons: string[]; consumables: { id: string; count: number }[]; equippedWeapon: string | null; selectedPower: string | null };

const Shop = () => {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<"how" | "progress" | null>(null);
  const [records] = useState(() => ({ bestScore: Number(localStorage.getItem(BEST_SCORE_KEY) || 0), highestSector: Number(localStorage.getItem(HIGHEST_SECTOR_KEY) || 0), totalDestroyed: Number(localStorage.getItem(TOTAL_DESTROYED_KEY) || 0) }));
  const [selected, setSelected] = useState(selectedShip);
  const [previewSkin, setPreviewSkin] = useState(() => selectedShip().skin);
  const [previewColor, setPreviewColor] = useState(() => selectedShip().color);
  const [owned, setOwned] = useState(() => ownedSkins(localStorage.getItem(SHIP_OWNED_KEY)));
  const [shards, setShards] = useState(() => shardBalance(localStorage.getItem(SHARD_BALANCE_KEY)));
  const [hangarMessage, setHangarMessage] = useState("");
  const [offers, setOffers] = useState<Offer[]>(() => [...hangarCatalog]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loadoutMessage, setLoadoutMessage] = useState("");
  const previewOwned = previewSkin.price === 0 || owned.includes(previewSkin.id);

  const equipPreview = () => {
    const currentOwned = ownedSkins(localStorage.getItem(SHIP_OWNED_KEY));
    const currentBalance = shardBalance(localStorage.getItem(SHARD_BALANCE_KEY));
    setOwned(currentOwned);
    setShards(currentBalance);
    if (previewSkin.price > 0 && !currentOwned.includes(previewSkin.id)) {
      const purchase = buySkin(previewSkin.id, currentOwned, currentBalance);
      if (!purchase) { setHangarMessage("Not enough Shards yet. Earn them by defeating Cryptoids."); return; }
      localStorage.setItem(SHIP_OWNED_KEY, JSON.stringify(purchase.owned));
      localStorage.setItem(SHARD_BALANCE_KEY, String(purchase.balance));
      setOwned(purchase.owned);
      setShards(purchase.balance);
    }
    localStorage.setItem(SHIP_SKIN_KEY, previewSkin.id);
    localStorage.setItem(SHIP_COLOR_KEY, previewColor.id);
    setSelected({ skin: previewSkin, color: previewColor });
    setHangarMessage(`${previewSkin.name} ready for your next mission.`);
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
    catch { setLoadoutMessage("Connect your Pi account to see your saved loadout."); }
  };
  useEffect(() => { axiosClient.get<{ offers: Offer[] }>("/hangar/catalog").then(({ data }) => {
    if (!Array.isArray(data.offers)) throw new Error("Invalid catalog");
    setOffers(data.offers);
    setCatalogReady(true);
  }).catch(() => setLoadoutMessage("Hangar catalog unavailable. Try again when the server is online.")); }, []);
  useEffect(() => {
    if (!isAuthenticated) return;
    axiosClient.get<Inventory>("/hangar/inventory").then(({ data }) => {
      if (!Array.isArray(data.ownedWeapons) || !Array.isArray(data.consumables)) throw new Error("Invalid inventory");
      setInventory(data);
    }).catch(() => setLoadoutMessage("Connect your Pi account to see your saved loadout."));
  }, [isAuthenticated]);
  const equip = async (weapon: string | null, power: string | null) => {
    if (!isAuthenticated) { requireAuth(); return; }
    try {
      await axiosClient.post("/hangar/equip", { weapon, power });
      await refreshInventory();
      setLoadoutMessage("Loadout saved for the next mission.");
    } catch { setLoadoutMessage("Could not save loadout. Please retry."); }
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
    <main className="app-shell">
      <Header
        user={user}
        onSignIn={signIn}
        onSignOut={() => { setInventory(null); void signOut(); }}
        onSendTestNotification={onSendTestNotification}
        isLoading={isAuthLoading}
      />

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow"><span className="signal-dot" /> Mission control online</p>
          <h1>Cryptoid <span>Evolution</span></h1>
          <p className="hero-tagline">Defend Earth.<br />Evolve your power.</p>
          <p className="hero-description">Build your streak, master the grid, and become the force Earth needs.</p>
          <div className="hero-actions">
            <button className="button button-primary" type="button" onClick={() => navigate("/game")}>Play <span>↗</span></button>
            <button className="button button-secondary" type="button" onClick={() => setActivePanel("how")}>How to Play</button>
          </div>
        </div>
        <div className="planet-stage" aria-label="Cryptoid Evolution planet status">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="planet"><div className="planet-core" /><div className="planet-ring" /></div>
          <div className="stage-label"><span className="stage-label-value">01</span><span>Genesis sector</span></div>
        </div>
      </section>

      <section className="dashboard-grid" aria-label="Player overview">
        <article className="status-card progress-card">
          <div className="card-heading"><span>YOUR PROGRESS</span><span className="card-icon">↗</span></div>
          <div className="progress-row"><strong>Best {records.bestScore}</strong><span>Sector {String(records.highestSector).padStart(2, "0")}</span></div>
          <div className="progress-track"><span style={{ width: `${Math.min(100, records.bestScore / 10)}%` }} /></div>
          <button className="text-button" type="button" onClick={() => setActivePanel("progress")}>My Progress <span>→</span></button>
        </article>
        <article className="status-card streak-card">
          <div className="card-heading"><span>ACTIVE STREAK</span><span className="flame">✦</span></div>
          <strong className="streak-number">{records.totalDestroyed} <small>asteroids</small></strong>
          <p>Total destroyed across all missions.</p>
        </article>
      </section>

      <section className="ship-selector" aria-labelledby="hangar-heading">
        <p className="eyebrow">YOUR HANGAR</p>
        <h2 id="hangar-heading">Choose your ship</h2>
        <p>Grey Scout is your free starter ship. Preview any other hull and its color before buying with game-only Shards. Paint changes are always free.</p>
        <strong className="shard-balance">◆ {shards} Shards</strong><span className="shard-help">Earn 1 Shard per defeated Cryptoid; your Shards are saved at the end of each mission.</span>
        <div className="ship-picker" role="group" aria-label="Ship hull">
          {playerSkins.map(skin => <button key={skin.id} className="ship-choice" type="button" aria-pressed={previewSkin.id === skin.id} onClick={() => { setPreviewSkin(skin); setHangarMessage(""); }}>
            <span className={`ship-preview${skin.price === 0 ? " ship-preview-starter" : ""}`}><i style={{ ...spriteStyle(skin.sprite), "--ship-hue": previewColor.hue, "--ship-glow": previewColor.glow } as CSSProperties} /></span><span>{skin.name}</span><small>{skin.price === 0 ? "ISSUED" : owned.includes(skin.id) ? "OWNED" : `◆ ${skin.price}`}</small>
          </button>)}
        </div>
        <p className="hangar-selection">Preview: <strong>{previewSkin.name}</strong> · {previewSkin.price === 0 ? "Grey starter" : previewOwned ? "Owned" : `◆ ${previewSkin.price} Shards`} {selected.skin.id === previewSkin.id && <span>· EQUIPPED</span>}</p>
        <div className="ship-picker" role="group" aria-label="Ship paint">
          {playerColors.map(color => <button key={color.id} className="color-choice" type="button" aria-label={color.name} aria-pressed={previewColor.id === color.id} title={color.name} style={{ backgroundColor: color.glow }} onClick={() => { setPreviewColor(color); setHangarMessage(""); }} />)}
        </div>
        <button className="button button-primary hangar-action" type="button" onClick={equipPreview} disabled={!previewOwned && shards < previewSkin.price}>{previewSkin.price === 0 ? "Fly Grey Scout" : previewOwned ? "Equip ship · free paint" : `Buy for ◆ ${previewSkin.price}`}</button>
        {!previewOwned && shards < previewSkin.price && <span className="shard-help">◆ {previewSkin.price - shards} more Shards needed</span>}
        {hangarMessage && <p className="hangar-message" role="status">{hangarMessage}</p>}
      </section>

      <section className="upgrade-section" aria-labelledby="upgrade-heading">
        <div className="section-heading"><div><p className="eyebrow">POWER LAB</p><h2 id="upgrade-heading">Weapons and start power-ups</h2></div><span className="section-line" /></div>
        <p>Standard laser is always free. Weapons are permanent unlocks; start bonuses are consumed once when a mission begins. All upgrades can also drop during play. Pi prices are independent of the Shards used for ship skins.</p>
        {(["weapon", "power"] as const).map(kind => <div key={kind} className="hangar-offers"><h3>{kind === "weapon" ? "Permanent weapons" : "One-mission start bonuses"}</h3><div className="hangar-offer-grid">
          {offers.filter(offer => offer.kind === kind).map(offer => {
            const count = inventory?.consumables.find(item => item.id === offer.id)?.count ?? 0;
            const owned = kind === "weapon" ? inventory?.ownedWeapons.includes(offer.id) : count > 0;
            const selected = kind === "weapon" ? inventory?.equippedWeapon === offer.id : inventory?.selectedPower === offer.id;
            return <article key={offer.id} className="hangar-offer"><h4>{offer.name}</h4><p>{offer.description}</p><span>{kind === "weapon" ? "Permanent unlock" : "Consumed at mission start"} · {offer.pricePi} π</span><strong>{selected ? "EQUIPPED" : owned ? kind === "power" ? `${count} AVAILABLE` : "OWNED" : "NOT OWNED"}</strong><div>
              {owned ? <button className="button button-secondary" type="button" disabled={Boolean(selected)} onClick={() => equip(kind === "weapon" ? offer.id : inventory?.equippedWeapon ?? null, kind === "power" ? offer.id : inventory?.selectedPower ?? null)}>{selected ? "Selected" : "Equip for next mission"}</button> : null}
              {(kind === "power" || !owned) && <button className="button button-primary" type="button" disabled={isLoading || !catalogReady} onClick={() => orderProduct(`Cryptoid ${offer.name}`, offer.pricePi, { productId: offer.id }, () => { setLoadoutMessage(`${offer.name} purchase confirmed.`); void refreshInventory(); })}>Buy with π</button>}
            </div></article>;
          })}
        </div></div>)}
        {inventory?.equippedWeapon && <button className="text-button" type="button" onClick={() => equip(null, inventory.selectedPower)}>Use free standard laser</button>}
        {inventory?.selectedPower && <button className="text-button" type="button" onClick={() => equip(inventory.equippedWeapon, null)}>Save bonus for a later mission</button>}
        {loadoutMessage && <p role="status">{loadoutMessage}</p>}
      </section>

      {activePanel && <div className="info-panel" role="dialog" aria-modal="true" aria-labelledby="info-title">
        <div className="info-panel-content">
          <button className="close-button" type="button" onClick={() => setActivePanel(null)} aria-label="Close">×</button>
          <p className="eyebrow">{activePanel === "how" ? "FIELD GUIDE" : "MISSION LOG"}</p>
          <h2 id="info-title">{activePanel === "how" ? "How to Play" : "Your Progress"}</h2>
          <p>{activePanel === "how" ? "Move your ship with the arrow keys or WASD; on touchscreens, drag it in the lower playfield. Your laser fires automatically. Dodge diving Cryptoids, line up shots, and fly into glowing pickups: Shield absorbs a hit, Repair restores a heart, and Overdrive briefly strengthens your shots. You have three hearts; the round ends when they run out." : `Your best score is ${records.bestScore}, your highest sector is ${records.highestSector}, and you have destroyed ${records.totalDestroyed} Cryptoids.`}</p>
          <button className="button button-primary" type="button" onClick={() => { setActivePanel(null); if (activePanel === "how") navigate("/game"); }}>Enter mission <span>↗</span></button>
        </div>
      </div>}

      {showSignIn && <SignIn onSignIn={signIn} onModalClose={closeSignIn} disabled={isAuthLoading} />}
    </main>
  );
};

export default Shop;
