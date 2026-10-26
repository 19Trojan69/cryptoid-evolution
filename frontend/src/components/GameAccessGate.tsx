import { useLocale } from '../i18n';
import LaunchShip from './LaunchShip';
import LoadingStripes from './LoadingStripes';

export default function GameAccessGate({ pending, error, onRetry }: {
  pending: boolean; error: string | null; onRetry: () => void;
}) {
  const { t } = useLocale();
  return <div className="game-overlay game-access-overlay">
    <section className="game-modal game-access-modal" aria-labelledby="game-access-title">
      <p className="eyebrow">CRYPTOID EVOLUTION</p>
      <LaunchShip />
      <h1 id="game-access-title">{t('SECURE ACCESS')}</h1>
      <p role={pending ? 'status' : 'alert'}>{t(pending ? 'Signing in…' : error ?? 'Try again')}</p>
      {pending ? <LoadingStripes />
        : <div className="modal-actions">
          <button type="button" className="button button-primary" onClick={onRetry}>{t('Sign in with Pi')} <span aria-hidden="true">↗</span></button>
          <a className="button button-secondary" href="/">{t('Home')}</a>
        </div>}
    </section>
  </div>;
}
