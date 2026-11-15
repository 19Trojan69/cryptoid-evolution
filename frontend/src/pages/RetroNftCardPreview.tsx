import { useState } from 'react';
import { useLocale } from '../i18n';
import type { ArcadeStickerBackup } from '../../../backend/src/galaxyArcadeStickerSchema.ts';
import type { retroNftPreviewFor } from './retroNftPreviews';
import { allPlayerColors, playerSkins } from './shipFleet';
import { shipEvolutionAsset } from './shipEvolution';
import { staticHullAsset } from './staticHullAssets';
import ShipPortrait from './ShipPortrait';
import { useAdminNftArtwork } from './useAdminNftArtwork';
import './retroNftCard.css';

const shipStages = ['Standard', 'Advanced', 'Elite'] as const;

type Props = {
  sticker: ArcadeStickerBackup;
  preview: NonNullable<ReturnType<typeof retroNftPreviewFor>>;
  rankLabel: string;
};

export default function RetroNftCardPreview({ sticker, preview, rankLabel }: Props) {
  const { t } = useLocale();
  const { result, retry } = useAdminNftArtwork(preview.artworkPath);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [failedHullUrl, setFailedHullUrl] = useState<string>();
  const model = playerSkins.find(skin => skin.id === sticker.modelId);
  const paint = allPlayerColors.find(color => color.id === sticker.colorId);
  if (!model || !paint || result === 'denied' || sceneFailed)
    return <p role="status">{t('Preview unavailable')}</p>;
  if (result === 'error') return <div>
    <p role="alert">{t('Preview unavailable')}</p>
    <button className="galaxy-retro-nft-back" type="button" onClick={retry}>{t('Try again')}</button>
  </div>;
  if (!result) return <p role="status">{t('Loading…')}</p>;

  const stage = t(shipStages[sticker.stage - 1]);
  const shipLabel = `${model.name} · ${stage} · ${t(paint.name)}`;
  const hull = staticHullAsset(model.sprite, paint.id, sticker.stage);

  return <figure className="galaxy-retro-nft" data-arcade-rank={sticker.rank} data-nft-rank={preview.rankId}>
    <div className="galaxy-retro-nft-card">
      <img className="galaxy-retro-nft-scene" src={result.artwork} alt="" width={545} height={925}
        decoding="async" onError={() => setSceneFailed(true)}/>
      <strong className="galaxy-retro-nft-title" lang="en">{preview.title}</strong>
      <div className="galaxy-retro-nft-hull">
        {hull && hull.url !== failedHullUrl ? <img src={hull.url} alt={shipLabel} decoding="async" onError={() => setFailedHullUrl(hull.url)}/>
          : <ShipPortrait src={shipEvolutionAsset(model.sprite, sticker.stage, paint.id)} color={paint.id}
            name={shipLabel} loadingLabel={t('Loading ship…')} errorLabel={t('Preview unavailable')}/>}
      </div>
      <strong className="galaxy-retro-nft-rank" lang="en" aria-label={rankLabel}>{preview.rankId}</strong>
    </div>
    <figcaption>{shipLabel}</figcaption>
  </figure>;
}
