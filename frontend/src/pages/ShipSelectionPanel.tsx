import type { CSSProperties } from "react";
import PaintedShip from "./PaintedShip";
import PiPrice from "../components/PiPrice";
import { allPlayerColors, fleetCount, playerColors, standardShipPrice, testnetStandardHullAvailable, type ShipFleet } from "./shipFleet";
import { type ShipStage } from "./shipEvolution";
import { shipPreviewPlacement } from "./shipPreviewPlacement";

type Skin = typeof import("./shipFleet").playerSkins[number];
type Color = typeof allPlayerColors[number];
export type ShipUpgradeOffer = { id: string; description: string; pricePi: number; shipIndex?: number; stage?: 2 | 3 };

type Props = {
  view: "shop" | "hangar";
  skin: Skin;
  color: Color;
  focusStage: ShipStage;
  ownedStage: ShipStage;
  fleet: ShipFleet;
  shards: number;
  locale: string;
  offers: ShipUpgradeOffer[];
  adminPreview?: boolean;
  message: string;
  selectedSkinId: string;
  selectedColorId: string;
  t: (source: string) => string;
  onStageChange: (stage: ShipStage) => void;
  onColorChange: (color: Color) => void;
  onBuyStandard: () => void;
  onEquipPreview: () => void;
  onOpenShop: () => void;
};

const stageLabel = (stage: ShipStage) => stage === 1 ? "STANDARD" : stage === 2 ? "ADVANCED" : "ELITE";

