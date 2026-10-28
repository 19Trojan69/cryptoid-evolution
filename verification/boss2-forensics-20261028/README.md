# Boss-2-Feinanalyse, 28. Oktober 2026

Marc hat die isolierte Vorbereitung eines kurzen Boss-Tests mit automatisiertem
Vorlauf, sparsamen Gestenhinweisen und Prozessmessung bestätigt. Ausgangspunkt
ist Main `ce073547cf573375d141bf846f70e294138dbd73`, Tree
`494b543c9522317811acbf3eaf538393654f03e8`. Der private Besitzerbericht wird nicht
übernommen. Dessen Dirty-Markierung erlaubt keine Behauptung eines exakten Replays.

## Was vorbereitet ist

- Der bestehende verifizierte Owner-Mitschnitt erhält grobe Gestenkategorien:
  Richtung, Startregion (24 CSS-Pixel Randbereich), Weg-/Geschwindigkeitsklasse,
  100-ms-Dauerklassen und Ende/Abbruch. Keine Fingerkoordinaten, Pointer-IDs,
  URLs, History-Payloads, Konto-/Zahlungsdaten oder Rohfehlermeldungen.
- Nur vorhandene Eingabecallbacks treiben den Sammler. Höchstens acht Meldungen
  pro Sekunde; Bewegung höchstens alle 250 ms. Keine neuen Spieltimer/RAF oder
  automatische Übertragung. Ohne aktiven verifizierten Diagnosebeobachter wird
  kein Kontaktverlauf gesammelt. Die zwei History-Listener gehören zum
  verifizierten Recorder und werden beim Ende/Fehler entfernt.
- Die vorhandenen begrenzten IndexedDB-/Crash-Tail-Formate lesen und exportieren
  die neuen `input`-Einträge. Normale Steuerung, Fehlerpausen und manuelles
  Fortsetzen bleiben erhalten. Kein neuer öffentlicher Bericht oder Admin-Bypass.
- Ein separater Testserver fügt ausschließlich im Test ausgelieferte Hooks in
  den bytegleich gehaltenen GamePage-Controller ein. Direktstart: synthetischer
  Spielstand bei Boss 2, entfernte Geschütze und halbe Bossgesundheit als offen
  ausgewiesene Szenenvorgabe. Das ist kein normal erspielter Zustand.
- Während der Messfenster hält ein ausdrücklich ausgewiesener, nur im Testserver
  eingefügter Schadensboden Boss 2 bei höchstens 40 Prozent Mindestgesundheit
  am Leben. Bereits niedrigere Gesundheit wird nicht erhöht. Treffer, Schüsse,
  Effekte, Ton und Takt bleiben aktiv. Diese Absicherung ist keine normale
  Bosskampf-/Schwierigkeitsabnahme und wird nicht in die App übernommen.
- Der warme Lauf beginnt bei Abschnitt 1 und erreicht Abschnitt 20 über reguläre
  Abläufe/Handler mit echten Uhren. Technische Pausen sind Fehler. Karten und
  Abschluss-Continue werden ausdrücklich bedient, nicht durch Zeitverkürzung
  übersprungen. Künstliches Konto, Bestand, Zufall und Kollisionsschutz bleiben
  offengelegt; keine echte Anmeldung, Datenbank oder Zahlung.
- Linux-Messung von außen: getrennte Browser-/Renderer-/GPU-Prozessrollen,
  RSS/High-Water und PSS, soweit zugänglich. Nur Nachfahren des Testläufers werden
  zugeordnet. RSS-Summen können gemeinsame Seiten mehrfach zählen; Linux-Zähler
  sind keine iOS-/Android- oder GPU-residente Speichermessung.
- Ein optionaler Kontrolllauf lässt ausschließlich die neuen Eingabebelege aus;
  Ownerrolle, Katalog, Waffen und übrige Diagnose bleiben gleich. Unterschiedliche
  Läufe sind explorative Vergleiche, keine garantierten identischen Benchmarks.

## Testmatrix

Chromium-Androidprofil und WebKit-iPhoneprofil jeweils direkt und nach Vorlauf;
zusätzlich ein direkter Chromium-Lauf ohne neue Eingabebelege. Jeder Lauf erhält
getrennte 20-Sekunden-Fenster:

