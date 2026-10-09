import { useLocale } from "../i18n";
import { useEffect, useState } from "react";
import { axiosClient } from "../lib/axiosClient";

type Row = { hour: string; browser: string; network: string; visits: number; activeSeconds: number; gameSeconds: number };
type Result = { since: string; until: string; rows: Row[] };
const names: Record<string, string> = { pi: "Pi Browser", external: "Externe Browser", unknown: "Nicht erkennbar" };
const number = (n: number) => n.toLocaleString("de-AT", { maximumFractionDigits: 1 });
const time = (s: number) => `${number(s / 60)} Min.`;
const totals = (rows: Row[]) => rows.reduce((sum, r) => ({ visits: sum.visits + r.visits, activeSeconds: sum.activeSeconds + r.activeSeconds, gameSeconds: sum.gameSeconds + r.gameSeconds }), { visits: 0, activeSeconds: 0, gameSeconds: 0 });
const stamp = (s: string) => new Date(s).toLocaleString("de-AT", { timeZone: "Europe/Vienna", dateStyle: "short", timeStyle: "short" });
const dayFormat = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vienna" });
const hourFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Vienna", hour: "2-digit", hourCycle: "h23" });

export default function AdminUsage() {
  const { t } = useLocale();
  const [days, setDays] = useState(7), [network, setNetwork] = useState("mainnet"), [reload, setReload] = useState(0);
  const [result, setResult] = useState<Result | null>(null), [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void axiosClient.get<Result>("/admin/usage", { params: { days, network }, signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) { setResult(data); setError(""); }
    }).catch(() => { if (!controller.signal.aborted) { setResult(null); setError("Statistik nicht verfügbar. Bitte Anmeldung prüfen und erneut versuchen."); } });
    return () => controller.abort();
  }, [days, network, reload]);
  const rows = result?.rows || [];
  const total = totals(rows);
  const daily = new Map<string, Row[]>();
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, visits: 0, activeSeconds: 0, gameSeconds: 0 }));
  for (const row of rows) {
    const instant = new Date(row.hour);
    const day = dayFormat.format(instant);
    const group = daily.get(day) || []; group.push(row); daily.set(day, group);
    const bucket = hourly[Number(hourFormat.format(instant))];
    bucket.visits += row.visits; bucket.activeSeconds += row.activeSeconds; bucket.gameSeconds += row.gameSeconds;
  }
  const change = (action: () => void) => { setResult(null); setError(""); action(); };
  return <section className="admin-panel">
    <h2>{t("Zugriffsstatistik – ohne persönliche Nutzungsverläufe")}</h2>
    <p>{t("Nur stündliche Summen. Keine Namen, Pi-IDs, IP-Adressen, Besuchskennungen, Cookies oder Fingerprints in dieser Statistik. Keine Verknüpfung mit Anmeldung, Zahlungen oder Bestenliste.")}</p>
    <div className="admin-actions">
      <label>{t("Zeitraum")} <select value={days} onChange={e => change(() => setDays(Number(e.target.value)))}>{[1, 7, 30, 90].map(n => <option key={n} value={n}>{n === 1 ? t("Letzte 24 Stunden") : t("Letzte {value0} Tage", {value0: n})}</option>)}</select></label>
      <label>{t("Umgebung")} <select value={network} onChange={e => change(() => setNetwork(e.target.value))}><option value="mainnet">Mainnet</option><option value="testnet">Testnet</option><option value="all">{t("Beide")}</option></select></label>
      <button className="admin-button" onClick={() => change(() => setReload(n => n + 1))}>{t("Aktualisieren")}</button>
    </div>
    {error ? <p role="alert">{t(error)}</p> : !result ? <p role="status">{t("Statistik wird geladen …")}</p> : <>
      <p>{t("Erfasstes Zeitfenster:")} {stamp(result.since)} – {stamp(result.until)} {t("(Wien). Speicherung: 90 Tage.")}</p>
      <div className="admin-actions"><strong>{number(total.visits)} {t("Aufrufe")}</strong><strong>{time(total.activeSeconds)} {t("aktive Nutzung")}</strong><strong>{time(total.gameSeconds)} {t("unpausierte Spielansicht")}</strong></div>
      {rows.length === 0 && <p>{t("Noch keine Daten im ausgewählten Zeitraum. Die Erfassung beginnt erst mit dieser Veröffentlichung; frühere Besuche lassen sich nicht nachträglich rekonstruieren.")}</p>}
      <h3>{t("Browser-Verteilung")}</h3>
      <div className="admin-usage-scroll"><table><thead><tr><th>{t("Browser")}</th><th>{t("Aufrufe")}</th><th>{t("Anteil")}</th><th>{t("Aktive Nutzung")}</th><th>{t("Spielansicht")}</th></tr></thead><tbody>{Object.entries(names).map(([key, label]) => { const s = totals(rows.filter(r => r.browser === key)); return <tr key={key}><th>{t(label)}</th><td>{number(s.visits)}</td><td>{total.visits ? number(s.visits / total.visits * 100) : 0}%</td><td>{time(s.activeSeconds)}</td><td>{time(s.gameSeconds)}</td></tr>; })}</tbody></table></div>
      <h3>{t("Tagesübersicht")}</h3>
      <div className="admin-usage-scroll"><table><thead><tr><th>{t("Tag (Wien)")}</th><th>Pi</th><th>{t("Extern")}</th><th>{t("Unbekannt")}</th><th>{t("Aktive Nutzung")}</th><th>{t("Spielansicht")}</th></tr></thead><tbody>{[...daily.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([day, entries]) => <tr key={day}><th>{day}</th>{Object.keys(names).map(b => <td key={b}>{number(totals(entries.filter(r => r.browser === b)).visits)}</td>)}<td>{time(totals(entries).activeSeconds)}</td><td>{time(totals(entries).gameSeconds)}</td></tr>)}</tbody></table></div>
      <details><summary>{t("Verteilung nach Tageszeit (Wien)")}</summary><p>{t("Summen über alle ausgewählten Tage, keine individuellen Besuchszeiten.")}</p><div className="admin-usage-scroll"><table><thead><tr><th>{t("Stunde")}</th><th>{t("Aufrufe")}</th><th>{t("Aktive Nutzung")}</th><th>{t("Spielansicht")}</th></tr></thead><tbody>{hourly.map(h => <tr key={h.hour}><th>{String(h.hour).padStart(2, "0")}:00</th><td>{number(h.visits)}</td><td>{time(h.activeSeconds)}</td><td>{time(h.gameSeconds)}</td></tr>)}</tbody></table></div></details>
    </>}
    <p>{t("Aufrufe sind keine eindeutigen Personen: Neuladen zählt erneut. Aktive Zeit wird in maximal 30-Sekunden-Beiträgen geschätzt; versteckte Seiten und mehr als 60 Sekunden ohne Eingabe werden nicht mitgezählt. Teilintervalle, Verbindungsabbrüche und blockierte Erfassung können zu Unterzählung führen. Browserangaben sind technische Hinweise, keine bestätigten Identitäten; automatisierte oder gefälschte Aufrufe können nicht vollständig ausgeschlossen werden. Admin- und Rechtstextseiten werden nicht gezählt.")}</p>
  </section>;
}
