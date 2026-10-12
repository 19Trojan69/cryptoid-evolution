# Cryptoid Evolution: unabhängige Absturzanalyse, 12. Oktober 2026

## Ergebnis und Geltungsbereich

**Der gemeldete erneute iPhone-/Pi-Browser-Abbruch ist nicht reproduziert und seine Behebung nicht nachgewiesen.** Es wurden unabhängig davon konkrete Fehler in Navigation, Fehlerabfang und Audioinitialisierung reproduziert und gezielt korrigiert. Die unbeschränkte Produktion von Save-Outbox-Barrieren bei langen Netzproblemen wird durch eine technische Pause begrenzt. Keine Behauptung garantierter Absturzfreiheit.

Nur Stabilität, Ressourcenlebensdauer und lokale Diagnose sind Gegenstand dieses Branches. Kein Main-Merge, keine neue Testnet-/Mainnet-Veröffentlichung, keine bezahlte Änderung, keine Live-Datenbank-Wiederherstellung. Ein echter iPhone-/Pi-Browser-/WebKit-Langzeittest steht aus. Der dazugehörige [Gerätetestplan](stability-audit-device-test-2026-10-12.md) ist Teil des Ergebnisses.

## 1. Ausgangslage und tatsächliche Builds

Vor Änderungen gelesen: `AGENTS.md`, `frontend/AGENTS.md` und die drei Berichte `stability-performance-2026-10-12.md`, `testnet-enemy-motion-2026-10-12.md`, `backup-recovery-2026-10-12.md`. Die widersprüchliche frühe Mainnet-Grundlage wurde ausdrücklich nicht übernommen.

Arbeitsbranch: **codex/stability-audit-20261012**, aus **16fcfb43aad836de0e38f684c0d4cade82b78976**, dem geprüften Head des weiterhin offenen Draft-PR #159. Gegenüber dem veröffentlichten Testnet-Commit 1c1c7f9 enthält dieser Ausgangsstand nur zusätzliche Backup-Dokumentation/Anweisungen. Die genehmigte Testnet-Grundlage **21eb4b2151b9e5cb5b1f32f3e78d666bb860fdb1** wurde zu Beginn als Vorfahr geprüft. Die anschließend genehmigten Pendelbewegungen und um 10 % verlängerten normalen Einflüge aus 1c1c7f9 bleiben erhalten.