| Fall | Durchführung | Aussagegrenze |
| --- | --- | --- |
| Basis | Aktiver Reaktor ohne Zusatzaktion | Keine kontinuierliche Pixelbeobachtung |
| Links aus der Mitte | Fünf schnelle Bewegungen | Chromium: CDP-Touch; WebKit: synthetische Pointer-Handler |
| Links vom rechten Rand | Fünf Bewegungen ab 99 % Feldbreite | Kein Nachweis einer nativen Browser-History-Geste |
| Abgebrochene Bewegung | Fünf Bewegungen mit Cancel | Eingabe-/Freigabepfad, kein OS-Abbruch |
| Browseraufnahme | Eine Playwright-Aufnahme | Kein iOS-/Android-System-Screenshot oder dessen Vorschau |

Prüfbedingungen: Boss 2 bleibt aktiv/offen, echte Framecallbacks laufen weiter,
die Reaktorsalven steigen, keine technische/unerklärte Pause, kein Dokumentwechsel,
keine JS-/Konsolen-/API-Fehler und tatsächliche Prozessmesswerte. Die warme Variante
muss sämtliche Abschnitte 1 bis 20 beobachtet haben. Ein überschrittenes Zeitbudget
oder gescheiterter Testpilot gilt als Fehler, nicht als bestandene Stabilität.

Der echte System-Screenshot, dessen Vorschau, native Randnavigation und ein
physischer Pi-Browser bleiben ausdrücklich **nicht ausgeführt**, bis entsprechende
Gerätemessung vorliegt. Ein bestandener Laborlauf beweist keine White-Screen-Heilung.

## Ausführen

```sh
npm install --prefix frontend --include=optional --no-audit --no-fund
npm ci --prefix backend --include=optional --ignore-scripts
npm run build --prefix backend
npm run prepare:hulls --prefix frontend
npm install --prefix verification/boss2-forensics-20261028 --ignore-scripts --no-audit --no-fund
cd verification/boss2-forensics-20261028
npx playwright install --with-deps chromium webkit
node --experimental-strip-types preflight.mjs
CRYPTOID_TEST_PROFILE=android-phone CRYPTOID_FORENSIC_MODE=direct node run.mjs
CRYPTOID_TEST_PROFILE=iphone CRYPTOID_FORENSIC_MODE=warm node run.mjs
```

Ergebnisse liegen standardmäßig unter dem ignorierten `results/`. Der Workflow
`.github/workflows/cryptoid-boss2-forensics.yml` führt die fünf Varianten isoliert
bei GitHub aus. Seine Artefakte enthalten ausschließlich künstliche Testdaten;
Aufbewahrung drei Tage. Die Speicherprobe selbst verursacht Messaufwand. Alle
Verfahren halten native Spieluhren und den >2500-ms/500-ms-Pausenschutz bei.

## Physisches Android-Gerät

`android_capture.py --preflight` stellt nur fest, ob ADB und ein bereits
autorisierter Geräteanschluss vorhanden sind. Keine automatische USB-Autorisierung,
App-Installation, Datenlöschung, Zahlung oder Veröffentlichung. Für den tatsächlichen
Lauf muss ein Tester das installierte Paket eindeutig prüfen und auswählen:

```sh
python android_capture.py --preflight
python android_capture.py --serial DEVICE_SERIAL --package VERIFIED.PACKAGE \
  --seconds 120 --output /privater/pfad/cryptoid-android
```

Platzhalter vorher ersetzen. Renderer-PIDs werden nur mit `--renderer-pid PID`
hinzugenommen, nachdem sie unabhängig der betreffenden WebView zugeordnet wurden.
Der Hostprozess allein ist keine vollständige Renderer-Speichermessung.
Zeitstempel, Prozesswechsel, getrennte Meminfo-Ausgaben und passende Logcat-Zeilen
werden lokal gehalten. Diese Rohdateien können private Daten enthalten und gehören
nicht ins Repository oder automatisch in CI-Artefakte. Das Werkzeug zeichnet
Messungen auf; es bescheinigt weder die Durchführung einer bestimmten Geste noch
eine native Absturzursache.

