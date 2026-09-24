import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import SignIn from "../components/SignIn";

import { useAuth } from "../hooks/useAuth";
import { IRRA_TOKEN_CANONICAL, usePayments } from "../hooks/usePayments";
import { axiosClient } from "../lib/axiosClient.ts";
import { BEST_SCORE_KEY, HIGHEST_SECTOR_KEY, TOTAL_DESTROYED_KEY } from "./GamePage.tsx";
import { buySkin, emblemStyle, ownedSkins, playerColors, playerSkins, selectedShip, shardBalance, SHARD_BALANCE_KEY, SHIP_COLOR_KEY, SHIP_OWNED_KEY, SHIP_SKIN_KEY, spriteStyle } from "./shipFleet";

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
        onSignOut={signOut}
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
        <p>Grey Scout is your free starter ship. Preview any other hull and its color before buying with game-only Shards. Paint changes are always free. Every ship carries your golden π coin.</p>
        <strong className="shard-balance">◆ {shards} Shards</strong><span className="shard-help">Earn 1 Shard per defeated Cryptoid; your Shards are saved at the end of each mission.</span>
        <div className="ship-picker" role="group" aria-label="Ship hull">
          {playerSkins.map(skin => <button key={skin.id} className="ship-choice" type="button" aria-pressed={previewSkin.id === skin.id} onClick={() => { setPreviewSkin(skin); setHangarMessage(""); }}>
            <span className={`ship-preview${skin.price === 0 ? " ship-preview-starter" : ""}`}><i style={{ ...spriteStyle(skin.sprite), "--ship-hue": previewColor.hue, "--ship-glow": previewColor.glow } as CSSProperties} /><b style={emblemStyle(skin.sprite)}>π</b></span><span>{skin.name}</span><small>{skin.price === 0 ? "ISSUED" : owned.includes(skin.id) ? "OWNED" : `◆ ${skin.price}`}</small>
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
        <div className="section-heading"><div><p className="eyebrow">POWER LAB</p><h2 id="upgrade-heading">Upgrade your loadout</h2></div><span className="section-line" /></div>
        <div className="product-grid">
          <ProductCard name="Solar Core" description="Charge your next evolution." price={0.1} pictureURL="https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=900&q=80" onClickBuyWithPi={() => orderProduct("Order Solar Core", 0.1, { productId: "solar_core_1" })} onClickBuyWithIrra={() => orderProduct("Order Solar Core", 0.1, { productId: "solar_core_1" }, IRRA_TOKEN_CANONICAL)} disabled={isLoading} />
          <ProductCard name="Cyan Shield" description="Hold the line for Earth." price={0.2} pictureURL="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=80" onClickBuyWithPi={() => orderProduct("Order Cyan Shield", 0.2, { productId: "cyan_shield_1" })} onClickBuyWithIrra={() => orderProduct("Order Cyan Shield", 0.2, { productId: "cyan_shield_1" }, IRRA_TOKEN_CANONICAL)} disabled={isLoading} />
        </div>
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
