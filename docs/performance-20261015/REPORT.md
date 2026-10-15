# Cryptoid Evolution – Performance- und Absturzdiagnose, 15.10.2026

**Ergebnis: Die gemeldete Rückkehr zur Startseite wurde nicht reproduziert. Eine Absturzursache und eine dauerhafte Behebung sind deshalb noch nicht nachgewiesen.** Es wurde kein spekulativer Eingriff in das Gameplay vorgenommen. Fertig sind die reproduzierbaren Ablaufprüfungen, eine abschaltbare Entwicklerdiagnose und eine getrennte private Smartphone-Testseite.

## Ausgangspunkt und Schutz der veröffentlichten Version

Der öffentliche Testnet-Link lieferte vor und nach der Arbeit Commit `1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220` aus, Deployment `dpl_FTwoRZ4GApix1tyJvMPV5XsPnveV`. Der Ausgangspunkt wurde als lokaler Branch `backup/performance-baseline-20261015` gesichert; derselbe unveränderliche Commit ist auf GitHub über `backup/testnet-20261012-1c1c7f9` vorhanden. Diagnose-Branch: `codex/crash-diagnosis-20261015`, direkt auf diesem Ausgangspunkt. `main` wurde nicht verändert. Keine Änderung an Konten, Datenbank, Käufen, Testnet- oder Produktionsveröffentlichungen.

Automatische Vercel-Deployments sind ausschließlich für den Diagnose-Branch in dessen eigener Konfiguration ausgeschaltet. Die neue private Testseite ist ein eigenes Projekt mit gesperrten Konto-APIs und getrenntem Arbeitsspeicher für Testfortschritt. Sie greift nicht auf echte Spielstände zu.

## Nachgewiesene Ergebnisse

- 356 automatisierte Frontend-Funktionstests bestanden; Backend- und Frontend-Build erfolgreich.
- Vorher-/Nachher-Vergleich der tatsächlichen GamePage-Simulation, deterministischer Zufallsstart: jeweils 450 normale Kampfstufen und 49 Boss-/Bonusrunden bei 800 × 600 und 390 × 844. Jeder Lauf umfasst 13.646 Sekunden beziehungsweise etwa 3 Stunden 47 Minuten **beschleunigte simulierte** Zeit.
- Zusätzlich verlängerte Kampffenster an Stufen 1, 25, 49, 99, 249 und 499 sowie Bossen 10, 50, 100 und 250. Alle sieben Muster beobachtet: dive, curve, side, sCurve, loop, double und vDive; im Smartphone-Lauf 248.587 Frames mit Angriffsflug und 121.478 Frames mit Rückflug.
- Der bestehende separate Engine-Test durchlief alle 500 Stufen, 50 Bosse und 50 Bonusrunden bis zum Sieg. Gegner-/Bossabschlüsse werden in diesen Kampagnentests teilweise erzwungen; die verlängerten Kampffenster verwenden zusätzliche Leben und sehr hohe Gegnergesundheit. Das ist kein vollständiger menschlicher Spieldurchlauf.
- Vorher und nachher identischer Hash der regelmäßig erfassten vollständigen Spielzustände und Spiel-Refs, in beiden Formaten. Keine doppelte Spielschleife in den Läufen; nach Beenden jeweils 0 erfasste RAF, Timer und Listener. Die Tests zählen die vom Simulationshost installierten Ressourcen tatsächlich, einschließlich der Bereinigung.
- Vorhandene Tests bestätigen weiterfallende Power-Ups bei Übergängen, geschützte Boost-Zeiten, Pause/Fortsetzen, Checkpoint-Wiederherstellung und sichere Pause bei injiziertem Fehler, ohne Navigation oder Verlust von Punkten und Waffenzeit.
- Quellvergleich bestätigt: gesamtes Spiel-JSX, Bewegungs-/Einflugfunktionen, Größen, Formationsberechnung und Simulationscode sind nach Entfernung der rein beobachtenden Diagnoseaufrufe identisch mit dem Ausgangspunkt. Keine CSS-, Grafik- oder Sounddatei geändert.

## Messungen und ihre Grenzen

