# Cryptoid Evolution – Darstellungskorrektur V3, 15.10.2026

**Zwei nachgewiesene Wiederholungen bei der Darstellung sind entfernt. Die Diagnose arbeitet sparsamer und zeichnet Spielzustände korrekt auf. Eine Verbesserung der Smartphone-FPS ist damit noch nicht gemessen.** Das frühere vollständige Einfrieren bleibt nicht reproduziert.

## Ausgangspunkt

Separater Diagnose-Branch `codex/crash-diagnosis-20261015`, Ausgangscommit `9cdf32caba9787f94879c380673de9f21a798562` (private V2). Dieser Commit ist bereits auf GitHub gesichert; zusätzlicher lokaler Sicherungsbranch `backup/diagnosis-v2-before-render-20261015`. Öffentlicher Testnet-Ausgangspunkt bleibt `1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220`. Keine Freigabe für Testnet/Produktion, keine Veröffentlichung dort.

Marcus bestätigte zum neuen echten Diagnosebericht: Safari, regulärer Verlust aller Leben, kein Stillstand in diesem Lauf. Die erhaltenen Messfenster zeigen wiederholt etwa 25–40 FPS und spätere Erholung in Richtung 60 FPS. Die gemessene Simulation benötigt meistens höchstens 1 ms. Auch Übergänge ohne Gegner/Projektile ruckeln. Der Bildcache bleibt bei 48 Einträgen; die zuletzt gestarteten Vorbereitungsaufträge sind abgeschlossen. Das grenzt die Suche ein, beweist aber weder einen GPU-Engpass noch einen bestimmten Browserfehler. Der Bericht enthält keine Gesamt-/GPU-Speichermessung und keine Temperaturdaten.

## Gemessen, dann korrigiert

Die tatsächlichen Komponenten wurden vor und nach der Änderung mit React 19.3.1 und dessen Test-Renderer abgeglichen. Canvas-Aufrufe sind aufgezeichnete Befehle eines Testkontexts, keine Browser-/Pixelmessung.

| Wiederholung bei 240 Aktualisierungen | vorher V2 | nachher V3 |
| --- | ---: | ---: |
| Vollflächiges Löschen einer bereits leeren Felsen-Zeichenfläche | 240 | 0 |
| Neuberechnung des unveränderten Block-Hinweises | 240 | 1 |
| Löschungen direkt nach dem letzten sichtbaren Felsen-/Effektbild | 1 | 1 |
| Weitere Zeichenbefehle während 80 leerer Folgeaktualisierungen | 160 | 0 |

`BonusRockLayer` merkt sich nun, ob noch etwas auf der Fläche steht. Der letzte sichtbare Inhalt wird weiterhin entfernt; eine Größenänderung setzt die Fläche wie bisher zurück. Alle Zeichenbefehle für aktive Felsen, Treffer, Staub und Bruchstücke sind im Vergleich **identisch** (SHA-256 `09aa798948fe7913ee9656740d0425830bc3a283498668bd8baf885c98f0f03f`). Auflösung, Texturen, Anzahl, Bewegung und Dauer bleiben gleich.

`BlockchainProgress` überspringt mit React `memo` die Neuberechnung bei unveränderten Eigenschaften. Blockzahl, Gespeichert-Zustand und Sprachwechsel werden weiter aktualisiert. Die vollständigen Host-Bäume für normalen, geänderten und gespeicherten Zustand stimmen mit V2 überein. Animationen bleiben montiert und behalten alle bisherigen CSS-Regeln.

Diese Messung beweist weniger überflüssige Arbeit. Sie beweist nicht, dass genau diese beiden Stellen die gesamten Safari-Ruckler oder den früheren Stillstand verursacht haben.

## Genauere und sparsamere Entwicklerdiagnose

- Der Messkontext übernimmt jetzt auch `destroying`, `game-over`, `paused` und verbleibende Herzen. Die neue Zustandsfolge wird bei Änderungen gespeichert; Home/Unmount behalten nicht mehr irreführend `playing`.
- FPS werden aus der Summe der tatsächlich erfassten Frameintervalle berechnet. Sehr kurze Phasenfenster hatten zuvor eine zusätzliche Verzerrung durch ihren abweichenden Zeitnenner. `sampleDurationMs` macht kurze Fenster erkennbar; wenige Frames bleiben statistisch wenig belastbar.
- Aufwendige DOM-/Animations-/Cache-/Audioabfragen laufen höchstens einmal in zwei Sekunden statt bei jedem Phasenwechsel. `runtimeAgeMs` zeigt das Alter der Zähler; `runtimeSampleMs` misst die Kosten dieser Diagnoseabfrage.
- `sceneRequests`, `sceneCommits`, `sceneCommitWaitP95Ms` und `sceneRenderToCommitP95Ms` erfassen die angeforderten Szenenaktualisierungen und Zeit bis zum Layout-Effekt. Sie enthalten gegebenenfalls React-Warte-/Abgleichzeit, **keine Browser-Paint-/GPU-Zeit**. Es werden keine zusätzlichen RAF, Timer oder Zustandsänderungen gestartet.
- Felsen-Zeichenaufrufe und Block-Neuberechnungen sind als begrenzte kumulative Zahlen messbar. Long-Task-Zähler werden mit `longTasksSupported` gekennzeichnet; fehlende Unterstützung darf nicht als fehlende Last interpretiert werden.
- Protokollformat jetzt Version 2, Vorschau als V3 bezeichnet. Grenzen 90 Fenster/64 Ereignisse, lokale Speicherung mit Fallback, Datenschutz und abschaltbare Entwicklermessung bleiben erhalten.

