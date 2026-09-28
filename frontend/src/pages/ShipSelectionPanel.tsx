import type { CSSProperties } from "react";
import PaintedShip from "./PaintedShip";
import { allPlayerColors, EXTRA_STARTER_PRICE, fleetCount, playerColors, type ShipFleet } from "./shipFleet";
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
  offers: ShipUpgradeOffer[];
  catalogReady: boolean;
  isLoading: boolean;
  message: string;
  selectedSkinId: string;
  selectedColorId: string;
  locale: string;
  t: (source: string) => string;
  onStageChange: (stage: ShipStage) => void;
  onColorChange: (color: Color) => void;
  onBuyStandard: () => void;
  onBuyUpgrade: (offer: ShipUpgradeOffer) => void;
  onOpenShop: () => void;
};

const stageLabel = (stage: ShipStage) => stage === 1 ? "STANDARD" : stage === 2 ? "ADVANCED" : "ELITE";

export default function ShipSelectionPanel({
  view, skin, color, focusStage, ownedStage, fleet, shards, offers, catalogReady,
  isLoading, message, selectedSkinId, selectedColorId, locale, t, onStageChange, onColorChange,
  onBuyStandard, onBuyUpgrade, onOpenShop,
}: Props) {
  const hullCount = fleetCount(fleet, skin.id);
  const stage = view === "shop" ? focusStage : ownedStage;
  const price = skin.price || EXTRA_STARTER_PRICE;
  const offerFor = (level: ShipStage) => offers.find(offer => offer.shipIndex === skin.sprite && offer.stage === level);
  const piStage = stage === 1 ? ownedStage >= 2 ? 3 : 2 : stage;
  const piOffer = offerFor(piStage);
  const piOwned = ownedStage >= piStage;
  const piReady = hullCount > 0 && (piStage === 2 || ownedStage >= 2);
  const formatPi = (value: number) => value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const colors = allPlayerColors.filter(item => view === "shop"
    ? playerColors.some(available => available.id === item.id) || fleetCount(fleet, skin.id, item.id) > 0
    : fleetCount(fleet, skin.id, item.id) > 0);
  const description = stage === 1 ? t("Single fire. No free enemy projectile hits. An active shield protects against shots and ship collisions.") : t(offerFor(stage)?.description ?? "");
  const status = stage === 1
    ? hullCount ? t("Owned") + " ×" + hullCount : t("Not owned") + " · ◆ " + price + " " + t("Shards")
    : ownedStage >= stage ? t("OWNED") : !hullCount ? t("Buy hull with Shards first") : stage === 3 && ownedStage < 2 ? t("Requires Stage 2") : t("NOT OWNED");

  return <div className="ship-one-screen">
    <div className="ship-one-hero">
      <div className="ship-one-art-wrap" role="img" aria-label={skin.name + " · " + t(color.name) + " · " + t(stageLabel(stage))}>
        <span className="ship-one-art-frame">
          <span className="ship-one-art" style={shipPreviewPlacement(skin.sprite, stage)}>
            <PaintedShip sprite={skin.sprite} color={color.id} stage={stage} />
          </span>
        </span>
      </div>
      <div className="ship-one-info">
        <h3>{skin.name} <small>· {t(stageLabel(stage))}</small></h3>
        <p>{description}</p>
        <strong>{status}</strong>
        {view === "shop" && stage !== 1 && <button className="ship-standard-return" type="button" onClick={() => onStageChange(1)}>‹ {t("Show standard ship")}</button>}
      </div>
    </div>
    {view === "shop" && <div className="ship-evolution-stages" role="group" aria-label={t("Three ship stages")}>
      {([2, 3] as const).map(level => {
        const offer = offerFor(level);
        const stageOwned = ownedStage >= level;
        const unlocked = hullCount > 0 && (level === 2 || ownedStage >= 2);
        const requirement = !hullCount ? t("Buy hull with Shards first") : t("Requires Stage 2");
        return <button key={level} className={`ship-evolution-stage${!unlocked && !stageOwned ? " ship-evolution-stage-locked" : ""}`} type="button"
          aria-pressed={focusStage === level} onClick={() => onStageChange(level)}>
          <span className="ship-evolution-stage-art" aria-hidden="true"><img src={`/ships/evolution/ship_${String(skin.sprite + 1).padStart(2, "0")}_stage_${level}.png`} alt="" loading="lazy" decoding="async" style={shipPreviewPlacement(skin.sprite, level)} /></span>
          <span className="ship-evolution-stage-info"><strong>0{level} · {t(stageLabel(level))}</strong><small>{offer ? formatPi(offer.pricePi) + " π" : "π"}</small><span className="ship-evolution-stage-description">{t(offer?.description ?? "")}</span><em>{stageOwned ? t("OWNED") : unlocked ? t("NOT OWNED") : requirement}</em></span>
        </button>;
      })}
    </div>}
    <div className="ship-one-colors">
      <div className="ship-one-colors-heading"><h4>{t("Color variants")}</h4><span>{t(color.name)}{fleetCount(fleet, skin.id, color.id) ? " · " + t("Owned") + " ×" + fleetCount(fleet, skin.id, color.id) : ""}</span></div>
      <div className="ship-color-dots" role="group" aria-label={t("Ship paint")}>
        {colors.map(item => <button key={item.id} type="button" aria-pressed={color.id === item.id}
          aria-label={t(item.name) + (fleetCount(fleet, skin.id, item.id) ? " · " + t("Owned") : " · " + t("Not owned"))}
          title={t(item.name)} style={{ "--paint": item.glow } as CSSProperties} onClick={() => onColorChange(item)} />)}
      </div>
    </div>
    <div className="ship-one-checkout">
      {view === "hangar"
        ? <><span>{selectedSkinId === skin.id && selectedColorId === color.id ? t("EQUIPPED") : t("Owned")}</span><button className="button button-secondary" type="button" onClick={onOpenShop}>{t("Shop")} ›</button></>
        : <>
          {stage === 1 && <button className="button button-secondary ship-shard-button" type="button" onClick={onBuyStandard} disabled={shards < price}>{t(hullCount ? "Buy another for" : "Buy for")} ◆ {price}</button>}
          <button className="button button-primary ship-pi-button" type="button" disabled={!piOffer || piOwned || isLoading || !catalogReady || !piReady}
            title={!piReady ? t(hullCount ? "Requires Stage 2" : "Buy hull with Shards first") : undefined}
            onClick={() => { if (piOffer) onBuyUpgrade(piOffer); }}>{piOwned ? t("OWNED") : t("Buy with π")} · {t(stageLabel(piStage))} {piOffer ? formatPi(piOffer.pricePi) : "–"} π</button>
        </>}
    </div>
    {view === "shop" && stage === 1 && shards < price && <small className="ship-shortfall">◆ {price - shards} {t("more Shards needed")}</small>}
    {message && <p className="hangar-message" role="status">{message}</p>}
    <details className="ship-rules"><summary>{t("Shield & protection")}</summary><p>{t("Upgrades apply to this ship type in every color. Each new life restores its projectile protection. An active shield absorbs shots and ship collisions; unshielded ship collisions destroy the hull immediately.")}</p></details>
  </div>;
}
