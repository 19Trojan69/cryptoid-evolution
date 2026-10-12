# Cryptoid Evolution: Stabilitäts- und Performance-Prüfung, 12. Oktober 2026

## Ergebnis und Freigabestatus

Tatsächliche Codeänderungen auf `codex/stability-performance-20261012`, Ausgangspunkt `907d2a7363345d00f0f90c54402bf04e887b64d9`. Keine Veröffentlichung, kein Merge auf main, keine Änderung an Kaufpreisen oder Spielökonomie. Dieser Stand ist ein **Entwurf, noch keine Freigabe für Produktion**: Ressourcenwachstum und lange Lackierungsaufgaben wurden nachweislich begrenzt, die allgemeine mobile FPS-Verbesserung ist nicht nachgewiesen. Der künstlich gedrosselte Rendering-Vergleich zeigte schlechtere Framezeiten und muss vor einer Freigabe weiter untersucht werden.

Der gemeldete Rücksprung zur Startseite am 12. Oktober in Meme Nebula 5/9 und der frühere Pi-Browser-Abbruch bei einer Bossexplosion wurden nicht reproduziert. Es gibt keinen Nachweis, dass eine der gefundenen Schwachstellen diese konkreten Abbrüche verursacht hat. Ein Betriebssystem kann einen gesamten Browserprozess ohne auswertbaren JavaScript-Fehler beenden; ein Restart-Marker ist dafür nur ein Hinweis. Gerätetemperatur wird nicht abgefragt oder geschätzt.

## Gefundene Schwachstellen und Änderungen

