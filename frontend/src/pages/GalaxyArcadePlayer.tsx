import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '../i18n';
import { readControlHand } from './controlPreferences';
import { isPublicArcadeLevel } from './galaxyArcadeRecords';
import './galaxyArcadePlayer.css';

const downloadLimit = 15000;
const startupLimit = 14000;
type Status = { phase: 'fetching' }
  | { phase: 'starting' | 'booted' | 'ready'; html: string }
  | { phase: 'error'; code: 'AR-01' | 'AR-02' | 'AR-03' | 'AR-04' };

function ArcadeFrame({ source, launch, leave }: {
  source: string | null; launch: string; leave: (hash?: string) => void;
}) {
  const { t } = useLocale();
  const frame = useRef<HTMLIFrameElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>(source ? { phase: 'fetching' } : { phase: 'error', code: 'AR-01' });

  useEffect(() => {
    if (!source) return;
    const controller = new AbortController();
    let booted = false;
    let timeout = window.setTimeout(() => fail('AR-02'), downloadLimit);
    function fail(code: 'AR-02' | 'AR-03' | 'AR-04') {
      if (controller.signal.aborted) return;
      controller.abort();
      window.clearTimeout(timeout);
      setStatus({ phase: 'error', code });
    }
    const onMessage = (event: MessageEvent) => {
      // The sandbox gives the arcade an opaque origin. Only its own window can report a result.
      if (controller.signal.aborted || event.origin !== 'null' || event.source !== frame.current?.contentWindow) return;
      const message = event.data;
      if (message?.type === 'cryptoid:arcade-boot') {
        booted = true;
        setStatus(current => current.phase === 'starting' ? { ...current, phase: 'booted' } : current);
      } else if (message?.type === 'cryptoid:arcade-ready') {
        window.clearTimeout(timeout);
        setStatus(current => 'html' in current ? { ...current, phase: 'ready' } : current);
      } else if (message?.type === 'cryptoid:arcade-error') {
        fail('AR-04');
      } else if (message?.type === 'cryptoid:arcade-exit') {
        const hash = message.hash;
        leave(typeof hash === 'string' && hash.startsWith('#') && hash.length <= 256 ? hash : '');
      }
    };
    window.addEventListener('message', onMessage);
    void fetch(source, { credentials: 'omit', cache: 'no-store', redirect: 'error', signal: controller.signal })
      .then(response => {
        if (!response.ok || !response.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
          throw new Error('Arcade document unavailable');
        }
        return response.json();
      })
      .then(data => {
        if (controller.signal.aborted) return;
        const html = data?.document;
        if (typeof html !== 'string' || !html.startsWith('<!doctype html>') || !html.includes('<head>')) {
          throw new Error('Invalid arcade document');
        }
        // The frame starts locally with an explicit launch configuration, independent of URL fragments.
        const config = `<meta name="cryptoid-arcade-launch" content="${encodeURIComponent(launch)}">`;
        window.clearTimeout(timeout);
        timeout = window.setTimeout(() => fail(booted ? 'AR-04' : 'AR-03'), startupLimit);
        setStatus({ phase: 'starting', html: html.replace('<head>', () => '<head>' + config) });
      })
      .catch(() => fail('AR-02'));
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
    };
  }, [attempt, launch, leave, source]);

  const showFrame = status.phase === 'booted' || status.phase === 'ready';
  return <main className="galaxy-arcade-player">
    {'html' in status && <iframe key={attempt} ref={frame} title={t('Mini-game')}
      srcDoc={status.html} sandbox="allow-scripts" referrerPolicy="no-referrer" aria-hidden={!showFrame}/>}
    {!showFrame && <section>
      <p role={status.phase === 'error' ? 'alert' : 'status'}>{t(status.phase === 'error' ? 'This page could not be loaded.' : 'Loading…')}
        {status.phase === 'error' && <small> · {status.code}</small>}
      </p>
      {source && status.phase === 'error' && <button type="button" onClick={() => { setStatus({ phase: 'fetching' }); setAttempt(value => value + 1); }}>{t('Retry')}</button>}
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
  const requested = new URLSearchParams(location.hash.slice(1));
  const hand = requested.get('hand');
  const fragment = new URLSearchParams({
    hand: hand === 'left' || hand === 'right' ? hand : readControlHand(),
    embed: '1',
    'parent-origin': window.location.origin,
  });
  const run = requested.get('arcade-run');
  if (run && /^[a-f0-9-]{36}$/.test(run)) fragment.set('arcade-run', run);
  const stationLevel = Number(level);
  const source = isPublicArcadeLevel(stationLevel) && String(stationLevel) === level
    ? `/api/galaxy-minigames/${level}/document?lang=${encodeURIComponent(locale)}`
    : null;
  const launch = fragment.toString();
  return <ArcadeFrame key={`${source}#${launch}`} source={source} launch={launch} leave={leave}/>;
}
