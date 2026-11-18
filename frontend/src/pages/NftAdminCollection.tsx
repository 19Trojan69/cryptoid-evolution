import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { retroNftTerms as retroTerms } from '../../../backend/src/nftCollectionTerms.ts';
import { arcadeRankIds, arcadeStickerAlbumName } from '../../../backend/src/galaxyArcadeStickerSchema.ts';
import { arcadeLocale } from '../../../backend/src/galaxyArcadeCopy';
import { arcadeStickerLabels } from '../../../backend/src/galaxyArcadeStickerCopy';
import { retroNftScenes } from '../../../backend/src/retroNftScenes.ts';
import { BOSS_STICKER_COUNT } from '../../../backend/src/rewardRules';
import { shipNftMaxSupply } from '../../../backend/src/shipNftCatalog';
import { isPremiumBossEdition, premiumBossCard, premiumBossEditions } from '../../../backend/src/premiumBossNft';
import { hangarCatalog } from '../../../backend/src/hangarCatalog';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../i18n';
import { nftGalleryCopy } from '../locales/bossNftGallery';
import { bossName } from './bossNames';
import { bossNftEditions } from './bossNftEditions';
import { retroNftPreviewCount, retroNftPreviewFor } from './retroNftPreviews';
import PremiumBossNftPreview from './PremiumBossNftPreview';
import RetroNftCardPreview from './RetroNftCardPreview';
import { retroMiniGamesName } from './galaxyArcadeRecords';
import { allPlayerColors, playerSkins, shipFactoryPaint, shipPaintAvailable, shipSaveNetwork } from './shipFleet';
import type { ShipStage } from './shipEvolution';
import { useAdminNftArtwork } from './useAdminNftArtwork';
import { NftMusicButton, NftMusicProvider } from './NftMusic';
import './bossNftGallery.css';
import './adminNftCollection.css';

const sections = ['bosses', 'ships', 'retro'] as const;
const stages = ['Standard', 'Advanced', 'Elite'] as const;
const bossEditions = { ...bossNftEditions, ...premiumBossEditions };
const bossEditionKeys = Object.keys(bossEditions) as Array<keyof typeof bossEditions>;
const bossIds = Array.from({ length: BOSS_STICKER_COUNT }, (_, i) => i + 1);
const stationLevels = Object.keys(retroNftScenes).map(Number);
function NftTerms({ supply, price, currency }: { supply: number; price?: number; currency: 'Pi' | 'Shards' }) {
  const { locale, t } = useLocale();
  const priceFormat = currency === 'Pi' ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : undefined;
  return <dl className="admin-nft-terms">
    <div><dt>{t('Edition size')}</dt><dd>{supply.toLocaleString(locale)}</dd></div>
    {price !== undefined && <div><dt>{t('Planned price')}</dt><dd>{price === 0 ? t('Free') : `${price.toLocaleString(locale, priceFormat)} ${currency}`}</dd></div>}
  </dl>;
}

function StoredArtwork({ path, title }: { path: string; title: string }) {
  const { locale, t } = useLocale();
  const { result, retry } = useAdminNftArtwork(path);
  const copy = nftGalleryCopy(locale);
  if (result === 'denied') return <p className="boss-nft-state" role="alert">{t('Preview unavailable')}</p>;
  if (result === 'error') return <div className="boss-nft-state" role="alert">
    <p>{copy.error}</p><button type="button" onClick={retry}>{t('Try again')}</button>
  </div>;
  if (!result) return <p className="boss-nft-state" role="status">{copy.loading}</p>;
  return <figure className="admin-nft-art">
    <img src={result.artwork} alt={title} width={540} height={720} decoding="async" />
    {result.story && <figcaption lang="en">{result.story}</figcaption>}
  </figure>;
}

