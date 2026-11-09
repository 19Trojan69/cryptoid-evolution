import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../i18n';
import { axiosClient } from '../lib/axiosClient';
import type { ArcadeLabels, ArcadeRecord, ArcadeStation } from './galaxyArcadeRecords';

type Rating = { count: number; average: number | null; own: number | null };
type Props = { game: ArcadeStation; labels: ArcadeLabels; record: ArcadeRecord | null; canRate: boolean };

export default function GalaxyArcadePanel({ game, labels, record, canRate }: Props) {
  const { locale, t } = useLocale();
  const [rating, setRating] = useState<Rating | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const request = useRef<AbortController | null>(null);
  const path = `/galaxy-minigames/${game.level}/rating`;

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    void axiosClient.get<Rating>(path, { baseURL: '/api', signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setRating(data); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [path, canRate]);

  const rate = async (stars: number) => {
    const signal = request.current?.signal;
    if (!signal || signal.aborted || pending || !rating || !canRate) return;
    setError(false);
    setPending(true);
    try {
      const { data } = await axiosClient.put<Rating>(path, { stars }, { baseURL: '/api', signal });
      if (!signal.aborted) setRating(data);
    } catch {
      if (!signal.aborted) setError(true);
    } finally {
      if (!signal.aborted) setPending(false);
    }
  };
  const medalNames = [t('Bronze'), t('Silver'), t('Gold')];
  const number = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 1 });

  return <div className="galaxy-arcade-panel">
    <p className="galaxy-arcade-description">{game.description}</p>
    <dl className="galaxy-arcade-record">
      <div><dt>{labels.lastScore}</dt><dd>{record ? number(record.last) : '—'}</dd></div>
      <div><dt>{labels.bestScore}</dt><dd>{record ? number(record.best) : '—'}</dd></div>
    </dl>
    <p className="galaxy-note">{record ? labels.localNote : labels.noScore}</p>
    <details><summary>{labels.scoring}</summary><p>{game.scoring}</p></details>
    <details><summary>{labels.medalGoals}</summary><p>{game.medalLabel}</p>
      <div className="galaxy-medals">{game.medalGoals.map((goal, index) => <span key={index} data-medal={index} data-earned={(record?.medal ?? 0) > index}>
        {medalNames[index]} {number(goal)}{(record?.medal ?? 0) > index ? ' ✓' : ''}
      </span>)}</div>
    </details>
    <section className="galaxy-arcade-rating" aria-label={labels.rating}>
      <strong>{labels.rating}</strong>
      <p role="status">{rating ? (rating.count && rating.average !== null
        ? `★ ${number(rating.average)} / 5 · ${labels.votes.replace('{count}', number(rating.count))}`
        : labels.noRating) : error ? labels.ratingError : t('Loading…')}</p>
      {canRate ? <div className="galaxy-rating-stars" role="group" aria-label={labels.ownRating}>
        {[1, 2, 3, 4, 5].map(stars => <button type="button" key={stars} disabled={pending || !rating}
          aria-label={labels.rate.replace('{count}', String(stars))} aria-pressed={rating?.own === stars}
          onClick={() => void rate(stars)}>{stars} <span aria-hidden="true">★</span></button>)}
      </div> : <p className="galaxy-note">{labels.signIn}</p>}
      {rating && error && <p role="alert">{labels.ratingError}</p>}
    </section>
  </div>;
}
