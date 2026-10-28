import { standardHullAvailable } from "./ownerTestnetCatalog";
import type { CSSProperties } from "react";
import ShipPreview from "./ShipPreview";
import PiPrice from "../components/PiPrice";
import TestPiPurchase from './TestPiPurchase';
import { allPlayerColors, fleetCount, playerColors, standardShipPrice, type ShipFleet } from "./shipFleet";
import { stagePickupRadiusBonus, type ShipStage } from "./shipEvolution";
import { attributesForHull, shipBaseFirepower } from "./shipAttributes";

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
  testnetCatalogAccess?: boolean;
  upgradePending?: boolean;
  upgradeStatus?: string;
  upgradeDiagnostic?: string;
  onBuyUpgrade?: (offer: ShipUpgradeOffer, color: Color) => void;
  purchaseBusy?: boolean;
  message: string;
  selectedSkinId: string;
  selectedColorId: string;
  selectedStage?: ShipStage;
  selectionConfirmed?: boolean;
  t: (source: string) => string;
  onStageChange: (stage: ShipStage) => void;
  onColorChange: (color: Color) => void;
  onBuyStandard: () => void;
  onEquipPreview: (stage: ShipStage) => void;
  onOpenShop: (stage: ShipStage) => void;
};

const stageLabel = (stage: ShipStage) => stage === 1 ? "STANDARD" : stage === 2 ? "ADVANCED" : "ELITE";

