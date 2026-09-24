import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import SignIn from "../components/SignIn";

import { useAuth } from "../hooks/useAuth";
import { IRRA_TOKEN_CANONICAL, usePayments } from "../hooks/usePayments";
import { axiosClient } from "../lib/axiosClient.ts";
import { BEST_SCORE_KEY, HIGHEST_SECTOR_KEY, TOTAL_DESTROYED_KEY } from "./GamePage.tsx";

const Shop = () => {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<"how" | "progress" | null>(null);
  const [records] = useState(() => ({ bestScore: Number(localStorage.getItem(BEST_SCORE_KEY) || 0), highestSector: Number(localStorage.getItem(HIGHEST_SECTOR_KEY) || 0), totalDestroyed: Number(localStorage.getItem(TOTAL_DESTROYED_KEY) || 0) }));
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
          <p>{activePanel === "how" ? "Tap or click an asteroid to fire one virtual coin. Small asteroids take 1 hit and reward 2 coins and 10 points. Medium asteroids take 2 hits and reward 4 coins and 25 points. Large asteroids take 3 hits and reward 7 coins and 50 points. You start with 30 coins and 3 hearts. Lose a heart when an asteroid reaches Earth. The round ends at 0 hearts or 0 coins." : `Your best score is ${records.bestScore}, your highest sector is ${records.highestSector}, and you have destroyed ${records.totalDestroyed} asteroids.`}</p>
          <button className="button button-primary" type="button" onClick={() => { setActivePanel(null); if (activePanel === "how") navigate("/game"); }}>Enter mission <span>↗</span></button>
        </div>
      </div>}

      {showSignIn && <SignIn onSignIn={signIn} onModalClose={closeSignIn} disabled={isAuthLoading} />}
    </main>
  );
};

export default Shop;