## Prüfungen

- **405 automatisierte Tests bestanden**, keine fehlgeschlagen; Frontend-Build inklusive TypeScript und Sprachprüfungen erfolgreich.
- React-Vergleich: identische aktive Zeichenbefehle und Block-Bäume; Änderung der Blockzahl, gespeicherter Zustand, Sprachwechsel, Entfernen des letzten Inhalts, Resize und Timer-Bereinigung geprüft.
- Quellenvergleich gegen öffentlichen Stand besteht: Simulation bis auf die zuvor autorisierten V2-Korrekturen und reine Messaufrufe identisch; Spiel-JSX bis auf das bereits vorhandene Rumpfbereitschaftsattribut identisch. Bestehende CSS-, Grafik- und Audiodateien unverändert.
- Erneuter langer GamePage-Lauf bei 390 × 844: **450 normale Stufen, 49 Bosse, 13.646 Sekunden simulierte Zeit**. Vollständiger Verlaufshash identisch mit V2: `2168c6035edd5e762b404e8c4568d73a89c41b78d940de51ac8a4d3849a2c398`. Alle sieben Angriffsmuster beobachtet. Nach Beenden 0 erfasste RAF, 0 Timer, 0 Listener.
- Zusätzlicher Lauf mit neuer Diagnose: 60 normale Stufen, sechs Bosse und 1.543 Sekunden simulierte Zeit; gültiger Export und vollständige Bereinigung.
- Separater Engine-Test erneut bis zum Sieg über **500 Stufen, 50 Bosse und 50 Bonusrunden**. Weiterfallende Power-ups, Boost-Zeiten, Schuss-/Angriffsablauf und Wiederherstellung bleiben geprüft.
- Vorschaupaket: 262 Originalressourcen bytegleich, V3 und neue Messfelder vorhanden, keine zusätzliche Leiste im Spiel.

Die Simulationen erzwingen manche Abschlüsse und erhöhen für längere Kämpfe Leben/Gegnergesundheit. Sie ersetzen Darstellung, Hardware-Audio und Konto-APIs. Sie sind kein menschlicher Gerätedurchlauf. Die Umgebung bietet keine unterstützte Browser-Teststeuerung; Safari/Pi Browser auf dem physischen Smartphone bleiben ausstehend.

## Dateien dieser Runde

- `frontend/src/pages/BonusRockLayer.tsx`, `BlockchainProgress.tsx`: nur redundante Darstellungsarbeit vermeiden.
- `frontend/src/pages/renderWork.ts`: ausschließlich aktivierte Entwicklerzähler.
- `frontend/src/pages/GamePage.tsx`, `performanceDiagnostics.ts`, `performanceDiagnostics.test.mjs`: Szenenmessung, Zustandskorrektur und Regressionen.
- `frontend/scripts/verifyRenderWork.cjs`: reproduzierbarer React-/Canvas-Vergleich; isolierte Test-Abhängigkeiten unter `/tmp`, keine Änderung an Spiel-Abhängigkeiten.
- `frontend/scripts/verifyDiagnosisPreservation.cjs`, `verifySimulationStability.cjs`: Messaufrufe im Vergleich berücksichtigen; Layout-Effekt im Simulationshost ausdrücklich ohne echte Renderzeit ersetzen.
- `frontend/scripts/buildCrashPreview.mjs`: V3-Kennzeichnung und Exportname.
- `docs/performance-20261015/RENDER_V3.md`, `render-summary.json`, `render-after.json`, `render-preservation.json` und komprimierte V3-Läufe: Befunde und Belege.

## Private Vorschau

[Private Testvorschau V3](https://cryptoid-crash-diagnosis-20261015.xwsk9s27cg.chatgpt.site). Im Testmenü muss **„Absturzdiagnose V3 · Darstellungstest 15.10.“** erscheinen. Konto-APIs, Käufe und echte Spielstände bleiben isoliert. Öffentlicher Testnet-/Produktionsstand unverändert.

Der nächste Safari-Lauf mit aktivierter Messung kann die echten Framezeiten und neuen Szenenwerte mit V2 vergleichen. Anschließend sind ein vergleichbarer Lauf ohne Diagnose sowie ein Pi-Browser-Test erforderlich. Die V3-Korrektur nimmt keine Bewegungen, Effekte oder Bildqualität zurück. Eine Garantie gegen den nicht reproduzierten vollständigen Stillstand ist weiterhin nicht begründbar.
