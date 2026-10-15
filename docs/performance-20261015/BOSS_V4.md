# Cryptoid Evolution – Bossübergang und Absturzspur V4

V4 ist ausschließlich in der bestehenden privaten Testvorschau verfügbar.
Öffentliches Testnet und Produktion wurden nicht aktualisiert. Der vollständige
Geräteabsturz ist weiterhin nicht reproduziert; eine Absturzgarantie wäre falsch.

## Neuer Fehlerbericht und gesicherter Ausgangspunkt

Marcus meldet nach V3 erneut einen Rücksprung zur Startseite nach dem Boss.
Kleine Explosionen erscheinen, der Boss verschwindet zunächst, taucht wieder auf,
sinkt ab und explodiert schließlich. Nach erneutem Öffnen fehlen die Messdaten.
Eine neue Absturzspur ist nicht vorhanden. Der ältere eingefügte Bericht enthält
einen anderen Lauf; der dortige reguläre Verlust aller Leben wurde bereits bestätigt.
Er beweist keine Ursache des jetzt gemeldeten Bossabsturzes.

Ausgangscommit `004fc05a88c5bef7961573c522dae65c7bf90210` ist auf GitHub gesichert;
lokaler Sicherungsbranch `backup/diagnosis-v3-before-crash-20261015`.
Alle Änderungen liegen auf `codex/crash-diagnosis-20261015`.
Öffentlicher Testnet-Baselinecommit bleibt `1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220`.

## Nachgewiesene Schwachstellen und gezielte Änderung

| Befund | V3 | V4 | Beweisgrenze |
| --- | --- | --- | --- |
| Boss-Rumpf und Waffen beim Tod | Kampfansicht entfernt; Fallansicht mit neuem Bild und neuem Canvas montiert | Dieselben Bild-/Canvas-Instanzen wechseln in die bestehende Fallansicht | React-Test für alle 50 Bosse; keine Safari-/Pixelmessung |
| Waffen-Montagen je Kampf plus Fall | 2 | 1 | Sichtbares Ergebnis der jeweiligen Ansichten im Host-Baum gleich |
| Diagnose bei Verlust sämtlicher Browserdaten | Nur native Web Storage bzw. Sitzungsspeicher | Zusätzlich bestätigte technische Sicherung auf der privaten Testseite | Echter HTTPS-/Datenbanktest; letzte ungesendete Daten können fehlen |

`BossHullView` besitzt den Boss vom Kampf bis zum Ende des bestehenden Falls.
Waffen-Texturzustand, dekodiertes Rumpfbild und Canvas bleiben erhalten. Die
vorhandenen Klassen, Bilder, Maße, Feuerstellen, Fragmentdarstellung und
Fünf-Sekunden-Fallanimation bleiben gleich. Der Effekt wird im allgemeinen
Effektbaum nicht zusätzlich gerendert. Der bestehende Schlussknall bleibt bestehen;
die Nutzerbeschreibung beweist keine zweite Simulationszerstörung. Es wurden weder
Explosionen entfernt noch Flugmuster oder Geschwindigkeiten vereinfacht.

Das beseitigt den nachgewiesenen unnötigen Neuaufbau. Ob dieser den beobachteten
Bildaussetzer oder den kompletten Browserausfall verursacht hat, ist noch offen.

## Unabhängige Entwicklerdiagnose

Nur die private Vorschau installiert den optionalen Sicherungsempfänger. Das
öffentliche Spiel bekommt keinen Diagnose-Netzwerkzugriff. Bestehende lokale
Kopien bleiben erhalten. Zusätzlich gehen begrenzte technische Prüfpunkte an
`/api/diagnostics`: regulär höchstens im bestehenden Zehn-Sekunden-Takt, sofort bei
Schaden, Bosszerstörung, Schlussknall sowie Fehler-/Lebenszyklusereignissen.

- Maximal ein laufender und ein zusammengefasster wartender Auftrag; fünf Sekunden
  Timeout einschließlich Antwortkörper; kein Polling und kein Warten der Spielschleife.
- Höchstens 16 aktuelle Messfenster und 64 Ereignisse, zusammen maximal 48 KiB.
  Die volle lokale Messspur bleibt davon unabhängig.
