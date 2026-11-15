import { useEffect, useState } from 'react';
import { premiumBossCard } from '../../../backend/src/premiumBossNft';
import { shipLiveryAssetPath } from '../../../backend/src/shipLivery';
import { useLocale } from '../i18n';
import { axiosClient } from '../lib/axiosClient';
import { bossNftPreviewCopy } from '../locales/bossNftPreview';
import { bossManifest } from './bossManifest';
import { bossName } from './bossNames';
import { playerSkins, shipFactoryPaint } from './shipFleet';
import platinumEmblem from './assets/boss-platinum-emblem.webp';
import diamondEmblem from './assets/boss-diamond-emblem.webp';
import './premiumBossNftPreview.css';

type Card = NonNullable<ReturnType<typeof premiumBossCard>>;
type Preview = { wins: number; eligible: boolean } & (
  { design: 'layout' | 'silhouette' } | { design: 'illustration'; artwork: string }
);

const fallbackBackgrounds = ['ringed-world', 'blue-nebula', 'amber-galaxy'];

function BattleLayout({ card, concealed }: { card: Card; concealed: boolean }) {
  const name = bossName(card.bossId);
  const boss = bossManifest[card.bossId - 1];
  const ship = playerSkins.find(skin => skin.id === card.shipId);
  if (!boss || !ship) return null;
  const background = card.bossId > 3
    ? `/cards/space/unique/boss-${String(card.bossId).padStart(2, '0')}.webp`
    : `/cards/space/${fallbackBackgrounds[card.bossId - 1]}.png`;
  const fighter = '/' + shipLiveryAssetPath(ship.sprite, card.stage, shipFactoryPaint(ship.id).id);
  return <div className="premium-battle-card" data-edition={card.edition} data-concealed={concealed} data-angle={card.battleIndex % 4} lang="en"
    style={concealed ? undefined : { backgroundImage: `linear-gradient(#050810 3%, transparent 50%, #040610b0 100%), url(${background})` }}>
    <div className="premium-battle-title">
      <div>CRYPTOID EVOLUTION</div>
      <div>{card.name}</div>
      <div className="premium-battle-name"><strong>{name}</strong>
        <img decoding="async" src={card.edition === 'diamond' ? diamondEmblem : platinumEmblem} alt="" />
      </div>
      <p>{card.story}</p>
    </div>
    <div className="premium-battle-stage">
      <img className="premium-battle-boss" src={boss.image} alt={name} decoding="async" />
      <div className="premium-battle-beam" aria-hidden="true" />
      <img className="premium-battle-ship" src={fighter} alt={ship.name} decoding="async" />
    </div>
  </div>;
}

export default function PremiumBossNftPreview({ card }: { card: Card }) {
  const { t, locale } = useLocale();
  const { bossId, edition } = card;
  const [preview, setPreview] = useState<Preview | 'error'>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const request = new AbortController();
    void axiosClient.get<Preview>(`/admin/nft-collection/bosses/${bossId}/${edition}`, {
      baseURL: '/api', signal: request.signal,
    }).then(({ data }) => {
      if (request.signal.aborted) return;
      const valid = Number.isInteger(data?.wins) && typeof data.eligible === 'boolean' && (
        data.design === 'layout' || data.design === 'silhouette' || (data.design === 'illustration' && typeof data.artwork === 'string' && data.artwork.startsWith('data:image/webp;base64,UklGR'))
      );
      setPreview(valid ? data : 'error');
    }).catch(() => { if (!request.signal.aborted) setPreview('error'); });
    return () => request.abort();
  }, [bossId, edition, attempt]);

  if (!preview) return <p role="status">{t('Loading…')}</p>;
  if (preview === 'error') return <div className="boss-nft-state" role="alert">
    <p>{t('Preview unavailable')}</p>
    <button type="button" onClick={() => { setPreview(undefined); setAttempt(attempt + 1); }}>{t('Try again')}</button>
  </div>;

  const winCount = Math.min(preview.wins, card.requiredWins);
  const ship = playerSkins.find(skin => skin.id === card.shipId);
  return <>
    <dl className="admin-nft-terms">
      <div><dt>{t('Confirmed boss wins')}</dt><dd>{winCount} / {card.requiredWins}</dd></div>
      <div><dt>{t('NFT purchase')}</dt><dd>{preview.eligible ? t('Win requirement met') : t('Locked')}</dd></div>
    </dl>
    <figure className="admin-nft-art premium-battle-preview">
      {preview.design === 'illustration'
        ? <img src={preview.artwork} alt={`${bossName(bossId)} · ${card.name}`} width={1086} height={1448} decoding="async" />
        : <>{preview.design === 'layout' && <p className="premium-battle-draft">{t('Artwork in progress')}</p>}<BattleLayout card={card} concealed={preview.design === 'silhouette'} /></>}
      <figcaption>
        <strong lang="en">{card.battle}</strong> · {ship?.name} {t(edition === 'diamond' ? 'Elite' : 'Advanced')}
        <br /><span>{bossNftPreviewCopy(locale).preview}</span>
      </figcaption>
    </figure>
  </>;
}
