import { useState } from 'react';
import { useLocale } from '../i18n';
import { arcadeRankIds, type ArcadeStickerBackup } from '../../../backend/src/galaxyArcadeStickerSchema.ts';
import { allPlayerColors, playerSkins } from './shipFleet';
import { shipEvolutionAsset } from './shipEvolution';
import { staticHullAsset } from './staticHullAssets';
import ShipPortrait from './ShipPortrait';

const shipStages = ['Standard', 'Advanced', 'Elite'] as const;

type Props = {
  sticker: ArcadeStickerBackup;
  title: string;
  image: string;
  rankLabel: string;
};

export default function RetroNftCardPreview({ sticker, title, image, rankLabel }: Props) {
  const { t } = useLocale();
  const [sceneFailed, setSceneFailed] = useState(false);
  const [hullFailed, setHullFailed] = useState(false);
  const model = playerSkins.find(skin => skin.id === sticker.modelId);
  const paint = allPlayerColors.find(color => color.id === sticker.colorId);
  if (!model || !paint) return <p role="status">{t('Preview unavailable')}</p>;

  const stage = t(shipStages[sticker.stage - 1]);
  const shipLabel = `${model.name} · ${stage} · ${t(paint.name)}`;
  const hull = staticHullAsset(model.sprite, paint.id, sticker.stage);

  return <figure className="galaxy-retro-nft" data-arcade-rank={sticker.rank}>
    <div className="galaxy-retro-nft-card">
      {sceneFailed ? <p className="galaxy-retro-nft-error" role="status">{t('Preview unavailable')}</p>
        : <img className="galaxy-retro-nft-scene" src={image} alt="" width={545} height={925}
          decoding="async" onError={() => setSceneFailed(true)}/>}
      <strong className="galaxy-retro-nft-title" lang="en">{title}</strong>
      <div className="galaxy-retro-nft-hull">
        {hull && !hullFailed ? <img src={hull.url} alt={shipLabel} decoding="async" onError={() => setHullFailed(true)}/>
          : <ShipPortrait src={shipEvolutionAsset(model.sprite, sticker.stage, paint.id)} color={paint.id}
            name={shipLabel} loadingLabel={t('Loading ship…')} errorLabel={t('Preview unavailable')}/>}
      </div>
      <strong className="galaxy-retro-nft-rank" lang="en" aria-label={rankLabel}>{arcadeRankIds[sticker.rank - 1]}</strong>
    </div>
    <figcaption>{shipLabel}</figcaption>
  </figure>;
}
