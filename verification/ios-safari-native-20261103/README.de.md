# iOS-Safari-Prüfung der eingefrorenen Gastszene

## Ziel und Stand

Der gemeldete Handy-White-Screen ist weiterhin ungeklärt. Die erfolgreichen
Linux-Läufe werden hier um Apples iOS-Simulator mit dessen Safari ergänzt.
Dieser Test ist noch kein Nachweis einer Fehlerbehebung und kein echtes iPhone.
Die erste Ausführung muss die tatsächliche Verfügbarkeit und die Prozesszuordnung
der neuen Umgebung erst belegen. Fehlgeschlagene Vorprüfungen bleiben Fehlschläge.

## Unveränderte Spielversion

Zwei getrennte Checkouts enthalten den externen Testtreiber und den eingefrorenen
Kandidaten `ac98e95166b0e2013186257904da46323840dab5`, Baum
`99092ec24e843fb1e419dc382bc2523a4edc0b42`. Nur der externe Treiber und dieser
Workflow werden ergänzt. Frontend, Backend, API, Bilder, Ton und Spieluhren werden
nicht bearbeitet. Der vorhandene Gast-Build mit Originalgrafik und den bereits
eingeführten Testschutz-/Diagnosehilfen wird erneut gebaut.

Alle ausgelieferten Dateien werden vor und nach jedem Ablauf gehasht. Die
unveränderten Quellbäume und genau die beiden bereits bekannten generierten
NPM-Lockdateien werden kontrolliert. Der Build entsteht diesmal auf macOS;
Identität mit den Bytes des entfernten Vercel-Deployments wird nicht behauptet.
Es entsteht kein Deployment, und `main` wird nicht verändert.

## Erster Einrichtungsversuch: Build gestoppt

Quelle `85c512de4b1a1718f5ce8307463cd55d4cb50cec`,
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41593146394

Treiber-Prüfungen und der Start des iOS-26.2-Simulators mit Xcode 26.2 bestanden.
Der anschließende Build scheiterte, bevor Safari die Spielszene öffnete. Rollup
meldete `MISSING_EXPORT`: Der vorhandene Import `./PaintedShip` wurde auf dem
Mac als `paintedShip.ts` statt als `PaintedShip.tsx` aufgelöst. Auf diesem
Dateisystem wird die Groß-/Kleinschreibung nicht wie im bisherigen Linux-Build
unterschieden. Es gibt aus diesem Versuch keine bestandene Spielminute und
keinen nachgestellten White-Screen.

Die Einrichtungsänderung verwendet deshalb ein eigenes, mit einer echten
Dateiprobe geprüftes APFSX-Volume für den eingefrorenen Kandidaten. Keine
Quelldatei wird umbenannt oder inhaltlich angepasst. Das Volume verbleibt bis
zum Ende der automatischen Checkout-Aufräumarbeiten auf dem temporären Runner
und wird mit dessen Vernichtung verworfen. Der fehlgeschlagene erste Lauf
bleibt erhalten.

Der zweite Einrichtungsversuch `3b9f4c45c0a0f10f3731a1c473ac2b1ab029b5e2`,
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41594163423,
endete bereits beim Erzeugen des Volumes: `hdiutil` akzeptierte das verwendete
Formatkürzel `APFSX` nicht (`Invalid argument`). Auch dieser Lauf enthält keine
Spielprüfung. Der korrigierte Aufruf verwendet den Dateisystemnamen
`Case-sensitive APFS`; die echte Dateiprobe bleibt unverändert vorgeschrieben.

## Direkter Safari-Treiber: Verbindung vor Spielstart gescheitert

Quelle `53668ae36250da278f5d0c48e61103fb20b484a0`,
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41594414579

Der Dateisystemtest, Simulatorstart und unveränderte Gast-Build bestanden.
Apples direkter Treiber konnte die Sitzung allerdings nicht öffnen:
`session not created`, Zeitüberschreitung beim Suchen/Starten einer kompatiblen
Safari-Instanz und Warten auf deren `RWIApplication`. Es gab noch keinen
Spielzyklus und keinen beobachteten Spielabsturz. Die abschließenden Quellen-
und Paketprüfungen bestanden. Das Ergebnis bleibt `complete:false`.