| Bereich | Nachvollziehbarer Befund | Änderung |
| --- | --- | --- |
| Schiffslackierungen | Globale Maps behielten jede Farb-/Evolutionsvariante sowie jedes Quellbild; Blob-URLs wurden nicht verworfen. | LRU-Cache: Ziel 48 Varianten / geschätzte 24 MiB, acht Quellbilder. Sichtbare Verbraucher pinnen ihre Ressourcen; nur ungenutzte URLs werden widerrufen. Aktive Pins können das Ziel vorübergehend überschreiten. |
| Lackierungsspitzen | Gleichzeitige Pixelverarbeitung kann neue Formationen mit Hauptthread-Arbeit belasten. | Varianten seriell berechnen, zwischen Jobs an den Browser abgeben; HD-Auflösung und Materialberechnung unverändert. Temporäre Canvas-Flächen auf null setzen und Image-Handler lösen. |
| Initialisierung | `createInitialState()` wurde als Argument eines Ref bei jedem React-Render erneut ausgewertet, einschließlich Storage-Lesen. | Ref einmalig initialisieren. Leistungsregler ebenfalls einmalig anlegen. |
| Boss-Surfaces | Verzögerte finale Explosion konnte ihre großen Flächen schon während des Fallens belegen. Fragmentmasken können volle Hull-Flächen als Backing behalten. | Finale Explosion erst nach Fallphase mounten. Konservatives RGBA-Budget von 48 MiB für Blast/Fragmente; Bildschirmgröße/DPR berücksichtigen, 16/8/4 oder bei fehlendem Budget null Trümmerflächen. Feuer, Rauch, Schiff und Explosion bleiben erhalten. Einzelne große Filter auf begrenzten mobilen Impacts vermeiden. Das Budget ist eine Modellrechnung, keine gemessene GPU-Speichergrenze. |
| Waffen-Canvas | Alte Basis-/Hitze-Canvas-Flächen blieben bis zur GC erreichbar; zahlreiche Hitzevarianten konnten entstehen. | Resize/Unmount geben Flächen explizit frei; nur aktuelles Hitze-Tile pro Geschütz, tote Geschütztile entfernen. |
| Audio | Einmalige Oszillatoren/Samples waren nicht gemeinsam begrenzt und bei Pause nicht vollständig verwaltet. | Maximal 32 parallele Effektstimmen, Ende-/Pause-Cleanup mit Disconnect; Samples und bestehende Waffenressourcen wiederverwenden, Fetch beim Schließen abbrechen, stumm keine neuen Effektstimmen. Bei Spitzen kann ein zusätzlicher Sound ausfallen, Treffer und Schaden bleiben unverändert. |
| Zeitberechnung | Der bisherige Delta-Clamp verwarf verstrichene Zeit auf langsamen Frames und konnte die Simulation verlangsamen. | Verstrichene Zeit in Teilsteps von höchstens 34 ms integrieren, unabhängig vom React-Paint. Über eine Sekunde ungeklärter Vordergrund-Lücke kontrolliert pausieren. Hintergrund/Pause nicht nachholen. Zwischensteps schreiben keine zusätzlichen Player-DOM-Stile. |
| Anpassung | Eine reine mobile Renderdrosselung erkennt tatsächliche dauerhafte Last nicht zuverlässig. | Gemessene RAF-Lücken/Loop-Arbeitszeit: zuerst dekorative Stern-/Binärbewegung und Trümmerdichte reduzieren, danach 30 und 20 Paints/s; Teilstep-Simulation bleibt zeitbasiert. Mindestens vier Sekunden Druck pro Absenkung, mindestens 30 stabile Sekunden zur Erholung. Qualitätseinstellung je Effekt festhalten. |
| Fehlerbehandlung | RAF-Schutz erfasste nicht alle globalen Fehler oder Fehler beim Rendern von Szenenkomponenten. | Vorhandenen Unterbrechungspfad nutzen, JS-Fehler/Unhandled Rejection kontrolliert pausieren. Szenen-Error-Boundary lässt den Besitzer des Kampfspeichers gemountet; Router bietet zusätzliche Wiederherstellung. Ein Fehler direkt im GamePage-Render kann weiterhin den äußeren Router-Fallback erreichen. |
| Diagnose | Kontext und Neustarthinweise fehlten; pro-Frame-Storage wäre selbst teuer. | Höchstens 20 lokale Diagnoseeinträge; Sektor/Block, Phase, Objektzahlen, Frame-/Arbeitszeit bei Tierwechsel, letzter bestätigter Save. Session-Marker höchstens alle zehn Sekunden plus Lifecycle-Ereignisse. Keine Kontodaten, Fehlermeldungstexte, Stacks oder automatische Übertragung. |
| Save-Outbox | Aufgestaute wiederholte Checkpoints bei gestörter Verbindung erzeugen unnötige Serialisierung/Upload-Arbeit. | Nur aufeinanderfolgende, noch nicht hochgeladene Checkpoints desselben Runs/Stages/Encounters zusammenfassen. Upload in Arbeit bleibt unverändert, Rewards/Highscore sind Ordnungsbarrieren und werden nicht entfernt. Die Outbox ist nicht global begrenzt: dauerhafte Belohnungen müssen erhalten bleiben. |
| Startpaket | Shop und Admin wurden beim Einstieg mitgeladen. | Lazy Imports über vorhandenes Routing. Shop/Käufe bleiben funktional identisch. |

Untersucht wurden GamePage, vorhandener Guarded Loop/Diagnostik, Starfield, SectorBackdrop, sectorManager, Boss-/Schiffs-/Waffenrenderer, Frontend-Checkpoint/Outbox und Backend-Checkpoint-/Reward-/Score-Regeln. SectorBackdrop und sectorManager brauchten keinen eigenen parallelen Manager; ihre Mechanik blieb unverändert. Keine pauschale Entfernung von HD-Assets, keine neuen Texturauflösungen, keine Änderungen an Waffenwerten, Bosswerten, Formationsdefinitionen, allen 500 Leveldaten, Schiffsstufen, Preisen, Kauf-/Netzwerkgrenzen oder Profilen. Rendering-/Audio-Budgets verändern dekorative Spitzen; echte Geräte müssen den optischen Eindruck noch bestätigen.

## Messungen

Einzelmessungen in lokalem Chromium 134 Headless; keine mobile Hardwaremessung. Ergebnisse stehen im Unterordner `stability-performance-2026-10-12/`.

