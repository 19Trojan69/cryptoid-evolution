import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, Navigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../i18n";
import { axiosClient } from "../lib/axiosClient";
import { nftGalleryCopy } from "../locales/bossNftGallery";
import { shipNftCopy } from "../locales/shipNft";
import { shipNftEditions } from "../../../backend/src/shipNftCatalog";
import { vanguardMetallic } from '../../../backend/src/shipLivery.ts';
import type { ShipStage } from "./shipEvolution";
import { shipNftMainnetVisible } from "./shipNftVisibility";
import "./bossNftGallery.css";
import "./bossNftPreview.css";
import "./shipNftPreview.css";

type LockedStatus = "needs-hull" | "needs-hull-proof" | "needs-advanced" | "needs-purchase";
type Card = { id: string; name: string } & ({ status: LockedStatus } | { status: "eligible"; story: string; livery?: string; webp: string });
type EligibleCard = Extract<Card, { status: "eligible" }>;
type Page = { owner: string; total: number; pageSize: number; cards: Card[] };
const cardImage = (card: EligibleCard) => `data:image/webp;base64,${card.webp}`;
const editionName = (stage: ShipStage) => shipNftEditions[stage - 1];

function CardDetail({ card, stage, close }: { card: EligibleCard; stage: ShipStage; close: () => void }) {
  const { locale, t } = useLocale();
  const copy = shipNftCopy(locale);
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
        <div><span className="nft-preview-edition">{editionName(stage)}</span><h2 id={titleId}>{card.name}</h2></div>
        <button className="nft-preview-close" type="button" aria-label={t("Close")} onClick={close}>×</button>
      </header>
      <div className="nft-preview-content">
        <p className="nft-preview-story" lang="en">{card.story}</p>
        <figure className="nft-preview-figure">
          <img src={cardImage(card)} width={540} height={720} alt={`${card.name} · ${editionName(stage)}`} />
          <figcaption>{card.livery === vanguardMetallic.name ? vanguardMetallic.name : copy.livery}</figcaption>
        </figure>
        <p className="nft-preview-status">{copy.ready}</p>
      </div>
    </div>
  </dialog>, document.body);
}

function ShipNftCards({ uid, stage, page, onPage, retry, signIn }: {
  uid: string;
  stage: ShipStage;
  page: number;
  onPage: (page: number) => void;
  retry: () => void;
  signIn: () => void;
}) {
  const { locale, t } = useLocale();
  const copy = shipNftCopy(locale);
  const gallery = nftGalleryCopy(locale);
  const [result, setResult] = useState<Page | "error" | "expired" | null>(null);
  const [selected, setSelected] = useState<EligibleCard | null>(null);
  useEffect(() => {
    const request = new AbortController();
    void axiosClient.get<Page>("/ship-nft-preview", { params: { stage, page }, signal: request.signal })
      .then(({ data }) => {
        if (request.signal.aborted) return;
        setResult(data?.owner === uid && Number.isSafeInteger(data.total) && data.total > 0 &&
          Number.isSafeInteger(data.pageSize) && data.pageSize > 0 && Array.isArray(data.cards) ? data : "error");
      })
      .catch(error => {
        if (!request.signal.aborted) setResult(isAxiosError(error) && error.response?.status === 401 ? "expired" : "error");
      });
    return () => request.abort();
  }, [uid, stage, page]);

  if (!result) return <p className="boss-nft-state" role="status">{gallery.loading}</p>;
  if (result === "expired") return <div className="boss-nft-state" role="alert">
    <p>{t("Pi session expired. Sign in again.")}</p>
    <button type="button" onClick={signIn}>{t("Connect Pi")}</button>
  </div>;
  if (result === "error") return <div className="boss-nft-state" role="alert">
    <p>{gallery.error}</p>
    <button type="button" onClick={retry}>{t("Try again")}</button>
  </div>;
  const pageCount = Math.ceil(result.total / result.pageSize);
  return <>
    <ul className="boss-nft-grid nft-preview-grid">
      {result.cards.map(card => <li key={card.id}>
        {card.status === "eligible" ? <button className="nft-preview-tile" type="button" onClick={() => setSelected(card)}>
          <img src={cardImage(card)} width={540} height={720} alt="" loading="lazy" decoding="async" />
          <span><strong>{card.name}</strong><small>{copy.ready}</small></span>
        </button> : <div className="ship-nft-locked"><strong>{card.name}</strong><small>{copy[card.status]}</small></div>}
      </li>)}
    </ul>
    <nav className="boss-nft-pagination" aria-label={copy.title}>
      <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1}>{gallery.previous}</button>
      <span>{page} / {pageCount}</span>
      <button type="button" onClick={() => onPage(page + 1)} disabled={page === pageCount}>{gallery.next}</button>
    </nav>
    {selected && <CardDetail card={selected} stage={stage} close={() => setSelected(null)} />}
  </>;
}

function MainnetShipNftPreview() {
  const { authReady, user, isLoading, authError, signIn, canAdmin } = useAuth({ autoSignIn: false });
  const { locale, t } = useLocale();
  const copy = shipNftCopy(locale);
  const gallery = nftGalleryCopy(locale);
  const [view, setView] = useState<{ stage: ShipStage; page: number }>({ stage: 1, page: 1 });
  const [attempt, setAttempt] = useState(0);
  const retry = () => setAttempt(value => value + 1);
  const connect = () => { void signIn().then(retry); };

  return <main className="boss-nft-page nft-preview-page ship-nft-page">
    <header className="boss-nft-header">
      <Link className="boss-nft-home" to="/"><span aria-hidden="true">←</span> {t("Home")}</Link>
      <h1>{copy.title}</h1>
      {user && canAdmin && <Link className="boss-nft-home" to="/admin/nft-bosses">{gallery.title}</Link>}
    </header>
    {!authReady || isLoading ? <p className="boss-nft-state" role="status">{gallery.loading}</p>
      : !user ? <div className="boss-nft-state">
        <p>{copy.signIn}</p>
        {authError && <p role="alert">{t(authError)}</p>}
        <button type="button" onClick={connect}>{t("Connect Pi")}</button>
      </div> : <>
        <div className="boss-nft-editions ship-nft-editions" role="group" aria-label={copy.title}>
          {([1, 2, 3] as const).map(stage => <button key={stage} type="button" data-stage={stage} aria-pressed={view.stage === stage}
            onClick={() => setView({ stage, page: 1 })}>{editionName(stage)}</button>)}
        </div>
        <ShipNftCards key={`${user.uid}/${view.stage}/${view.page}/${attempt}`} uid={user.uid} {...view}
          onPage={page => setView(previous => ({ ...previous, page }))} retry={retry} signIn={connect} />
      </>}
  </main>;
}

export default function ShipNftPreview() {
  return shipNftMainnetVisible ? <MainnetShipNftPreview /> : <Navigate to="/" replace />;
}