Die Tabelle zeigt CPU-Zeit pro Simulationsschritt im Node-Test bei 390 × 844, **keine Browser-Framezeit oder Smartphone-FPS**. Parallel laufende Prozesse und Garbage Collection beeinflussen die Messungen; die Unterschiede begründen keine Optimierungsbehauptung.

| Abschnitt | vorher p95 | nachher p95 |
| --- | ---: | ---: |
| Formation | 0,095 ms | 0,095 ms |
| Angriffsflug | 0,110 ms | 0,105 ms |
| Rückflug | 0,085 ms | 0,085 ms |
| Übergang | 0,025 ms | 0,025 ms |
| Bosskampf | 0,150 ms | 0,135 ms |

Die Node-Speicherwerte der langen 800-×-600-Läufe lagen inklusive Testhost und gesammelten Snapshots ungefähr zwischen 29 und 31 MiB. Ausgangs- und Diagnosefassung verhielten sich ähnlich. Das schließt Lecks im DOM, in dekodierten Bildern, Audio, GPU oder WebView nicht aus. Darstellung, echte React-Commit-Kosten, Browser-Thermik und Pi-Host sind in der Simulation nicht vorhanden. Es gibt deshalb **keinen belastbaren FPS-Vorher-/Nachher-Wert und keinen Nachweis dauerhafter Smartphone-Stabilität**.

## Entwicklerdiagnose

Nur ein ausdrücklich mit `VITE_CRYPTOID_DIAGNOSTICS=1` gebautes Entwicklerpaket kann die Messung aktivieren; ein URL-Parameter im öffentlichen Spiel genügt nicht. Die private Testseite hat dafür einen Schalter im Testmenü. Im Spiel selbst erscheinen keine zusätzlichen Anzeigen.

Erfasst werden tatsächliche RAF-Abstände, FPS, Median/p95/Maximum der Framezeiten, Simulationsabschnitte, aktive Gegner/Angreifer/Rückflieger, beide Projektilarten, Effekte, Felsen, Power-Ups, Schussabstände und blockierte Salven an der bestehenden Projektilgrenze. In unterstützten Browsern zusätzlich Long Tasks, JavaScript-Heap, laufende DOM-Animationen, gezeichnete Fragmentknoten, DOM-Knoten, Bildcache und aktive Audio-Stimmen. Phasen-/Block-/Formationswechsel tragen Zeitstempel und Dauer.

Browserweite Timer-/Listenerzahlen sind nicht allgemein zugänglich. Die Stichproben kennzeichnen daher explizit nur bekannte Besitzer: Loop-Wächter, Game-over-/Reload-Hinweistimer und fünf Diagnose-Lifecycle-Listener. Sie werden nicht als Gesamtzahlen ausgegeben. JavaScript-Heap ist kein Gesamt-/GPU-Speicherwert. Fragmentknoten sind keine unabhängigen Simulationspartikel.

Ein begrenzter lokaler Ring hält 90 Messfenster und 64 Ereignisse. Reguläres Speichern höchstens alle zehn Sekunden, Fehler und Seitenereignisse sofort; keine zusätzlichen Spiel-Timer oder RAF. Fehlerprotokolle enthalten gegebenenfalls Asset-Dateiname und Zeile/Spalte, aber keine Exception-Nachrichten, vollständigen Stacks, URLs, Tokens, Wallets oder Kontodaten. Keine automatische Übertragung. Speicherverweigerung und fehlende Browser-APIs sind getestet.

Fehler, beabsichtigte Home-/Speichern-und-Verlassen-Aktionen, Unmount, pagehide und pageshow lassen sich unterscheiden. Ein fehlendes pagehide ist lediglich ein Hinweis auf einen abgebrochenen Prozess; es beweist weder Speicherknappheit noch einen WebView-Neustart.

## Veränderte Dateien

