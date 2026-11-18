import { useCallback, useEffect, useState } from "react";
import { axiosClient } from "../lib/axiosClient";

type Check = { id: string; label: string; status: "ok" | "warning" | "error" | "unknown"; detail: string; responseMs: number };
type Report = {
  checkedAt: string;
  checks: Check[];
  nfts: { purchasable: boolean; ownerReleased: boolean | null; walletSigning: string; reservationMode: false;
    checks: { id: string; ready: boolean }[]; explanation: string };
};
const statusNames = { ok: "Erreichbar", warning: "Eingeschränkt", error: "Störung", unknown: "Nicht bestätigt" };
const nftNames: Record<string, string> = {
  walletCheckout: "Mainnet-Kaufablauf und Ziel-Wallet nachgewiesen",
  nftIssuance: "NFT-Ausgabe durch Mainnet-Transaktion nachgewiesen",
  nftMetadata: "Dauerhafte Bild- und Metadatenadressen vollständig",
};
export default function AdminIntegrationHealth() {
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    setBusy(true); setError(""); setReport(null);
    try {
      const { data } = await axiosClient.get<Report>("/admin/integration-health", { signal });
      if (!signal?.aborted) setReport(data);
    } catch {
      if (!signal?.aborted) setError("Status nicht abrufbar. Bitte Pi-Anmeldung prüfen und erneut abrufen.");
    } finally { if (!signal?.aborted) setBusy(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const sdk = typeof window === "undefined" ? undefined : (window as unknown as { Pi?: { authenticate?: unknown; createPayment?: unknown } }).Pi;
  return <section className="admin-panel" aria-labelledby="pi-integration-title">
    <div className="admin-section-head">
      <h2 id="pi-integration-title">Pi-Anbindung & NFT-Status</h2>
      <button className="admin-button" type="button" disabled={busy} onClick={() => void load()}>Status aktualisieren</button>
    </div>
    <p>Aktuelle Leseabfragen ohne Zahlung, Mint, Reservierung oder gespeicherte Prüfhistorie.</p>
    <p>Pi-SDK in diesem Browser: <strong>{typeof sdk?.authenticate === "function" && typeof sdk?.createPayment === "function" ? "Funktionen vorhanden" : "Nicht verfügbar"}</strong></p>
    {busy && <p role="status">Verbindungen werden abgefragt …</p>}
    {error && <p className="admin-error" role="alert">{error}</p>}
    {report && <>
      <p>Stand: {new Date(report.checkedAt).toLocaleString("de-AT", { timeZone: "Europe/Vienna", timeZoneName: "shortOffset" })}</p>
      <dl className="admin-checks">{report.checks.map(check => <div key={check.id}>
        <dt>{check.label}</dt><dd><strong className={`admin-service-status ${check.status}`}>{statusNames[check.status]}</strong> · {check.responseMs.toLocaleString("de-AT")} ms<br />{check.detail}</dd>
      </div>)}</dl>
      <h3>NFT-Käufe im Mainnet: {report.nfts.purchasable ? "Freigegeben" : "Noch nicht verfügbar"}</h3>
      <ul>{report.nfts.checks.map(check => <li key={check.id}>{nftNames[check.id] || check.id}: <strong>{check.ready ? "Nachgewiesen" : "Offen"}</strong></li>)}
        <li>Wallet-Signierung für NFT-Smart-Contracts: <strong>{report.nfts.walletSigning === "verified" ? "Nachgewiesen" : "Noch nicht nachgewiesen"}</strong></li>
        <li>Deine Freigabe: <strong>{report.nfts.ownerReleased === null ? "Nicht abrufbar" : report.nfts.ownerReleased ? "Erteilt" : "Zurückgehalten"}</strong></li>
      </ul>
      <p>{report.nfts.explanation}</p>
      <p>Es werden keine vorläufigen NFT-Ansprüche oder Kaufreservierungen angelegt. Die Statusanzeige allein aktiviert keine Käufe.</p>
      <p>Momentaufnahme der technischen Verbindung. Sie zeigt keinen Bearbeitungsstand deiner Anträge beim Pi Core Team.</p>
    </>}
  </section>;
}
