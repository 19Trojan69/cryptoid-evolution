import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../i18n";
import { axiosClient } from "../lib/axiosClient";
import { nftGalleryCopy, type BossNftGalleryCopy } from "../locales/bossNftGallery";
import { bossName } from "./bossNames";
import "./bossNftGallery.css";

type Edition = "victory" | "holo";
type Preview = { id: number; story: string; webp: string };
type Page = { total: number; pageSize: number; cards: Preview[] };

function GalleryCards({ edition, page, copy, retryLabel, onRetry, onPage, sessionExpired, connectLabel, onSignIn }: {
  edition: Edition;
  page: number;
  copy: BossNftGalleryCopy;
  retryLabel: string;
  onRetry: () => void;
  onPage: (page: number) => void;
  sessionExpired: string;
  connectLabel: string;
  onSignIn: () => void;
}) {
  const [result, setResult] = useState<Page | "error" | "denied" | "expired" | null>(null);
  useEffect(() => {
    const request = new AbortController();
    void axiosClient.get<Page>("/admin/boss-nfts", { params: { edition, page }, signal: request.signal })
      .then(({ data }) => {
        if (request.signal.aborted) return;
        setResult(Number.isSafeInteger(data?.total) && data.total >= 0 &&
          Number.isSafeInteger(data.pageSize) && data.pageSize > 0 && Array.isArray(data.cards)
          ? data : "error");
      })
      .catch(error => {
        if (request.signal.aborted) return;
        const status = isAxiosError(error) ? error.response?.status : undefined;
        setResult(status === 403 ? "denied" : status === 401 ? "expired" : "error");
      });
    return () => request.abort();
  }, [edition, page]);

  if (result === "denied") return <Navigate to="/" replace />;
  if (result === "expired") return <div className="boss-nft-state" role="alert">
    <p>{sessionExpired}</p>
    <button type="button" onClick={onSignIn}>{connectLabel}</button>
  </div>;
  if (result === "error") return <div className="boss-nft-state" role="alert">
    <p>{copy.error}</p>
    <button type="button" onClick={onRetry}>{retryLabel}</button>
  </div>;
  if (!result) return <p className="boss-nft-state" role="status">{copy.loading}</p>;
  if (!result.total) return <p className="boss-nft-state" role="status">{copy.empty}</p>;

  const pageCount = Math.ceil(result.total / result.pageSize);
  const editionName = edition === "victory" ? "Victory Edition" : "Holo Edition";
  return <>
    <ul className="boss-nft-grid">
      {result.cards.map(card => <li key={card.id}>
        <img src={"data:image/webp;base64," + card.webp} width={540} height={720}
          decoding="async" loading="lazy" alt={bossName(card.id) + " · " + editionName + ". " + card.story} />
      </li>)}
    </ul>
    {(pageCount > 1 || page > 1) && <div className="boss-nft-pagination">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1}>{copy.previous}</button>
      <span>{page} / {pageCount}</span>
      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pageCount}>{copy.next}</button>
    </div>}
  </>;
}

export default function BossNftGallery() {
  const { authReady, isAuthenticated, isLoading, canAdmin, signIn } = useAuth({ autoSignIn: false });
  const { locale, t } = useLocale();
  const copy = nftGalleryCopy(locale);
  const [view, setView] = useState<{ edition: Edition; page: number }>({ edition: "victory", page: 1 });
  const [attempt, setAttempt] = useState(0);
  const home = <Link className="boss-nft-home" to="/"><span aria-hidden="true">←</span> {t("Home")}</Link>;

  if (!authReady || isLoading) return <main className="boss-nft-page" aria-busy="true">{home}</main>;
  if (!isAuthenticated || !canAdmin) return <Navigate to="/" replace />;

  return <main className="boss-nft-page">
    <header className="boss-nft-header">
      {home}
      <h1>{copy.title}</h1>
      <p>{copy.status}</p>
    </header>
    <div className="boss-nft-editions" role="group" aria-label={copy.title}>
      <button type="button" aria-pressed={view.edition === "victory"}
        onClick={() => setView({ edition: "victory", page: 1 })}>{copy.free}</button>
      <button type="button" aria-pressed={view.edition === "holo"}
        onClick={() => setView({ edition: "holo", page: 1 })}>{copy.buyable}</button>
    </div>
    <GalleryCards key={view.edition + "/" + view.page + "/" + attempt} edition={view.edition}
      page={view.page} copy={copy} retryLabel={t("Try again")}
      sessionExpired={t("Pi session expired. Sign in again.")} connectLabel={t("Connect Pi")}
      onSignIn={() => { void signIn().then(() => setAttempt(value => value + 1)); }}
      onRetry={() => setAttempt(value => value + 1)}
      onPage={page => setView(previous => ({ ...previous, page }))} />
  </main>;
}
