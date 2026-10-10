# Vollbild und Pilotenprofil – 10. Oktober 2026

Basis: Release-Branch `codex/seven-packages-20261009`, Commit
`7b7029969b889a7d3b8c3ca511568d1a82f85c16`. Die zwischenzeitlichen
Verbesserungen an Benutzername und Tonsymbol bleiben enthalten.

## Verhalten

- Der Vollbildknopf schaltet zwischen Ein- und Austritt um und zeigt den
  tatsächlichen Browserzustand, auch nach Escape. Standard- und WebKit-APIs
  werden unterstützt. Die Anforderung erfolgt direkt beim Klick.
- Ablehnung, fehlende Browserunterstützung und installierte App-Ansicht erhalten
  übersetzte Rückmeldungen. Eine ausbleibende Browserantwort blockiert die
  Bedienung höchstens drei Sekunden. Vollbild lässt sich nicht gegen die
  Einschränkungen des Pi Browsers erzwingen.
- Angemeldete Spieler finden ihr bestehendes Pilotenprofil im Kopfbereich und
  über einen kompakten Startseitenknopf mit „Profilbild & Bio bearbeiten“.
- Namen und Profilbilder in allen drei Ranglisten bleiben mit dem öffentlichen
  Pilotenprofil verknüpft. Ein sichtbarer Profilhinweis und zugängliche
  Beschriftungen machen diese vorhandene Funktion erkennbar.
- Bestehende Profil-Endpunkte, Speicherung, öffentliche Felder, Ranglisten,
  Ausrüstung und Kaufabläufe bleiben erhalten. Keine Datenmigration oder
  Neuberechnung. Alle 19 unterstützten Sprachen erhalten die neuen Hinweise.

## Lokale Prüfung

- 262 Frontendtests bestanden: native Vollbildübergänge, Browserablehnungen,
  ausbleibende Antworten, Zustandsanzeige, Escape, Listenerbereinigung und
  bestehende Profilnavigation eingeschlossen.
- Produktionsbuild einschließlich TypeScript und Übersetzungsprüfung bestanden.
  Die vorhandene Warnung zur Größe des Hauptbundles besteht weiterhin.
- Geänderte TypeScript-Komponenten gezielt mit ESLint geprüft.
- Keine echten Zahlungen, Profiländerungen oder Spielerdaten für Tests erzeugt.

## Veröffentlichungsprüfung

Veröffentlichung erfolgt separat für Testnet und Produktion aus demselben
Commit. Zu prüfen: erfolgreicher Build, richtige Netzwerkzuordnung, ausgelieferte
JavaScript-/CSS-Dateien identisch zum lokalen Build, öffentliche Profilanzeige
und Vergleich der Ranglisteneinträge vor und nach der Veröffentlichung.

Ein nativer Pi-Browser auf dem Tablet ist in dieser Arbeitsumgebung nicht
verfügbar. Vollbild und Pi-Anmeldung auf dem tatsächlichen Gerät sind daher
nicht als praktisch bestätigt zu betrachten.