| Messung | Baseline | Optimiert | Aussage |
| --- | --- | --- | --- |
| 240 originale HD-Lackierungen, gespeicherte Varianten am Ende | 240 | 48 | Unbenutzte Varianten wachsen nicht mehr unbegrenzt. |
| Dabei gespeicherte Quellbilder | 60 | 8 | Quellbild-Cache begrenzt. |
| Lackierung: längste beobachtete Hauptthread-Aufgabe >50 ms | 244 ms; vier Aufgaben | Keine solche Aufgabe gemeldet | Bessere Abgabe zwischen Varianten in diesem Durchlauf; kein universeller Beweis für kurze Frames. |
| Gesamter Lackierungsdurchlauf | 3148,7 ms | 3235,4 ms | Rund 2,8 % langsamer insgesamt, dafür verteilte Arbeit. |
| Produktions-JS-Einstieg, minifiziert | 2441,68 kB | 1883,02 kB | Kleineres Einstiegspaket; ausgelagerte Chunks zählen weiter zur Gesamtanwendung. |
| Produktions-JS-Einstieg, gzip | 757,47 kB | 607,13 kB | Kein Beleg für entsprechend geringeren Gesamt-RAM. |
| Feste Formation mit sechs Gegnern, 20 s, 4× CPU-Drossel, beobachtete RAF-Callbacks | 347 | 145 | Rückgang; keine bestätigte allgemeine FPS-Verbesserung. |
| Derselbe Lasttest: p95 RAF-Abstand | 116,7 ms | 183,3 ms | Offene Performance-Regression in dieser Umgebung. |
| Derselbe Lasttest: längster RAF-Abstand | 266,7 ms | 283,3 ms | Muss weiter profiliert werden. |

Der CPU-Test verwendet Dev-Server, Software-/Headless-Rendering und Single-Process-Chromium, nicht einen Produktions-Build auf einem Smartphone. Einzelmessungen schwanken; außerdem integriert der neue Loop die gesamte verstrichene Zeit, die Baseline verwirft auf langen Frames Zeit. Dadurch arbeitet die neue Simulation unter Drosselung mehr. Das erklärt einen Teil der Mehrarbeit, beweist aber nicht, dass die Regression ausschließlich daran liegt. Der Befund wird nicht als Verbesserung ausgegeben. Vor Freigabe: Production-Traces auf echter Hardware und Kosten der Teilsteps/React/CSS getrennt messen; gegebenenfalls visuelle Arbeit weiter aus Teilsteps ziehen, ohne Kollisionen oder Timer zu verlangsamen.

Im beschleunigten Smartphone-Viewport-Test (390×844, DPR 3) lag der nach expliziter GC gemessene JS-Heap an Blockgrenzen zuerst bei 14,92 MiB, zuletzt bei 16,73 MiB, maximal bei 16,76 MiB. Die letzten zehn Messpunkte lagen zwischen 16,13 und 16,76 MiB. Der Cache wärmte sich bis 48 Varianten / acht Quellen auf; DOM-Knoten an Grenzen maximal 438, zuletzt 437. Das ist kein Beweis für vollständige Leak-Freiheit: JS-Heap umfasst nicht dekodierte Bilder, Canvas-/GPU-Speicher oder Browser-Gesamtspeicher. Objektzahlen wurden nach Clearing an Übergängen erfasst, nicht als Kampf-Spitzenwerte. Es gibt keinen gleich langen Baseline-Heap-Vergleich.

## Erfolgreiche Prüfungen

