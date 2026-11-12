import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, Navigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../i18n";
import { axiosClient } from "../lib/axiosClient";
import { nftGalleryCopy } from "../locales/bossNftGallery";
import { bossNftPreviewCopy } from "../locales/bossNftPreview";
import { bossName } from "./bossNames";
import { shipSaveNetwork } from "./shipFleet";
import "./bossNftGallery.css";
import "./bossNftPreview.css";

const editions = {
  victory: { name: "Victory Edition", supply: 31415 },
  holo: { name: "Holo Edition", supply: 3141 },
} as const;
const holoPricePi = 14.9;
type Edition = keyof typeof editions;
type Card = {
  id: number;
  story: string;
  webp: string;
  defeated: boolean;
  interested: boolean;
};
type InterestCount = { id: number; count: number };
type Page = { owner: string; total: number; pageSize: number; cards: Card[]; interestSummary?: InterestCount[] };
type Interest = { owner: string; id: number; interested: boolean; changed: boolean };
const cardImage = (card: Card) => "data:image/webp;base64," + card.webp;

function CardDetail({ card, edition, saving, saveError, onInterest, onClose }: {
  card: Card;
  edition: Edition;
  saving: boolean;
  saveError: boolean;
  onInterest: () => void;
  onClose: () => void;
}) {
  const { locale, t } = useLocale();
  const copy = bossNftPreviewCopy(locale);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const progressId = useId();
  const interestNoteId = useId();
  const number = new Intl.NumberFormat(locale).format;
  const price = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(holoPricePi);
  const { name, supply } = editions[edition];
  const holo = edition === "holo";
  const status = holo && card.interested ? copy.interested : card.defeated ? t("Boss defeated") : copy.reached;

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog ref={dialogRef} className={`nft-preview-detail nft-preview-detail-${edition}`}
      aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="nft-preview-panel">
        <header className="nft-preview-heading">
          <div>
            <span className="nft-preview-edition">{name}</span>
            <h2 id={titleId}>{bossName(card.id)}</h2>
          </div>
          <button className="nft-preview-close" type="button" aria-label={t("Close")} onClick={onClose}>×</button>
        </header>
        <div className="nft-preview-content">
          <p className="nft-preview-story" lang="en">{card.story}</p>
          <figure className="nft-preview-figure">
            <img src={cardImage(card)} width={540} height={720} decoding="async" alt={`${bossName(card.id)} · ${name}`} />
            <figcaption>{copy.artwork}</figcaption>
          </figure>
          <section className="nft-preview-progress">
            <div><span id={progressId}>{copy.minting}</span><strong>0 / {number(supply)}</strong></div>
            <progress value={0} max={supply} aria-labelledby={progressId} />
            <p>{copy.planned}</p>
          </section>
          <p className="nft-preview-status" role="status">{status}</p>
          <dl className="nft-preview-facts">
            <div><dt>{copy.supply}</dt><dd>{number(supply)}</dd></div>
            <div><dt>{t("Level")}</dt><dd>{number(card.id * 10)}</dd></div>
            <div><dt>{copy.availability}</dt><dd>{holo ? copy.holo : copy.victory}</dd></div>
          </dl>
        </div>
        {holo && <footer className="nft-preview-action">
          <div className="nft-preview-price"><span>{t("Planned price")}</span><strong>{price} Pi</strong></div>
          <button className="nft-preview-interest" type="button" aria-describedby={interestNoteId}
            disabled={saving} onClick={onInterest}>
            {card.interested ? copy.removeInterest : copy.interest}
          </button>
          <p id={interestNoteId}>{copy.interestNote}</p>
          {saveError && <p role="alert">{copy.saveError}</p>}
        </footer>}
      </div>
    </dialog>, document.body,
  );
}

function InterestSummary({ summary }: { summary: InterestCount[] }) {
  const { locale } = useLocale();
  const copy = bossNftPreviewCopy(locale);
  const number = new Intl.NumberFormat(locale).format;
  return <details className="boss-nft-state nft-preview-summary">
    <summary>{copy.interestCount}</summary>
    {summary.length ? <dl>
      {summary.map(({ id, count }) => <div key={id}><dt>{bossName(id)}</dt><dd>{number(count)}</dd></div>)}
    </dl> : <p>{copy.noInterest}</p>}
  </details>;
}

