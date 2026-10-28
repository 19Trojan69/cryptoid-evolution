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
  erfolgreich: fünf Werkzeugtests, zwei Heap-Samplertests und ein Android-
  Paketvalidierungstest.
- Geänderte TypeScript-Module lint-fehlerfrei.
- Lokaler Browserlauf: Server gestartet, anschließend fehlende Chromium-Binärdatei;
  null ausgeführte Browserszenen. Das ist kein Testpass.
- Geräte-Preflight: `adb-not-installed`, kein physischer Test ausgeführt.

## Ausgeführte externe Prüfungen

Die bereinigten Belege stehen in [completed-results.json](completed-results.json).
Sie enthalten getestete Commits, Job-/Artefakt-IDs, Prüfsummen und Messbereiche;
keine privaten Besitzerberichte. Die heruntergeladenen drei Chromium-Messarchive
und die beiden gesonderten Speicherproben wurden per SHA-256 und ZIP-Integrität
geprüft. Die ursprünglichen WebKit-Szenenergebnisse wurden aus den Jobprotokollen
gelesen; ihre unvollständigen Speicherwerte sind ausgeschlossen.

| Ausführung | Tatsächlich geprüft | Ergebnis |
| --- | --- | --- |
| [Szenenmatrix 40733335418](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/40733335418), Commit `69496765` | Fünf Chromium-/WebKit-Varianten, 25 Fenster à 20 s, 75 gesteuerte Bewegungen, fünf Browseraufnahmen | Alle Szenenbedingungen bestanden; keine JS-/Konsolen-/API-Fehler oder unerklärter Dokumentwechsel. Beide warmen Läufe beobachteten Abschnitte 1–20. |
| [WebKit-Speicherprobe 40736374748](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/40736374748), Commit `f3c5ca52` | Warmer Lauf 1–20, danach fünf Fenster à 10 s und neun synthetische Bewegungen | Bestanden; 525/525 Proben mit `WPEWebProcess`, zusätzlich Netzwerk-/Hauptprozess. |
| [Chromium-Heapvergleich 40737185866](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/40737185866), Commit `0203e8a6` | Direktstart, fünf Fenster à 20 s, 15 CDP-Bewegungen; optionale CDP-Heapmessung von außerhalb der Seite | Bestanden; 106 Heap- und 93 Prozessproben, keine Samplerfehler. |

Linux-PSS-Spitzen der akzeptierten Chromium-Matrix: direkt mit Eingabebelegen
1329,52 MiB, direkt ohne diese Belege 1331,98 MiB, nach warmem Vorlauf 1545,67 MiB.
Der Anstieg liegt überwiegend im Renderer und beginnt bereits im Basisfenster
vor den gesteuerten Bewegungen. Diese getrennten Läufe belegen keine exakte
Aufwandsdifferenz. Sie sprechen gegen die Annahme, allein die neuen Eingabebelege
erklärten den dort gemessenen großen Zuwachs.

Im gesonderten Chromium-Vergleich steigt die Browser-PSS bis 1323,09 MiB.
Der benutzte gewöhnliche JavaScript-Heap erreicht maximal 51,17 MiB; der
zusätzliche CDP-Zähler `embedderHeapUsedSize` steigt von 6,12 bis maximal
407,81 MiB. Damit erklärt der gewöhnliche JavaScript-Heap allein die hohen
Prozesswerte nicht. Diese unterschiedlich abgegrenzten Zähler dürfen nicht als
getrennte Summanden addiert oder zur exakten Restberechnung subtrahiert werden.
Der Sammler läuft optional einmal pro Sekunde im Node-Testläufer, ohne neuen
Seitentimer, erzwungenen GC oder Heap-Snapshot. Aktivierung nur für Chromium:
`CRYPTOID_HEAP_PROBE=1 node run.mjs`.