Die nächste Ausführung verwendet deshalb Appium **3.9.0** mit dem dazu
kompatiblen XCUITest-Treiber **12.22.8**. Version 13 des Treibers wurde bewusst
nicht gewählt, weil dessen Paket Appium 4 als Beta voraussetzt. Die beiden
gewählten Versionen und ihre Peer-Anforderungen wurden an den offiziellen
Veröffentlichungen/Paketdateien geprüft. Installation und Begleit-App bleiben
außerhalb des eingefrorenen Spiel-Checkouts. WDA wird ausschließlich für den
Simulator gebaut; es gibt keinen Geräte-Account oder Signierdienst.

`nativeWebTap:true` verlangt normale native Berührungen statt JavaScript-Klicks.
Automatische XCTest-Screenshots, laufende Appium-Logsammler und angeforderte
Safari-GC bleiben ausgeschaltet. `waitForIdleTimeout:1` begrenzt allein das
Warten des Testwerkzeugs auf eine ruhige native Oberfläche; es verändert keine
Spieluhr. Die initiale WDA-Erstellung hat eine getrennte begrenzte Startfrist.
Eine unerwartete Unterbrechung im laufenden Spiel wird weiterhin nicht wiederholt
oder automatisch fortgesetzt. Quellen: 
https://github.com/appium/appium/releases/tag/appium%403.9.0
https://github.com/appium/appium-xcuitest-driver/blob/v12.22.8/package.json
https://appium.github.io/appium-xcuitest-driver/latest/reference/capabilities/

Der erste Appium-Workflow-Entwurf `3fdb936f7b6be027cac2600fef76a644444e0071`,
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41596062504,
wurde vor der Job-Zuweisung abgelehnt; die Jobliste ist leer. Der Entwurf
verwendete `runner.temp` an der nicht erlaubten Stelle `jobs.<job_id>.env`.
Die offizielle Kontexttabelle erlaubt `runner` dort nicht. Die Korrektur setzt
den eigenen Werkzeugpfad erst in einem Runner-Schritt und übergibt ihn mit
`GITHUB_ENV` an die folgenden Schritte. Auch dieser Entwurf liefert keine
Spielminute. Referenz:
https://docs.github.com/en/actions/reference/workflows-and-actions/contexts

## Appium-Verbindungsversuch ohne vorab geladene Webseite

Quelle `e3ec90bb0f610b7d88fe589269f0f1400727b49c`,
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41596611695

Werkzeuginstallation, Simulatorstart, Gast-Build und die abschließende Quellen-/
Paketprüfung bestanden. Die Appium-Sitzung scheiterte vor dem ersten Spielzyklus:
Der Remote-Debugger meldete nach 9966 ms keine verbundenen Web-Anwendungen.
Das ist ein Einrichtungs-/Verbindungsfehler, kein gemessener Spielabsturz.
Die nachträgliche Prozessabfrage lief in eine eigene Zeitüberschreitung und
liefert keinen gültigen Speicherwert. Im nativen Log abgesuchte `jetsam`-Wörter
werden nicht als belegte Prozessbeendigung ausgelegt.

Die geprüfte Treiberquelle aktiviert zuerst den aktuellen Webview und setzt
erst danach die normale Safari-Startadresse. Ein frischer Safari-Start ohne
bereits vorhandene Webseite ist deshalb eine konkrete, noch unbestätigte
Erklärung für fehlende Web-Anwendungen. Die nächste Einrichtung lädt die
vorhandene lokale Gastadresse über das dokumentierte `initialDeeplinkUrl`
bereits beim nativen Safari-Start; eine zusätzliche anschließende Navigation
wird vermieden. Es werden keine geratenen privaten Inspector-Schalter gesetzt.
Quelle: `lib/driver.ts` im unveränderten XCUITest-Tag `v12.22.8` und die
Capability-Dokumentation oben.

