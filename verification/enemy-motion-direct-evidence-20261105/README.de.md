# Ergebnis: direkte Gegner-Styles intern geprüft, kein neuer Handytest

Die neue Renderingvariante besteht die begrenzten Darstellungs-/Ablaufprüfungen.
Der kurze Speichervergleich liefert nur kleine, überlappende Unterschiede.
Ein belastbarer nativer Speichergewinn oder White-Screen-Fix ist nicht belegt.
Die Variante bleibt intern; keine neue Vorschau und kein weiterer unveränderter
Handy-Dauertest werden daraus abgeleitet. Der Geräteexport bei 27:53,672 bleibt
ein Seitenneustart ohne geklärte Ursache und ohne automatische native Diagnose.
Die private Originaldatei wurde nicht in dieses öffentliche Repository übertragen.

## Quelle und tatsächliche Änderung

Branch: `codex/enemy-motion-internal-20261105`.
Geprüfte Quelle: `4ecdde51c0ab77a3e90c96dfd0cddf0bdfa4bb40`.
Quellbaum: `6be297245426b78e1ad12c3e121ad2fe5f215101`.
Basis: bereitgestellter `9f3bf451c01d6976ea1a50342cdec1470e2e080b`.
Code und vorab festgelegte Methode:
https://github.com/19Trojan69/cryptoid-evolution/tree/4ecdde51c0ab77a3e90c96dfd0cddf0bdfa4bb40/verification/enemy-motion-direct-20261105

Nur im virtuellen Build wechseln drei häufige normale Gegnerwerte vom geerbten
Unterbaum zu ihren vorhandenen Verbrauchern: Neigung an transform, Schublänge
an height, Rumpflicht an opacity. Originalformeln und Bildmaterial bleiben
erhalten. Spieler, Bonus und andere Aufrufer behalten den bisherigen Pfad.
Zwei zusätzliche CSS-Regeln erhalten reduzierte Bewegung auch bei manueller
Pause. Keine neuen Game-Timer, Frames, Listener, DOM-Knoten oder Spieluhren.
Die neuen primitiven Props können zusätzliche einfache Child-Renders auslösen;
ein Vorteil wurde deshalb nicht aus der Quelländerung allein abgeleitet.

Alle fünf Runtime-Quellbäume und vercel.json bleiben exakt wie 9f3. Der gesamte
eingefrorene frontend/src-Bestand wurde verfügbar gemacht: 485 passende
Quelldateien, 4.613.161 Bytes, darunter 39 CSS-Dateien. Alle 485 entsprechen ihren
Git-Blobs. Dies ist keine pauschale semantische Freiprüfung sämtlicher Module.
Der neue native Quellenabgleich schließt einen bloßen Gleichwert-Schreibfilter
als belegten Cache-Leak-Fix aus: WebKit vergleicht gleiche Property-Inhalte
bereits selbst. Parsingkosten sind dadurch nicht als null bewiesen.
Vier genaue Quellfingerprints stehen in `native-source-review.json`.

## Tatsächlich bestandene Prüfung

CI: https://github.com/19Trojan69/cryptoid-evolution/actions/runs/42046493626
Gesamtlauf success, alle vier Jobs success. Fünf lokale Quell-/Treiberfälle,
strenge Typprüfung des neuen Helpers, Syntaxprüfung beider vollständigen virtuellen
TSX-Dateien und der normale eingefrorene Gast-Build bestehen. Keine neue gesamte
Projekt-Typprüfung oder neue physische Geräteabnahme wird behauptet.

Chromium 151.0.7922.34, Job 127310730884, und Linux-WebKit 26.5, Job
127310731176, bestehen je drei 60/10/10-Spielzyklen mit Pause, Waffenmenü,
Home-Bestätigung und normalem Journalexport. ID/Quelle/ended/elapsedMs stimmen
nach dem normalen Ausstieg exakt; laufgebundener Ressourcenpunkt vorhanden;
keine gespeicherten normalen error-/unhandledrejection-Einträge.

Der neue native Vergleich läuft nur in der regulären Pause: acht Werteprofile
in drei Bewegungseinstellungen, also 24 Fälle je Engine. Alle standardisierten
berechneten Styles und Rechtecke der sechs verglichenen Knoten sind exakt gleich.
Der Prototyp stammt aus bereits vorbereiteten tatsächlichen Schiffsknoten.
Keine vollständige Pixel-/Sprite-/Kampagnenabnahme. Bestehende Animationen bleiben
innerhalb derselben Einstellung identisch; ein Einstellungswechsel darf die
authentischen CSS-Animationen ersetzen. Die alten zehn Journal-Zustands- und zwölf
Fehlerfälle sowie die beendete Simulatorserie wurden nicht erneut gestartet.