function BossCollection() {
  const { t, locale } = useLocale();
  const [id, setId] = useState(1);
  const [edition, setEdition] = useState<keyof typeof bossEditions>('victory');
  const plan = bossEditions[edition];
  const premium = isPremiumBossEdition(edition) ? premiumBossCard(id, edition) : undefined;
  const path = `/admin/nft-collection/bosses/${id}/${edition}`;
  return <>
    <section className="admin-nft-notice">
      <strong>{t('Coming to Mainnet')}</strong>
      <ul className="premium-edition-notice">
        {Object.values(premiumBossEditions).map(edition => <li key={edition.name}>
          <strong lang="en">{edition.name}</strong> · {edition.pricePi.toLocaleString(locale)} <span>Pi</span> · {t('{count} copies per boss', {
            count: edition.supply.toLocaleString(locale),
          })}
          <p>{t('{count} confirmed wins against the same boss on its level unlock its card for purchase.', {
            count: edition.requiredWins.toLocaleString(locale),
          })}</p>
        </li>)}
      </ul>
    </section>
    <div className="admin-nft-filters">
      <label>{t('Boss')}<select value={id} onChange={event => setId(Number(event.currentTarget.value))}>
        {bossIds.map(boss => <option key={boss} value={boss}>{boss.toLocaleString(locale)} · {bossName(boss)}</option>)}
      </select></label>
      <label>{t('Edition')}<select value={edition} onChange={event => {
        const selected = bossEditionKeys.find(key => key === event.currentTarget.value);
        if (selected) setEdition(selected);
      }}>
        {bossEditionKeys.map(key => <option key={key} value={key}>{bossEditions[key].name}</option>)}
      </select></label>
    </div>
    <NftTerms supply={plan.supply} price={'pricePi' in plan ? plan.pricePi : 0} currency="Pi"/>
    {premium ? <PremiumBossNftPreview key={path} card={premium}/>
      : <StoredArtwork path={path} key={path} title={`${bossName(id)} · ${plan.name}`}/>}
  </>;
}

function ShipCollection() {
  const { t } = useLocale();
  const [shipId, setShipId] = useState<(typeof playerSkins)[number]['id']>('grey-scout');
  const [stage, setStage] = useState<ShipStage>(1);
  const ship = playerSkins.find(skin => skin.id === shipId) ?? playerSkins[0];
  const edition = stages[stage - 1];
  const upgrade = hangarCatalog.find(offer => offer.kind === 'ship_upgrade' && offer.shipIndex === ship.sprite && offer.stage === stage);
  const path = `/admin/nft-collection/ships/${ship.id}/${edition.toLowerCase()}`;
  return <>
    <div className="admin-nft-filters">
      <label>{t('Ship')}<select value={ship.id} onChange={event => {
        const next = playerSkins.find(skin => skin.id === event.currentTarget.value);
        if (next) setShipId(next.id);
      }}>{playerSkins.map(skin => <option key={skin.id} value={skin.id}>{skin.name}</option>)}</select></label>
      <label>{t('Edition')}<select value={stage} onChange={event => setStage(Number(event.currentTarget.value) as ShipStage)}>
        {stages.map((name, index) => <option key={name} value={index + 1}>{t(name)}</option>)}
      </select></label>
    </div>
    <NftTerms supply={shipNftMaxSupply[edition]} price={stage === 1 ? ship.price : upgrade?.pricePi} currency={stage === 1 ? 'Shards' : 'Pi'}/>
    <p>{t(stage === 1 ? 'Grey Scout is free. Other Standard ships cost Shards. The NFT is included.'
      : stage === 2 ? 'NFT included with the ship upgrade.' : 'NFT included with the ship upgrade. Requires Advanced.')}</p>
    <StoredArtwork path={path} key={path} title={`${ship.name} · ${edition}`}/>
  </>;
}

