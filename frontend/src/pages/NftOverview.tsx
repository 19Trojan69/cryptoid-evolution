import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import BlockchainIcon from "../components/BlockchainIcon";
import { useAuth } from "../hooks/useAuth";
import { axiosClient } from "../lib/axiosClient";
import { hangarCatalog } from "../../../backend/src/hangarCatalog";
import { shipNftEditions, shipNftMaxSupply } from "../../../backend/src/shipNftCatalog";
import { BOSS_STICKER_COUNT } from "../../../backend/src/rewardRules";
import { useLocale } from "../i18n";
import { nftGalleryCopy } from "../locales/bossNftGallery";
import { bossNftPreviewCopy } from "../locales/bossNftPreview";
import { bossNftEditions } from "./bossNftEditions";
import { playerSkins, shipSaveNetwork } from "./shipFleet";
import { shipNftMainnetVisible } from "./shipNftVisibility";
import "./bossNftGallery.css";
import "./bossNftPreview.css";
import "./nftOverview.css";

const upgrades = hangarCatalog.filter(offer => offer.kind === "ship_upgrade");
const editions = [
  { name: shipNftEditions[0], stage: 1 },
  { name: shipNftEditions[1], stage: 2 },
  { name: shipNftEditions[2], stage: 3 },
] as const;
const testnet = shipSaveNetwork === "testnet";
const editionCount = Object.keys(bossNftEditions).length + editions.length;
const cardCount = Object.keys(bossNftEditions).length * BOSS_STICKER_COUNT + editions.length * playerSkins.length;

type NftProgress = { owner: string; boss: number; ships: [number, number, number] };

function useNftProgress(uid: string | undefined) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ owner: string; progress: NftProgress | null; attempt: number }>();
  useEffect(() => {
    if (!uid || !testnet) return;
    const request = new AbortController();
    const finish = (progress: NftProgress | null) => {
      if (!request.signal.aborted) setResult({ owner: uid, progress, attempt });
    };
    void axiosClient.get<NftProgress>("/testnet-ship-nft-preview/progress", { signal: request.signal })
      .then(({ data }) => {
        const validCount = (value: number, max: number) => Number.isSafeInteger(value) && value >= 0 && value <= max;
        finish(data?.owner === uid && validCount(data.boss, BOSS_STICKER_COUNT) && Array.isArray(data.ships) &&
          data.ships.length === editions.length && data.ships.every(value => validCount(value, playerSkins.length)) ? data : null);
      }).catch(() => finish(null));
    return () => request.abort();
  }, [uid, attempt]);
  return { progress: result?.owner === uid && result?.attempt === attempt ? result.progress : undefined,
    retry: () => setAttempt(value => value + 1) };
}

function EditionProgress({ unlocked, total }: { unlocked: number | undefined; total: number }) {
  const { t, locale } = useLocale();
  if (unlocked === undefined) return null;
  return <div className="nft-edition-progress">
    <span>{t("Unlocked")} <strong>{unlocked.toLocaleString(locale)} / {total.toLocaleString(locale)}</strong></span>
    <progress value={unlocked} max={total} aria-label={t("Unlocked")} />
  </div>;
}

