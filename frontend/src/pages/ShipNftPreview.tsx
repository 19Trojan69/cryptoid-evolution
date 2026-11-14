import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../i18n";
import { axiosClient } from "../lib/axiosClient";
import { nftGalleryCopy } from "../locales/bossNftGallery";
import { shipNftCopy } from "../locales/shipNft";
import { hangarCatalog } from "../../../backend/src/hangarCatalog";
import { shipNftEditions, shipNftMaxSupply } from "../../../backend/src/shipNftCatalog";
import { SHIP_NFT_PREVIEW_PAGE_SIZE as pageSize } from "../../../backend/src/nftPreviewLimits";
import { vanguardMetallic } from "../../../backend/src/shipLivery";
import type { ShipStage } from "./shipEvolution";
import { playerSkins, shipSaveNetwork } from "./shipFleet";
import { shipNftMainnetVisible } from "./shipNftVisibility";
import NftCardCover from "./NftCardCover";
import { NftMusicButton } from "./NftMusic";
import "./bossNftGallery.css";
import "./bossNftPreview.css";
import "./shipNftPreview.css";

type Card = { id: string; name: string; maxSupply: number; status: "eligible"; story: string; livery: string; webp: string };
type Page = { owner: string; total: number; pageSize: number; cards: Array<Card | { id: string; status: string }> };
const pageCount = Math.ceil(playerSkins.length / pageSize);
const cardImage = (card: Card) => `data:image/webp;base64,${card.webp}`;
const editionName = (stage: ShipStage) => shipNftEditions[stage - 1];
const upgrades = hangarCatalog.filter(offer => offer.kind === "ship_upgrade");
const testnet = shipSaveNetwork === "testnet";

function CardDetail({ card, stage, close }: { card: Card; stage: ShipStage; close: () => void }) {
  const { locale, t } = useLocale();
  const copy = shipNftCopy(locale);
  const edition = editionName(stage);
  const maxSupply = t("{count} per ship model", { count: card.maxSupply.toLocaleString(locale) });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(<dialog ref={dialogRef} className="nft-preview-detail ship-nft-detail" data-stage={stage}
    aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }}
    onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="nft-preview-panel">
      <header className="nft-preview-heading">
        <div><span className="nft-preview-edition">{edition}</span><h2 id={titleId}>{card.name}</h2></div>
        <button className="nft-preview-close" type="button" aria-label={t("Close")} onClick={close}>×</button>
      </header>
      <div className="nft-preview-content">
        <p className="nft-preview-story" lang="en">{card.story}</p>
        <figure className="nft-preview-figure">
          <img src={cardImage(card)} width={540} height={720} alt={`${card.name} · ${edition}`} />
          <figcaption>{card.livery === vanguardMetallic.name ? vanguardMetallic.name : t("Original Livery")}{" · "}{maxSupply}</figcaption>
        </figure>
        {!testnet && <p className="nft-preview-status">{copy.ready}</p>}
      </div>
    </div>
  </dialog>, document.body);
}

function ShipCardSlots({ cards = [], stage, page, onOpen }: {
  cards?: readonly Card[];
  stage: ShipStage;
  page: number;
  onOpen?: (card: Card) => void;
}) {
  const { locale, t } = useLocale();
  const number = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }).format;
  const start = (page - 1) * pageSize;
  return <ul className="boss-nft-grid ship-nft-grid">
    {playerSkins.slice(start, start + pageSize).map((ship, index) => {
      const card = cards.find(entry => entry.id === `${ship.id}-${editionName(stage).toLowerCase()}`);
      return <li key={ship.id}>
        {card && onOpen ? <button className="nft-preview-tile" type="button" aria-haspopup="dialog" onClick={() => onOpen(card)}>
          <img src={cardImage(card)} width={540} height={720} alt="" loading="lazy" decoding="async" />
          <span><strong>{card.name}</strong></span>
        </button> : <NftCardCover number={number(start + index + 1)} label={t("Locked")} />}
      </li>;
    })}
  </ul>;
}

function ShipNftCards({ uid, stage, page, retry, signIn }: {
  uid: string;
  stage: ShipStage;
  page: number;
  retry: () => void;
  signIn: () => void;
}) {
  const { locale, t } = useLocale();
  const gallery = nftGalleryCopy(locale);
  const [result, setResult] = useState<Card[] | "error" | "expired" | null>(null);
  const [selected, setSelected] = useState<Card | null>(null);
  useEffect(() => {
    const request = new AbortController();
    const endpoint = testnet ? "/testnet-ship-nft-preview" : "/ship-nft-preview";
    void axiosClient.get<Page>(endpoint, { params: { stage, page }, signal: request.signal })
      .then(({ data }) => {
        if (request.signal.aborted) return;
        setResult(data?.owner === uid && data.total === playerSkins.length &&
          data.pageSize === pageSize && Array.isArray(data.cards)
          ? data.cards.filter((card): card is Card => card.status === "eligible" && "webp" in card)
          : "error");
      })
      .catch(error => {
        if (!request.signal.aborted) setResult(isAxiosError(error) && error.response?.status === 401 ? "expired" : "error");
      });
    return () => request.abort();
  }, [uid, stage, page]);

  const covered = <ShipCardSlots stage={stage} page={page} />;
  if (!result) return <><p className="boss-nft-state" role="status">{gallery.loading}</p>{covered}</>;
  if (result === "expired") return <><div className="boss-nft-state" role="alert">
    <p>{t("Pi session expired. Sign in again.")}</p>
    <button type="button" onClick={signIn}>{t("Connect Pi")}</button>
  </div>{covered}</>;
  if (result === "error") return <><div className="boss-nft-state" role="alert">
    <p>{gallery.error}</p>
    <button type="button" onClick={retry}>{t("Try again")}</button>
  </div>{covered}</>;
  return <>
    <ShipCardSlots cards={result} stage={stage} page={page} onOpen={setSelected} />
    {selected && <CardDetail card={selected} stage={stage} close={() => setSelected(null)} />}
  </>;
}