function RetroCollection({ uid }: { uid: string }) {
  const { t, locale } = useLocale();
  const [level, setLevel] = useState(5);
  const [rank, setRank] = useState(1);
  const [stage, setStage] = useState<ShipStage>(1);
  const [shipId, setShipId] = useState<(typeof playerSkins)[number]['id']>('grey-scout');
  const [paintId, setPaintId] = useState<string>();
  const labels = arcadeStickerLabels(arcadeLocale(locale));
  const paints = allPlayerColors.filter(color => shipPaintAvailable(shipId, color.id));
  const colorId = paints.find(color => color.id === paintId)?.id ?? shipFactoryPaint(shipId).id;
  const preview = retroNftPreviewFor({ level, rank });
  return <>
    <Link className="boss-nft-home" to="/galaxy?album=retro" state={{ fromNfts: true, owner: uid }}>{arcadeStickerAlbumName} <span aria-hidden="true">›</span></Link>
    <div className="admin-nft-filters">
      <label>{retroMiniGamesName}<select value={level} onChange={event => setLevel(Number(event.currentTarget.value))}>
        {stationLevels.map(station => <option key={station} value={station}>{station.toLocaleString(locale)} · {retroNftScenes[station]?.title}</option>)}
      </select></label>
      <label>{t('Rank')}<select value={rank} onChange={event => setRank(Number(event.currentTarget.value))}>
        {labels.ranks.map((name, index) => <option key={arcadeRankIds[index]} value={index + 1}>{name}</option>)}
      </select></label>
    </div>
    <fieldset className="admin-nft-filters admin-nft-test-selection">
      <legend>{t('Test selection')}</legend>
      <label>{t('Ship')}<select value={shipId} onChange={event => {
        const next = playerSkins.find(skin => skin.id === event.currentTarget.value);
        if (next) { setShipId(next.id); setPaintId(undefined); }
      }}>{playerSkins.map(skin => <option key={skin.id} value={skin.id}>{skin.name}</option>)}</select></label>
      <label>{t('Ship stage')}<select value={stage} onChange={event => setStage(Number(event.currentTarget.value) as ShipStage)}>
        {stages.map((name, index) => <option key={name} value={index + 1}>{t(name)}</option>)}
      </select></label>
      <label>{t('Paint')}<select value={colorId} onChange={event => setPaintId(event.currentTarget.value)}>
        {paints.map(color => <option key={color.id} value={color.id}>{t(color.name)}</option>)}
      </select></label>
    </fieldset>
    {preview && <>
      <NftTerms supply={retroTerms[preview.rankId].supply} price={retroTerms[preview.rankId].pricePi} currency="Pi"/>
      <RetroNftCardPreview key={preview.artworkPath} sticker={{ level, rank, modelId: shipId, stage, colorId }}
        preview={preview} rankLabel={labels.ranks[rank - 1]}/>
    </>}
  </>;
}

function TestnetNftCollection() {
  const { user, canAdmin, authReady, isLoading, signIn, authError } = useAuth({ autoSignIn: false });
  const { t, locale } = useLocale();
  const [search, setSearch] = useSearchParams();
  const section = sections.find(key => key === search.get('collection')) ?? sections[0];
  const names = { bosses: nftGalleryCopy(locale).title, ships: t('Ship NFTs'), retro: retroMiniGamesName };
  const counts = { bosses: bossIds.length * bossEditionKeys.length, ships: playerSkins.length * stages.length, retro: retroNftPreviewCount };
  const total = counts.bosses + counts.ships + counts.retro;
  const verifiedAdmin = authReady && !isLoading && !!user && canAdmin;

  if (authReady && user && !canAdmin) return <Navigate to="/" replace/>;

  return <NftMusicProvider active={verifiedAdmin}><main className="boss-nft-page admin-nft-collection">
    <header className="boss-nft-header">
      <div className="nft-page-links">
        <Link to="/admin" className="boss-nft-home"><span aria-hidden="true">←</span> {t('Admin dashboard')}</Link>
        <NftMusicButton/>
      </div>
      <h1>{t('NFT overview')}</h1>
      {verifiedAdmin && <p>{t('Testnet')} · {t('{count} card designs', { count: total.toLocaleString(locale) })}</p>}
    </header>
    {!authReady || isLoading ? <p role="status">{t('Loading…')}</p> : user && canAdmin ? <section>
      <p className="admin-nft-notice">{t('NFT issuance and sales are planned for the Mainnet app.')}</p>
      <div className="boss-nft-editions admin-nft-sections" role="group" aria-label={t('NFT overview')}>
        {sections.map(key => <button key={key} type="button" aria-pressed={section === key}
          onClick={() => setSearch({ collection: key }, { replace: true })}>
          {names[key]} <span>{counts[key].toLocaleString(locale)}</span>
        </button>)}
      </div>
      {section === 'bosses' && <BossCollection/>}
      {section === 'ships' && <ShipCollection/>}
      {section === 'retro' && <RetroCollection uid={user.uid}/>}
    </section> : <div className="boss-nft-state">
      <p>{t(authError || 'Sign in with Pi')}</p>
      <button type="button" onClick={() => { void signIn(); }}>{t('Connect Pi')}</button>
    </div>}
  </main></NftMusicProvider>;
}

export default function AdminNftCollection() {
  return shipSaveNetwork === 'testnet' ? <TestnetNftCollection/> : <Navigate to="/" replace/>;
}
