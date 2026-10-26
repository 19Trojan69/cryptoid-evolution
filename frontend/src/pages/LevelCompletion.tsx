import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocale } from '../i18n';
import BlockchainProgress from './BlockchainProgress';
import { advanceSummaryVisibility, BOSS_SUMMARY_VISIBLE_MS, canContinueBossSummary, type BossSummary } from './bossSummaryTiming';
import { BLOCKS_PER_CHAIN } from './networkChain';

export default function LevelCompletion({ summary, name, headline, bonusHits, bonusResult, bonusPoints, bonusHeart,
  prepared, saving, failed, continuing, onRetry, onContinue }: {
  summary: BossSummary; name: string; headline: ReactNode; bonusHits: number; bonusResult: string; bonusPoints: number; bonusHeart: boolean;
  prepared: boolean; saving: boolean; failed: boolean; continuing: boolean; onRetry: () => void; onContinue: () => void;
}) {
  const { t, locale } = useLocale();
  const [visibleMs, setVisibleMs] = useState(0);
  const last = useRef(0), panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.focus({ preventScroll: true });
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    last.current = performance.now();
    const update = () => {
      const now = performance.now(), elapsed = now - last.current; last.current = now;
      setVisibleMs(value => advanceSummaryVisibility(value, elapsed, !document.hidden && prepared));
    };
    const visible = () => { last.current = performance.now(); };
    const timer = window.setInterval(update, 250);
    document.addEventListener('visibilitychange', visible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [prepared]);
  const ready = canContinueBossSummary(visibleMs, prepared, saving || continuing, failed);
  return <div className="game-overlay level-completion-overlay">
    <section ref={panel} className="level-completion" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="level-completion-title" data-game-scroll
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
        const first = buttons[0], final = buttons.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); final?.focus(); }
        else if (!event.shiftKey && (document.activeElement === final || document.activeElement === event.currentTarget)) { event.preventDefault(); first.focus(); }
      }}>
      <header><p className="level-completion-name">{name}</p><h1 id="level-completion-title">{headline}</h1>
        <p className="level-completion-chain">{t('Block')} {BLOCKS_PER_CHAIN}/{BLOCKS_PER_CHAIN} · {t('CHAIN SAVED')}</p></header>
      <BlockchainProgress blocks={BLOCKS_PER_CHAIN} saved />
      <div className="level-completion-rewards">
        <p>{bonusHits}/12 {t('BONUS TARGETS')} · {bonusResult}{bonusPoints > 0 ? ` · +${bonusPoints.toLocaleString(locale)} ${t('Score')}` : ''}</p>
        {bonusHeart && <strong className="level-completion-heart">+1 ♥ · {t('HEART RESTORED')}</strong>}
      </div>
      <h2>{t('Battle statistics')}</h2>
      <dl className="level-completion-stats" aria-label={t('Your mission')}>
        {[[t('Score'), summary.score], [t('Shards'), summary.shards], [t('Destroyed'), summary.destroyed], [t('Hearts'), summary.hearts], [t('Combos'), summary.combos]].map(([label,value]) =>
          <div key={label}><dt>{label}</dt><dd>{Number(value).toLocaleString(locale)}</dd></div>)}
      </dl>
      <footer>
        <p className="level-completion-status" role={failed ? 'alert' : 'status'}>{failed ? t('Save not confirmed. Please retry.') : saving ? t('Saving progress…')
          : visibleMs < BOSS_SUMMARY_VISIBLE_MS ? t('Continue available in {seconds}s', { seconds: Math.ceil((BOSS_SUMMARY_VISIBLE_MS - visibleMs) / 1000) }) : t('Game saved.')}</p>
        {failed && <button className="button button-secondary" type="button" disabled={saving || continuing} onClick={onRetry}>{t('Retry save')}</button>}
        <button className="button button-primary" type="button" disabled={!ready} onClick={onContinue}>{t('Continue game')} <span aria-hidden="true">▶</span></button>
      </footer>
    </section>
  </div>;
}
