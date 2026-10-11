# Touch-Steuerung und unterbrochene Spielschleife

Stand: 11. Oktober 2026. Basis: `main` bei `69f78d1`. Freigabe zunächst im Testnet; Produktion erst nach der Testnet-Abnahme.

## Befund

Der gemeldete Screenshot zeigt ein nicht mehr bewegliches Schiff. Die genaue Ursache beim Tester lässt sich daraus nicht beweisen. Im Code wurden zwei passende Fehlerquellen festgestellt: Eine nicht freigegebene Pointer-ID konnte alle folgenden Gesten blockieren; die normale Rechtshänder-Einstellung ignorierte zusätzlich die linken 35 Prozent des unteren Spielfelds. Eine Ausnahme in der Simulation konnte außerdem das Planen des nächsten Animationsframes abbrechen.

## Korrektur

- Eine frische primäre Geste ersetzt eine veraltete Eingabe. Zweite Finger und Bedienelemente übernehmen die laufende Steuerung nicht.
- Pointer-Capture, globale Freigabe, Abbruch und verlorener Capture sowie Fokus-, Sichtbarkeits-, Größen- und Vollbildwechsel geben die Steuerung frei. Ältere WebViews ohne Pointer Events erhalten denselben Touch-Fallback.
- Alle Steuerungsbereiche erlauben die volle Breite. Kompakt/Normal/Breit verändern die vertikale Reichweite; die Händigkeit bestimmt die Position der Buttons. Fingerabstand, Empfindlichkeit und sichere Schiffgrenzen bleiben erhalten.
- Ein zentraler Scheduler hält genau einen Animationsframe aktiv und plant auch nach frühen Rückgaben oder abgefangenen Simulationsfehlern weiter. Veraltete Callbacks können keine zweite Schleife starten.
- Bei Eingabe-/Simulationsfehlern und einer erkannten Vordergrund-Unterbrechung von mehr als 2,5 Sekunden pausiert die Mission. Fortsetzen beginnt über den vorhandenen Drei-Sekunden-Countdown mit freigegebenen Eingaben. Die vorhandenen Herzen, Belohnungen und Ausrüstungstimer werden weder aufgefüllt noch zurückgesetzt; der bestehende Checkpoint wird zum Speichern vorgemerkt. Ein gescheitertes Speichern bleibt sichtbar und wiederholbar.
- Höchstens 20 lokale Diagnoseeinträge unter `cryptoid_game_diagnostics_v1` enthalten Zeitpunkt, Fehlertyp, Level/Phase, Ansichtsgröße und Browser. Keine Account-IDs, Rohfehlermeldungen, Zugangsdaten oder automatische Übertragung.
- Die Bedienhinweise und technische Pausenmeldung sind in den fünf vollständig freigegebenen Sprachen übersetzt.

## Automatisierte Prüfung

- 31 neue Tests: 22 Eingabefälle und 9 Scheduler-/Wiederherstellungs-/Diagnosefälle. Die echte Fehlerbehandlung aus `GamePage` wird mit Audio- und Speicherfehlern ausgeführt und auf erhaltene Herzen, Shards und bezahlte Timer geprüft.
- Gesamte Frontend-Testsuite: 325/325 bestanden. Backend-Prüfungen für Speichern, Lebensgrenzen, Belohnungen und Kaufregeln: 35/35 bestanden.
- Backend-Build vor Tests, die dessen CommonJS-Ausgabe verwenden. Der bestehende Bossgeschütz-Test verwendet jetzt ebenfalls diese Ausgabe, damit Node keine extensionlosen TypeScript-Imports auflösen muss.
- Frontend-Build einschließlich TypeScript, i18n und Vite; fünf Release-Sprachen mit 1.195/1.195 Texten.
- Neue Hilfsmodule und geänderte Einstellungen/Anleitung ohne ESLint-Meldungen. Der bestehende `GamePage` hat unter den aktuell installierten React-Hooks-Regeln bereits Meldungen: Basis 38, Änderung 37; keine zusätzliche Meldung und keine Regelabschaltung. Der gesamte bestehende Lint-Bestand ist damit nicht als fehlerfrei ausgewiesen.

Reproduzierbare Befehle, jeweils im betreffenden Verzeichnis:

```sh
# backend
npm run build
node --experimental-strip-types --test src/lifeRules.test.mjs src/handlers/progress.test.mjs src/handlers/rewards.test.mjs src/paymentPolicy.test.mjs src/purchaseQuote.test.mjs src/hangarCatalog.test.mjs
# frontend, nach dem Backend-Build
node --experimental-strip-types --test src/**/*.test.mjs src/*.test.mjs
npm run build
```

## Testnet-Abnahme und Grenzen

Browserprüfung: Start, Bewegung, Pause/Fortsetzen, Shop/Steuerungshinweise, Größenwechsel und Laufzeitmeldungen. Die vorhandene `mobile-layout-check.html` zeigt die echte App in kleinen Ansichten, simuliert aber keine Touch-Hardware.

Live geprüft: Die neue Anleitung und Einstellung erscheinen im Testnet; die linke Spielfeldseite nimmt neue Eingaben an, und Pause/Fortsetzen einschließlich Countdown ist bedienbar. Bei 320 × 568 Pixeln gibt es keinen horizontalen Überlauf, die gemessenen sichtbaren Buttons sind mindestens 48 Pixel groß, und das Pausenmenü ist scrollbar. Die visuelle Prüfung zeigte zunächst einen zwischen Buttons eingequetschten Erklärungstext; ein voller Grid-Zeilenspan korrigiert dies. Die vollständige Dauer einer Mission und echte Multi-Touch-Gesten wurden im Cloud-Browser nicht abschließend verifiziert. Die vorhandenen Pi-SDK-Zeitüberschreitungen außerhalb des Pi Browsers bleiben von diesem Fix getrennt.

Für die Geräteabnahme: Auf iPhone und Android im Pi Browser mehrfach links/rechts steuern, zweiten Finger auf die Waffen legen, außerhalb loslassen, Bildschirm drehen sowie App wechseln/zurückkehren. Nach jeder Unterbrechung muss eine neue Geste funktionieren; Herzen und bezahlte Timer dürfen nicht aufgefüllt werden. Diese Hardwareprüfung ist durch automatisierte Ereignis-Fixtures nicht ersetzt.

Ein dauerhaft blockierter JavaScript-Hauptthread, Betriebssystemabbruch oder Browserabsturz kann nicht während der Blockierung durch einen JavaScript-Watchdog behoben werden. Der Fix schützt die gefundenen Eingabe- und Scheduler-Fehler; er garantiert nicht die Wiederherstellung jeder möglichen Geräte- oder Browserstörung.