| Datei | Zweck |
| --- | --- |
| `frontend/src/pages/GamePage.tsx` | Beobachtende Messpunkte und Lifecycle-Protokoll; Spiel-JSX und Mechaniken unverändert |
| `frontend/src/pages/performanceDiagnostics.ts` | Begrenzte, abschaltbare Entwicklerdiagnose |
| `frontend/src/pages/performanceDiagnostics.test.mjs` | Begrenzung, Pause, Datenschutz und Fehlertoleranz prüfen |
| `frontend/src/pages/gameLoop.test.mjs` | Bestehende VM-Prüfungen um die optionale Diagnose-Referenz ergänzen |
| `frontend/scripts/verifySimulationStability.cjs` | Lange Angriffsfenster, Smartphone-Format, Zustandshashes und Node-CPU-Messung |
| `frontend/scripts/verifyDiagnosisPreservation.cjs` | Vergleich gegen den unveränderlichen öffentlichen Stand |
| `frontend/scripts/buildCrashPreview.mjs` | Getrennte Testseite mit Originalressourcen, gesperrten Konto-APIs und Berichtsdownload |
| `vercel.json` | Automatisches Deployment nur des Diagnose-Branches verhindern |
| `docs/performance-20261015/` | Bericht, Zusammenfassung und komprimierte Rohmessungen |

## Was offen bleibt

Alte Levelobjekte, doppelte Formationseinrichtung, konkurrierende Levelwechsel und anwachsende Timer-/Listenerzahlen haben sich in den durchgeführten Simulationen nicht gezeigt. **Global ausgeschlossen sind diese Ursachen dadurch nicht.** Kein Geräteabsturz, WebView-Prozessabbruch, unbeabsichtigter realer Seitenwechsel oder schleichender Browser-FPS-Abfall wurde nachgestellt. Es gibt daher noch keine nachgewiesene ursächliche Korrektur.

Die Umgebung stellt keine unterstützte Browser-Teststeuerung zur Verfügung. Es wurde kein Pi Browser und kein physisches iPhone bedient. Die private Seite ist erfolgreich bereitgestellt; ihr sichtbarer Ablauf muss noch auf dem Gerät bestätigt werden. Netzwerk-/Kontoverhalten der angemeldeten Testnet-Fassung ist wegen der gewollten Isolation nicht Bestandteil dieser Vorschau.

## Nächster Gerätetest

[Private Smartphone-Testseite](https://cryptoid-crash-diagnosis-20261015.xwsk9s27cg.chatgpt.site)

1. In Safari und anschließend im Pi Browser öffnen, Entwicklermessung eingeschaltet lassen. Bei Stufe 25 beginnen, danach auch Übergänge zu Boss und Bonusrunde spielen.
2. Originalmusik nach Wunsch aktiv lassen; mindestens 20–30 Minuten einschließlich normaler Angriffe und Schusssequenzen spielen. Zusätzliche Starts nahe 49/50 und 99/100 stehen bereit.
3. Nach einem Ausfall dieselbe private Testseite erneut öffnen und **„Letzten Diagnosebericht herunterladen“** wählen. Auch nach einem unauffälligen Lauf einen Bericht speichern.
4. Einen vergleichbaren Lauf mit ausgeschalteter Messung durchführen, um den Diagnoseaufwand zu beurteilen. Der vorhandene Home-Button führt zum Testmenü zurück.

Mit dem realen Fehlerbericht lässt sich anschließend eine konkrete Korrektur auswählen. Eine Veröffentlichung auf dem öffentlichen Testnet oder der Spielproduktion ist weiterhin nicht erfolgt und bedarf der ausdrücklich gewünschten Freigabe.

Reproduktion der lokalen Prüfungen: `node scripts/verifyDiagnosisPreservation.cjs`; `node --experimental-strip-types --test src/pages/*.test.mjs src/hooks/*.test.mjs src/lib/*.test.mjs`; `node checks/build.mjs` und `node checks/run-engine.cjs`; für lange Vergleiche `CRYPTOID_SIMULATION_BLOCKS=450 CRYPTOID_SUSTAIN_MS=120000 CRYPTOID_WIDTH=390 CRYPTOID_HEIGHT=844 node --expose-gc scripts/verifySimulationStability.cjs` aus `frontend/`. Vorher-/Nachher-Quelle über `CRYPTOID_GAME_SOURCE` wählen. Rohwerte liegen als `.json.gz` neben `summary.json`; synthetische Zeitwerte sind keine Geräte-FPS.
