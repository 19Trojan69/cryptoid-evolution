import { useLocale } from "../i18n";
import { missionPowerOffers, type MissionPower } from "../../../backend/src/missionPower";
import { powerUpSymbols } from "./powerUps";

export function PowerOrb({ power }: { power: MissionPower }) {
  return <i className={`power-orb power-preview-${power}`} aria-hidden="true">{powerUpSymbols[power]}</i>;
}

export default function PowerPreview({ offerId }: { offerId: string }) {
  const { t } = useLocale();
  const power = missionPowerOffers.find(offer => offer.id === offerId)?.powerUp;
  if (!power) return null;
  return <div className={`offer-preview power-preview power-preview-${power}`} aria-hidden="true">
    <span className="preview-grid" />
    <span className="power-preview-orbit"><PowerOrb power={power} /></span>
    <span className="power-preview-wave" />
    <small>{t("Energy core")}</small>
  </div>;
}