- Frontend: 334 Tests bestanden, null Fehler; zusätzliche Tests für identische Zeitintegration bei 20/30/60/120 Hz, träge Qualitätsstufen, Resource-Pins/Eviction über 500 Einfügungen, Bossbudget und verzögertes Mounten, Restart-Marker und Checkpoint-Barrieren.
- Backend: 93 bestehende Tests bestanden nach erfolgreichem Backend-Build, einschließlich Checkpoints, Rewards/Score-/Payment-Regeln. Backend-Code wurde nicht geändert.
- Frontend-Produktions-Build einschließlich TypeScript und Übersetzungs-Release-Gate erfolgreich. Vorhandene Vite-Warnung über große Chunks bleibt.
- Tatsächliche GamePage-Schleife im beschleunigten Chromium-Test: 30 normale Blöcke (1–9, 11–19, 21–29, 31–33) plus Bosskämpfe 10/20/30, einschließlich Meme Nebula Block 5/9 (Stage 25). Keine pageerrors. Gruppen/Bosse werden per Testhook gelöscht/besiegt; echte Übergänge, Effekte und Formationen laufen. Das ist ein reproduzierbarer Lebensdauer-/Übergangstest, kein realer 30-Minuten-Kampf und keine Balanceprüfung.
- Stage 25: 80 eigene plus 80 gegnerische Testprojektile, zwölf Explosionen, bezahlter Waffen-/Rapid-Fire-Timer, Pause/Fortsetzen. Timer ändern sich während Pause nicht. Finale Bossflächen vor der Fallfrist nicht gemountet, anschließend acht mobile bzw. 16 Tablet-Fragmente.
- Tablet-Viewport 1024×768: zwölf normale Blöcke und ein Boss ohne pageerrors.
- Injizierter technischer Loop-Fehler pausiert auf /game und erhält Score, Shards, Leben, Stage und bezahlte Restzeit.
- Audio-Stresstest: Effektstimmen bleiben begrenzt, Nodes werden getrennt und Stummschalten verhindert neue Stimmen.
- Isolierte Offline-Vorschau: Meme Nebula 5/9 mit sechs Gegnern spielbar, keine JS-Fehler und keine externen HTTP-Anfragen im geprüften Einstieg.

## Offene Prüfungen und Risiken

Kein echter Pi Browser, kein echtes Smartphone/Tablet, kein funktionierendes WebKit in dieser Umgebung. WebKit konnte wegen fehlender Systembibliotheken nicht starten. Eine volle Kontospeicher-/Browser-Neuladeprüfung ließ sich mit Fake Clock und Single-Process-Browser nicht zuverlässig abschließen (leere about:blank-Seite im Harness). Bestehende Backend-Idempotenz-, Checkpoint- und Frontend-Outbox-Tests bestehen; daraus folgt keine abgeschlossene End-to-End-Prüfung eines Pi-Prozessabbruchs. Background-/Pageshow-Pfade sind im Code berücksichtigt, müssen aber auf mobilen Browsern tatsächlich ausgeführt werden. Keine echte Temperatur-, Energieverbrauchs- oder GPU-RAM-Messung. Keine garantierte Absturzfreiheit.

## Reproduktion

Node 24 für Strip-Types-Tests. Zuerst vorhandene Frontend-/Backend-Abhängigkeiten installieren; Playwright separat in einer QA-Umgebung installieren und Chromium bereitstellen. Tests benötigen keine produktiven Zugangsdaten. Browser-Skripte injizieren Hooks ausschließlich in einen lokalen Vite-Testtransform.

```sh
cd frontend
node --experimental-strip-types --test --test-concurrency=1 src/*.test.mjs src/lib/*.test.mjs src/pages/*.test.mjs
npm run build
# PLAYWRIGHT_MODULE_PATH zeigt auf ein separat installiertes playwright-Modul;
# CRYPTOID_CHROMIUM auf die Chromium-Executable.
CRYPTOID_QA_VIEWPORT=390 CRYPTOID_QA_BLOCKS=30 node scripts/verifyStabilityPerformance.cjs
CRYPTOID_QA_VIEWPORT=1024 CRYPTOID_QA_BLOCKS=12 node scripts/verifyStabilityPerformance.cjs
# Baseline-Worktree am oben angegebenen SHA, mit installierten Abhängigkeiten:
CRYPTOID_BASELINE_REPO=/path/to/baseline node scripts/verifyResourceCache.cjs
CRYPTOID_PERF_SCENE=formation CRYPTOID_PERF_MS=20000 node scripts/verifyStartupPerformance.cjs
# Dasselbe Profiling-Skript auch in den Baseline-Worktree kopieren.
node scripts/buildStabilityPreview.mjs /tmp/Cryptoid_Evolution_Stabilitaetstest.html
cd ../backend
npm run build
node --test src/*.test.mjs src/handlers/*.test.mjs
```