Die korrigierte WebKit-Probe misst 1085,91 MiB Gesamt-PSS zu Beginn der
aufgezeichneten Szene, 1448,63 MiB am Ende und maximal 1507,87 MiB. Die Spitze
liegt bereits im Vorlauf vor den Gestenfenstern. Der Content-Prozess erreicht
1363,12 MiB. Es handelt sich um Linux-WPE-WebKit mit iPhone-Profil, nicht den
Speicherverbrauch eines echten iPhones.

**Aussagegrenze:** Eine große Speicherspur ist im Labor belegt. Weder die genaue
wachsende Ressource noch ihre Verbindung zum gelegentlichen Pi-Browser-Abbruch
ist damit bewiesen. Vite-Entwicklungsserver, Linux-/Softwarerendering, synthetischer
Spielstand, Kollisionsschutz und der Boss-Schadensboden unterscheiden sich vom
normalen Spiel auf einem Gerät. Kein White Screen wurde reproduziert oder als
behoben bestätigt. System-Screenshot/Vorschau und native Randnavigation wurden
nicht getestet. Bestandene Fenster liefern keine Fehlerquote für seltene Abbrüche.

## Ausgeschlossene Vorversuche und Veröffentlichungsstand

Der erste externe Lauf 40731123040 ist als fehlgeschlagener Prüfaufbau erhalten:
Der Boss wurde während der geplanten Messfenster besiegt. Im künstlichen
Direktstart trat außerdem ein abgewiesener Checkpoint auf. Diese Ergebnisse
zählen weder als bestandene Messfenster noch als reproduzierter White Screen.
Der ursprüngliche Diagnose-Aus-Kontrolllauf änderte auch die Ownerrolle und
Waffenfreigabe; er wird nicht als isolierter Messaufwandsvergleich verwendet.
Die oben beschriebene Korrektur begrenzt den Kontrollunterschied auf Eingabebelege.
Beim ursprünglichen WebKit-Vorlauf enthielt die Speicherprobe nur den
Browserhauptprozess. Seine Werte sind kein Content-/Gesamtspeichernachweis.
Auch der gesonderte Lauf 40734594626 bestand seine Szenen, scheiterte aber korrekt
an der Content-Messabdeckung. Er zählt nicht als bestandene Speicherprobe oder
App-Absturz. Die Samplerkorrektur erkennt die tatsächlichen Namen `WPEWebProcess`
und `WPENetworkProcess`, erhält
Abstammungsketten auch bei nicht lesbarer Wrapper-Befehlszeile, behandelt gekürzte
Prozessnamen, speichert keine Startargumente und weist unbekannte Nachfahren aus.
Eine Elternprozessprobe allein kann die Content-Messprüfung nicht mehr bestehen.
Szenenkontext wird den Speicherproben beigefügt. Die korrigierte warme Probe oben
bestätigt die Abdeckung; der fehlgeschlagene Aufbau bleibt nachvollziehbar.
Artefakte schließen Vite-Caches aus. Die gesonderten Workflow-Dateien sind
`.github/workflows/cryptoid-webkit-memory-probe.yml` und
`.github/workflows/cryptoid-chromium-heap-probe.yml`.
PR194/195 bleiben getrennt. Dieser Prüfzweig schaltet automatische Vercel-
Deployments ab; Main, Testnet-/Produktionsadressen und reale Spielstände bleiben
unverändert. Weder ein Merge noch eine neue Veröffentlichung wird vorgenommen.

## Gezieltes Objektprofil

`node profileObjects.mjs` ergänzt einen ausdrücklich invasiven Chromium-
Vorher-/Nachher-Vergleich am künstlichen Boss-2-Direktstart. Nach dem ersten
regulären Pause-Klick werden Heap-/DOM-/Prozesszähler vor und nach einer
expliziten Garbage Collection erfasst. Ein Heap-Schnappschuss entsteht nur im
pausierten Zustand. Danach bedient der Läufer regulär Resume, beobachtet
60 Sekunden laufenden Kampf ohne Zusatzgeste und wiederholt die pausierte
Messung. Echte Spieluhren, Stillstandsschutz und manuelles Resume bleiben
aktiv. Diese Untersuchung ist keine unbeeinflusste Stabilitätsabnahme und
beweist keinen nativen Pi-Browser-Fehler.

