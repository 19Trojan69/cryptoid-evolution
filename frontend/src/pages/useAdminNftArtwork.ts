import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { axiosClient } from '../lib/axiosClient';

type ArtworkResult = { artwork: string; story?: string } | 'error' | 'denied';

export function useAdminNftArtwork(path: string) {
  const [result, setResult] = useState<ArtworkResult>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const request = new AbortController();
    void axiosClient.get<{ artwork: string; story?: string }>(path, { baseURL: '/api', signal: request.signal })
      .then(({ data }) => {
        if (request.signal.aborted) return;
        setResult(typeof data?.artwork === 'string' && data.artwork.startsWith('data:image/webp;base64,UklGR')
          ? data : 'error');
      })
      .catch(error => {
        if (request.signal.aborted) return;
        const status = isAxiosError(error) ? error.response?.status : undefined;
        setResult(status === 401 || status === 403 ? 'denied' : 'error');
      });
    return () => request.abort();
  }, [path, attempt]);

  return { result, retry: () => {
    setResult(undefined);
    setAttempt(value => value + 1);
  } };
}
