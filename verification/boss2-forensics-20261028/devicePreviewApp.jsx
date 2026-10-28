import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createBrowserRouter, RouterProvider, useNavigate } from 'react-router-dom';
import { browserDeviceOptions, readDeviceRuns, recordDeviceRun, DEVICE_OPTIONS_KEY } from './devicePreviewAuth.mjs';
import { readFullSessionSummaries, exportFullSession, settleFullSessionWrites } from '../../frontend/src/pages/fullSessionStore.ts';
import { readFlightRecorders } from '../../frontend/src/pages/flightRecorderReport.mjs';
import { readCrashTails } from '../../frontend/src/pages/crashTail.ts';
import { fullSessionText, fullSessionTextPart, shareableFullSessionFile } from '../../frontend/src/pages/fullSessionTransfer.ts';
import { recordApplicationBoot } from '../../frontend/src/pages/reloadDiagnostics.ts';
import { primeGameAudio } from '../../frontend/src/pages/gameAudio.ts';
import { requestGameFullscreen } from '../../frontend/src/pages/gameFullscreen.ts';
import './devicePreview.css';

const Game = lazy(() => import('../../frontend/src/pages/GamePage.tsx'));
// Every new document opens the report/menu, including after a hard WebView exit.
// A user click is required to mount another scene. Never auto-resume old combat.
if (location.pathname !== '/') history.replaceState(null, '', '/');
recordApplicationBoot(window);