- Feste Positivliste für technische Zahlen, Phasen und Ereignisse; keine Konten,
  Wallets, Eingaben, vollständigen Fehlermeldungen, URLs, Stacks oder Zugriffstoken.
- Flüchtige zufällige Laufkennung, fortlaufende Revision und Serverzeit; veraltete
  Revisionen überschreiben keinen neueren bestätigten Stand.
- Höchstens acht Läufe; Einträge älter als sieben Tage werden beim nächsten
  Zugriff entfernt. Es gibt keine zusätzliche Hintergrundautomation.
- Das Menü zeigt Erfolg erst nach bestätigter Speicherung. Beim Wiederöffnen wird
  die letzte bestätigte Sicherung ohne Web Storage abgerufen und exportierbar.
- Netzwerkfehler blockieren die Simulation nicht. Beim Prozessabbruch können Daten
  seit dem letzten bestätigten Prüfpunkt fehlen. Bereits verlorene V3-Daten lassen
  sich dadurch nicht rückwirkend erzeugen.

Die bestehende private Plattformzugriffsgrenze bleibt erhalten: ein Eigentümer,
keine weiteren Nutzer, Gruppen oder externen Besucher. Der echte HTTPS-Test weist
für nicht authentifizierte Diagnoseabrufe HTTP 401 nach. Testdaten tragen
`server-qa` und erscheinen nicht als letzter Nutzerbericht.

## Tatsächlich ausgeführte Prüfungen

- **412 automatisierte Tests bestanden**, 0 fehlgeschlagen, 0 übersprungen.
  Frontend-Build mit TypeScript und Sprachprüfungen erfolgreich.
- Alle 50 Bosse: gleicher Live-/Fall-Host-Baum wie V3, dieselben Bild-/Canvas-
  Instanzen über den Übergang und zehn Folgeaktualisierungen, vollständiges Aufräumen.
  Die Unterkomponenten verwenden hierbei Präsentationsstubs; GPU, Bilddekodierung
  und CSS-Rasterung werden nicht simuliert. Die Originaldateien bleiben unverändert.
- Tatsächliche GamePage-Simulation bei 390 × 844: **450 normale Stufen, 49 Bosse,
  13.646,316 simulierte Sekunden**. Alle sieben Angriffsmuster, 248.587 Frames mit
  Angreifern und 121.478 mit Rückkehrern erfasst. Nach Beenden 0 erfasste RAF,
  Timer und Listener. Lebens-/Gesundheitsanhebungen und erzwungene Abschlüsse dienen
  ausschließlich dem Test.
- Vollständiger Simulationsverlauf exakt wie V2/V3:
  `2168c6035edd5e762b404e8c4568d73a89c41b78d940de51ac8a4d3849a2c398`.
  Das umfasst Zustände und Kampf-Refs, keine Browserbilder.
- Zusätzlicher Lauf mit Diagnose: 60 normale Stufen, 6 Bosse, 1.513,544 Sekunden,
  gültiger Export und vollständige Bereinigung.
- Separate tatsächliche Übergangsschleife: 500 Stufen, 50 Bosse und Bonusrunden bis
  zum Sieg; Schussablauf, weiterfallende Power-ups, Boost-Zeiten und Wiederherstellung bestehen.
- Quellenvergleich gegen öffentlichen Ausgangspunkt: restliches Spiel-JSX identisch,
  Simulation unverändert bis auf die autorisierten bisherigen V2-Korrekturen und
  reine Messaufrufe. Bestehende CSS-, Bild-, Schrift- und Audiodateien unverändert.
- Alle **262 Originalressourcen** der privaten Vorschau bytegleich. Root-HTML und
  JavaScript-Bundle der veröffentlichten Vorschau entsprechen exakt dem Prüfstand.
- Sicherung: kompletter Browser-Speicherverlust im SQLite-/Client-Test, beschränkte
  Aufbewahrung, Filterung, Timeout auch nach Empfang der HTTP-Header, Netzwerkfehler,
  Zusammenfassung und Schutz vor veralteten Revisionen geprüft.
- Zusätzlich echter authentifizierter HTTPS-Test des bereitgestellten Dienstes:
  Revision 3 gespeichert, Revision 1 kann sie nicht überschreiben, neue unabhängige
  Anfrage stellt denselben Boss-Prüfpunkt wieder her. Datenbank separat lesend geprüft.

