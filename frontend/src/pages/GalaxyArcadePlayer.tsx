import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '../i18n';
import { readControlHand } from './controlPreferences';
import { isPublicArcadeLevel } from './galaxyArcadeRecords';
import './galaxyArcadePlayer.css';

const startupLimit = 24000;

function ArcadeFrame({ source, leave }: { source: string | null; leave: (hash?: string) => void }) {
  const { t } = useLocale();
  const frame = useRef<HTMLIFrameElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(source ? 'loading' : 'error');

  useLayoutEffect(() => {
    if (!source) return;
    const timeout = window.setTimeout(() => setStatus('error'), startupLimit);
    const onMessage = (event: MessageEvent) => {
      // The sandbox gives the arcade an opaque origin. Only its own window can report a result.
      if (event.origin !== 'null' || event.source !== frame.current?.contentWindow) return;
      const message = event.data;
      if (message?.type === 'cryptoid:arcade-ready') {
        window.clearTimeout(timeout);
        setStatus('ready');
      } else if (message?.type === 'cryptoid:arcade-error') {
        window.clearTimeout(timeout);
        setStatus('error');
      } else if (message?.type === 'cryptoid:arcade-exit') {
        const hash = message.hash;
        leave(typeof hash === 'string' && hash.startsWith('#') && hash.length <= 256 ? hash : '');
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
    };
  }, [attempt, leave, source]);

  return <main className="galaxy-arcade-player">
    {source && status !== 'error' && <iframe key={attempt} ref={frame} title={t('Mini-game')}
      src={source} sandbox="allow-scripts" referrerPolicy="no-referrer" aria-hidden={status !== 'ready'}/>}
    {status !== 'ready' && <section>
      <p role={status === 'error' ? 'alert' : 'status'}>{t(status === 'error' ? 'This page could not be loaded.' : 'Loading…')}</p>
      {source && status === 'error' && <button type="button" onClick={() => { setStatus('loading'); setAttempt(value => value + 1); }}>{t('Retry')}</button>}
      <button type="button" onClick={() => leave()}>{t('Galaxy map')}</button>
    </section>}
  </main>;
}

export default function GalaxyArcadePlayer() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const { level } = useParams();
  const leave = useCallback((hash = '') => {
    navigate({ pathname: '/galaxy', search: '?arcade-return=1', hash }, { replace: true });
  }, [navigate]);
  const fragment = new URLSearchParams(location.hash.slice(1));
  if (!fragment.has('hand')) fragment.set('hand', readControlHand());
  fragment.set('embed', '1');
  const stationLevel = Number(level);
  const source = isPublicArcadeLevel(stationLevel) && String(stationLevel) === level
    ? `/api/galaxy-minigames/${level}/play?lang=${encodeURIComponent(locale)}#${fragment}`
    : null;
  return <ArcadeFrame key={source ?? 'invalid'} source={source} leave={leave}/>;
}