## Kurzer PSS-Vergleich

Jobs 127313576586 und 127313576705 bestehen. Je zwei frische Chromium-Prozesse
auf demselben Runner, Reihenfolgen Control/Candidate und Candidate/Control.
Jeder Arm spielt tatsächlich mindestens 180 aktive Sekunden, danach die zwei
vorhandenen kurzen Wiedereinstiege und den normalen Export. Alle vier Hauptläufe
schaffen 64 weitere Kernsalven; aktive Wandzeiten rund 181,4–181,7 Sekunden.
36 externe Fünfsekundenpunkte pro Hauptlauf, zwölf Punkte in der letzten Minute.
Keine zusätzliche aktive Game-Instrumentierung, kein Dump, Snapshot oder GC.

| Paar | Letzte Minute Control, Mittel MiB | Candidate, Mittel MiB | Verringerung MiB | Bereiche überlappen |
|---|---:|---:|---:|---|
| 1, Control zuerst | 431,138 | 422,085 | 9,053 | ja |
| 2, Candidate zuerst | 424,455 | 422,382 | 2,073 | ja |

Bereiche, höchste tatsächlich gespeicherte PSS-Punkte und Aktivitätsdaten stehen
in `comparison-summary.json`; beide unveränderten Originalquittungen liegen
daneben. Das ist gesamte Linux-Browser-Nachfahren-PSS, weder iPhone-RAM noch GPU-
Speicher oder ein reiner Rendererwert. Zwischenpunkte und tatsächliche zeitliche
Spitzen sind nicht gemessen. Die vier Spielszenen sind unabhängig und unseeded.
Die alte Markierung memoryComparisonEligible:false bleibt in allen vier Rohdaten
erhalten. Keine historische fehlgeschlagene Abnahme wird umgewertet, keine
universelle MB-/Prozentvorgabe eingeführt. Die Mittelwerte sind in beiden Paaren
niedriger; eine verlässliche native Entlastung im problematischen langen Verlauf
folgt aus diesen kleinen, überlappenden kurzen Beobachtungen nicht.

## Erster Treiberfehler bleibt erhalten

Quelle `12847df2211bceb754bfbdef17f8b09c6fb16bb8`, CI 42045250069, insgesamt
failure. Chromium 127306330825 besteht Build/Helpertypen/TSX, bricht dann vor
Browser-/Spielstart an der falschen argv-Zuordnung der Engine ab. WebKit
127306330606 endet während der Bibliotheksinstallation mit cancelled; kein
WebKit-Build-/Spielpass daraus. Paarbeobachtung wird übersprungen.
Die zwei komprimierten Original-Joblogs mit SHA256 bleiben erhalten. Die Korrektur
bindet die Engine ausdrücklich; die neue fünfte Vorprüfung validiert beide
generierten Treiberebenen aus tatsächlichen CLI-Aufrufen. Der Renderer bleibt
dabei unverändert. Keine Zeit-, Quellen-, Fehler- oder Darstellungsregel wurde
gelockert. Ein Messaufbaufehler ist keine diagnostizierte Spiel-Abbruchursache.

## Erhalt und Belege

`preservation-proof.json` hält die fünf Quellbaum-IDs, unveränderte vercel.json
und tatsächlich erneut gelesene öffentliche Alias-Ziele fest. Produktion,
öffentliches Testnet und der bisherige Diagnosealias sind unverändert. Kein
Merge, Deployment, Produktions-Promotion oder geänderter Zugriffsschutz.
Die Nutzerangabe „alles aktuell“ bleibt akzeptiert; USB ist keine Voraussetzung.

Vier Original-CI-ZIPs wurden gegen GitHub-Digest, Größe und ZIP-Integrität geprüft
und unter `artifacts/` bytegleich archiviert. Die sechs Binär-Git-Blobs entsprechen
den Originaldateien. `manifest.json` enthält die archivierten Hashes;
`ci-receipt.json` trennt erfolgreiche Prüfmethodik von fehlender Fix-Abnahme.
Keine privaten Geräte-Rohdaten, Zugangsdaten oder geheimen Freigabeparameter.
