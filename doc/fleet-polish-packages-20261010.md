# Flotten-Überarbeitung – vier Pakete, 10. Oktober 2026

Ausgangspunkt: `7e100a67cd3254a92c3c9e3455995c7e238f1a43` auf `codex/seven-packages-20261009`.
Der aktuelle veröffentlichte Stand einschließlich der Tablet-Anmeldung und
des verzögerten Vollbildversuchs bleibt erhalten; der ältere `main`-Stand
ist nicht die Ausgangsbasis.

## Paket 1 – Pilotenprofil

Der bestehende Profil-Callback im Header bleibt erhalten. Direkt unter dem
Usernamen erscheint jetzt ein kontrastreicher champagnerfarbener Profilhinweis.
Lange Usernamen umbrechen innerhalb der vorhandenen Header-Spalte.
Der zusätzliche Pilotenprofil-Button im unteren Homescreen wurde entfernt.
Karriere und Community bleiben separate Funktionen. Der Profilzugang im
Schnellzugriff bleibt bestehen.

## Paket 2 – Shop und Hangar

Standard, Advanced und Elite verwenden drei kompakte Versionsbuttons und
nur eine gemeinsame Vorschau. Name, Stufe, Farbe, Beschreibung, Preis und
Aktionen gehören zur ausgewählten Konfiguration. Die bisherigen großen
Advanced-/Elite-Vorschaukacheln entfallen.

Neun Metallfarben und gegebenenfalls bereits besessene ältere Farben bleiben
verfügbar. Auswahlhaken, Besitzpunkt, Farbname und zugängliche Beschriftungen
kennzeichnen die Farbauswahl. Smartphone-Layouts verwenden eine Spalte,
Tablet-Layouts eine kompakte Anordnung neben der Vorschau. Das quadratische
Seitenverhältnis der Schiffe bleibt erhalten.

Im Hangar wird die Farbe zunächst angesehen und erst mit dem Ausrüstungsbutton
übernommen. Der normale Ausrüstungsbutton erscheint nur für eine tatsächlich
besessene Farbe in der verwendbaren, höchsten freigeschalteten Stufe. Eine
niedrigere Stufenansicht behauptet keinen technisch nicht vorhandenen Downgrade.
Neue Konto-Inventardaten aktualisieren die anfängliche Hangar-Stufenauswahl.
Admin-Vorschauen bleiben an den vorhandenen Admin-Testablauf angeschlossen.

Die bestehenden Beschreibungen und die reale Stufenlogik nennen Einzelfeuer,
Doppelfeuer, die stärkeren Elite-Schüsse und 0/1/2 abgefangene Gegnerschüsse
pro Leben. Aktive Schilde und direkte Kollisionen folgen unverändert ihren
bisherigen Spielregeln.

## Paket 3 – Metallfarben und Details

Ein gemeinsamer Materialrenderer erhält Oberflächenhelligkeit, Panzerungs-
kontrast, Glas, blaue Triebwerkskerne und namensgebende Farbdetails. Dunkle
Lacke behalten deutlich sichtbare helle Reflexionen; helle Metallreflexe
werden teilweise neutral. Die Farben und ihre gespeicherten IDs bleiben gleich.

Shop, Hangar, Spiel und Sammelkarten verwenden dieselbe Materialfunktion.
Die vorhandenen Bilder werden nicht ersetzt. Alpha und Abmessungen ändern
sich durch die Materialberechnung nicht.

## Paket 4 – Darstellung im Spiel

Die volle Ausgangsauflösung bleibt beim Erzeugen der lackierten Sprites
verfügbar. Vorhandene Facetten und Plattenfugen erhalten eine lokale Relief-
aufbereitung. Statisches, alpha-maskiertes Licht und dezente Schlagschatten
unterstützen die räumliche Form im Spielfeld. Die bisherige graue Zwischen-
darstellung beim Laden entfällt.

Die Materialberechnung erfolgt einmal pro zwischengespeicherter Variante,
nicht pro Spielbild. Keine zusätzliche Rastergrafik und kein neues 3D-Engine-
Paket wird geladen. Die vorhandenen Trefferflächen, Größen, Positionszentren,
Feuerkraft, Bewegung, Explosionen und Schadensanzeigen bleiben erhalten.

## Erhaltene Regeln und Daten – To-do 9