Gemessen werden Prozess-RSS/PSS, gewöhnlicher und browserinterner GC-Heap,
DOM-Dokumente/-Knoten/-Listener, sichtbare Element-/Bild-/Canvas-/Animationszahlen
und die bestehenden Effekt-/Audiozähler. Die Zahlen sind unterschiedlich
abgegrenzt; eine Differenz zwischen DOM-Zählern allein ist kein Nachweis
abgetrennter Knoten. Audiozähler betreffen die Spieleffekte, nicht sämtliche
nativen Audiopuffer des Browsers.

Die zwei Roh-Schnappschüsse werden auf je 128 MiB begrenzt, lokal ausgewertet
und nach erfolgreicher Auswertung entfernt. Exportiert werden nur Summen,
Konstruktorbezeichner und Knoten-Eigengrößen. Stringwerte, DOM-Attribute/-Text,
URLs und Referenzkanten werden nicht exportiert. Eigengrößen sind keine
dominatorbasierten Retained Sizes. Die Differenz benennt wachsende Klassen,
aber noch keinen haltenden Verweis oder sicheren Verursacher.

Der gesonderte Workflow heißt `cryptoid-browser-object-profile.yml`. Seine
Artefaktliste enthält ausschließlich bereinigte JSON-/JSONL-Dateien und
schließt Roh-Schnappschüsse und Vite-Caches aus. Die abgeschlossenen
Ausführungen und ihre Aussagegrenzen stehen unten und in
[object-profile-results.json](object-profile-results.json).

`CRYPTOID_PROFILE_BUILD=production node profileObjects.mjs` baut dieselbe
instrumentierte synthetische Szene mit Vite im Produktionsmodus und liefert
sie nur auf Loopback aus. Der Test prüft die tatsächlichen gebündelten
`import.meta.env`-Flags; installierte React-/React-DOM-Versionen werden erfasst.
Die Handler bleiben im synthetischen Testmodus. Buildausgaben liegen nur in
ignorierten Laborergebnissen, eine Veröffentlichung ist damit nicht verbunden.
Dieser Vergleich ist nötig, weil React-Entwicklungsinstrumentierung zusätzliche
Performance-Messeinträge erzeugt; der Entwicklungsserver allein ist kein
Produktions-Speicherbenchmark.

## Ergebnis des Objektprofilings

Zwei Profile sind abgeschlossen: [Entwicklungsmodus 40742453252](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/40742453252)
an Commit `08425b5a` mit 60,998 Sekunden aktivem Kampf und
[Produktionsmodus 40744147683](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/40744147683)
an Commit `de368aaf` mit 60,610 Sekunden. Je zwei pausierte Schnappschüsse und
58 aktive Zählerproben wurden ausgewertet. Beide Profile hielten Reaktorsalven
und Framecallbacks aufrecht; keine technische Pause oder API-Fehler. Die
regulären Pause-/Resume-Aktionen sind ausdrücklich Teil der Messmethode.

| Linux-Browser-PSS, MiB | Entwicklung | Produktionsmodus |
| --- | ---: | ---: |
| Beginn nach explizitem GC, pausiert | 440,45 | 381,10 |
| Aktive Messphase, Spitze | 939,01 | 633,97 |
| Ende pausiert, vor explizitem GC | 949,81 | 642,14 |
| Ende pausiert, nach explizitem GC | 526,86 | 418,57 |
| Verbleibender Anstieg gegenüber Beginn nach GC | 86,41 | 37,47 |

Damit ist ein großer Teil des hier beobachteten Zuwachses wieder einsammelbar.
Der verbleibende Anstieg wird nicht als geklärt oder normal ausgegeben. Ein
60-Sekunden-Fenster kann weder langfristiges Wachstum ausschließen noch einen
unbegrenzten Leak beweisen. Der Profiler selbst beeinflusst den Prozessspeicher;
Snapshots starten ebenfalls eine Speicherbereinigung. Diese Daten ersetzen
keine ungestörte Messung auf einem physischen Gerät.

