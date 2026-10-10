# Tablet: Anmeldung und Schiffsgrößen

Ausgangsstand: `ad521451d44da4de444ff98c8d62da107ac0a733`, zuletzt auf Testnet und Produktion bereitgestellte Startseite. Keine Änderungen an Backend, Datenbank, Bestwerten, Zahlungsdaten oder Netzwerkzuordnung.

## Korrekturen

- Die native Pi-Anmeldung hatte keine Zeitbegrenzung. Wenn die Browser-Brücke nicht antwortete, blieb „Anmeldung läuft …“ dauerhaft stehen. Nach spätestens 60 Sekunden wird die Oberfläche jetzt freigegeben. Die vorhandene übersetzte Fehlermeldung erscheint und eine neue Anmeldung ist möglich. Verspätete Antworten des abgelaufenen Versuchs werden nicht als Anmeldung gespeichert.
- Bestehende Sitzungen der installierten Web-App werden weiterhin wiederhergestellt. Es gibt im untersuchten Anmeldecode keine Sperre gegen eine Anmeldung auf einem zweiten Gerät. Die Ursache einer nicht antwortenden nativen Pi-Brücke auf dem konkreten Tablet ist damit noch nicht nachgewiesen oder behoben.
- Gegner hatten feste Bildgrößen, während das Spielerschiff auf größeren Ansichten wuchs. Ihre Bildgröße wird jetzt proportional zur gemessenen CSS-Breite des Spielerschiffs skaliert. Leichte, mittlere und schwere Gegner sowie Begleiter behalten ihre Größenabstufung. Bei 132 Pixel Spielerbreite sind die normalen Gegner ungefähr 77, 111 und 154 Pixel breit, bisher 55, 79 und 110 Pixel.
- Die Messung erfolgt beim Größenwechsel über den bestehenden ResizeObserver. Keine zusätzliche Messung in der Spielschleife. Trefferflächen, Lebenspunkte, Positionen, Formationen und Bossgrößen bleiben unverändert.

## Prüfungen vor Veröffentlichung

- Gesamte vorhandene Frontend-Testauswahl einschließlich neuer Anmeldetests und Größenprüfungen erfolgreich.
- Neue Anmeldetests: Zeitüberschreitung gibt Oberfläche frei; verspätete Antwort wird ignoriert; erneuter Versuch kann erfolgreich anmelden; SDK-Ablehnung schreibt keine Sitzung; bestehende Web-App-Sitzung bleibt nutzbar.
- Größenprüfungen: gleichbleibendes Verhältnis bei Spielerbreiten 94 bis 160 Pixel; Größenabstufungen und Kampfdefinitionen erhalten; Einbindung in den tatsächlichen Renderer geprüft.
- Frontend-Build mit TypeScript, Übersetzungstests und Sprachfreigabe erfolgreich. Bestehende Warnung über die Größe des JavaScript-Bundles bleibt bestehen.
- ESLint für alle vier geänderten TypeScript-Dateien ohne Fehler oder Warnungen. `git diff --check` erfolgreich.

## Veröffentlichung und praktische Grenzen

Bereitstellung über den bestehenden Vorschauzweig `codex/seven-packages-20261009`, damit dessen branchbezogene Testnet-Konfiguration erhalten bleibt. Produktion wird aus demselben unveränderlichen Commit mit Produktionsumgebung gebaut. Keine Übernahme des kompilierten Testnet-Builds in Produktion.

Nach Bereitstellung sind Commit, Alias, Ressourcen-MIME-Typen, API-Netzwerk und öffentliche Ranglisten vor/nach der Aktualisierung lesend zu prüfen. Eine echte Pi-Anmeldung auf dem Tablet und eine Sichtprüfung der Schiffsgrößen in dessen Pi Browser müssen am Gerät bestätigt werden. Der erforderliche Browser-Prüfzugang ist in dieser Umgebung nicht verfügbar; es wurden keine echten Konten, Käufe oder Spielstände zu Testzwecken geschrieben.

Das abgebildete „Cryptoid“-Symbol entspricht dem vorhandenen PWA-Manifest und der Datei `cryptoid-icon.svg`. Welche Adresse und welcher Browser hinter der installierten Tablet-Verknüpfung stehen, ist nicht ermittelt. Unterschiedliche Browser-Kontexte können getrennte Anmeldesitzungen besitzen.
