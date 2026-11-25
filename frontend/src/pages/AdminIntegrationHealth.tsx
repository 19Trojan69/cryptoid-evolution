import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { axiosClient } from "../lib/axiosClient";
import { adminText, useAdminLocale } from "../adminLocale";
import { browserIntegrationPollingHost, integrationQuality, RESPONSE_SCALE_MS, startIntegrationPolling } from "./adminIntegrationHealth";
import type { IntegrationCheck, IntegrationReport, IntegrationPollingMode } from "./adminIntegrationHealth";
import { readinessLabel, readinessReason } from "./mainnetReadinessCopy";
import "./AdminIntegrationHealth.css";

const statusNames = { ok: "Erreichbar", warning: "Eingeschränkt", error: "Störung", unknown: "Nicht bestätigt" };

function IntegrationHealthCheck({ check, stale = false }: { check: IntegrationCheck; stale?: boolean }) {
  const quality = integrationQuality(check, stale);
  const hasMeasurement = quality.responseMs !== null;
  const response = Number.isFinite(check.responseMs) && check.responseMs >= 0 ? check.responseMs.toLocaleString("de-AT") : "—";
  return <div className={`admin-health-check ${quality.tone}`}>
    <dt>{adminText(check.label)}</dt>
    <dd>
      <div className="admin-health-reading">
        <strong className="admin-service-status">{adminText(stale ? "Veraltet" : statusNames[check.status])}</strong>
        <strong className="admin-health-ms">{response} {adminText("ms")}</strong>
        <span className="admin-health-quality">{adminText(quality.label)}</span>
      </div>
      {hasMeasurement ? <div className="admin-health-meter" role="meter"
        aria-label={adminText("Antwortzeit: {service}", { service: check.label })}
        aria-valuemin={0} aria-valuemax={RESPONSE_SCALE_MS} aria-valuenow={Math.min(RESPONSE_SCALE_MS, quality.responseMs)}
        aria-valuetext={`${adminText(quality.label)} · ${response} ${adminText("ms")}`}>
        <span style={{ width: `${Math.min(100, quality.responseMs / RESPONSE_SCALE_MS * 100)}%` }} />
      </div> : <div className="admin-health-meter unrated" aria-hidden="true" />}
      <span className="admin-health-detail">{adminText(check.detail)}</span>
    </dd>
  </div>;
}

