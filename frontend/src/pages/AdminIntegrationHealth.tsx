import { useCallback, useEffect, useState } from "react";
import { axiosClient } from "../lib/axiosClient";
import { adminText, useAdminLocale } from "../adminLocale";

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
  useAdminLocale();
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
      <h2 id="pi-integration-title">{adminText("Pi-Anbindung & NFT-Status")}</h2>
      <button className="admin-button" type="button" disabled={busy} onClick={() => void load()}>{adminText("Status aktualisieren")}</button>
    </div>
    <p>{adminText("Aktuelle Leseabfragen ohne Zahlung, Mint, Reservierung oder gespeicherte Prüfhistorie.")}</p>
    <p>{adminText("Pi-SDK in diesem Browser:")} <strong>{adminText(typeof sdk?.authenticate === "function" && typeof sdk?.createPayment === "function" ? "Funktionen vorhanden" : "Nicht verfügbar")}</strong></p>
    {busy && <p role="status">{adminText("Verbindungen werden abgefragt …")}</p>}
    {error && <p className="admin-error" role="alert">{adminText(error)}</p>}
    {report && <>
      <p>{adminText("Stand:")} {new Date(report.checkedAt).toLocaleString("de-AT", { timeZone: "Europe/Vienna", timeZoneName: "shortOffset" })}</p>
      <dl className="admin-checks">{report.checks.map(check => <div key={check.id}>
        <dt>{adminText(check.label)}</dt><dd><strong className={`admin-service-status ${check.status}`}>{adminText(statusNames[check.status])}</strong> · {check.responseMs.toLocaleString("de-AT")} {adminText("ms")}<br />{adminText(check.detail)}</dd>
      </div>)}</dl>
      <h3>{adminText("NFT-Käufe im Mainnet:")} {adminText(report.nfts.purchasable ? "Freigegeben" : "Noch nicht verfügbar")}</h3>
      <ul>{report.nfts.checks.map(check => <li key={check.id}>{adminText(nftNames[check.id] || check.id)}: <strong>{adminText(check.ready ? "Nachgewiesen" : "Offen")}</strong></li>)}
        <li>{adminText("Wallet-Signierung für NFT-Smart-Contracts:")} <strong>{adminText(report.nfts.walletSigning === "verified" ? "Nachgewiesen" : "Noch nicht nachgewiesen")}</strong></li>
        <li>{adminText("Deine Freigabe:")} <strong>{adminText(report.nfts.ownerReleased === null ? "Nicht abrufbar" : report.nfts.ownerReleased ? "Erteilt" : "Zurückgehalten")}</strong></li>
      </ul>
      <p>{adminText(report.nfts.explanation)}</p>
      <p>{adminText("Es werden keine vorläufigen NFT-Ansprüche oder Kaufreservierungen angelegt. Die Statusanzeige allein aktiviert keine Käufe.")}</p>
      <p>{adminText("Momentaufnahme der technischen Verbindung. Sie zeigt keinen Bearbeitungsstand deiner Anträge beim Pi Core Team.")}</p>
    </>}
  </section>;
}
