import type { CSSProperties } from "react";
import PaintedShip from "./PaintedShip";
import PiPrice from "../components/PiPrice";
import { allPlayerColors, fleetCount, playerColors, standardShipPrice, testnetStandardHullAvailable, type ShipFleet } from "./shipFleet";
import { projectileGuardForStage, type ShipStage } from "./shipEvolution";
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
  purchaseBusy?: boolean;
  message: string;
  selectedSkinId: string;
  selectedColorId: string;
  t: (source: string) => string;
  onStageChange: (stage: ShipStage) => void;
  onColorChange: (color: Color) => void;
  onBuyStandard: () => void;
  onEquipPreview: () => void;
  onOpenShop: (stage: ShipStage) => void;
};

const stageLabel = (stage: ShipStage) => stage === 1 ? "STANDARD" : stage === 2 ? "ADVANCED" : "ELITE";

export default function ShipSelectionPanel({
  view, skin, color, focusStage, ownedStage, fleet, shards, locale, offers,
  adminPreview, purchaseBusy, message, selectedSkinId, selectedColorId, t, onStageChange, onColorChange,
  onBuyStandard, onEquipPreview, onOpenShop,
}: Props) {
  const hullCount = fleetCount(fleet, skin.id);
  const stage = focusStage;
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

  const equipped = selectedSkinId === skin.id && selectedColorId === color.id && stage === ownedStage;
  const canEquip = Boolean(adminPreview || hullCount > 0 && fleetCount(fleet, skin.id, color.id) > 0 && stage === ownedStage);

  return <div className="ship-one-screen ship-compact-configuration" data-stage={stage}>
    <div className="ship-version-tabs" role="group" aria-label={t("Three ship stages")}>
      {([1, 2, 3] as const).map(level => <button key={level} type="button" aria-pressed={stage === level}
        data-owned={Boolean(hullCount && ownedStage >= level)} onClick={() => onStageChange(level)}>
        <strong>{t(stageLabel(level))}</strong>
        <small>{hullCount && ownedStage >= level ? t("Owned") : level === 1 ? `◆ ${shardPrice}` : offerFor(level) ? piPrice(offerFor(level)!.pricePi) : t("Price unavailable")}</small>
      </button>)}
    </div>
    <div className="ship-one-hero">
      <div className="ship-one-info">
        <h3>{skin.name} <small>· {t(stageLabel(stage))}</small></h3>
        <strong className={status === "MAINNET READY" ? "mainnet-ready-badge" : undefined}>{status}</strong>
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
            title={t(item.name)} data-owned={fleetCount(fleet, skin.id, item.id) > 0} style={{ "--paint": item.glow } as CSSProperties} onClick={() => onColorChange(item)}><span aria-hidden="true">{color.id === item.id ? "✓" : ""}</span></button>)}
        </div>
      </div>
      <div className="ship-configuration-summary">
        {view === "shop" && !adminPreview && <div className="ship-inline-purchase">
          <span className="ship-purchase-price">{stage === 1
            ? `◆ ${shardPrice} ${t("Shards")}`
            : focusedOffer ? <>{t("Planned price")}: {piPrice(focusedOffer.pricePi)}</> : t("Price unavailable")}</span>
          {stage === 1 ? <>
            <small>{t(color.name)}{skin.price === 0 ? " · " + t("Starter issued free; price is for an additional ship.") : ""}</small>
            <button className="button button-secondary ship-shard-button" type="button" onClick={onBuyStandard} aria-busy={purchaseBusy || undefined} disabled={adminPreview || purchaseBusy || !standardAvailable || shards < price}>
              {t(hullCount ? "Buy another for" : "Buy for")} ◆ {shardPrice} {t("Shards")}
            </button>
            {!standardAvailable && <small className="ship-lock-notice"><span className="mainnet-ready-badge">{t("MAINNET READY")}</span> · {t("Purchases locked")}</small>}
            {standardAvailable && shards < price && <small className="ship-shortfall">◆ {(price - shards).toLocaleString(locale)} {t("more Shards needed")}</small>}
          </> : <>
            {ownedStage < stage && <button className="button button-secondary" type="button" disabled>{t("Buy for")} {focusedOffer ? piPrice(focusedOffer.pricePi) : "Pi"} · {t("Purchases locked")}</button>}
            {stage === 3 && advancedOffer && focusedOffer && <small>{t("Requires Stage 2")} · {t("Total with Advanced")}: {piPrice(advancedOffer.pricePi + focusedOffer.pricePi)}</small>}
          </>}
        </div>}
        <div className="ship-version-benefits">
          <span><b aria-hidden="true">{stage === 1 ? "Ⅰ" : stage === 2 ? "Ⅱ" : "Ⅱ+"}</b>{t(stage === 1 ? "Single laser" : "Twin Laser")}</span>
          <span><b>{projectileGuardForStage(stage)}</b>{t("Projectile hits left")}</span>
        </div>
        <p className="ship-configuration-description">{description}</p>
      </div>
    </div>
    {(view === "hangar" || adminPreview || canEquip) && <div className="ship-one-checkout">
      {adminPreview
        ? <><span>{t("Admin test access: all variants unlocked")}</span><button className="button button-secondary" type="button" onClick={onEquipPreview}>{t("Equip for next mission")}</button></>
        : <>
          {canEquip && <button className="button button-secondary ship-equip-button" type="button" onClick={onEquipPreview} disabled={equipped || purchaseBusy}>{t(equipped ? "EQUIPPED" : "Equip for next mission")}</button>}
          {view === "hangar" && ownedStage < 3 && <button className="button button-secondary ship-upgrade-button" type="button" onClick={() => onOpenShop(stage > ownedStage ? stage : ownedStage < 2 ? 2 : 3)}>{t("Shop")} · {t(stageLabel(stage > ownedStage ? stage : ownedStage < 2 ? 2 : 3))} ›</button>}
          {view === "hangar" && !canEquip && stage <= ownedStage && <button className="ship-standard-return" type="button" onClick={() => onStageChange(ownedStage)}>{t(stageLabel(ownedStage))} ›</button>}
        </>}
    </div>}
    {message && <p className="hangar-message" role="status">{message}</p>}
    <details className="ship-rules"><summary>{t("Shield & protection")}</summary><p>{t("Upgrades apply to this ship type in every color. Each new life restores its projectile protection. An active shield absorbs shots and ship collisions; unshielded ship collisions destroy the hull immediately.")}</p></details>
  </div>;
}
