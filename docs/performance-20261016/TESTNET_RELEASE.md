# Testnet-Freigabe vom 16. Oktober 2026

Der Nutzer hat ausschließlich die Veröffentlichung im bestehenden öffentlichen
Testnet freigegeben. Die Haupt-App/Produktion bleibt unverändert.

- Fertiger Release-Commit: `5f025e92b6eafd9523512e7b5b048e6777bd923e`.
- Release-Branch: `codex/testnet-stability-20261016`.
- Spielcode entspricht der privat getesteten V5; normaler App-Einstieg, echte
  bestehende Konto-APIs, unveränderte Backend-/Kauf-/Speicherfunktionen.
- Vercel-Build setzt `VITE_CRYPTOID_DIAGNOSTICS=0`; der fertige Build enthält
  weder privates Testmenü, `/api/diagnostics`, Isolation-Stubs noch Startpunkt-Seeding.
- Automatische Git-Deployments dieses Branches sind ausgeschaltet. Veröffentlichung
  nur manuell und ausdrücklich im Projekt `prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF`.
- Rückfallbranch auf GitHub bestätigt: `backup/testnet-before-stability-20261016`
  zeigt auf `1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220`.
- Bisheriges Testnet-Deployment: `dpl_FTwoRZ4GApix1tyJvMPV5XsPnveV`.
- Unveränderte Haupt-App: `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe` im separaten
  Projekt `prj_BAIJH4BzLLwun36kWVEnTdx69j0q`.

## Geprüft

399 Frontend-/Seitentests, 9 Hook-/Lib-Tests und 106 Backendtests bestanden
(514 insgesamt, keine Fehler/übersprungenen Tests). Frontend-Build einschließlich
TypeScript und Sprachprüfung sowie Backend-TypeScript-Build erfolgreich.

Alle 50 Boss-Handoffs behalten Bild und Waffenfläche; Live-/Fall-Host-Bäume sind
identisch. Rendervergleich: 240 leere Löschungen auf 0, 240 unveränderte
Block-Neuberechnungen auf 1; aktive Zeichenbefehle bleiben identisch.

GamePage-Langlauf mit 450 normalen Stufen und 49 Bossen, 13.646,316 simulierten
Sekunden bei 390 × 844 und 120.000 ms ausgewählten längeren Kämpfen bestanden.
Verlaufshash exakt wie V2–V5:
`2168c6035edd5e762b404e8c4568d73a89c41b78d940de51ac8a4d3849a2c398`.
Pause, Hintergrundwechsel, Fehlerbehandlung und Checkpoint-Wiederherstellung
bestanden; nach Ende 0 erfasste RAF/Timer/Listener. Separater tatsächlicher
Übergangstest durchläuft 500 Stufen, 50 Bosse und Bonusrunden bis zum Sieg.
Quellenvergleich bestätigt ursprünglichen HUD, unsichtbare Positionsmarker,
Einflug-/Kampfzeiten, bestehende CSS-/Grafik-/Audioressourcen. Keine Safari-/GPU-
oder Pi-Browser-Simulation behauptet.

Der vom Nutzer eingefügte frische V5-Lauf erfasst Bossmodell 4 bei interner Stufe
40, Textur 2048 × 966, Waffen-Canvas 1090 × 682, Sieg/Freigabe, Extra-Leben,
Bonusrunde und Fortschritt bis 42; Ende Pause → Home. Nutzer bestätigt den
vollständigen HUD in Safari. Dieser kurze Lauf beweist keine dauerhafte
Absturzfreiheit nach längerer Nutzung.

## Veröffentlichung erfolgreich

Am 16. Oktober 2026 um 19:43 Uhr Europe/Vienna wurde der öffentliche Alias
`https://cryptoid-evolution-testnet.vercel.app` auf die freigegebene Version
`5f025e92b6eafd9523512e7b5b048e6777bd923e` geprüft.

- Der Nutzer erstellte im vorhandenen Testnet-Projekt über sein Vercel-Dashboard
  die Vorschau `dpl_5tAmjxyH47BuzqypowAR563mnr5R`; Status `READY`, korrekter
  Release-Branch und Commit bestätigt.
- Anschließend veröffentlichte er dieselbe Version für die feste Testnet-Adresse.
  Das neu gebaute Deployment `dpl_EHy1xmbgB8GqNs9azTYacqEVSg3k` ist `READY`,
  Target `production`, Projekt `prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF`.
  Der öffentliche Testnet-Alias zeigt nachweislich auf dieses Deployment.
- Die separate Haupt-App `https://cryptoid-evolution.vercel.app` zeigt weiterhin
  auf `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe`. Keine Änderung im Hauptprojekt.
- Rückfall bleiben das oben genannte vorherige Testnet-Deployment sowie der
  bestätigte GitHub-Backupbranch auf dem Baseline-Commit.

### Prüfung der öffentlichen Bereitstellung

HTTP-Prüfung ab `2026-10-16T17:43:52Z` direkt an der festen Testnet-Adresse:

- `/` und `/game`: HTTP 200, HTML-App-Einstieg, identischer JavaScript-Einstieg.
- `/api/hangar/catalog`: HTTP 200, JSON mit 51 Angeboten,
  `x-cryptoid-backend: testnet-catalog`.
- `/api/progress/me`: erwartetes HTTP 401 ohne Anmeldung;
  `x-cryptoid-backend: production-proxy`, wie beim bisherigen Testnet.
  Der bestehende Konto-Proxy wurde nicht geändert.
- `/assets/index-Ddn4GwQ_.js`: HTTP 200, JavaScript, 1.886.139 Bytes.
  Keine der geprüften privaten Diagnose-/Isolationsmarkierungen
  (`__cryptoidProbeOptOut`, `Absturzdiagnose V5`, `/api/diagnostics`,
  `Serverzugriff in der Testvorschau deaktiviert`, `__previewLevel`).
- `/assets/index-jaywVuOe.css`: HTTP 200, CSS, 356.857 Bytes.

Diese Prüfung bestätigt Veröffentlichung, App-/Asset-Auslieferung und die
genannten lesenden API-Antworten. Ein Pi-Login, Kauf oder gespeicherter
Spielstand wurde dabei nicht verändert. Ein neuer längerer Lauf im echten
Pi Browser steht noch aus; dauerhafte Absturzfreiheit ist weiterhin nicht
nachgewiesen.

### Zugangsgrenze der automatischen Veröffentlichung

Die Vercel-Verbindung dieses Chats lehnte das Erstellen eines Production-
Deployments im Testnet-Projekt auch nach der gemeldeten Berechtigungsänderung
mit HTTP 403 ab. Der angebotene offizielle CLI-Fallback wurde mit Vercel CLI
64.3.1 und einer vom Nutzer bestätigten Geräteanmeldung versucht; eine
Netzwerksperre zu `api.vercel.com` verhinderte dessen Abschluss.
Geschützte Vorschau-HTTP-Anfragen und Build-Log-Abrufe waren ebenfalls über
die Verbindung nicht zugänglich. Es wurden keine Schutzregeln, Kontorechte,
Produktionsbranches oder Haupt-App-Aliase geändert. Die Veröffentlichung
erfolgte durch den Nutzer in seinem Vercel-Dashboard; der Agent bestätigte
danach Commit, Status, Alias und die öffentliche Auslieferung unabhängig.
