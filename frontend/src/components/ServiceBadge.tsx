import { rankTiers } from "../../../backend/src/rewardRules";
import { useLocale } from "../i18n";
export default function ServiceBadge({ name, size = "small", locked = false }: { name: string; size?: "small" | "medium" | "large"; locked?: boolean }) {
  const { t } = useLocale();
  const rank = rankTiers.find(tier => tier.name === name) ?? rankTiers[0];
  return <img className={`service-badge service-badge-${size}${locked ? " service-badge-locked" : ""}`} src={`/ranks/${rank.name.toLowerCase()}.svg`} alt={t(rank.name)} loading="lazy" width={160} height={164}/>;
}