export default function AdminIntegrationHealth() {
  useAdminLocale();
  const [report, setReport] = useState<IntegrationReport | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  const [mode, setMode] = useState<IntegrationPollingMode>("live");
  const refresh = useRef<(() => void) | null>(null);
  useEffect(() => {
    const polling = startIntegrationPolling({
      host: browserIntegrationPollingHost(),
      request: async signal => (await axiosClient.get<IntegrationReport>("/admin/integration-health", { signal })).data,
      onResult: data => { setReport(data); setStale(false); setError(""); },
      onError: cause => {
        const denied = isAxiosError(cause) && (cause.response?.status === 401 || cause.response?.status === 403);
        if (denied) setReport(null);
        setStale(true);
        setError("Status nicht abrufbar. Bitte Pi-Anmeldung prüfen und erneut abrufen.");
        return !denied;
      },
      onBusy: setBusy,
      onMode: next => { setMode(next); if (next !== "live") setStale(true); },
    });
    refresh.current = polling.refresh;
    return () => { refresh.current = null; polling.stop(); };
  }, []);
  const sdk = typeof window === "undefined" ? undefined : (window as unknown as { Pi?: { authenticate?: unknown; createPayment?: unknown } }).Pi;
  return <section className="admin-panel" aria-labelledby="pi-integration-title">
    <div className="admin-section-head">
      <h2 id="pi-integration-title">{adminText("Pi-Anbindung & NFT-Status")}</h2>
      <button className="admin-button" type="button" disabled={busy || mode === "offline" || mode === "hidden"} onClick={() => refresh.current?.()}>{adminText("Status aktualisieren")}</button>
    </div>
    <p>{adminText("Aktuelle Leseabfragen ohne Zahlung, Mint, Reservierung oder gespeicherte Prüfhistorie.")}</p>
    <p>{adminText("Pi-SDK in diesem Browser:")} <strong>{adminText(typeof sdk?.authenticate === "function" && typeof sdk?.createPayment === "function" ? "Funktionen vorhanden" : "Nicht verfügbar")}</strong></p>
    <p className={`admin-health-live ${mode === "live" && !error && !stale ? "live" : ""}`} role="status">
      {adminText(mode === "offline" ? "Live-Prüfung pausiert · Keine Internetverbindung"
        : mode === "hidden" ? "Live-Prüfung pausiert · Seite im Hintergrund"
        : mode === "blocked" ? "Live-Prüfung angehalten · Pi-Anmeldung prüfen"
        : error ? "Erneuter Abruf automatisch in 15 Sekunden"
        : "Live · Automatische Prüfung alle 15 Sekunden")}
    </p>
    {busy && <p role="status">{adminText("Verbindungen werden abgefragt …")}</p>}
    {error && <p className="admin-error" role="alert">{adminText(error)}</p>}
    {report && <>
      <p>{adminText("Stand:")} {new Date(report.checkedAt).toLocaleString("de-AT", { timeZone: "Europe/Vienna", timeZoneName: "shortOffset" })}</p>
      {stale && <p className="admin-health-stale">{adminText("Letzte Messung · Werte werden erst nach erfolgreicher Prüfung wieder als aktuell angezeigt.")}</p>}
      <dl className="admin-health-checks">{report.checks.map(check => <IntegrationHealthCheck key={check.id} check={check} stale={stale} />)}</dl>
      <p className="admin-health-legend">
        <span className="good">{adminText("Grün: bis 500 ms")}</span>
        <span className="fair">{adminText("Gelb: bis 1.000 ms")}</span>
        <span className="slow">{adminText("Orange: bis 2.500 ms")}</span>
        <span className="bad">{adminText("Rot: über 2.500 ms oder Störung")}</span><br />
        {adminText("Balken: 0 bis 4.000 ms; länger bedeutet langsamer. Eigene Richtwerte, keine Pi-Vorgabe. Fehlende Nachweise bleiben neutral; Einschränkungen mindestens orange.")}
      </p>
      <h3>{adminText("NFT-Käufe im Mainnet:")} {adminText(report.nfts.purchasable ? "Freigegeben" : "Noch nicht verfügbar")}</h3>
      <p>{adminText("Alle Voraussetzungen bleiben gemeinsam verpflichtend.")}</p>
      <ul>{report.nfts.checks.map(check => <li key={check.id}>{adminText(readinessLabel(check.id))}: <strong>{adminText(check.ready ? "Nachgewiesen" : "Offen")}</strong>
        <p>{adminText(readinessReason(check))}</p>
      </li>)}
        <li>{adminText("Wallet-Signierung für NFT-Smart-Contracts:")} <strong>{adminText(report.nfts.walletSigning === "verified" ? "Nachgewiesen" : "Noch nicht nachgewiesen")}</strong></li>
        <li>{adminText("Deine Freigabe:")} <strong>{adminText(report.nfts.ownerReleased === null ? "Nicht abrufbar" : report.nfts.ownerReleased ? "Erteilt" : "Zurückgehalten")}</strong></li>
      </ul>
      <p>{adminText(report.nfts.explanation)}</p>
      <p>{adminText("Es werden keine vorläufigen NFT-Ansprüche oder Kaufreservierungen angelegt. Die Statusanzeige allein aktiviert keine Käufe.")}</p>
      <p>{adminText("Laufend aktualisierte Messung der technischen Verbindung. Sie zeigt keinen Bearbeitungsstand deiner Anträge beim Pi Core Team.")}</p>
    </>}
  </section>;
}