function ShipNftPreviewPage() {
  const { authReady, user, isLoading, authError, signIn, canAdmin } = useAuth({ autoSignIn: false });
  const { locale, t } = useLocale();
  const gallery = nftGalleryCopy(locale);
  const [search, setSearch] = useSearchParams();
  const requestedStage = search.get("stage");
  const stage = requestedStage === "3" ? 3 : requestedStage === "2" ? 2 : 1;
  const requestedPage = Number(search.get("page"));
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= pageCount ? requestedPage : 1;
  const [attempt, setAttempt] = useState(0);
  const retry = () => setAttempt(value => value + 1);
  const connect = () => { void signIn().then(retry); };
  const number = new Intl.NumberFormat(locale).format;
  const pi = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format;
  const busy = !authReady || isLoading;
  const price = upgrades.find(offer => offer.stage === stage)?.pricePi;
  const terms = stage === 1
    ? t("Grey Scout is free. Other Standard ships cost Shards. The NFT is included.")
    : stage === 2 ? t("NFT included with the ship upgrade.") : t("NFT included with the ship upgrade. Requires Advanced.");
  const navigateCards = (nextStage: ShipStage, nextPage: number) => {
    const query: Record<string, string> = {};
    if (nextStage > 1) query.stage = String(nextStage);
    if (nextPage > 1) query.page = String(nextPage);
    setSearch(query);
  };

  useEffect(() => { window.scrollTo(0, 0); }, [stage, page]);

  return <main className="boss-nft-page nft-preview-page ship-nft-page">
    <header className="boss-nft-header">
      <nav className="nft-page-links" aria-label={t("Game navigation")}>
        <Link className="boss-nft-home" to="/nfts"><span aria-hidden="true">←</span> {t("NFT overview")}</Link>
        <Link className="boss-nft-home" to="/">{t("Home")}</Link>
        <Link className="boss-nft-home" to="/" state={{ openShopView: "shop" }}>{t("Ship shop")}</Link>
        {!testnet && user && canAdmin && <Link className="boss-nft-home" to="/admin/nft-bosses">{gallery.title}</Link>}
        <NftMusicButton />
      </nav>
      <h1>{t("Ship NFTs")}</h1>
      <p className="nft-unlock-notice">{t("All NFT card slots are visible. Artwork appears once you unlock the card.")}</p>
      <p>{t("NFT issuance and sales are planned for the Mainnet app.")}</p>
    </header>
    <div className="boss-nft-editions ship-nft-editions" role="group" aria-label={t("Ship NFTs")}>
      {([1, 2, 3] as const).map(level => <button key={level} type="button" data-stage={level} aria-pressed={stage === level}
        onClick={() => navigateCards(level, 1)}>{editionName(level)}</button>)}
    </div>
    <p className="nft-card-count">{t("{count} card designs", { count: number(playerSkins.length) })}{" · "}
      {t("{count} per ship model", { count: number(shipNftMaxSupply[editionName(stage)]) })}</p>
    <p className="nft-card-terms">{price !== undefined && <strong>{pi(price)} Pi{" · "}</strong>}{terms}</p>
    {!busy && user ? <ShipNftCards key={`${user.uid}/${stage}/${page}/${attempt}`} uid={user.uid} stage={stage} page={page}
      retry={retry} signIn={connect} /> : <>
      {busy ? <p className="boss-nft-state" role="status">{gallery.loading}</p> : <div className="boss-nft-state">
        <p>{t("Connect your Pi account to see your unlocked NFTs.")}</p>
        {authError && <p role="alert">{t(authError)}</p>}
        <button type="button" onClick={connect}>{t("Connect Pi")}</button>
      </div>}
      <ShipCardSlots stage={stage} page={page} />
    </>}
    <nav className="boss-nft-pagination" aria-label={t("Ship NFTs")}>
      <button type="button" onClick={() => navigateCards(stage, page - 1)} disabled={page === 1}>{gallery.previous}</button>
      <span>{number(page)} / {number(pageCount)}</span>
      <button type="button" onClick={() => navigateCards(stage, page + 1)} disabled={page === pageCount}>{gallery.next}</button>
    </nav>
  </main>;
}

export default function ShipNftPreview() {
  return testnet || shipNftMainnetVisible ? <ShipNftPreviewPage /> : <Navigate to="/" replace />;
}
