# Cryptoid Evolution – Stabilitätskorrekturen, 12. Oktober 2026

## Verbindlicher Umfang

Der Nutzer hat den Auftrag präzisiert: ausschließlich Stabilität wiederherstellen. Die zuletzt offiziell verwendete Optik **aller Seiten**, Sounds und Spielmechanik bleiben erhalten. Der kompakte Header aus IMG_5288.jpeg ist die Referenz; Gegner-Positionierungsplätze bleiben unsichtbar, alle bisherigen Formationen erhalten. Keine Veröffentlichung auf das Spiel-Testnet oder die Spielproduktion und kein Main-Merge.

Der Entwurf enthält deshalb **keinen neuen Qualitätsregler**, keine Partikel-/Explosions-/Filterreduktion, keine Änderung an Sternen oder Soundparametern und keine neue Simulation mit Teilsteps. Der offizielle Delta-Clamp und die bisherige mobile Paint-Frequenz sind wiederhergestellt. Das neue Effektstimmen-Limit wurde entfernt: alle ursprünglichen gleichzeitigen Effekte spielen weiter; Nodes werden erst nach Ende beziehungsweise im bestehenden Pause-/Close-Lifecycle freigegeben. Diese Vorgaben sind auch in frontend/AGENTS.md festgehalten.

## Gefundene technische Probleme und verbleibende Korrekturen

- Schiffslackierungen und Quellbilder blieben in globalen Maps erhalten. Ein LRU-Cache gibt nur ungenutzte Varianten frei, widerruft ihre Blob-URLs und pinnt sichtbare Verbraucher, auch während Erstellung. Ziel: 48 Varianten / geschätzte 24 MiB und acht Quellen; aktive Pins können das Ziel vorübergehend überschreiten. HD-Auflösung und Materialberechnung bleiben gleich.
- Gleichzeitige Pixelarbeit verursachte Hauptthread-Spitzen. Lackierungsjobs werden seriell und mit Browser-Yield verarbeitet; temporäre Canvas-Flächen und Image-Handler werden freigegeben.
- createInitialState() lief als Ref-Argument bei jedem React-Render. Die Initialisierung erfolgt jetzt einmalig, ohne Änderung der Startwerte.
- Bosswaffen-Canvas-Caches hielten alte Basis-/Hitze-Flächen. Resize/Unmount geben diese explizit frei, nur das aktuelle Hitze-Tile pro Geschütz bleibt. Das gezeichnete Ergebnis ist unverändert.
- Die finale Bossexplosion belegte Flächen schon während ihres bestehenden Fall-Delays. Sie wird erst beim ursprünglichen Startzeitpunkt gemountet; Größe, Feuerstellen, 16 Fragmente und Filter bleiben original.
- Audio-Nodes werden nach Ende/Pause/Close getrennt, Sample-Fetches beim Schließen abgebrochen und Ressourcen wiederverwendet. Keine neuen Soundlimits oder Klangänderungen.
- Aufgestaute Checkpoints werden nur für aufeinanderfolgende, noch nicht hochgeladene Saves desselben Runs/Stages/Encounters zusammengefasst. In-flight-Uploads, Reward-/Score-Barrieren und Idempotenz bleiben erhalten.
- Der vorhandene Guarded Loop, lokale Diagnostik und Unterbrechungspfad wurden erweitert. Globale JS-/Promise-Fehler führen möglichst zur kontrollierten Pause. Eine Szenen-Error-Boundary erhält den Besitzer des Kampfspeichers; Fehler direkt im GamePage-Render können weiterhin den äußeren Router-Fallback erreichen.
- Diagnose: maximal 20 lokale Einträge, Kontext/Objektzahlen, letzte erfolgreiche Speicherung, Frame-Lücke bei Fehlern. Per-Tab Session-Marker höchstens alle zehn Sekunden plus Lifecycle. Keine Kontodaten, Stacks oder automatische Übertragung. Ein vermuteter OS-Prozessabbruch ist nur ein Hinweis.
- Shop/Admin werden über bestehendes Routing lazily geladen; normale Seiteninhalte und Layouts wurden nicht geändert.

## Vorschau-Korrektur

Im Vorschau-Bundle überschrieben spätere mobile Regeln aus hudDepth.css die ursprüngliche kompakte Anordnung und erzeugten eine zweite HUD-Zeile. Eine ausschließlich für die isolierte Vorschau geladene Compatibility-CSS stellt Home, Herzen, Level, Shards über Score, Block und Pause in einer Reihe wieder her. Formation-Targets bleiben unsichtbar, ihre Koordinaten und Fluglogik unverändert. Online-Vorschauen laden wieder den offiziellen Google-Fonts-Stylesheet. Diese Korrektur verändert keine normalen Produktions-Styles.

