import ServiceBadge from "../components/ServiceBadge";
import { useLocale } from "../i18n";
import { rankForLevel, rankTiers, CHAIN_MILESTONES, type RewardProgress } from "./rewardProgress";
type Scores = { careerScore: number; bestRun: { score: number; level: number | null } };
export default function CareerDashboard({ progress, scores, records, accountId, localBest, loading = false }: { progress: RewardProgress | null; scores: Scores | null; records: { highestSector: number; totalDestroyed: number } | null; accountId?: string; localBest?: number; loading?: boolean }) {
  const { t, locale } = useLocale();
  const number = (value: number | undefined | null) => value == null ? t("Not available") : value.toLocaleString(locale);
  const rank = progress ? rankForLevel(progress.highestLevel) : null;
  const next = progress ? rankTiers.find(tier => tier.level > progress.highestLevel) : null;
  const percent = progress && rank && next ? Math.max(0,Math.min(100,(progress.highestLevel-rank.level)/(next.level-rank.level)*100)) : 100;
  return <section className="career-cockpit" aria-label={t("Starfleet career")}>
    <p className="eyebrow">{t("Starfleet career")}</p>
    {rank ? <div className="career-rank"><ServiceBadge name={rank.name} size="large"/><div><small>{t("Current service rank")}</small><h3>{t(rank.name)}</h3><p>{t("Career stage")} {number(progress?.highestLevel)} / 500</p></div></div> : <p role="status">{t(loading ? "Loading rewards…" : "Rewards unavailable. Open this tab again to retry.")}</p>}
    <dl className="career-instruments">
      <div><dt>{t("Career Score")}</dt><dd>{number(scores?.careerScore)}</dd></div>
      <div><dt>{t("Best Run")}</dt><dd>{number(scores?.bestRun.score ?? localBest)}</dd><small>{t("Run level")}: {number(scores?.bestRun.level)}</small></div>
      <div><dt>{t("Sector")}</dt><dd>{number(records?.highestSector)}</dd></div>
      <div><dt>{t("Destroyed")}</dt><dd>{number(records?.totalDestroyed)}</dd></div>
    </dl>
    {progress && rank && <div className="career-next">
      {next ? <><ServiceBadge name={next.name} size="medium"/><div><h4>{t("Next service rank")}: {t(next.name)}</h4><p>{t("{count} career stages to go", { count: next.level - progress.highestLevel })} · {t("Career stage")} {next.level}</p><progress value={percent} max={100} aria-label={t("Next service rank")}/><small>{t("Career stage")} {rank.level} → {next.level}</small></div></> : <p>{t("Highest service rank reached")}</p>}
    </div>}
    {progress && <div className="career-achievements"><h4>{t("Your achievements")}</h4><p>{t("Boss stickers")}: {number(Object.keys(progress.bossWins).length)} · {t("Bonus medals")}: {number(Object.keys(progress.bonusMedals).length)} · {t("Perfect bonus rounds")}: {number(progress.perfectBonuses)}</p><h4>{t("Chain milestones")}</h4><div className="career-milestones">{CHAIN_MILESTONES.map(count => <span key={count} className={progress.completedChains.length >= count ? "earned" : ""}>{progress.completedChains.length >= count ? "✓ " : ""}{count} {t("Chains")}</span>)}</div><p>{number(progress.completedChains.length)} / 50 {t("Chains")}</p></div>}
    {accountId && <details className="career-account"><summary>{t("Account details")}</summary><p>{t("Pi account ID:")} <code>{accountId}</code></p></details>}
  </section>;
}
