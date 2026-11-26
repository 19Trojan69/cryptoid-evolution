import { useCallback, useEffect, useState } from "react";
import { axiosClient } from "../lib/axiosClient";
import { adminText, useAdminLocale } from "../adminLocale";

type Preparation = {
  phase: "preparation";
  publishable: false;
  catalogHash: string;
  summary: {
    total: number;
    bosses: number;
    ships: number;
    retro: number;
    missingImageUris: number;
    missingMetadataUris: number;
    missingDescriptions: number;
    unlinkedNftProducts: number;
    preparedNftProducts?: number;
    silhouetteDesigns: number;
  };
};

export default function AdminNftPreparation() {
  useAdminLocale();
  const [data, setData] = useState<Preparation | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    const result = await axiosClient.get<Preparation>("/admin/nft-preparation", { signal });
    if (!signal?.aborted) setData(result.data);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) return load(controller.signal);
    }).catch(() => {
      if (!controller.signal.aborted) setError(adminText("Die NFT-Vorbereitung konnte nicht geladen werden."));
    });
    return () => controller.abort();
  }, [load]);

  const download = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await axiosClient.get("/admin/nft-preparation", { params: { download: "1" } });
      const file = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "cryptoid-evolution-nft-preparation.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch { setError(adminText("Die NFT-Vorlage konnte nicht heruntergeladen werden.")); }
    finally { setBusy(false); }
  };

  return <section className="admin-panel" aria-labelledby="nft-preparation-title">
    <h2 id="nft-preparation-title">{adminText("NFT-Vorbereitung")}</h2>
    <p>{adminText("Die Vorlage verbindet die vorhandenen Entwürfe mit Preisen, Auflagen und Erwerbsbedingungen. Öffentliche Bildadressen und die Blockchain-Ausgabe stehen noch aus.")}</p>
    {data && <>
      <div className="admin-metrics">
        <div><strong>{data.summary.bosses}</strong><span>{adminText("Boss-Editionen")}</span></div>
        <div><strong>{data.summary.ships}</strong><span>{adminText("Schiffs-Editionen")}</span></div>
        <div><strong>{data.summary.retro}</strong><span>{adminText("Retro-Editionen")}</span></div>
      </div>
      <ul>
        <li>{adminText("{count} Entwürfe insgesamt", { count: data.summary.total })}</li>
        <li>{adminText("{count} öffentliche Bildadressen noch offen", { count: data.summary.missingImageUris })}</li>
        <li>{adminText("{count} Metadatenadressen noch offen", { count: data.summary.missingMetadataUris })}</li>
        <li>{adminText("{count} NFT-Editionen brauchen noch eine Kaufanbindung", { count: data.summary.preparedNftProducts ?? data.summary.unlinkedNftProducts })}</li>
        {data.summary.missingDescriptions > 0 && <li>{adminText("{count} Kartengeschichten noch zu prüfen", { count: data.summary.missingDescriptions })}</li>}
        <li>{adminText("{count} Entwürfe verwenden bislang eine Silhouette.", { count: data.summary.silhouetteDesigns })}</li>
      </ul>
    </>}
    {error && <p className="admin-error" role="alert">{adminText(error)}</p>}
    <div className="admin-actions">
      <button className="admin-button" type="button" disabled={!data || busy} onClick={() => void download()}>
        {adminText(busy ? "Wird geladen…" : "Metadaten-Vorlage herunterladen")}
      </button>
      <button className="admin-button" type="button" disabled={busy} onClick={() => {
        setError("");
        void load().catch(() => setError(adminText("Die NFT-Vorbereitung konnte nicht geladen werden.")));
      }}>{adminText("Status aktualisieren")}</button>
    </div>
    {!data && !error && <p role="status">{adminText("Die NFT-Vorbereitung wird geladen…")}</p>}
  </section>;
}