function NftOverviewPage() {
  const { locale, t } = useLocale();
  const { user, authReady, isLoading, authError, signIn } = useAuth({ autoSignIn: false });
  const { progress, retry } = useNftProgress(user?.uid);
  const gallery = nftGalleryCopy(locale);
  const bossCopy = bossNftPreviewCopy(locale);
  const number = new Intl.NumberFormat(locale).format;
  const pi = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format;
  const designs = (count: number) => t("{count} card designs", { count: number(count) });
  const progressPending = testnet && user && progress === undefined;
  const progressFailed = testnet && user && progress === null;
  const signInAvailable = testnet && !user && authReady && !isLoading;

  return <main className="boss-nft-page nft-overview">
    <header className="boss-nft-header">
      <nav className="nft-page-links" aria-label={t("Game navigation")}>
        <Link className="boss-nft-home" to="/"><span aria-hidden="true">←</span> {t("Home")}</Link>
        <Link className="boss-nft-home" to="/" state={{ openShopView: "shop" }}>{t("Ship shop")}</Link>
        <Link className="boss-nft-home" to="/" state={{ openCollection: true }}>{t("Card collection")}</Link>
      </nav>
      <div className="nft-overview-title"><BlockchainIcon kind="collection"/><h1>{t("NFT overview")}</h1></div>
      <p className="nft-unlock-notice">{t("All NFT card slots are visible. Artwork appears once you unlock the card.")}</p>
      <p className="nft-overview-notice">{t("NFT issuance and sales are planned for the Mainnet app.")}</p>
      <div className="nft-catalog-size"><b>{designs(cardCount)}</b><span>{t("{count} editions", { count: number(editionCount) })}</span></div>
    </header>
    {progressFailed && <div className="boss-nft-state" role="alert">
      <p>{gallery.error}</p><button type="button" onClick={retry}>{t("Try again")}</button>
    </div>}
    {progressPending && <p className="nft-progress-note" role="status">{t("Loading…")}</p>}
    {signInAvailable &&
      <div className="nft-progress-note"><span>{t("Connect your Pi account to see your unlocked NFTs.")}</span>
        <button type="button" onClick={() => { void signIn(); }}>{t("Connect Pi")}</button></div>}
    {testnet && !user && authError && <p className="nft-progress-note" role="alert">{t(authError)}</p>}
    <div className="nft-overview-groups">
      <section aria-labelledby="nft-overview-bosses-heading">
        <h2 id="nft-overview-bosses-heading">{gallery.title}</h2>
        <ul>
          {(["victory", "holo"] as const).map(edition => {
            const { name, supply } = bossNftEditions[edition];
            const terms = <>
              <strong>{name}</strong>
              <span>{designs(BOSS_STICKER_COUNT)}{" · "}{t("{count} per boss", { count: number(supply) })}</span>
              <p>{edition === "victory" ? bossCopy.victory : <b>{pi(bossNftEditions.holo.pricePi)} Pi</b>}</p>
              <EditionProgress unlocked={progress?.boss} total={BOSS_STICKER_COUNT} />
            </>;
            return <li key={edition}>
              {testnet ? <Link data-edition={edition} className="nft-overview-edition" to={edition === "holo" ? "/nft-bosses?edition=holo" : "/nft-bosses"}>
                {terms}
              </Link> : <div data-edition={edition} className="nft-overview-edition">{terms}</div>}
            </li>;
          })}
        </ul>
        {testnet && <p className="nft-overview-terms">{t("Defeat a boss to reveal both of its NFT cards.")}</p>}
      </section>
      <section aria-labelledby="nft-overview-ships-heading">
        <h2 id="nft-overview-ships-heading">{t("Ship NFTs")}</h2>
        <ul>
          {editions.map(({ name, stage }) => {
            const price = upgrades.find(offer => offer.stage === stage)?.pricePi;
            const terms = stage === 1
              ? t("Grey Scout is free. Other Standard ships cost Shards. The NFT is included.")
              : stage === 2
                ? t("NFT included with the ship upgrade.")
                : t("NFT included with the ship upgrade. Requires Advanced.");
            return <li key={stage}>
              <Link data-edition={name.toLowerCase()} className="nft-overview-edition" to={stage === 1 ? "/nft-ships" : `/nft-ships?stage=${stage}`}>
                <strong>{name}</strong>
                <span>{designs(playerSkins.length)}{" · "}{t("{count} per ship model", { count: number(shipNftMaxSupply[name]) })}</span>
                <p>{price !== undefined && <b>{pi(price)} Pi{" · "}</b>}{terms}</p>
                <EditionProgress unlocked={progress?.ships[stage - 1]} total={playerSkins.length} />
              </Link>
            </li>;
          })}
        </ul>
      </section>
    </div>
  </main>;
}

export default function NftOverview() {
  return shipSaveNetwork === "testnet" || shipNftMainnetVisible ? <NftOverviewPage /> : <Navigate to="/" replace />;
}