Die gewöhnlichen JS-Heaps nach GC wachsen von 17,87 auf 20,12 MiB bzw. von
9,04 auf 10,69 MiB. Die Zähler für DOM-Knoten wachsen nach GC von 935 auf 996
bzw. von 882 auf 946; die Listener von 321 auf 339 bzw. 322 auf 338. Die
Szenen haben am Ende auch andere lebende Projektile/Animationen. Diese
Differenzen allein sind kein Nachweis zurückgehaltener, abgetrennter Elemente.
Sichtbare Bilder und Canvas-Flächen bleiben bei eins und drei, die erfassten
Effekt-Audiopuffer bei 6.925.568 Bytes. Browserinterne Bild-, Grafik- und
Audiokapazitäten sind damit nicht vollständig erfasst.

Im Entwicklungssnapshot erscheinen 15.155 zusätzliche `PerformanceMeasure`-
Objekte (1.827.432 Bytes zusätzliche Eigengrößen). Der Spielquellcode unter
`frontend/src` ruft `performance.measure` nicht auf; die lokal geprüfte
React-DOM-Entwicklungsversion dagegen schon. React dokumentiert zusätzliche
[Performance-Instrumentierung im Entwicklungsmodus](https://react.dev/reference/dev-tools/react-performance-tracks).
Eine vollständige Zuordnung über haltende Referenzen wurde nicht durchgeführt;
insbesondere erklärt dieser Eigengrößenzähler nicht allein die ganze PSS-
Differenz. Im Produktionsprofil bleiben die abgefragten Timeline-Messzähler
bei null, ohne entsprechende Zunahme in der exportierten Klassendifferenz.
Das unterstreicht die Grenzen des ursprünglichen Entwicklungs-Laborwerts.

Im Produktionslauf sind die tatsächlichen Browserflags `DEV=false`,
`PROD=true` bestätigt; React und React DOM waren dort Version 19.2.4.
Im früheren Entwicklungslauf wurde die Abhängigkeitsversion nicht aufgezeichnet.
Die getrennten Läufe sind deshalb kein exakt identischer Benchmark und
quantifizieren nicht isoliert den React-Instrumentierungsanteil.

Der erste Profiling-Anlauf 40741836537 an `772da79d` ist ausgeschlossen:
Die neue Navigationserkennung wertete die normale Pausen-History irrtümlich
als Dokumentwechsel. Es entstanden null Schnappschüsse und kein App-Absturz.
Die korrigierte Prüfung vergleicht die Bootkennung und lehnt echte
Dokumentanfragen/-ersetzungen weiterhin ab. Die Roh-Snapshots der erfolgreichen
Profile wurden im CI nach Auswertung entfernt; die heruntergeladenen Aggregate
sind per SHA-256 und ZIP-Integrität geprüft. Die dauerhafte bereinigte Quittung
enthält beide getesteten Commits, Artefakte, Zähler, Typ-/Klassendifferenzen und
die ausgeschlossene Messung. Main, reale Konten und veröffentlichte Apps sind
unverändert. Es wird kein White-Screen-Fix behauptet und keine weitere
Profiling-Ausführung durch diesen Ergebnisnachtrag gestartet.

## Wiederholter Produktionslauf und Pause-Belege

Die anschließend bestätigte Fortsetzung ergänzt drei Dinge:

- Ein Produktionsbuild bleibt im selben Browserprozess für 60 Sekunden
  Aufwärmphase und drei weitere Fenster zu je 60 Sekunden aktiv. Zwischen
  Fenstern werden regulär Pause/Resume bedient und nur pausiert expliziter GC
  sowie ein Snapshot ausgeführt. Asset-, Quell-Lock- und Installations-Lock-
  Prüfsummen werden vor/nach dem Lauf verglichen; React-/Node-/Browserversionen
  sind aufgezeichnet. Es gibt während der Fenster keine Neuinstallation oder
  einen Buildwechsel. Die Kampfszene entwickelt sich mit ihren echten Uhren
  weiter; die Fenster sind keine identischen eingefrorenen Spielframes.
- Die Snapshot-Auswertung führt zusätzlich private, prozessinterne Objekt-IDs
  gegen die warme Baseline. Für bis zu acht wachsende Klassen werden höchstens
  zwei neue Objekte mit einem kürzesten Pfad vom synthetischen Snapshot-Root
  untersucht. Als schwach markierte Kanten sind ausgeschlossen. Ausgegeben
  werden nur Konstruktor-/C++-Klassennamen, feste erlaubte Eigenschaftsnamen
  und begrenzte Pfadstücke mit ausdrücklich markierten Auslassungen. Keine
  IDs, Zeichenkettenwerte, DOM-Attribute oder unbekannten Schlüssel werden
  exportiert. Synthetische, native und Inspector-Wurzeln können vorkommen.
  Das ist weder eine vollständige Dominatoranalyse noch ein Beweis, dass ein
  erreichbares Objekt unnötig ist. Klassendifferenzen werden im Speicher vor
  der begrenzten Exportauswahl berechnet, damit wechselnde Top-150-Ränge keine
  erfundenen Neuallokationen erzeugen.
- Verifizierte Owner erhalten am tatsächlichen vorhandenen Pause-Zweig einen
  begrenzten `pause`-Eintrag: manueller Pause-/Home-/Waffenmenüeintritt,
  Belohnungskarten/Boss-Zusammenfassung, Blur/Sichtbarkeit/Rückkehr sowie die
  sechs bestehenden technischen Unterbrechungsgründe. Er entsteht unmittelbar
  vor der unveränderten Zuweisung von `playing` nach `paused`; `status` bezeichnet
  den Ausgangszustand, `targetStatus` das Ziel. Frameabstand, Sichtbarkeit und
  Fokus sind grobe zusätzliche Belege. Neue Spieler-Listener/Timer oder
  automatische Übertragung entstehen nicht. Wiederholte Aufrufe bei bereits
  pausiertem Spiel werden nicht als neuer Eintritt ausgegeben. Altdaten bleiben
  lesbar. Recorder und Crash-Tail übernehmen das neue erlaubte Format.

Der echte Controller hat damit Diagnose-Ergänzungen; er wird nicht mehr als
bytegleich zum Release ausgegeben. Zwölf exakt reversible Hunks stellen den
gesamten veröffentlichten Controller wieder her. Sie schließen die Original-
Statuszuweisungen, Aufrufer und Abhängigkeiten ein; pauschales Entfernen von
Diagnose-Aufrufen ist nicht erlaubt. Zwei Abhängigkeitsergänzungen betreffen
die Ownerfreigabe und den stabilen React-Setter. Alle Uhren, Schutzpausen,
Speicher-/Zahlungsabläufe und manuelles Resume bleiben erhalten. Historische
Negativprüfungen akzeptieren jetzt auch die frühere Zurückweisung durch diese
strengere Hunk-Prüfung; ihre positiven Original-Fingerprints bleiben gleich.

Ein gesonderter, ausdrücklich synthetischer DOM-Blur nach den Speicherfenstern
prüft den tatsächlichen Blur-Callback samt Pause-Beleg. Unit-Prüfungen führen
auch die echten Sichtbarkeits-/Hintergrund- und technischen Callback-Körper aus.
Das ist kein auf Android/iOS ausgeführtes Fokusereignis. Eine reale Pi-Browser-
Pause bzw. der ursprüngliche iPhone-Abbruch bleiben Gerätebefunde, bis ein
passender physischer Zugriff vorhanden ist. Diese Fortsetzung veröffentlicht
keine neue App-Version und behauptet keinen bestätigten White-Screen-Fix.