`CRYPTOID_STABILITY_OUT`, `CRYPTOID_RESOURCE_OUT` und `CRYPTOID_PERF_OUT` wählen JSON-Ausgaben. Browser-Skripte verwenden Sandbox-kompatible Chromium-Flags; auf echten Geräten gelten deren normale Browserprozesse. Die selbständige HTML-Vorschau enthält Original-HD-Assets, daher etwa 32 MB. Käufe, Konto/API und dauerhafte Belohnungen sind deaktiviert; Musik ausgeschaltet, Soundeffekte vorhanden. Startpunkte 1, Meme 25, Boss 30 und Boss 500, alle Testschiffe und beide Steuerhände. Ihr eingebettetes Assetpaket eignet sich nicht als Produktions-Speicherbenchmark.

## Konkreter Pi-/WebKit-Gerätetest vor Freigabe

1. Eigener Branch als isolierter lokaler/QA-Build, keine automatische Testnet-/Produktionsveröffentlichung. Moderne Android-Hardware mit Pi Browser und Chrome sowie iPhone/iPad mit Pi Browser/Safari; zusätzlich Desktop-Chrome. OS-/Browserversion, DPR und Build-SHA protokollieren. Geräte ohne Ladegerät mit vergleichbarer Ausgangslast testen; tatsächliche Temperatur nur mit gesondertem zuverlässigem Messgerät dokumentieren.
2. Je 30–45 Minuten echte Kämpfe und mindestens 30 Blöcke plus Bosse. Meme 5/9 mehrfach mit dichter Formation, Standard/Advanced/Elite, mehreren Waffen/Power-ups; Boss 30 und 500 mit finalem Fall/Explosion. Originaloptik und Trümmer-/Rauchwirkung visuell vergleichen.
3. Remote DevTools/Web Inspector: 60-Sekunden-Traces beim Einstieg, Meme 5/9 und Bossblast; p50/p95/p99 Framezeiten, Long Tasks, React-Commits, JS-Heap nach GC, DOM-/Canvaszahlen und gegebenenfalls Prozess-/GPU-Speicher erfassen. Nach jedem Boss und zehn Blöcken prüfen, ob Ressourcen wieder auf das warme Ausgangsniveau zurückkehren. Beide Branches mit gleichen Einstellungen vergleichen; CPU-/GPU-Kosten getrennt betrachten.
4. Regelmäßig Pause/Fortsetzen; Bildschirm sperren, App wechseln für 5 s/60 s/5 min und zurück. Keine Hintergrund-Nachsimulation, Timer bleiben eingefroren, kontrollierte Wiederaufnahme. Last für mindestens fünf Minuten erhöhen und wieder entfernen: dekorative Stufe zuerst, spätere Paint-Drossel, mindestens 30 stabile Sekunden zur Erholung; kein hektischer Wechsel.
5. In einem isolierten Testkonto Save bestätigen und Zeitpunkt notieren. Netz unterbrechen, mehrere Checkpoints/Reward-Barrieren erzeugen, Verbindung wiederherstellen. Seite neu laden und Browser vollständig schließen/wieder öffnen. Fortsetzung, Herzen/gekaufte Waffenrestzeit, Shards, einmalige Boss-/Kartenbelohnung und genau einen Highscore-Eintrag prüfen. Auch Timeout nach serverseitig akzeptiertem Reward mit verlorenem ACK testen. Testnet-/Mainnet-Speichergrenzen kontrollieren; keine echten Käufe auslösen.
6. Bei Abbruch lokale `cryptoid_game_diagnostics_v1` und per-Tab Session-Marker zusammen mit Uhrzeit/OS-Bericht exportieren, ohne Token-/Kontodaten. Vordergrundfehler, absichtliches Reload, Hintergrundwechsel und vermuteten Prozessabbruch getrennt notieren. Ein fehlender pagehide-Callback beweist keinen OS-Abbruch. Erst nach Klärung der gedrosselten Framezeit-Regression und erfolgreichen Gerätetests Freigabe erwägen.