Die früheren V3-Optimierungen bestehen weiterhin: bei 240 unveränderten Updates
0 statt 240 leere Canvas-Löschungen und 1 statt 240 Block-Neuberechnungen; aktive
Zeichenbefehle und Blockdarstellung bleiben identisch.

## FPS, ausgeschlossene Vermutungen und offene Tests

Für V4 liegen noch keine vergleichbaren Smartphone-FPS oder Framezeiten vor.
Der ältere Safari-Lauf schwankt zwischen etwa 25–40 und später rund 60 FPS bei
meist nur 1 ms gemessener Simulation. Daraus folgt weder GPU- noch Speicherursache.
Die neuen Änderungen belegen weniger Neuaufbau, keine gemessene Geräte-FPS-Steigerung.

Im automatisierten Verlauf tritt keine zunehmende Ansammlung der erfassten
Spielobjekte, Timer, Listener oder Schleifen auf. Das schließt einen browserinternen
Speicherverlust, GPU-/WebView-Problem, ungeprüften Listener oder seltenen Fehler
nicht generell aus. Die Übergänge bestehen in der Simulation, der gemeldete
Rücksprung und vollständige Eingabeverlust sind auf realer Hardware noch offen.

Die Umgebung bietet keine unterstützte Browser-Teststeuerung. Es wurde kein
Safari-/Pi-Browser-Test erfunden. Ausstehend: Bossbesiegen einschließlich Absinken,
Schlussknall, Bonus und Folgestufe im physischen Safari und Pi Browser; längerer
Vergleich mit/ohne Entwicklermessung; neue echte FPS-/Framezeitmessungen und die
Absturzspur bei erneutem Ausfall. Keine Behauptung, dass das Spiel nun nicht mehr
abstürzen kann.

## Dateien dieser Runde

- `frontend/src/pages/BossHullView.tsx`, `GamePage.tsx`: stabiler Boss-Besitz und
  reine Diagnoseanbindung/Schlussknallmarkierung.
- `performanceDiagnostics.ts`, `diagnosticExport.ts`, `diagnosticExport.test.mjs`:
  optionaler Sicherungsempfänger, Wiederherstellung und Prüfung bei Speicherverweigerung.
- `traceBackupFormat.ts`, `remoteTraceBackup.ts`, `remoteTraceBackup.test.mjs`:
  begrenztes technisches Format, nicht blockierender Client und Diensttests.
- `frontend/previewServer/`: privater Dienst, schema, generierte Migration,
  Routen und reproduzierbare Anleitung; keine öffentliche API-Änderung.
- `frontend/scripts/buildCrashPreview.mjs`, `prepareCrashPreviewServer.mjs`:
  isoliertes V4-Paket und Port in den bestehenden privaten Site-Checkout.
- `verifyBossHandoff.cjs`, `verifyHostedBackup.mjs`,
  `verifyDiagnosisPreservation.cjs`, `verifySimulationStability.cjs`: Prüfwerkzeuge.
- Dieser Bericht, `boss-v4-summary.json`, einzelne Prüfbelege und komprimierte Läufe.
  Der separate private Site-Quellstand enthält den offiziellen Vinext-Starter,
  Originalressourcen, die generierten Routen und D1-Migration.

## Private Vorschau

[Absturzdiagnose V4](https://cryptoid-crash-diagnosis-20261015.xwsk9s27cg.chatgpt.site)
– Menükennung **„Absturzdiagnose V4 · Boss- und Sicherungstest 15.10.“**.
Entwicklermessung eingeschaltet lassen; vor Teststart muss die Sicherung bereit
sein. Stufe 30, 100 oder 500 erlaubt den direkten Bossvergleich. Nach einem
weiteren Ausfall reicht das erneute Öffnen derselben privaten Seite; der letzte
bestätigte technische Stand ist zusätzlich unabhängig abrufbar.

Private Bereitstellung: Version 4, Quellcommit
`81494b13db072753aab10018cc775331f4a70875`, Deployment
`appgdep_6ad131d629108191894a43eeb8e89fe1`, Status `succeeded`.
Testnet-Alias weiterhin `dpl_FTwoRZ4GApix1tyJvMPV5XsPnveV`,
Produktionsalias weiterhin `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe`.
Diagnosebranch in beiden Vercel-Projekten ohne Deployment.
