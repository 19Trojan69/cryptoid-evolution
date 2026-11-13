import { useEffect, useRef, type ReactNode } from 'react';
import { useLocale } from '../i18n';
import BlockchainProgress from './BlockchainProgress';
import { canContinueLevelCompletion, type BossSummary } from './bossSummaryTiming';
import { BLOCKS_PER_CHAIN } from './networkChain';
import { BONUS_TARGET_COUNT } from './bonusChallenge';

export default function LevelCompletion({ summary, name, headline, bonusHits, bonus, bonusHeart,
  chainShards, saveDestination, deviceSaved, prepared, saving, failed, continuing, failureMessage, onRetry, onContinue }: {
  summary: BossSummary; name: string; headline: ReactNode; bonusHits: number; bonusHeart: boolean;
  chainShards: number; bonus: { shards: number; points: number; powerUps: readonly string[] };
  saveDestination: 'account' | 'device' | 'test'; deviceSaved: boolean;
  prepared: boolean; saving: boolean; failed: boolean; continuing: boolean; failureMessage?: string; onRetry: () => void; onContinue: () => void;
}) {
  const { t, locale } = useLocale();
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.focus({ preventScroll: true });
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  const ready = canContinueLevelCompletion(prepared, saving || continuing, failed);
  const number = new Intl.NumberFormat(locale).format;
  const saveConfirmed = prepared && !saving;
  const saveWarning = failed || saveConfirmed && saveDestination === 'device' && !deviceSaved;
  const saveStatus = saveDestination === 'account' ? t('Game saved.') : saveDestination === 'test' ? t('Test run · rewards are not saved.')
    : deviceSaved ? t('Shards saved on this device.') : t('Shards could not be saved on this device.');
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
      <header><p className="level-completion-name">{name}</p><h1 id="level-completion-title">{headline}</h1></header>
      <div className="level-completion-rewards">
        <p className="completion-bonus-targets">{t('BONUS TARGETS')} <strong>{number(bonusHits)} / {number(BONUS_TARGET_COUNT)}</strong></p>
        <dl className="completion-bonus-amounts">
          <div><dt>{t('Bonus Shards')}</dt><dd>+{number(bonus.shards)}</dd></div>
          <div><dt>{t('Bonus points')}</dt><dd>+{number(bonus.points)}</dd></div>
        </dl>
        <div className="completion-bonus-extras">
          {chainShards > 0 && <span>+{number(chainShards)} {t('Chain Shards')}</span>}
          {bonusHeart && <span>+1 ♥ · {t('HEART RESTORED')}</span>}
          {bonus.powerUps.length > 0 && <span>{t('SHIELD')}</span>}
        </div>
      </div>
      <p className="level-completion-chain">{t('Block')} {BLOCKS_PER_CHAIN}/{BLOCKS_PER_CHAIN} · {t('CHAIN COMPLETE')}</p>
      <BlockchainProgress blocks={BLOCKS_PER_CHAIN} saved />
      <h2>{t('Battle statistics')}</h2>
      <dl className="level-completion-stats" aria-label={t('Your mission')}>
        {[[t('Score'), summary.score], [t('Shards'), summary.shards], [t('Destroyed'), summary.destroyed], [t('Hearts'), summary.hearts], [t('Combos'), summary.combos]].map(([label,value]) =>
          <div key={label}><dt>{label}</dt><dd>{Number(value).toLocaleString(locale)}</dd></div>)}
      </dl>
      <footer>
        <p className="level-completion-status" data-status={saveWarning ? 'warning' : saveConfirmed ? 'ready' : 'pending'}
          role={saveWarning ? 'alert' : 'status'}>{failed ? t(failureMessage || 'Save not confirmed. Please retry.') : saveConfirmed ? saveStatus : t('Saving progress…')}</p>
        {failed && <button className="button button-secondary" type="button" disabled={saving || continuing} onClick={onRetry}>{t('Retry save')}</button>}
        <button className="button button-primary" type="button" disabled={!ready} onClick={onContinue}>
          {t('Continue game')}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M4 12h15m-6-6 6 6-6 6" />
          </svg>
        </button>
      </footer>
    </section>
  </div>;
}