Optional kann `node serve.mjs` das synthetische Labor nur auf Loopback-Port 4179
starten. Ein Android-Tester mit bereits autorisiertem Gerät kann einen ausdrücklich
eingerichteten lokalen Zugang verwenden. Der Server ist nicht für öffentliche
Freigabe bestimmt. Die App zeigt ihre üblichen Menüs; Resume öffnet die Testszene.
In diesem isolierten Host sind keine echten Pi-Zugangsdaten zu verwenden.

## iPhone / externes Gerätelabor

Ein externer Tester benötigt den tatsächlichen Pi Browser. Web Inspector setzt
einen Mac und eine vom Browser freigegebene WebView voraus; diese Freigabe ist
nicht aus einer Webseite heraus aktivierbar. Fehlt sie, bleibt Unterstützung
des Browseranbieters bzw. zugängliche native Diagnose notwendig. Ein reiner
Safari-/Linux-WebKit-Lauf ersetzt diese Prüfung nicht. Hier besteht kein belegter
Zugriff auf ein echtes Gerätelabor; es wurde kein kostenpflichtiger Dienst gebucht.

## Bisherige lokale Prüfung

- 508 Release-Tests, Lokalisierung und TypeScript erfolgreich; gesonderter Vite-
  Build vollständig abgeschlossen (Exit 0, Abschlussmarker vorhanden).
- Instrumentierter Controller: TypeScript und bestehende Handler-Startprüfung
  für Abschnitt 1 und Boss 2 erfolgreich; unveränderter GamePage bestätigt.
- Linux-Sampler-, Szenenabsicherungs-/Kontrollprüfungen und Android-Paketvalidierung
  erfolgreich; aktuelle genaue Testzahl in den Ausführungsbelegen.
- Geänderte TypeScript-Module lint-fehlerfrei.
- Lokaler Browserlauf: Server gestartet, anschließend fehlende Chromium-Binärdatei;
  null ausgeführte Browserszenen. Das ist kein Testpass.
- Geräte-Preflight: `adb-not-installed`, kein physischer Test ausgeführt.

Der erste externe Lauf 40731123040 ist als fehlgeschlagener Prüfaufbau erhalten:
Der Boss wurde während der geplanten Messfenster besiegt. Im künstlichen
Direktstart trat außerdem ein abgewiesener Checkpoint auf. Diese Ergebnisse
zählen weder als bestandene Messfenster noch als reproduzierter White Screen.
Der ursprüngliche Diagnose-Aus-Kontrolllauf änderte auch die Ownerrolle und
Waffenfreigabe; er wird nicht als isolierter Messaufwandsvergleich verwendet.
Die oben beschriebene Korrektur begrenzt den Kontrollunterschied auf Eingabebelege.
Folgeläufe warten auf den laufenden Vorversuch, damit seine Belege erhalten bleiben.
Neue externe Ergebnisse werden erst nach tatsächlicher Ausführung ergänzt.
Beim ersten WebKit-Vorlauf enthielt die Speicherprobe nur den Browserhauptprozess.
Seine Werte sind kein Content-/Gesamtspeichernachweis. Die Samplerkorrektur erhält
Abstammungsketten auch bei nicht lesbarer Wrapper-Befehlszeile, behandelt gekürzte
Prozessnamen, speichert keine Startargumente und weist unbekannte Nachfahren aus.
Ein künftiger Lauf darf eine Elternprozessprobe allein nicht mehr als vollständige
Content-Messung bestehen lassen. Szenenkontext wird den Speicherproben beigefügt.
Ein gesonderter kurzer WebKit-Lauf prüft diese Messgrenze; die laufenden langen
Szenenversuche werden nicht erneut gestartet. Artefakte schließen Vite-Caches aus.
PR194/195 bleiben getrennt. Dieser Prüfzweig schaltet automatische Vercel-
Deployments ab; Main, Testnet-/Produktionsadressen und reale Spielstände bleiben
unverändert. Weder ein Merge noch eine neue Veröffentlichung wird vorgenommen.