export default function ShipSelectionPanel({
  view, skin, color, focusStage, ownedStage, fleet, shards, locale, offers,
  adminPreview, testnetCatalogAccess = false, upgradePending, upgradeStatus, upgradeDiagnostic, onBuyUpgrade,
  purchaseBusy, message, selectedSkinId, selectedColorId, selectedStage = 1, selectionConfirmed = true, t, onStageChange, onColorChange,
  onBuyStandard, onEquipPreview, onOpenShop,
}: Props) {
  const hullCount = fleetCount(fleet, skin.id);
  const stage = focusStage;
  const price = standardShipPrice(skin);
  const shardPrice = price.toLocaleString(locale);
  const piPrice = (amount: number) => <PiPrice amount={amount} locale={locale} testnet={testnetCatalogAccess} />;
  const standardAvailable = standardHullAvailable(skin.id, testnetCatalogAccess);
  const offerFor = (level: ShipStage) => offers.find(offer => offer.shipIndex === skin.sprite && offer.stage === level);
  const focusedOffer = offerFor(stage);
  const advancedOffer = offerFor(2);
  const colors = allPlayerColors.filter(item => view === "shop"
    ? playerColors.some(available => available.id === item.id) || fleetCount(fleet, skin.id, item.id) > 0
    : fleetCount(fleet, skin.id, item.id) > 0);
  const description = stage === 1 ? t("Single fire. No free enemy projectile hits. An active shield protects against shots and ship collisions.") : t(offerFor(stage)?.description ?? "");
  const stageOwned = hullCount > 0 && ownedStage >= stage;
  const locked = stage === 1 ? !standardAvailable : !stageOwned && !testnetCatalogAccess;
  const status = stageOwned ? t("Stage owned") : t("Stage not owned");
  const attributes = attributesForHull(skin.id);
  const firepower = shipBaseFirepower(skin.id, stage);
  const baseline = shipBaseFirepower("grey-scout", 1);
  const compared = Math.round((firepower / shipBaseFirepower(selectedSkinId, selectedStage) - 1) * 100);
  const percent = (value: number) => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(value / 100);
  const role = attributes.role === "power" ? t("Power-focused hull") : attributes.role === "rapid" ? t("Rapid-fire hull") : t("Balanced hull");
  const roleDescription = attributes.role === "power"
    ? t("Stronger individual shots are this hull's main advantage.")
    : attributes.role === "rapid" ? t("Faster automatic firing is this hull's main advantage.")
      : t("Balanced shot strength and firing cadence.");

  const equipped = selectedSkinId === skin.id && selectedColorId === color.id && stage === selectedStage && selectionConfirmed;
  const canEquip = Boolean(adminPreview || hullCount > 0 && fleetCount(fleet, skin.id, color.id) > 0 && stage <= ownedStage);

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
        <strong className="ship-stage-status" data-owned={stageOwned}>{status}{stage === 1 && hullCount > 0 ? ` ×${hullCount}` : ""}</strong>
      </div>
      <div className="ship-one-art-wrap" role="img" aria-label={skin.name + " · " + t(color.name) + " · " + t(stageLabel(stage))}>
        <span className="ship-one-art-frame">
          <span className="ship-one-art">
            <ShipPreview sprite={skin.sprite} color={color.id} stage={stage} />
          </span>
        </span>
      </div>
      <div className="ship-one-colors">
        <div className="ship-one-colors-heading"><h4>{t("Color variants")}</h4><span>{t(color.name)} · {t(fleetCount(fleet, skin.id, color.id) ? "Color owned" : "Color not owned")}{fleetCount(fleet, skin.id, color.id) ? " ×" + fleetCount(fleet, skin.id, color.id) : ""}</span></div>
        <div className="ship-color-dots" role="group" aria-label={t("Ship paint")}>
          {colors.map(item => <button key={item.id} type="button" aria-pressed={color.id === item.id}
            aria-label={t(item.name) + " · " + t(fleetCount(fleet, skin.id, item.id) ? "Color owned" : "Color not owned")}
            title={t(item.name)} data-owned={fleetCount(fleet, skin.id, item.id) > 0} style={{ "--paint": item.glow } as CSSProperties} onClick={() => onColorChange(item)}><span aria-hidden="true">{color.id === item.id ? "✓" : ""}</span></button>)}
        </div>
      </div>
      <div className="ship-configuration-summary">
        {view === "shop" && !adminPreview && <div className="ship-inline-purchase">
          {locked && <p className="ship-lock-notice"><strong>{t("Purchases locked")}</strong> · <span className="mainnet-ready-badge">{t("MAINNET READY")}</span></p>}
          <span className="ship-purchase-price">{stage === 1
            ? `◆ ${shardPrice} ${t("Shards")}`
            : focusedOffer ? <>{!testnetCatalogAccess && `${t("Planned price")}: `}{piPrice(focusedOffer.pricePi)}</> : t("Price unavailable")}</span>
          {stage === 1 ? <>
            <small>{t(color.name)}{skin.price === 0 ? " · " + t("Starter issued free; price is for an additional ship.") : ""}</small>
            <button className="button button-secondary ship-shard-button" type="button" onClick={onBuyStandard} aria-label={`${t(hullCount ? "Buy another ship" : "Buy ship")} · ${skin.name} · ${t(color.name)} · ${shardPrice} ${t("Shards")}`} aria-busy={purchaseBusy || undefined} disabled={adminPreview || purchaseBusy || !standardAvailable || shards < price}>
              {t(hullCount ? "Buy another ship" : "Buy ship")}
            </button>
            {standardAvailable && shards < price && <small className="ship-shortfall">◆ {(price - shards).toLocaleString(locale)} {t("more Shards needed")}</small>}
          </> : <>
            {!stageOwned && (testnetCatalogAccess && focusedOffer && onBuyUpgrade
              ? <TestPiPurchase price={focusedOffer.pricePi} disabled={purchaseBusy || !hullCount || stage === 3 && ownedStage < 2}
                  pending={upgradePending} status={upgradeStatus} diagnostic={upgradeDiagnostic}
                  reason={!hullCount ? 'Buy the Standard ship first.' : stage === 3 && ownedStage < 2 ? 'Requires Stage 2' : undefined}
                  onBuy={() => onBuyUpgrade(focusedOffer, color)} />
              : <button className="button button-secondary" type="button" disabled>{t("Purchases locked")}</button>)}
            {stage === 3 && advancedOffer && focusedOffer && <small>{t("Requires Stage 2")} · {t("Total with Advanced")}: {piPrice(advancedOffer.pricePi + focusedOffer.pricePi)}</small>}
          </>}
        </div>}
        <div className="ship-version-benefits">
          <span><b aria-hidden="true">{stage === 1 ? "Ⅰ" : stage === 2 ? "Ⅱ" : "Ⅱ+"}</b>{t(stage === 1 ? "Single laser" : "Twin Laser")}</span>
          <span><b>+{percent(stagePickupRadiusBonus(stage))}</b>{t("Power-up pickup radius")}</span>
        </div>
        <div className="ship-hull-characteristics" aria-label={t("Hull characteristics")}>
          <strong className="ship-hull-role">{role}</strong>
          <dl className="ship-hull-stats">
            <div><dt>{t("Shot damage bonus")}</dt><dd>+{percent(attributes.damageBonus)}</dd></div>
            <div><dt>{t("Fire rate bonus")}</dt><dd>+{percent(attributes.fireRateBonus)}</dd></div>
            <div><dt>{t("Base firepower")}</dt><dd>{percent(firepower / baseline * 100)}</dd></div>
          </dl>
          <p className="ship-hull-comparison" data-improved={compared > 0}>{t("Compared with equipped ship")}: <b>{compared > 0 ? "+" : ""}{percent(compared)}</b></p>
        </div>
        <details className="ship-configuration-details"><summary>{t("Ship details")}</summary>
          <p className="ship-configuration-description">{roleDescription}</p>
          <p className="ship-configuration-description">{description}</p>
          <p className="ship-configuration-description">{t("Grey Scout Standard = 100%. Paint does not change combat stats.")}</p>
          <p className="ship-configuration-description">{t("Hull bonuses also apply to weapon upgrades and power-ups.")}</p>
          <p className="ship-configuration-description">{t("Base firepower compares total damage per second before accuracy and enemy protection.")}</p>
        </details>
      </div>
    </div>
    {(view === "hangar" || adminPreview || canEquip) && <div className="ship-one-checkout">
      {adminPreview
        ? <><span>{t("Admin test access: all variants unlocked")}</span><button className="button button-secondary" type="button" onClick={() => onEquipPreview(stage)}>{t("Equip for next mission")}</button></>
        : <>
          {canEquip && <button className="button button-secondary ship-equip-button" type="button" onClick={() => onEquipPreview(stage)} disabled={equipped || purchaseBusy}>{t(equipped ? "EQUIPPED" : "Select")}</button>}
          {view === "hangar" && ownedStage < 3 && <button className="button button-secondary ship-upgrade-button" type="button" onClick={() => onOpenShop(stage > ownedStage ? stage : ownedStage < 2 ? 2 : 3)}>{t("Shop")} · {t(stageLabel(stage > ownedStage ? stage : ownedStage < 2 ? 2 : 3))} ›</button>}
          {view === "hangar" && !canEquip && stage <= ownedStage && <button className="ship-standard-return" type="button" onClick={() => onStageChange(ownedStage)}>{t(stageLabel(ownedStage))} ›</button>}
        </>}
    </div>}
    {message && <p className="hangar-message" role="status">{message}</p>}
    <details className="ship-rules"><summary>{t("Shield & protection")}</summary><p>{t("Ship stages do not absorb hits. Active shields protect separately; armor determines your maximum hearts. The larger pickup radius applies only to normal power-ups, not boss hearts or bonus targets.")}</p></details>
  </div>;
}
