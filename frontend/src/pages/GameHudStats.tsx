import { memo, useMemo } from "react";
import { translate, type Locale } from "../i18n";
import { formatLives } from "../locales/quantities";
import { BLOCKS_PER_CHAIN } from "./networkChain";

type Props = {
  hearts: number;
  heartsHit: boolean;
  levelLabel: string;
  shards: number;
  score: number;
  block: number;
  bossNumber?: number;
  locale: Locale;
};

// Scene motion does not change these cells. Keep their existing host elements
// mounted, including the heart-impact animation, until their own data changes.
export default memo(function GameHudStats({ hearts, heartsHit, levelLabel, shards, score, block, bossNumber, locale }: Props) {
  const compactNumber = useMemo(
    () => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }),
    [locale]
  );
  const hudNumber = (value: number) => (value < 1_000_000 ? String(value) : compactNumber.format(value));
  const t = (source: string) => translate(locale, source);
  const isBoss = bossNumber !== undefined;
  const roundLabel = t(isBoss ? "Boss" : "Block");
  return (
    <>
      <div className={`hud-stat hearts-stat${heartsHit ? " hearts-stat-hit" : ""}`}>
        <span className="hud-heart-label" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.2 3.4 13.1C-1.1 8.8 5.3 1.7 10.2 5.9L12 7.5l1.8-1.6c4.9-4.2 11.3 2.9 6.8 7.2L12 21.2Z" />
          </svg>
        </span>
        <strong className="hearts" role="status" aria-live="polite" aria-label={formatLives(locale, hearts)}>
          /{hearts}
        </strong>
      </div>
      <div className="hud-stat game-level-hud" aria-label={`${t("Game level")} ${levelLabel}`}>
        <span>{t("Level")}</span>
        <strong>{levelLabel}</strong>
      </div>
      <div className="hud-stat score-hud" aria-label={`${t("Shards")} ${shards}, ${t("Score")} ${score}`}>
        <span className="shard-line">
          <b title={String(shards)}>◆ {hudNumber(shards)}</b>
          <small>{t("Shards")}</small>
        </span>
        <span className="score-line">
          <b title={String(score)}>{hudNumber(score)}</b>
          <small>{t("Score")}</small>
        </span>
      </div>
      <div className="hud-stat round-hud chain-hud" aria-label={`${roundLabel} ${bossNumber ?? block}${isBoss ? "" : `/${BLOCKS_PER_CHAIN}`}`}>
        <span>{roundLabel}</span>
        <strong>
          {bossNumber ?? block}
          {isBoss ? null : <small>/{BLOCKS_PER_CHAIN}</small>}
        </strong>
      </div>
    </>
  );
});
