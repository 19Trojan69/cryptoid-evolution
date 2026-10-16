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

## Veröffentlichung blockiert

Ein einzelner ausdrücklich auf Testnet-Projekt und Release-SHA begrenzter
`create_deployment`-Aufruf mit dessen fester öffentlicher Adresse wurde von
Vercel mit HTTP 403 abgelehnt: „You don't have permission to create a Production
Deployment for this project.“ Vercels Target `production` bezeichnet in diesem
Fall die feste Testnet-Adresse, nicht das separate Haupt-App-Projekt.

Der angebotene CLI-Fallback ist hier nicht verfügbar: kein Vercel-CLI, keine
eigene CLI-Anmeldung und kein vorhandenes VERCEL_TOKEN. Keine erneute identische
Anfrage, keine Umgehung über Alias-/Git-Änderungen und keine Veröffentlichung
im Hauptprojekt. Der Release ist vorbereitet, aber noch nicht öffentlich live.
Nächster Schritt: diesen exakten Commit im bestehenden Testnet-Projekt über
einen berechtigten Vercel-Zugang bereitstellen.
