import { useCallback, useEffect, useState } from "react";
import { axiosClient } from "../lib/axiosClient";
import { adminText, useAdminLocale } from "../adminLocale";

type ReleaseStatus = {
  enabled: boolean;
  released: boolean;
  revision: number;
  ready: boolean;
  checks: { id: string; ready: boolean }[];
};

const checkLabels: Record<string, string> = {
  database: "Datenbank und Kontospeicherung",
  piPayments: "Mainnet-Zahlungszugang konfiguriert",
  walletCheckout: "Mainnet-Kaufablauf und Ziel-Wallet geprüft",
  nftIssuance: "NFT-Ausgabe mit bestätigter Blockchain-Transaktion",
  nftMetadata: "Dauerhafte Metadaten-Adressen aller NFT-Editionen",
};

export default function AdminMainnetRelease() {
  useAdminLocale();
  const [status, setStatus] = useState<ReleaseStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    const { data } = await axiosClient.get<ReleaseStatus>("/admin/mainnet-release", { signal });
    setStatus(data);
    return data;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).catch(() => {
      if (!controller.signal.aborted) setError(adminText("Der Freigabestatus konnte nicht geladen werden."));
    });
    return () => controller.abort();
  }, [load]);

  const change = async () => {
    if (!status || busy || (!status.released && !status.ready)) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await axiosClient.post<ReleaseStatus>("/admin/mainnet-release", {
        action: status.released ? "hold" : "release",
        revision: status.revision,
      });
      setStatus(data);
    } catch {
      setError(adminText("Die Änderung wurde nicht bestätigt. Bitte den aktuellen Status prüfen."));
      try { await load(); } catch { setStatus(null); }
    } finally { setBusy(false); }
  };

  return (
    <section className="admin-panel" aria-labelledby="mainnet-release-title">
      <h2 id="mainnet-release-title">{adminText("Mainnet-Freigabe")}</h2>
      <p><strong>{adminText(status ? status.enabled ? "Vollbetrieb freigegeben" : "Vorbereitungsbetrieb" : "Status wird geprüft")}</strong></p>
      <p>{adminText("Bis zur Vollfreigabe bleiben Grundspiel und Shard-Käufe verfügbar. Neue Pi-Käufe und die Ausgabe von NFTs sind gesperrt.")}</p>
      <p>{adminText("Die Freigabe wird serverseitig geprüft. Der Button wird verfügbar, sobald alle Voraussetzungen erfüllt sind.")}</p>
      {status && <ul>{status.checks.map(check => (
        <li key={check.id}>{adminText(checkLabels[check.id] ?? check.id)} · <strong>{adminText(check.ready ? "Bereit" : "Offen")}</strong></li>
      ))}</ul>}
      {error && <p className="admin-error" role="alert">{adminText(error)}</p>}
      <div className="admin-actions">
        <button type="button" className="admin-button" disabled={busy || !status || (!status.released && !status.ready)} onClick={() => void change()}>
          {adminText(busy ? "Wird gespeichert…" : status?.released ? "Freigabe zurücknehmen" : "Mainnet vollständig freigeben")}
        </button>
        <button type="button" className="admin-button" disabled={busy} onClick={() => {
          setError("");
          void load().catch(() => setError(adminText("Der Freigabestatus konnte nicht geladen werden.")));
        }}>{adminText("Status aktualisieren")}</button>
      </div>
      {!status && !error && <p role="status">{adminText("Freigabestatus wird geladen…")}</p>}
    </section>
  );
}