Keine Änderung an Besitz-IDs, Preisen, Testnet-/Mainnet-Trennung, Kauf-
freischaltungen, Shard-Abzügen, Zahlungswegen, gespeichertem Fortschritt oder
automatischem Ausrüsten nach erfolgreichem Kauf. Pi-Upgrades bleiben nach
den vorhandenen Regeln gesperrt. Die Tests prüfen insbesondere die Shard-
Unterdeckung, gesperrte Hulls, laufende Käufe, unbesessene Farben und Stufen.

## Nachweise und Grenzen – To-do 10

- Frontend-Build: Übersetzungsprüfung, Sprachfreigabe, TypeScript und Vite bestanden.
- Alle 264 Frontend-Tests bestanden, ohne übersprungene Tests.
- Komponententests führen die wirklichen Versions-, Farb-, Kauf- und
  Ausrüstungs-Callbacks aus; keine Käufe oder Datenbank-Schreibtests.
- Native Grafikprüfung: 20 Schiffe × 3 Stufen × 9 Metallfarben = 540 Varianten;
  Alpha-Konturen überall identisch zur Ausgangsgrafik.
- `fleet-review/metal-paints.png` und `fleet-review/combat-materials.png`
  zeigen die native Materialdarstellung. Sie sind keine Browser-Screenshots.
- `fleet-review/material-validation.json` dokumentiert native Laufzeiten;
  diese Werte sind keine Smartphone-FPS-Messung.
- Bestehende Regressionsprüfungen für Besitz, automatisch ausgerüstete Käufe,
  Speicherung, Kollisionen, Stufen und Übersetzungen bestehen.

Eine echte Smartphone-, Tablet- und Pi-Browser-Prüfung bleibt offen. In dieser
verwalteten Umgebung ist kein `control-browser` verfügbar; ein Ersatzbrowser
wurde entsprechend der bestehenden Sites-Anweisung nicht gestartet.
## Veröffentlichung und lesende Live-Prüfung

Veröffentlichter Anwendungscode: `1fc8a66aec127009f1e04e2d760659e512e59a8b`.
Pull Request: https://github.com/19Trojan69/cryptoid-evolution/pull/144.
Der PR bleibt offen; `main` und der bisherige Release-Branch wurden nicht
überschrieben. Die folgenden Bereitstellungen verwenden exakt den geprüften
Code-Commit. Ein späterer reiner Dokumentationscommit wird nicht neu zugeordnet.

| Umgebung | Adresse | Deployment | Ergebnis |
| --- | --- | --- | --- |
| Testnet / Preview | https://cryptoid-evolution-testnet.vercel.app | `dpl_CJu4SdUL8c4j5mvjUZq5855zcgKB` | READY |
| Hauptseite / Produktion | https://cryptoid-evolution.vercel.app | `dpl_8AU7rcLqSH7kxEKxoCDYtMwzDukZ` | READY |

Beide stammen aus dem bestehenden Projekt `cryptoid-evolution`. Der neue
Arbeitsbranch verwendet die bestehende branchbezogene Preview-Konfiguration
`CRYPTOID_TESTNET_BACKEND=local`. Produktionsvariablen und Geheimnisse wurden
nicht geändert. Sechs vorhandene Gateway-Regressionstests bestehen zusätzlich
zur Frontend-Suite; sie prüfen unter anderem die Netztrennung und den weiterhin
getrennten Pi-Zahlungsdienst.

Lesende HTTP-Prüfung auf den festen öffentlichen Adressen:

| Prüfung | Testnet | Hauptseite |
| --- | --- | --- |
| Startseite und neuer Anwendungsbundle | 200; neue Profil-/Versionsklassen enthalten, unterer Profilbutton fehlt | 200; dieselben Änderungen enthalten |
| Runtime-Testnet-Kennzeichnung | `appNetwork=testnet`, API `/api` | Kein Preview-Testnet-Schalter |
| `/api/hangar/catalog` | 200, Backend `testnet-local` | 200, Backend `local` |
| `/api/leaderboard/top?sort=career` | 200, Netzwerk `testnet` | 200, Netzwerk `mainnet` |
| `/api/rewards/me` ohne Anmeldung | 401 | 401 |
| `/api/hangar/inventory` ohne Anmeldung | 401 | 401 |

Schiffbild und neue Styles wurden auf der Testnet-Adresse mit HTTP 200 geprüft.
Keine Anmeldung, Zahlung, Inventaränderung, Gutschrift oder Fortschrittsänderung
wurde als Live-Test ausgelöst. Die direkten Deployment-Adressen sind geschützt;
die Live-Prüfung erfolgte über die vorhandenen öffentlichen Haupt-/Testnet-Adressen.
Die offene Geräteabnahme ist davon unabhängig und bleibt offen.
