# Gesicherter Zwischenstand der nativen Safari-Umgebung

Stand: eigener Zeitstempel in `evidence/history.json`. Der gemeldete Handy-White-Screen ist offen.
Diese Belege enthalten ausschließlich synthetische CI-Daten, keine privaten
Besitzerberichte. Es wurde kein Spielcode geändert und kein neues Vercel-
Deployment angelegt. Alle fünf ursprünglichen Runtime-Verzeichnisse sind über
ihre Git-Objekt-IDs geprüft; siehe `evidence/source-scope.json`.

Die dreizehn abgeschlossenen Einrichtungs-/Kontrollversuche sind fehlgeschlagen.
Keiner hat einen neuen vollständigen Spielzyklus bestanden. Build-Prüfungen,
Werkzeug-Unit-Tests, ein betriebsbereiter Appium-Server und Simulatorstarts sind
getrennte Teilergebnisse. Sie werden nicht zu einem bestandenen mobilen
Langlauf oder einer White-Screen-Behebung zusammengezählt.

Die neueste Kontrollserie verwendet nur konstantes lokales HTML, ohne das
Spiel zu laden. Die getrennte SDK-Initialisierung bestand für iOS 18.5 und 26.2.
Danach scheiterte 18.5 am WDA-Start, 26.2 bereits am Simulator-Boot. Eine weitere
18.5-Fassung bootete, verlor aber die HTTP-Sitzung, während das gesicherte
Compilerende noch statische Analyse zeigte. Die damalige Transportursache ist
nicht erfasst; ein OOM oder bestimmter HTTP-Timeout wird nicht behauptet.
Die einzelne Fehleraufnahme überschritt ihre Grenze und wurde nicht gesichert.

Die laufende Fassung `47bed1ef078f74567f849fd0b70d2616cb4d1c78` trennt den
WDA-Bau vollständig von Simulator-Boot und HTTP-Sitzung. Sie verwendet nur
`build-for-testing`, keine zusätzliche statische Analyse, und verlangt einen
erfolgreichen Bau vor jeder Safari-Verbindung. Ihre Kontrollseite und ihr
zwingender vertrauenswürdiger Touch bleiben gleich. Der Snapshot behauptet
das noch ausstehende Ergebnis nicht. Einzelne Quellen, Jobs und Fehlerstufen
stehen in `evidence/history.json`.

`evidence/capture-index.json` bindet alle zwölf ursprünglichen Jobprotokolle an
die von GitHub gelieferten Git-Blob-IDs. Eine vor der Job-Zuweisung abgelehnte
Workflow-Fassung ist gesondert in `rejected-workflow.json` dokumentiert.
Die erste große Appium-Logzeile wurde durch eine Unterprozess-Ausgabe vermischt;
diese konkrete Datenlücke ist erhalten und ausdrücklich kein vollständiger
nativer Capture. Spätere große Belege verwenden nummerierte, SHA-256-gebundene
Fragmente. Der Parser und die Ablehnung verlorener/veränderter Fragmente wurden
mit synthetischen Unicode-/Mehrzeilen-Daten geprüft.

`evidence/verifyCapturedHistory.py` prüft die vollständigen Git-Blob-IDs,
Fragmentreihenfolge und Fragment-SHA-256 sowie die unveränderten Quellen.
Der Bericht `evidence/verified-history-summary.json` enthält zusätzlich die
SHA-256-Werte der zwölf vollständigen Mitschnitte. Alle zwölf Prüfungen
bestanden; das bestätigt ihre Integrität, keinen bestandenen Spiel- oder
Handytest. Die bekannte unvollständige Zeile ist nur für ihren exakt gepinnten
historischen Blob ausdrücklich zugelassen und im Ergebnis gezählt.

Der zusätzliche Mac-/Linux-Buildvergleich bestätigt gleiche Bytes der elf
JS-/CSS-Dateien des bereits gebauten Mac-Pakets gegenüber allen sechs früheren
Linux-Captures. Das ist keine unabhängig geprüfte Identität mit dem entfernten
Vercel-Deployment und kein kausaler Speichervergleich. Der Simulator, seine
Host-Prozessdaten und seine Architektur ersetzen kein physisches Handy.