Zudem wurde eine vermischte Ausgabe erkannt: Auf eine große asynchrone
`console.log`-Zeile folgte die direkte Ausgabe einer synchronen Quellenprüfung.
Die betroffene native Logzeile ist im Original erhalten und wird nicht als
vollständig parsebares JSON umgedeutet. Neue große Belege werden in nummerierten,
SHA-256-gebundenen Fragmenten ausgegeben. Vor der nächsten Operation wird der
vollständige Abschluss jeder Ausgabe abgewartet. Der Offline-Prüfer
verlangt alle Fragmente in Reihenfolge und die exakten ursprünglichen Bytes.
Diese Änderung betrifft ausschließlich den externen Testtreiber.

## Kostenloser Ablauf

Das Repository wurde vor der Einrichtung als öffentlich bestätigt. Verwendet wird
ausschließlich der Standard-Runner `macos-15`, kein größerer oder GPU-Runner.
GitHub dokumentiert kostenlose Standard-Runner für öffentliche Repositories:
https://docs.github.com/en/actions/concepts/billing-and-usage

Der bereits vorhandene Xcode-26.2-Simulator wird verwendet. Kein Apple-Konto,
Testabo, Geräteanbieter oder kostenpflichtiger Dienst wird eingerichtet.
Appium und XCUITest steuern MobileSafari über W3C WebDriver und Apples XCTest.
Die Unterstützung für iOS-Simulatoren ist hier dokumentiert:
https://appium.github.io/appium-xcuitest-driver/latest/overview/

Es gibt keine zusätzlichen hochgeladenen Actions-Artefakte oder Caches. Die
synthetischen Belege werden mit eindeutigen JSON-Markern in das vorhandene
Workflow-Protokoll geschrieben und anschließend ausgewertet.

Zuerst muss ein vollständiger kurzer Ablauf mit 60, 10 und 10 realen aktiven
Sekunden bestehen. Danach startet eine neue, isolierte Safari-Automatisierung mit
1800, 10 und 10 aktiven Sekunden. Jeder Zyklus prüft die vorhandene Reaktor-Szene,
Pausenstillstand, Waffenmenü, normalen Ausstieg und anschließend den normalen
Berichtsexport. Die Startposition bleibt die vorhandene Mitte. Ein plötzliches
Pausieren, ein neues Dokument oder ausbleibender Bildfortschritt gilt als Fehler;
der Treiber setzt solche Unterbrechungen nicht automatisch fort.

## Neue Messdaten und Grenzen

Der Treiber liest die vorhandenen Diagnosewerte einmal pro ungefähr einer
Sekunde. Alle mindestens fünf Wandsekunden werden passende Dienste aus dem
`launchctl` des ausgewählten Simulators ermittelt und deren Host-RSS erfasst.
Ein tatsächlich beobachteter WebContent-Prozess ist eine Vorbedingung. Die
Zuordnung, PIDs und Einzelwerte bleiben im Beleg erhalten. Nach dem Ablauf
werden höchstens die letzten drei Minuten gefilterter Simulator-Protokolle
ausgelesen; Ausgabeumfang und eine eventuelle Kürzung werden angegeben.

RSS ist geteilter/privater residenter Host-Speicher ohne saubere Aufteilung und
ohne vollständigen GPU-Speicher. Diese Teilmenge wird weder als iPhone-RAM noch
als gesamter Browserspeicher oder nativer Absturzgrund ausgegeben. Der Simulator
hat andere Speicher-/Grafikgrenzen und ist kein Test des Pi Browsers. Die
XCUITest-Begleit-App und die Web-Inspector-Verbindung beeinflussen die
Testumgebung. Es gibt keine fremden Safari-Daten auf dem frischen Simulator.
Kamera, Bildschirmaufnahme und echte Handy-Unterbrechungen werden nicht
nachgestellt. Die früher beschriebenen Einschränkungen von Apples direktem
Automatisierungsfenster werden nicht pauschal auf Appium übertragen.

Es gibt keine aktiven Bildschirmaufnahmen, Heap-Snapshots oder erzwungene
Speicherbereinigung. DOM- und Uhrfortschritt beweisen keine korrekten nativen
Bildschirmpixel. Ein erfolgreicher Lauf erweitert die Abdeckung, löst aber den
gemeldeten Handyfehler nicht automatisch.
