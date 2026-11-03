# Gesicherter Zwischenstand der nativen Safari-Umgebung

Stand: 2026-11-03T08:42:21.329Z. Der gemeldete Handy-White-Screen ist offen.
Diese Belege enthalten ausschließlich synthetische CI-Daten, keine privaten
Besitzerberichte. Es wurde kein Spielcode geändert und kein neues Vercel-
Deployment angelegt. Alle fünf ursprünglichen Runtime-Verzeichnisse sind über
ihre Git-Objekt-IDs geprüft; siehe `evidence/source-scope.json`.

Die zehn abgeschlossenen Einrichtungs-/Kontrollversuche sind fehlgeschlagen.
Keiner hat einen neuen vollständigen Spielzyklus bestanden. Build-Prüfungen,
Werkzeug-Unit-Tests, ein betriebsbereiter Appium-Server und Simulatorstarts sind
getrennte Teilergebnisse. Sie werden nicht zu einem bestandenen mobilen
Langlauf oder einer White-Screen-Behebung zusammengezählt.

Die neueste Kontrollserie verwendet nur konstantes lokales HTML, ohne das
Spiel zu laden. Nach der getrennten SDK-Initialisierung laufen die beiden
Kontrollen für iOS 18.5 und 26.2 noch. Der Snapshot behauptet deren Ergebnis
nicht. Einzelne Quellen, Jobs, Fehlerstufen und der ausstehende Lauf stehen
in `evidence/history.json`.

`evidence/capture-index.json` bindet alle neun ursprünglichen Jobprotokolle an
die von GitHub gelieferten Git-Blob-IDs. Eine vor der Job-Zuweisung abgelehnte
Workflow-Fassung ist gesondert in `rejected-workflow.json` dokumentiert.
Die erste große Appium-Logzeile wurde durch eine Unterprozess-Ausgabe vermischt;
diese konkrete Datenlücke ist erhalten und ausdrücklich kein vollständiger
nativer Capture. Spätere große Belege verwenden nummerierte, SHA-256-gebundene
Fragmente. Der Parser und die Ablehnung verlorener/veränderter Fragmente wurden
mit synthetischen Unicode-/Mehrzeilen-Daten geprüft.

Der zusätzliche Mac-/Linux-Buildvergleich bestätigt gleiche Bytes der elf
JS-/CSS-Dateien des bereits gebauten Mac-Pakets gegenüber allen sechs früheren
Linux-Captures. Das ist keine unabhängig geprüfte Identität mit dem entfernten
Vercel-Deployment und kein kausaler Speichervergleich. Der Simulator, seine
Host-Prozessdaten und seine Architektur ersetzen kein physisches Handy.
