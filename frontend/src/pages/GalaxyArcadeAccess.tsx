import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocale } from '../i18n';
import { axiosClient } from '../lib/axiosClient';
import type { GalaxyMiniGame } from './galaxyData';

const arcadePath = '/admin/galaxy-minigames';
type AccessResponse = { stations?: GalaxyMiniGame[]; previewAccess?: boolean };
type AccessStatus = 'checking' | 'locked' | 'submitting' | 'invalid' | 'unavailable' | 'ready';

export default function GalaxyArcadeAccess({ onReady }: { onReady: (stations: GalaxyMiniGame[]) => void }) {
  const { t } = useLocale();
  const [status, setStatus] = useState<AccessStatus>('checking');
  const [code, setCode] = useState('');
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    void axiosClient.get<AccessResponse>(arcadePath, {
      baseURL: '/api', signal: controller.signal,
      validateStatus: result => [200, 401, 403, 410].includes(result),
    }).then(({ data }) => {
      if (controller.signal.aborted) return;
      if (Array.isArray(data?.stations)) {
        onReady(data.stations);
        setStatus('ready');
      } else {
        setStatus(data?.previewAccess === true ? 'locked' : 'unavailable');
      }
    }).catch(() => { if (!controller.signal.aborted) setStatus('unavailable'); });
    return () => controller.abort();
  }, [onReady]);

  const unlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const signal = request.current?.signal;
    if (!signal || signal.aborted || status === 'submitting' || !code.trim()) return;
    const normalized = code.replace(/[\s-]/g, '').toUpperCase();
    if (!/^[0-9A-F]{24}$/.test(normalized)) { setStatus('invalid'); return; }
    setStatus('submitting');
    try {
      const { data } = await axiosClient.post<AccessResponse>(`${arcadePath}/access`, null, {
        baseURL: '/api', signal,
        headers: { 'x-cryptoid-arcade-invitation': normalized },
        validateStatus: result => [200, 403, 404].includes(result),
      });
      if (signal.aborted) return;
      if (!Array.isArray(data?.stations)) { setStatus('invalid'); return; }
      setCode('');
      onReady(data.stations);
      setStatus('ready');
    } catch {
      if (!signal.aborted) setStatus('unavailable');
    }
  };

  if (status === 'ready') return null;
  if (status === 'checking') return <p className="galaxy-data-status" role="status">{t('Loading…')}</p>;
  if (status === 'unavailable') return <p className="galaxy-data-status" role="alert">{t('Private test access is unavailable.')}</p>;

  return <form className="galaxy-preview-access" onSubmit={unlock}>
    <label htmlFor="galaxy-preview-code">{t('Personal test code')}</label>
    <div>
      <input id="galaxy-preview-code" type="password" autoComplete="off" spellCheck={false} maxLength={48} required value={code} onChange={event => setCode(event.target.value)}/>
      <button type="submit" disabled={status === 'submitting'}>{t(status === 'submitting' ? 'Loading…' : 'Unlock mini-games')}</button>
    </div>
    {status === 'invalid' && <p role="alert">{t('The test code is invalid or expired.')}</p>}
  </form>;
}