function Menu() {
  const navigate = useNavigate();
  const [options, setOptions] = useState(browserDeviceOptions);
  const downloadUrl = useRef(null);
  useEffect(() => () => { if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current); }, []);
  const [sessions, setSessions] = useState([]), [prepared, setPrepared] = useState(null);
  const [message, setMessage] = useState('Lokale Diagnose wird gelesen …');
  const [text, setText] = useState('');
  const [textCapture, setTextCapture] = useState(null), [part, setPart] = useState(0);
  useEffect(() => { let active = true;
    void settleFullSessionWrites().then(() => readFullSessionSummaries(window)).then(result => {
      if (!active) return;
      setSessions(result.sessions);
      const tails = readCrashTails(window);
      const lastPause = tails.sessions.flatMap(tail => tail.events || []).filter(event => event.kind === 'pause').sort((a, b) => a.at - b.at).at(-1);
      setMessage(result.sessions.length ? `${result.sessions.length} Diagnosebericht(e) vorhanden${lastPause ? ' · Letzte Pause: ' + lastPause.data.pauseReason : ''}`
        : result.storage !== 'available' ? 'Vollständige Speicherung nicht verfügbar. Der begrenzte lokale Bericht bleibt abrufbar, soweit gespeichert.' : 'Bereit. Noch kein Testlauf gespeichert.');
    }).catch(() => { if (active) setMessage('Lokaler Speicher nicht verfügbar. Ein Bericht kann nach einem Abbruch fehlen.'); });
    return () => { active = false; };
  }, []);
  const start = () => {
    try {
      sessionStorage.setItem(DEVICE_OPTIONS_KEY, JSON.stringify(options));
      localStorage.setItem('cryptoid_language', 'de');
      localStorage.setItem('cryptoid_control_hand', 'right');
      recordDeviceRun(localStorage, options, Date.now());
    } catch { /* The current in-memory run still works without storage. */ }
    window.__deviceBossOptions = { ...options };
    window.__bossLabHold = options.protection;
    window.__bossLabDirect = false;
    window.__bossLabOpened = false;
    window.__bossLabPauseEvents?.splice(0);
    setPrepared(null); primeGameAudio(); requestGameFullscreen(); navigate('/game');
  };
  const prepare = async id => {
    setMessage('Bericht wird vorbereitet …'); setText(''); setTextCapture(null); setPart(0);
    try {
      const full = id ? await exportFullSession(window, id) : null;
      const history = (() => { try { return readDeviceRuns(localStorage); } catch { return []; } })();
      const startedAt = sessions.find(session => session.id === id)?.startedAt;
      const matched = startedAt ? history.filter(row => row.at <= startedAt).at(-1) : null;
      const details = { version: 1, format: 'cryptoid-isolated-boss2-device-report',
        source: __CRYPTOID_BUILD__, isolatedGuest: true, testOptions: matched,
        testOptionsHistory: history, testOptionsMatchedByStartTime: !!matched,
        truePiAuthentication: false, actualPhysicalDeviceVerified: false,
        automaticTransmission: false, nativeTerminationCauseMeasured: false,
        flightRecorders: readFlightRecorders(window), crashTails: readCrashTails(window) };
      const blob = new Blob([JSON.stringify(details).slice(0, -1), ',"fullSession":', full || 'null', '}'], { type: 'application/json' });
      setPrepared({ blob, id: id || 'isolated-boss2', name: 'cryptoid-boss2-diagnose.json' });
      setMessage('Bericht bereit. Speichern oder über „Teilen“ manuell senden.');
    } catch { setMessage('Vollständiger Bericht nicht lesbar. Bitte den begrenzten Bericht vorbereiten.'); }
  };
  const download = () => {
    if (!prepared) return;
    if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
    const url = URL.createObjectURL(prepared.blob), link = document.createElement('a');
    downloadUrl.current = url;
    link.href = url; link.download = prepared.name; link.click();
    // The URL is retired on another download or menu unmount; no combat timer.
    link.remove();
  };
  const share = () => {
    if (!prepared) return;
    const file = shareableFullSessionFile(prepared.blob, prepared.id, navigator);
    if (!file) { setMessage('Dateifreigabe hier nicht verfügbar. Bitte „Speichern“ oder den Berichtstext verwenden.'); return; }
    void navigator.share({ files: [file] }).catch(() => setMessage('Teilen abgebrochen. Der Bericht bleibt vorbereitet.'));
  };
  const showText = async () => {
    try { const capture = await fullSessionText(prepared.blob, prepared.id); setTextCapture(capture); setPart(0); setText(fullSessionTextPart(capture, 0)); }
    catch { setMessage('Berichtstext nicht verfügbar. Bitte die vollständige Datei speichern.'); }
  };
  const showPart = index => { setPart(index); setText(fullSessionTextPart(textCapture, index)); };
  return <main className="device-preview-menu"><section>
    <p className="device-preview-eyebrow">CRYPTOID EVOLUTION · PRIVATER TEST</p>
    <h1>Boss 2 direkt testen</h1>
    <p>Diese getrennte Gastszene verändert deinen echten Spielstand nicht. Anmeldung, Käufe und Rangliste sind gesperrt. Grafik, Ton und Spieluhren stammen aus dem Spiel.</p>
    <label>Startszene<select value={options.scene} onChange={event => setOptions({ ...options, scene: event.target.value })}>
      <option value="reactor">Boss 2 · Reaktor offen</option><option value="turrets">Boss 2 · Mit Geschützen</option>
    </select></label>
    <label className="device-preview-check"><input type="checkbox" checked={options.diagnostics} onChange={event => setOptions({ ...options, diagnostics: event.target.checked })} />Diagnose lokal aufzeichnen</label>
    <label className="device-preview-check"><input type="checkbox" checked={options.protection} onChange={event => setOptions({ ...options, protection: event.target.checked })} />Testschutz: Tod und Bossende verhindern</label>
    <p className="device-preview-note">Testschutz ist eine künstliche Hilfe für längere Messungen. Der Reaktorstart entfernt Geschütze und setzt die Bossgesundheit auf die Hälfte.</p>
    <button className="device-preview-primary" onClick={start}>Boss-2-Test starten</button>
    <p>Prüfe die Aktionen einzeln: normal spielen, schnell nach links wischen, Screenshot, App-Wechsel. Echte Pausen werden nur von dir fortgesetzt.</p>
    <h2>Nach einer Pause oder einem Abbruch</h2>
    <p>Diese Testadresse erneut öffnen. Vor dem nächsten Test den letzten Bericht vorbereiten und speichern oder teilen. Die Aufzeichnung bleibt auf diesem Gerät; es gibt keinen automatischen Upload.</p>
    <p role="status">{message}</p>
    {sessions.map(session => <button key={session.id} onClick={() => void prepare(session.id)}>Bericht vorbereiten · {new Date(session.startedAt).toLocaleString('de-AT')}</button>)}
    <button onClick={() => void prepare(null)}>Begrenzten lokalen Bericht vorbereiten</button>
    {prepared && <div><button onClick={download}>Bericht speichern</button><button onClick={share}>Bericht teilen</button><button onClick={() => void showText()}>Berichtstext in Teilen anzeigen</button></div>}
    {textCapture && <div><p>Teil {part + 1} von {textCapture.offsets.length - 1}. Für den vollständigen Bericht sind alle Teile nötig.</p><button disabled={part === 0} onClick={() => showPart(part - 1)}>Vorheriger Teil</button><button disabled={part >= textCapture.offsets.length - 2} onClick={() => showPart(part + 1)}>Nächster Teil</button></div>}
    {text && <textarea aria-label="Diagnosebericht" value={text} readOnly />}
    <p className="device-preview-note">Ein fehlender letzter Eintrag beweist keine bestimmte Absturzursache. Betriebssystem-, nativer Grafik- und gesamter Prozessspeicher sind hier nicht direkt messbar. Teststand: {__CRYPTOID_BUILD__.sourceCommit.slice(0, 8)}.</p>
  </section></main>;
}
const router = createBrowserRouter([{ path: '/game', element: <Suspense fallback={<p>Testszene wird geladen …</p>}><Game /></Suspense> }, { path: '*', element: <Menu /> }]);
export default function DevicePreviewApp() { return <RouterProvider router={router} />; }