Die separate Site bleibt unabhängig von Spiel-Testnet/Produktion. Reale Konten, APIs, Käufe und dauerhafte Belohnungen sind dort deaktiviert; die bereits vereinbarte Testkonfiguration schaltet Musik aus. Diese Isolation ist keine Änderung des offiziellen Spiels.

## Nachweise und aktuelle Grenzen

- 25 gezielte Prüfungen für Cache-Lifetime, Boss-Delay, Audio-Cleanup ohne Abschneiden, Outbox, Restart-Marker und kontrollierte Fehlerpause erfolgreich.
- 323 Tests der verfügbaren Frontend-Testdateien erfolgreich. Die unveränderten collectionAudit.test.mjs und galaxyMap.test.mjs sind in dieser wiederhergestellten Arbeitskopie nicht vollständig ausführbar, da Original-Kartenbilder fehlen; beide Dateien wurden beim erfolgreichen Lauf ausdrücklich ausgeschlossen. Ein vorheriger unvollständiger Lauf scheiterte außerdem an fehlenden Backend-Test-Builds/Audit-Skripten; diese Voraussetzungen wurden wiederhergestellt.
- Produktions-Build mit TypeScript und Übersetzungs-Release-Gate erfolgreich. Vorhandene Vite-Warnung zu großen Chunks und Hinweise auf in dieser Arbeitskopie fehlende Kartenbilder bleiben.
- Separater isolierter Preview-Build erfolgreich. Statisch geprüft: kompakte Headerregel zuletzt in der Cascade, keine Qualitäts-/Budget-CSS, unsichtbare Formation-Targets und offizielle Online-Schriftquelle.
- Browser-QA für diesen neu eingegrenzten Stand ist in der aktuellen managed Umgebung ohne control-browser nicht verfügbar. Kein echter Pi Browser oder WebKit-Gerät; kein Pixelvergleich auf dem Nutzergerät. Kein neuer vollständiger 30-Block-Browserlauf nach dieser Rücknahme.

Die zuvor gespeicherten JSON-Messungen in stability-performance-2026-10-12/ gehören zum früheren, breiteren Entwurf und sind **historische Daten**, kein Nachweis für diesen final eingegrenzten Stand. Der Lackierungsvergleich bleibt für den unveränderten Cache-Code relevant: 48 statt 240 Varianten, acht statt 60 Quellbilder; keine beobachtete Aufgabe über 50 ms gegenüber maximal 244 ms zuvor, bei rund 2,8 % längerer Gesamtdauer. Die schlechteren Framezeiten des früheren Teilstep-/Qualitätsregler-Entwurfs dürfen nicht auf den jetzt zurückgenommenen Loop übertragen werden; eine aktuelle allgemeine FPS-Verbesserung wird nicht behauptet.

Der ursprüngliche Meme-Nebula-/Pi-Abbruch wurde nicht reproduziert und ist nicht als sicher behoben nachgewiesen. Keine garantierte Absturzfreiheit, keine gemessene Gerätetemperatur, Energie- oder GPU-Speicherbilanz.

## Gerätetest vor Freigabe

Mit identischem offiziellen Erscheinungsbild auf Pi Browser (Android/iPhone), Safari/iPad und Desktop testen: mindestens 30 echte Blöcke plus Bosse, Meme Nebula 5/9, finale Boss-Fall-/Explosionsphase, dichte Projektile und Power-ups. Header, unsichtbare Targets, Formationsvielfalt, Sounds und Timer direkt mit dem Original vergleichen. Regelmäßig pausieren, Hintergrund/Sperrbildschirm und Rückkehr prüfen. Bestätigten Save, Netzunterbrechung, Reload und vollständiges Browser-Schließen mit isoliertem Testkonto prüfen; keine doppelten Shards, Leben, Boss-/Kartenbelohnungen oder Scores. JS-Heap nach GC, DOM-/Canvas-Zahlen, Framezeiten und gegebenenfalls Prozess-/GPU-Speicher an wiederholten Sektorgrenzen aufnehmen. OS-Kill bleibt technisch nur bedingt diagnostizierbar.

Reproduktion: frontend/scripts/buildStabilityPreview.mjs erstellt Offline-HTML und optional ein Webverzeichnis; frontend/scripts/verifyStabilityPerformance.cjs verwendet nur lokale QA-Hooks. Es verändert keine Produktionsmodule. Für einen vollständigen Testlauf müssen auch die originalen Kartenbilder und Backend-Builds vorhanden sein.