export default function ShipSelectionPanel({
  view, skin, color, focusStage, ownedStage, fleet, shards, locale, offers,
  adminPreview, message, selectedSkinId, selectedColorId, t, onStageChange, onColorChange,
  onBuyStandard, onEquipPreview, onOpenShop,
}: Props) {
  const hullCount = fleetCount(fleet, skin.id);
  const stage = adminPreview || view === "shop" ? focusStage : ownedStage;
  const price = standardShipPrice(skin);
  const shardPrice = price.toLocaleString(locale);
  const piPrice = (amount: number) => <PiPrice amount={amount} locale={locale} />;
  const standardAvailable = testnetStandardHullAvailable(skin.id);
  const offerFor = (level: ShipStage) => offers.find(offer => offer.shipIndex === skin.sprite && offer.stage === level);
  const focusedOffer = offerFor(stage);
  const advancedOffer = offerFor(2);
  const colors = allPlayerColors.filter(item => view === "shop"
    ? playerColors.some(available => available.id === item.id) || fleetCount(fleet, skin.id, item.id) > 0
    : fleetCount(fleet, skin.id, item.id) > 0);
  const description = stage === 1 ? t("Single fire. No free enemy projectile hits. An active shield protects against shots and ship collisions.") : t(offerFor(stage)?.description ?? "");
  const status = stage === 1
    ? hullCount ? t("Owned") + " ×" + hullCount : standardAvailable ? t("Not owned") : "MAINNET READY"
    : ownedStage >= stage ? t("OWNED") : "MAINNET READY";

  return <div className="ship-one-screen">
    <div className="ship-one-hero">
      <div className="ship-one-info">
        <h3>{skin.name} <small>· {t(stageLabel(stage))}</small></h3>
        <strong>{status}</strong>
      </div>
      <div className="ship-one-art-wrap" role="img" aria-label={skin.name + " · " + t(color.name) + " · " + t(stageLabel(stage))}>
        <span className="ship-one-art-frame">
          <span className="ship-one-art" style={shipPreviewPlacement(skin.sprite, stage)}>
            <PaintedShip sprite={skin.sprite} color={color.id} stage={stage} />
          </span>
        </span>
      </div>
      <div className="ship-one-colors">
        <div className="ship-one-colors-heading"><h4>{t("Color variants")}</h4><span>{t(color.name)}{fleetCount(fleet, skin.id, color.id) ? " · " + t("Owned") + " ×" + fleetCount(fleet, skin.id, color.id) : ""}</span></div>
        <div className="ship-color-dots" role="group" aria-label={t("Ship paint")}>
          {colors.map(item => <button key={item.id} type="button" aria-pressed={color.id === item.id}
            aria-label={t(item.name) + (fleetCount(fleet, skin.id, item.id) ? " · " + t("Owned") : " · " + t("Not owned"))}
            title={t(item.name)} style={{ "--paint": item.glow } as CSSProperties} onClick={() => onColorChange(item)} />)}
        </div>
      </div>
      <div className="ship-configuration-summary">
        {view === "shop" && !adminPreview && <div className="ship-inline-purchase">
          <span className="ship-purchase-price">{stage === 1
            ? `◆ ${shardPrice} ${t("Shards")}`
            : focusedOffer ? <>{t("Planned price")}: {piPrice(focusedOffer.pricePi)}</> : t("Price unavailable")}</span>
          {stage === 1 ? <>
            <small>{t(color.name)}{skin.price === 0 ? " · " + t("Starter issued free; price is for an additional ship.") : ""}</small>
            <button className="button button-secondary ship-shard-button" type="button" onClick={onBuyStandard} disabled={!standardAvailable || shards < price}>
              {t(hullCount ? "Buy another for" : "Buy for")} ◆ {shardPrice} {t("Shards")}
            </button>
            {!standardAvailable && <small className="ship-lock-notice">MAINNET READY · {t("Purchases locked")}</small>}
            {standardAvailable && shards < price && <small className="ship-shortfall">◆ {(price - shards).toLocaleString(locale)} {t("more Shards needed")}</small>}
          </> : <>
            {ownedStage < stage && <button className="button button-secondary" type="button" disabled>{t("Buy for")} {focusedOffer ? piPrice(focusedOffer.pricePi) : "Pi"} · {t("Purchases locked")}</button>}
            {stage === 3 && advancedOffer && focusedOffer && <small>{t("Requires Stage 2")} · {t("Total with Advanced")}: {piPrice(advancedOffer.pricePi + focusedOffer.pricePi)}</small>}
          </>}
        </div>}
        {view === "shop" && stage !== 1 && <button className="ship-standard-return" type="button" onClick={() => onStageChange(1)}>‹ {t("Show standard ship")}</button>}
        <p className="ship-configuration-description">{description}</p>
      </div>
    </div>
    {(view === "shop" || adminPreview) && <div className="ship-evolution-stages" role="group" aria-label={t("Three ship stages")}>
      {([2, 3] as const).map(level => {
        const stageOwned = ownedStage >= level;
        const offer = offerFor(level);
        return <button key={level} className={`ship-evolution-stage${!stageOwned ? " ship-evolution-stage-locked" : ""}`} type="button"
          aria-pressed={focusStage === level} onClick={() => onStageChange(level)}>
          <span className="ship-evolution-stage-art" aria-hidden="true"><img src={`/ships/evolution/ship_${String(skin.sprite + 1).padStart(2, "0")}_stage_${level}.png`} alt="" loading="lazy" decoding="async" style={shipPreviewPlacement(skin.sprite, level)} /></span>
          <span className="ship-evolution-stage-info"><strong>0{level} · {t(stageLabel(level))}</strong><small>{offer ? piPrice(offer.pricePi) : t("Price unavailable")}</small><em>{stageOwned ? t("OWNED") : "MAINNET READY · " + t("Planned price")}</em></span>
        </button>;
      })}
    </div>}
    {(view === "hangar" || adminPreview) && <div className="ship-one-checkout">
      {view === "hangar"
        ? <><span>{selectedSkinId === skin.id && selectedColorId === color.id ? t("EQUIPPED") : t("Owned")}</span><button className="button button-secondary" type="button" onClick={onOpenShop}>{t("Shop")} ›</button></>
        : <><span>Admin-Testzugang · alle Varianten freigeschaltet</span><button className="button button-secondary" type="button" onClick={onEquipPreview}>Für Testflug ausrüsten</button></>}
    </div>}
    {message && <p className="hangar-message" role="status">{message}</p>}
    <details className="ship-rules"><summary>{t("Shield & protection")}</summary><p>{t("Upgrades apply to this ship type in every color. Each new life restores its projectile protection. An active shield absorbs shots and ship collisions; unshielded ship collisions destroy the hull immediately.")}</p></details>
  </div>;
}
