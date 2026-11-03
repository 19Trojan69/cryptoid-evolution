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

## Kostenloser Ablauf

Das Repository wurde vor der Einrichtung als öffentlich bestätigt. Verwendet wird
ausschließlich der Standard-Runner `macos-15`, kein größerer oder GPU-Runner.
GitHub dokumentiert kostenlose Standard-Runner für öffentliche Repositories:
https://docs.github.com/en/actions/concepts/billing-and-usage

Der bereits vorhandene Xcode-26.2-Simulator wird verwendet. Kein Apple-Konto,
Testabo, Geräteanbieter oder kostenpflichtiger Dienst wird eingerichtet. Apples
vorinstallierter `safaridriver` steuert Safari direkt über W3C WebDriver; eine
zusätzliche Appium-Installation ist deshalb nicht notwendig. Die Unterstützung
für iOS-Simulatoren ist hier dokumentiert:
https://webkit.org/blog/9395/webdriver-is-coming-to-safari-in-ios-13/

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
WebDriver-Fenster verwenden isolierte Daten und unterdrücken bestimmte
Systemunterbrechungen. Kamera und Bildschirmaufnahme werden nicht nachgestellt.

Es gibt keine aktiven Bildschirmaufnahmen, Heap-Snapshots oder erzwungene
Speicherbereinigung. DOM- und Uhrfortschritt beweisen keine korrekten nativen
Bildschirmpixel. Ein erfolgreicher Lauf erweitert die Abdeckung, löst aber den
gemeldeten Handyfehler nicht automatisch.