| Umgebung | Tatsächlich geprüfter Commit | Deployment | Zustand |
| --- | --- | --- | --- |
| [Öffentliches Testnet](https://cryptoid-evolution-testnet.vercel.app) | 1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220 | dpl_FTwoRZ4GApix1tyJvMPV5XsPnveV | READY; öffentlicher Alias geprüft |
| [Öffentliches Mainnet](https://cryptoid-evolution.vercel.app) | 907d2a7363345d00f0f90c54402bf04e887b64d9 | dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe | READY; öffentlicher Alias geprüft |

Vercel-Alias und Deployment-Metadaten wurden separat abgefragt. Zusätzlich lieferten beide öffentlichen URLs HTTP 200 und ihre tatsächlichen JS-/CSS-Bundles. Das Testnet-CSS `index-jaywVuOe.css` hat SHA256 **c93f34d1220e0e84a74e17db399c91d51a23c18b07c32289124c0eeaa76b91cd**; der neue lokale Produktions-Build liefert exakt dasselbe CSS. Vercels Zielbezeichnung `production` im Testnet-Projekt bezeichnet dessen öffentliche Testnet-URL, nicht das Mainnet.

Für den erneuten Vorfall sind vom Nutzer **Testnet, iPhone/Pi Browser und normaler Kampf** bestätigt. Exaktes iPhone-Modell, iOS-/Pi-Browser-Version, Level/Block, Spieldauer und Datum/Uhrzeit bleiben unbekannt. Die spätere gezielte Nachfrage brachte keine zusätzlichen Angaben. Der heute geprüfte Live-Build ist deshalb **nicht automatisch der Build zum Zeitpunkt des Abbruchs**. Frühere Meldungen zu Meme Nebula 5/9 oder Boss-Explosionen beschreiben andere Vorfälle und werden nicht als Beweis für die neue Situation verwendet.

## 2. Bestätigte Fehler und Korrekturen

### Modal-History: fremden/veralteten Guard blind zurückgenommen

`useModalNavigation` entfernte jeden vorgefundenen `location.state.cryptoidModalGuard` mit `navigate(-1)`. Nach Reload/Browser-Wiederherstellung hat der neu montierte Hook dessen Vorgänger und Eigentum nicht mehr gesichert. Wiederholte Effect-Ausführung konnte dieselbe noch nicht abgeschlossene Navigation erneut auslösen.

Drei neue Regressionstests scheiterten am Ausgangscode und bestehen mit der Korrektur. Zusätzlich wurde im echten Produktions-Chromium eine History mit Home als Vorgänger und einem veralteten Guard auf `/game` wiederhergestellt: der Ausgangscode wechselte nach `/`; die Korrektur bleibt auf `/game`.

Der Hook merkt sich ausschließlich den tatsächlich selbst erzeugten Guard und einen ausstehenden Übergang. Unbekannte Guard-Marker werden durch `REPLACE` auf derselben URL entfernt; andere Location-State-Daten, Query und Hash bleiben erhalten. Nur ein eigener Guard darf einmal zurückgenommen werden. Bestehende geschachtelte Modale, Back-Verhalten und Fokussteuerung bleiben erhalten. Dies ist ein nachgewiesener Navigationsfehler, **kein Nachweis der Ursache des Nutzerabbruchs**.

### GamePage-Präsentation außerhalb der bisherigen Scene-Boundary

JSX-Argumente und berechnete Präsentationswerte werden im aufrufenden `GamePage` ausgeführt, bevor dessen bisherige innere Boundary wirksam ist. Ein dort injizierter Fehler erreicht im Ausgangscode den Router-Fallback und demontiert den Besitzer des laufenden Kampfzustands.

Die unveränderte vollständige Präsentation wird jetzt in einem festen Kind der `GameSceneBoundary` ausgewertet. `GamePage` mit Run-/Kampf-Refs bleibt montiert. Eine technische Unterbrechung pausiert, schützt den vorhandenen Zustand und versucht den bestehenden Checkpoint-Pfad. Back und Resume dürfen eine weiterhin fehlgeschlagene, unsichtbare Szene nicht starten. Nach erfolgreichem Retry werden Spielfeld-Observer und Eingabe-Listener sauber erneut gebunden. Eine weitere Regression prüft, dass auch eine erst später abgeschlossene Lade-/Aktivierungsanfrage eine weiterhin fehlgeschlagene Szene nicht unsichtbar simulieren lässt; der tatsächliche Step pausiert vor der Simulation erneut.

Die normale Spielansicht wurde nicht umgestaltet. Der vorhandene technische Fehlerdialog mit denselben Texten/Styles wird weiterverwendet. Fehler in beliebigen Owner-Hooks, Auth-Initialisierung oder im Fallback selbst lassen sich damit nicht sämtlich abfangen; solche Route-Fehler werden jetzt lokal kategorisiert. Es gibt keine neue automatische Home-Navigation als Fehlerbehandlung.

### AudioContext: ungeschützte und teilweise veröffentlichte Initialisierung

AudioContext-Erzeugung und Verbindung des Gain-/Limiter-Graphen lagen vor dem bisherigen `try`. Ein werfender nativer Host führte zu einer abgelehnten Start-Promise; ein teilweise erzeugter Graph konnte für spätere Versuche stehen bleiben. Beide Fälle wurden mit nativen Host-Fixtures reproduziert; die neuen Tests scheiterten vor der Änderung und bestehen danach.

Der dritte Audio-Regressionsfall zeigt eine konkrete Nebenwirkung der alten Sample-Vorbereitung: Nach einem Allocation-Fehler blieben zwei statt 18 Boss-Samples als scheinbar bereit stehen; ein Retry ergänzte sie nicht. Mit der Korrektur stehen nach Retry alle 18 bereit. Nachweis: `regression-proof.json`.

Die Initialisierung verwendet lokale Ressourcen und veröffentlicht sie erst nach erfolgreicher Verbindung. Ein fehlgeschlagener Teilgraph wird getrennt/geschlossen, `start()` liefert kontrolliert `false`, und eine spätere normale Benutzeraktion kann erneut starten. Synthese-Puffer werden vollständig vorbereitet, bevor die vorhandenen Sample-Maps als bereit gelten. Eine gleichzeitig abgelehnte Resume-Promise wird nicht unbehandelt gelassen.

Keine Änderung an Samples, Generatoren, Klang, Pitch, Lautstärke, Gain-/Limiter-Werten, Mischverhalten, bestehenden Voice-Grenzen oder hörbarer Überlagerung. Ein Hörvergleich auf echter Audiohardware ist dennoch ausstehend.

### Save-Outbox unter längeren Netzproblemen

Die vorhandene Zusammenfassung aufeinanderfolgender, noch nicht hochgeladener Checkpoints wirkt: 1.000 Checkpoints desselben Abschnitts ergeben in der Fixture zwei Einträge, einschließlich des laufenden Uploads. Reward-/Score-Barrieren dürfen dagegen nicht zusammengefasst werden und hatten keinen Produktions-Stopp. Bei einem anhaltenden Ausfall konnte die Liste samt wiederholter Serialisierung weiter wachsen. Das ist eine belegbare Ressourcen-Schwäche, keine gemessene OOM-Ursache auf dem iPhone.

Die bestehende Queue meldet jetzt Druck bei **32 Einträgen**, einer **konservativen UTF-16-Schätzung von 2 MiB** oder gescheiterter lokaler Persistierung. Der bestehende GameLoop pausiert daraufhin mit `save-pressure`. Es werden weder Reward-/Score-Ereignisse verworfen noch neue Queue-/Save-Systeme eingeführt. Die Pause produziert keinen weiteren rekursiven Save. Resume bleibt gesperrt, solange der Druck besteht; der vorhandene Retry-/Drain-Pfad bleibt verfügbar. Nach erfolgreich wiederhergestelltem Storage wird `durable` wieder korrekt `true`.

Getestet: 30 unterschiedliche Reward-Barrieren bleiben hinter zwei Checkpoints vollständig erhalten; nach Netzfreigabe werden alle 32 Einträge einmal übertragen. Quota-Verweigerung, anschließend verfügbarer Storage, große Payloads sowie tatsächliche GamePage-Pause/Resume wurden geprüft. Die Grenze ist ein Producer-Stopp, kein harter Byte-Allocator-Limit: ein einzelner großer Eintrag und bereits laufende Operationen können sie überschreiten. Bei einem späteren vollständigen Prozessverlust ist nur zuletzt bestätigter bzw. lokal haltbarer Fortschritt wiederherstellbar, kein garantierter letzter Frame.

### Unnötige UUID-Erzeugung bei jedem React-Render

`useRef(crypto.randomUUID())` erzeugte bei jedem Render eine neue UUID, obwohl nur der erste Wert im Ref blieb. Der Run-Key wird jetzt einmal lazily angelegt; bestehende absichtliche Reset-/Restart-Stellen bleiben gleich. Diese Arbeit erzeugte kurzlebige Allokationen, keine nachgewiesene dauerhaft wachsende Objektliste. Der Browser misst die tatsächlich ausgeführten Aufrufe vor/nach der Änderung.

## 3. Diagnose und kritische Prüfung bestehender Optimierungen

Es bleibt ein einziger Guarded GameLoop, die bestehende Save-Outbox und der bisherige Ressourcen-Cache. Keine zusätzliche Qualitätssteuerung, keine Partikelreduktion, kein neuer Paint-Takt. Insbesondere die vorhandenen 32-/50-ms-React-Paints auf kompakten Geräten werden weder verschärft noch verändert; die Simulation und direkte Schiffsbewegung behalten den bisherigen RAF-/Delta-Pfad.

Die lokale Diagnose umfasst maximal **20** bereinigte Einträge, den Build, Sektor/Block/Phase, Gegner/Geschosse/Effekte, Frame-Lücken, synchrone Simulationsarbeit, letzte bestätigte Speicherung, Navigation (`PUSH/POP/REPLACE`) und Lifecycle-Ereignisse. Ein fester 1.024-Sample-Ring benötigt ungefähr 16 KiB; Zusammenfassungen werden im vorhandenen Zehn-Sekunden-Rhythmus erstellt. Keine per-Frame-Storage-Schreibvorgänge.

Ein explizites Feld-Allowlisting bereinigt auch alte Einträge. Keine Konten, Zugangsdaten, Query-Parameter, rohe Fehlermeldungen oder Stacks; kein automatischer Upload. Ein freiwilliger Download ist ausschließlich über `?cryptoid_diagnostics=download` vorgesehen, ohne neues Menü oder normalen Download beim Start. Diese Funktion ist erst im vorbereiteten Branch enthalten, **nicht im aktuellen öffentlichen Testnet**. Download und Bereinigung bestehen im isolierten Browser-Test; die exportierte Fixture enthält vier bereinigte Einträge. Erzeugte Blob-URLs werden nach der Download-Gelegenheit widerrufen.

Der per-Tab-Marker wird auch beim App-Start geprüft, falls eine Wiederherstellung auf Home landet. App und GamePage melden denselben alten Marker höchstens einmal. Alte Marker ohne Build werden als `unknown` gekennzeichnet. `page-reload`, `background-interrupted` und `foreground-interrupted` sind Hinweise. Ein normaler Reload kann einen Hinweis erzeugen; ein verlorener sessionStorage-Marker verhindert ihn. **Browser-JavaScript kann einen OS-Kill nicht sicher feststellen.**

Geprüfte bestehende Ressourcenpfade:

- Lackierungen: LRU-Ziel 48 Varianten/geschätzte 24 MiB, acht Quellbilder, aktive Verbraucher gepinnt, nur ungenutzte Blob-URLs widerrufen. Canvas-Flächen werden nach Pixel-/Blob-Arbeit auf null gesetzt; Pending-Jobs serialisiert und nach Abschluss entfernt. Aktive Pins können das Ziel überschreiten. Die Quellbildanzahl begrenzt keine native Dekodiergröße. Visuelle Zentren halten kleine Werte aus dem endlichen Schiffskatalog, keine Bilder.
- Bosswaffen: WeakMap pro sichtbarem Canvas, explizites Dispose beim Unmount, alte Basisflächen beim Resize freigegeben, nur aktuelles Hitze-Tile pro Waffe. Textur-Cache hält höchstens zwei Bosswaffenbilder; daraus folgt keine Kenntnis des tatsächlichen GPU-Speichers.
- Gegner, eigene/feindliche Geschosse und Effekte: vorhandene Ablauf-/Außerhalb-Filter und Übergangsbereinigung unverändert. Stress-Fixtures prüfen die Entfernung eingespritzter Objekte. Normale Objektspitzen und Cache-Aufwärmung sind kein Beweis eines Leaks.
- Starfield/SectorBackdrop: vorhandene Memoisierung, feste SVG-Sternfelder, zeitlich begrenztes Flare; Listener/Observer/Timer mit Cleanup. Keine neue Grafikvereinfachung. Hintergrund-Pause und Effect-Alterung behalten ihren bisherigen Pfad.
- Audio/Musik: bestehende ended-/Pause-/Close-Cleanup-Pfade, Sample-Abbruch und Metadaten-Listener geprüft; nur die oben nachgewiesene Graph-Initialisierung geändert. Native Puffer/GPU-/Audiohardware sind nicht durch JS-Heap messbar.
- Checkpoint-/Reward-/Highscore-Backend: vorhandene Run-/Sequenzprüfung, Reward-Event-Keys, Version-/CAS-Updates und Netzwerkgrenzen bleiben unverändert. Regressionstests decken Wiederholungen und stale Requests ab. Es erfolgte keine reale Zahlung und keine Live-Konto-/Belohnungsmutation.

## 4. Offene Hypothesen und Unterscheidung der Abbrucharten

| Kategorie | Beleglage dieses Audits |
| --- | --- |
| JavaScript-/React-Fehler | Ungeschützte Präsentation und Audio-Startfehler reproduziert; kein Fehlerprotokoll des Nutzerereignisses vorhanden. |
| Navigation/History/Modal | Veralteter Guard reproduziert Home-Navigation; dessen Auftreten im Nutzerereignis bleibt unbekannt. |
| Auth-Weiterleitung | Quellen und vorhandene Auth-Tests geprüft. Normale 401-/Netzfehler setzen Auth-Status; OAuth-Weiterleitung ist ein anderer, begrenzter Sign-in-Pfad. Kein Nachweis einer Auth-Weiterleitung während dieses Kampfes. |
| Reload/Browser-Wiederherstellung | Getrennte Navigation-/Lifecycle-/Restart-Hinweise vorbereitet. Ohne Daten des Vorfalls ist Reload nicht von Prozess-Neustart sicher unterscheidbar. |
| Normale Pause/Hintergrund | Simulation und synthetische Browser-Lifecycle-Ereignisse prüfen Timer-Schutz. Keine Home-Rückkehr erforderlich; keine OS-Hintergrundverwaltung simuliert. |
| Rendering/GPU/native Speicher | Software-GPU belastet den Test deutlich; gemessenes JS-Heap enthält keine dekodierten Bilder, Compositor-Flächen, GPU-/Audio-Puffer oder WebKit-Prozessdaten. |
| Betriebssystem beendet Browserprozess | Offen. Wärme beweist diese Ursache nicht. Browser-JavaScript und fehlerfreie Serverlogs können sie weder bestätigen noch ausschließen. |

Der vorhandene Foreground-Stall-Guard pausierte auch im Software-Renderer beim anfänglichen Aufwärmen. Ein unvollständiger Entwicklungsdurchlauf pausierte ebenfalls zwischen Automationsbefehlen: die zuerst automatisch weiterlaufende virtuelle Uhr ließ langsame Software-GPU-/GC-Arbeit als RAF-Stall erscheinen. Die Kampagnenuhr wird deshalb nach dem Laden zwischen Befehlen eingefroren und nur bewusst fortgeschaltet. Dieser Testaufbaufehler ist kein reproduzierter iPhone-Abbruch; unvollständige Läufe zählen nicht als 30-Block-Nachweis. Das wurde als `loop-stall` erfasst; für die Messung wurde danach ausdrücklich fortgesetzt. Eine erste Messung einer noch pausierten Seite mit null Samples wurde verworfen und separat mit laufender RAF wiederholt. Diese Pause wird nicht als Nutzerabbruch oder FPS-Ergebnis ausgegeben.

## 5. Tests, Messwerte und Erhalt der Freigaben

- **390 Frontend-Tests**, null Fehler/übersprungene Dateien; neue Regressionen für Modal-Eigentum/Effect-Replay, native Audiofehler, Diagnose-Bereinigung/Restart-Deduplizierung, failed-scene-Resume und Save-Druck.
- **106 Backend-Tests** und Backend-TypeScript-Build erfolgreich; Backend-Quellen unverändert. Der Backend-Build muss vor der Frontend-Suite vorliegen, weil ein bestehender Turret-Test dessen Build-Ausgabe importiert. Ein anfänglicher Parallelstart ohne diese Ausgabe war ein Testaufbaufehler und wurde mit korrekter Reihenfolge behoben.
- Produktions-Build mit TypeScript, vollständigen Übersetzungsprüfungen und Release-Gate erfolgreich. Bestehende Warnung über große Vite-Chunks bleibt; keine neue Qualitätsstufe oder Änderung der CSS-Reihenfolge.
- Reale GamePage-Node-Simulation vor/nach: 30 normale Blöcke plus Bosse 10/20/30, Meme Nebula 25 = Block 5/9, 80 eigene + 80 feindliche Geschosse + zwölf Explosionen, 30 s Pause, 60 s Hintergrund, Frame-Fehler und mehrfacher tatsächlicher Serializer/Restore. Nach Unmount jeweils **0 RAF-Callbacks, 0 Timer, 0 Listener**.
- Vorhandener Engine-Test mit tatsächlicher Übergangslogik: **500 Stufen, 50 Bosse, 50 Bonusrunden bis Victory**; Formations-/Power-up-/Timer-/Belohnungsprüfungen erfolgreich.
- Eigenständiger Produktions-Browser-Harness: echte React-/Router-/Canvas-Ausführung in Chromium 153, 390×844 CSS-Pixel/DPR 3, Software-GPU, Original-Styles und Assets. Kampagnenzeit wird virtuell gesteuert; Clears/Bosszerstörung/zusätzliche Leben und API-/Save-Fixtures sind offen dokumentierte Hilfen. Der separate Frame-Test läuft mit echter Scheduling-Zeit. Nach Änderungen bestehen 30 normale Blöcke plus Bosse 10/20/30, Meme-Stress und 60 s synthetische Background-Lifecycle-Ereignisse, höhere Stufen 101/481/500, zehn Wiederherstellungen, Renderfehler mit erhaltenem Besitzer/Progress, Back-Sperre während der fehlgeschlagenen Szene, Retry/Resume mit erneut funktionierender Pointer-Steuerung sowie der freiwillige lokale Diagnose-Download. Kein Pi Browser/WebKit, kein mobiler 30–60-Minuten-Beweis, keine echte Servertransaktion. Details und Messgrenzen stehen in [comparison.json](stability-audit-2026-10-12/comparison.json).

**Vor-/Nach-Messwerte** und Rohdaten stehen in [comparison.json](stability-audit-2026-10-12/comparison.json). Je 36 GC-bereinigte Übergangsmessungen:

| Messung | Vorher | Nachher |
| --- | --- | --- |
| Browser-JS-Heap, erster → letzter Punkt | 8,334 → 9,710 MiB | 8,315 → 9,714 MiB |
| Browser-JS-Heap, Minimum–Maximum | 8,334–9,749 MiB | 8,315–9,752 MiB |
| Node-JS-Heap, erster → letzter Punkt | 29,255 → 29,751 MiB | 29,256 → 29,728 MiB |
| Lackierungscache: Varianten / Quellbilder | maximal 48 / 8 | maximal 48 / 8 |
| Geschätzte Lackierungsressourcen | maximal 16,964 MiB | maximal 16,964 MiB |
| Maximale DOM-Anzahl an Übergängen | 503 | 505 |
| Gegner / eigene Schüsse / feindliche Schüsse / Effekte, Node-Spitze | 6 / 82 / 80 / 14 | 6 / 82 / 80 / 14 |

Die Speicherentwicklung ist praktisch gleich, keine behauptete allgemeine RAM-Senkung. Caches wärmen auf und der Harness hält Messpunkte; diese Zahlen enthalten weder native Dekodier-/GPU-/Audioflächen noch OS-Prozessspeicher. Die Vergleichsgrenze: vor der Korrektur lief die virtuelle Kampagnenuhr zwischen Automationsbefehlen weiter, danach ist sie eingefroren; der Nachher-Lauf enthält außerdem einen zusätzlichen synthetischen Hintergrundwechsel. Keine allgemeine Leak-Freiheit daraus ableiten.

Echtzeit-Frameproben: jeweils 5 s Aufwärmen, bewusstes Fortsetzen nach eventuell beobachtetem Anfangs-Stall, anschließend 20 s Sampling; gleiche Viewport-/DPR-/Software-GPU-/Seed-/Stress-Einstellung und derselbe Chromium-Single-Process-Modus:

| Lauf | Samples | Mean / p95 / Maximum, Frame-Lücke | Mean / Maximum, synchrone Simulation | UUID-Aufrufe |
| --- | --- | --- | --- | --- |
| Vorher, erste gültige Probe | 247 | 79,9 / 200,0 / 799,9 ms | 0,486 / 14,9 ms | 198 |
| Nachher, erste Probe | 184 | 108,1 / 283,3 / 1416,7 ms | 0,491 / 15,6 ms | 2 |
| Vorher, Wiederholung | 138 | 143,4 / 533,2 / 950,0 ms | 1,578 / 63,3 ms | 122 |
| Nachher, Wiederholung | 272 | 72,5 / 200,0 / 499,9 ms | 0,669 / 75,6 ms | 2 |

Die erste Paarung hat nachher größere Frame-Lücken, die Wiederholung kleinere. Bereits derselbe unveränderte Vorher-Code schwankt stark. Kurze Software-GPU-Läufe enden in unterschiedlichen Kampfphasen/Objektzuständen; Frame-Lücke und Simulationsarbeit sind keine GPU-Messung. **Weder eine allgemeine FPS-Steigerung noch eine mobile Performance-Regressionsfreiheit ist belegt.** Eindeutig belegt sind die beseitigten UUID-Erzeugungen pro Render, nicht garantierte mobile Frameraten. Die anfangs pausierte Null-Sample-Probe wurde ausdrücklich verworfen.

Erhalt wird zusätzlich durch `scripts/verifyStabilityPreservation.cjs` überprüft: vollständiges normales `<main className="game-shell">`-Markup nach Entfernung der unsichtbaren alten Boundary-Tags **bytegleich**; Styles und Public-Assets **unverändert**; `createFormationSlots`, `spawnAsteroid`, `moveAsteroid`, `simulate`, `destroyBoss`, `activateStartPower`, `saveCombat`, `restoreCombat` **bytegleich**. 42 Audio-Member einschließlich Playback/Mixing/Cleanup sowie Sample-Gains identisch; nur Start/atomare Sample-Vorbereitung verändert. Das Produktions-CSS stimmt zusätzlich mit dem öffentlich ausgelieferten Testnet-CSS überein.

Die bestehenden HUD-/Formations-/Einflug-/Sway-/500-Stufen-/Netzwerk-/Kauf-/Karten-/Waffen-/Timer-Tests bestehen. Kein höherer Header, keine sichtbaren Marker, keine Preis-/Damage-/Geschwindigkeits-/Power-up-Änderung. Dies ist belastbare Quellen-/Logikevidenz, **kein behaupteter Pixel-/Hörvergleich auf dem iPhone**.

Reproduktion: zuerst `cd backend && npm run build`, dann alle Backend-`src/**/*.test.mjs` mit `node --experimental-strip-types --test`; Frontend entsprechend alle `src/**/*.test.mjs`, `npm run build`, `node --expose-gc scripts/verifySimulationStability.cjs`, `node checks/build.mjs`, `node checks/run-engine.cjs`, `node scripts/verifyStabilityPreservation.cjs`. Browser: `PLAYWRIGHT_MODULE_PATH`, `CRYPTOID_CHROMIUM` und ggf. Laufzeit-/Fontpfade setzen, dann `CRYPTOID_AUDIT_SINGLE_PROCESS=1 node scripts/verifyStabilityAudit.cjs`; für Ausgangscode `CRYPTOID_AUDIT_BASELINE=1`, für nur den gültigen Echtzeit-Vergleich zusätzlich `CRYPTOID_AUDIT_PERF_ONLY=1`. QA-Hooks werden ausschließlich vom Test-Harness injiziert, nie vom normalen Build.

Frühe lokale Test-Builds wurden aus dem noch nicht vollständig committeten Arbeitsbaum erstellt. Ihr eingeblendeter Git-Kurzstand alleine bezeichnet daher nicht den kompletten Testinhalt. Der abschließende Browser-Lauf verwendet den committeten lokalen Runtime-Stand 36f7083; alle zehn erfassten Quell-Hashes wurden gegen den finalen Runtime-Inhalt geprüft. Die entsprechend gespeicherten GitHub-Commits haben wegen der Connector-Commit-Metadaten andere Commit-SHAs, aber exakt dieselben Git-Tree-SHAs und Dateiinhalte. Spätere Dokumentations-/Deploy-Sperr-Commits ändern den getesteten Runtime-Code nicht. Ein späterer sauberer Deployment-Build muss seine eigene eindeutige Build-ID tragen.

## 6. Backups, Rücksetzweg und Veröffentlichung

Verifizierte datierte Code-Refs: `backup/testnet-20261012-1c1c7f9` und `backup/mainnet-20261012-907d2a7`, per `git ls-remote` auf die genannten Live-Commits geprüft. Beide ursprünglichen Vercel-Deployments existieren weiterhin als READY. Zusätzlich wurde der Testnet-Code mit `git archive` isoliert extrahiert: **alle 1.070 getrackten Dateien gegen ihre Git-Blob-Hashes geprüft, null Abweichungen**. [Nachweis](stability-audit-2026-10-12/code-restore-verification.json). Dies ist ausdrücklich **nur Code-/Asset-Restore**, kein Datenbank-Restore und kein unabhängiges Datenbackup.

Die tatsächliche öffentliche Testnet-API leitet die entsprechenden Benutzer-/Progress-/Payment-Pfade über den vorhandenen Gateway an das Mainnet-Backend weiter und erhält `x-cryptoid-app-network: testnet`. Ein Backup einer beliebigen Preview-Datenbank würde daher nicht genügen. Daten und Zahlungsgrenzen bleiben unverändert; keine Connection-Strings oder entschlüsselten Umgebungsschlüssel wurden abgerufen.

**Datenbank-Backup und isolierter Datenbank-Restore sind nicht verifiziert.** Es fehlen prüfbare Nachweise zu tatsächlicher Datenbank/Collections, Backup-Provider/Job, Abschlusszeit, Retention sowie isolierter Restore-Verifikation. Mit den verfügbaren Verbindungen ist kein Atlas-/MongoDB-Backupnachweis zugänglich. Historische Angaben zur Provider-Konfiguration werden nicht als heutige Tatsachen ausgegeben. Das bedeutet nicht, dass sicher kein Backup existiert; es bedeutet, dass der geforderte Schutz nicht bestätigt ist.

Die Änderungen sind im separaten [Draft-PR #160](https://github.com/19Trojan69/cryptoid-evolution/pull/160) gegen den bestehenden Stabilitätsbranch gesichert; PR #159 bleibt erhalten.

Der Entwicklungsbranch deaktiviert ausschließlich seine eigenen automatischen Git-Deployments in `vercel.json`. Beim Speichern wird der Branch erst auf den vollständigen Commit mit dieser Sperre angelegt. Bestehende Branches werden nicht überschrieben, PR #159 bleibt erhalten. Vor jeder späteren öffentlichen Veröffentlichung sind der reale Datenbank-Backup-/Restore-Nachweis und eine ausdrückliche Veröffentlichungserlaubnis weiterhin erforderlich.

Rücksetzweg: Code-Diff dieses Branches verwerfen bzw. auf 16fcfb4 zurückgehen; für eine ausdrücklich genehmigte Live-Code-Rückkehr den passenden vorhandenen Deployment-/Backup-Commit nutzen und die Netzwerk-/Produktionskonfiguration prüfen. **Kein automatischer DB-Restore, keine Reward-/Payment-Replays.** Ein Code-Rollback nimmt Datenbanktransaktionen nicht zurück.