function PreviewCards({ uid, edition, page, onPage, onRetry, onSignIn }: {
  uid: string;
  edition: Edition;
  page: number;
  onPage: (page: number) => void;
  onRetry: () => void;
  onSignIn: () => void;
}) {
  const { locale, t } = useLocale();
  const copy = bossNftPreviewCopy(locale);
  const gallery = nftGalleryCopy(locale);
  const [result, setResult] = useState<Page | "error" | "expired" | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const request = new AbortController();
    void axiosClient.get<Page>("/boss-nft-preview", { params: { edition, page }, signal: request.signal })
      .then(({ data }) => {
        if (request.signal.aborted) return;
        setResult(data?.owner === uid && Number.isSafeInteger(data.total) && data.total >= 0 &&
          Number.isSafeInteger(data.pageSize) && data.pageSize > 0 && Array.isArray(data.cards) ? data : "error");
      })
      .catch(error => {
        if (request.signal.aborted) return;
        setResult(isAxiosError(error) && error.response?.status === 401 ? "expired" : "error");
      });
    return () => request.abort();
  }, [uid, edition, page]);

  if (!result) return <p className="boss-nft-state" role="status">{gallery.loading}</p>;
  if (result === "expired") return <div className="boss-nft-state" role="alert">
    <p>{t("Pi session expired. Sign in again.")}</p>
    <button type="button" onClick={onSignIn}>{t("Connect Pi")}</button>
  </div>;
  if (result === "error") return <div className="boss-nft-state" role="alert">
    <p>{gallery.error}</p>
    <button type="button" onClick={onRetry}>{t("Try again")}</button>
  </div>;
  const summary = result.interestSummary && <InterestSummary summary={result.interestSummary} />;
  if (!result.total) return <>{summary}<p className="boss-nft-state" role="status">{copy.empty}</p></>;

  const pageCount = Math.ceil(result.total / result.pageSize);
  const activeCard = result.cards.find(card => card.id === selected);
  const setInterest = async (card: Card) => {
    if (saving || edition !== "holo") return;
    const interested = !card.interested;
    setSaving(true);
    setSaveError(false);
    try {
      const { data } = await axiosClient.put<Interest>(`/boss-nft-preview/holo/${card.id}/interest`, { owner: uid, interested });
      if (data?.owner !== uid || data.id !== card.id || data.interested !== interested)
        throw new Error("Unexpected interest response");
      setResult(current => {
        if (!current || typeof current !== "object") return current;
        const next = { ...current, cards: current.cards.map(entry => entry.id === card.id ? { ...entry, interested } : entry) };
        if (current.interestSummary && data.changed) {
          const others = current.interestSummary.filter(item => item.id !== card.id);
          const count = (current.interestSummary.find(item => item.id === card.id)?.count ?? 0) + (interested ? 1 : -1);
          if (count > 0) others.push({ id: card.id, count });
          next.interestSummary = others.sort((a, b) => a.id - b.id);
        }
        return next;
      });
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setSelected(null);
        setResult("expired");
      } else setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return <>
    {summary}
    <ul className="boss-nft-grid nft-preview-grid">
      {result.cards.map(card => <li key={card.id}>
        <button className="nft-preview-tile" type="button" aria-label={`${bossName(card.id)} · ${editions[edition].name}`}
          onClick={() => { setSelected(card.id); setSaveError(false); }}>
          <img src={cardImage(card)} width={540} height={720} decoding="async" loading="lazy" alt="" />
          <span><strong>{bossName(card.id)}</strong>{card.interested && <small>{copy.interested}</small>}</span>
        </button>
      </li>)}
    </ul>
    {(pageCount > 1 || page > 1) && <nav className="boss-nft-pagination" aria-label={gallery.title}>
      <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1}>{gallery.previous}</button>
      <span>{page} / {pageCount}</span>
      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pageCount}>{gallery.next}</button>
    </nav>}
    {activeCard && <CardDetail card={activeCard} edition={edition} saving={saving} saveError={saveError}
      onInterest={() => void setInterest(activeCard)} onClose={() => setSelected(null)} />}
  </>;
}

function TestnetBossNftPreview() {
  const { authReady, user, isLoading, authError, signIn } = useAuth({ autoSignIn: false });
  const { locale, t } = useLocale();
  const copy = bossNftPreviewCopy(locale);
  const gallery = nftGalleryCopy(locale);
  const [view, setView] = useState<{ edition: Edition; page: number }>({ edition: "victory", page: 1 });
  const [attempt, setAttempt] = useState(0);
  const retry = () => setAttempt(value => value + 1);
  const connect = () => { void signIn().then(retry); };
  const busy = !authReady || isLoading;

  return <main className="boss-nft-page nft-preview-page">
    <header className="boss-nft-header">
      <Link className="boss-nft-home" to="/"><span aria-hidden="true">←</span> {t("Home")}</Link>
      <span className="nft-preview-network">{copy.preview}</span>
      <h1>{gallery.title}</h1>
      <p>{copy.intro}</p>
    </header>
    {busy ? <p className="boss-nft-state" role="status">{gallery.loading}</p>
      : !user ? <div className="boss-nft-state">
        <p>{copy.signIn}</p>
        {authError && <p role="alert">{t(authError)}</p>}
        <button type="button" onClick={connect}>{t("Connect Pi")}</button>
      </div> : <>
        <div className="boss-nft-editions" role="group" aria-label={gallery.title}>
          {(["victory", "holo"] as const).map(edition => <button key={edition} type="button" aria-pressed={view.edition === edition}
            onClick={() => setView({ edition, page: 1 })}>{editions[edition].name}</button>)}
        </div>
        <PreviewCards key={`${user.uid}/${view.edition}/${view.page}/${attempt}`} uid={user.uid} {...view}
          onPage={page => setView(previous => ({ ...previous, page }))} onRetry={retry} onSignIn={connect} />
      </>}
  </main>;
}

export default function BossNftPreview() {
  return shipSaveNetwork === "testnet" ? <TestnetBossNftPreview /> : <Navigate to="/" replace />;
}
