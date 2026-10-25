import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../i18n';
import { advanceSummaryVisibility, BOSS_SUMMARY_VISIBLE_MS, canContinueBossSummary, type BossSummary } from './bossSummaryTiming';
import './bossIntermission.css';

export default function BossIntermission({ summary, prepared, saving, failed, continuing, onRetry, onContinue }: {
  summary: BossSummary; prepared: boolean; saving: boolean; failed: boolean; continuing: boolean;
  onRetry: () => void; onContinue: () => void;
}) {
  const { t, locale } = useLocale();
  const [visibleMs, setVisibleMs] = useState(0);
  const last = useRef(0);
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  useEffect(() => {
    last.current = performance.now();
    const update = () => {
      const now = performance.now(), elapsed = now - last.current; last.current = now;
      setVisibleMs(value => advanceSummaryVisibility(value, elapsed, !document.hidden && prepared));
    };
    const visibility = () => { last.current = performance.now(); };
    const timer = window.setInterval(update, 250);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', visibility); };
  }, [prepared]);
  const ready = canContinueBossSummary(visibleMs, prepared, saving || continuing, failed);
  return <div className="game-overlay boss-summary-overlay">
    <section ref={dialog} tabIndex={-1} className="game-modal boss-summary-dialog" role="dialog" aria-modal="true" aria-labelledby="boss-summary-title"
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
        const first = buttons[0], lastButton = buttons.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); lastButton?.focus(); }
        else if (!event.shiftKey && (document.activeElement === lastButton || document.activeElement === event.currentTarget)) { event.preventDefault(); first.focus(); }
      }}>
      <p className="boss-summary-kicker">{t('BOSS DEFEATED')} · {Math.ceil(summary.stage / 10)}</p>
      <h1 id="boss-summary-title">{t('Battle statistics')}</h1>
      <dl className="boss-summary-stats">
        {[[t('Score'), summary.score], [t('Shards'), summary.shards], [t('Destroyed'), summary.destroyed],
          [t('Hearts'), summary.hearts], [t('Combos'), summary.combos]].map(([label, value]) =>
          <div key={label}><dt>{label}</dt><dd>{Number(value).toLocaleString(locale)}</dd></div>)}
      </dl>
      <p role={failed ? 'alert' : 'status'}>{failed ? t('Save not confirmed. Please retry.')
        : saving ? t('Saving progress…') : prepared ? t('Ready for the bonus round.') : t('Preparing the next round…')}</p>
      {failed && <button type="button" className="button" disabled={saving || continuing} onClick={onRetry}>{t('Retry save')}</button>}
      {visibleMs < BOSS_SUMMARY_VISIBLE_MS
        ? <p className="boss-summary-countdown">{t('Continue available in {seconds}s', { seconds: Math.ceil((BOSS_SUMMARY_VISIBLE_MS - visibleMs) / 1000) })}</p>
        : <button type="button" className="button button-primary" disabled={!ready} onClick={onContinue}>{t('Continue game')}</button>}
    </section>
  </div>;
}
