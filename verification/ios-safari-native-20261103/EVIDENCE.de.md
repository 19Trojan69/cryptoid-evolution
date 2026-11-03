# Gesicherter Zwischenstand der nativen Safari-Umgebung

Stand: eigener Zeitstempel in `evidence/history.json`. Der gemeldete Handy-White-Screen ist offen.
Diese Belege enthalten ausschließlich synthetische CI-Daten, keine privaten
Besitzerberichte. Es wurde kein Spielcode geändert und kein neues Vercel-
Deployment angelegt. Alle fünf ursprünglichen Runtime-Verzeichnisse sind über
ihre Git-Objekt-IDs geprüft; siehe `evidence/source-scope.json`.

Die fünfzehn abgeschlossenen Einrichtungs-/Kontrollversuche sind fehlgeschlagen.
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

Die Fassung `47bed1ef078f74567f849fd0b70d2616cb4d1c78` trennte den
WDA-Bau von Simulator-Boot und HTTP-Sitzung. Sie scheiterte jedoch bereits bei
der Projektsuche: Das installierte ESM-Paket bietet den benutzten CommonJS-
Moduleinstieg nicht an (`ERR_PACKAGE_PATH_NOT_EXPORTED`). Weder WDA-Bau noch
Simulator-Boot oder Safari-Sitzung wurden erreicht. Dieser Fehler gehört zum
Testskript und zählt nicht als Spielabbruch. Mangels strukturierter Endmeldung
wird ausschließlich das vollständige ursprüngliche Jobprotokoll gewertet.

Die Fassung `84687baee154b00dc8afbb6898210071c80bd15d` fand das Projekt
korrekt. Ihre beiden Vorprüfungen bestanden. WebDriverAgent 16.17.7 wurde nach
136875 ms erfolgreich gebaut. Simulator-Boot, native Safari-Sitzung und Lesen
der nativen Oberfläche bestanden ebenfalls. Die konstante lokale Kontrollseite
war tatsächlich sichtbar geladen. Die Kontextabfrage lieferte aber nur
`NATIVE_APP`; deshalb wurden DOM-Abgleich und Berührung nicht erreicht. Die
Gesamtkontrolle bleibt fehlgeschlagen und hat das Spiel nicht geladen.

Die folgende Fassung `8a453df0d354c3a6bbe1c3c0e8c1fb94e94d551d` prüft den
Safari-Browsermodus mit demselben erfolgreichen WDA-Bauverfahren. Die nach
npm-SHA-512 geprüfte veröffentlichte Treiberquelle setzt diesen Modus nur bei
`browserName: Safari`; native Bundle-ID und `includeSafariInWebviews` genügen
hierfür nicht. Das ist die Begründung des Vergleichs, keine bewiesene Ursache
des fehlenden Webkontexts. Das Ergebnis dieses Laufs ist noch offen; Quellen,
Jobs und Fehlerstufen stehen in `evidence/history.json`.

`evidence/capture-index.json` bindet alle vierzehn ursprünglichen Jobprotokolle an
die von GitHub gelieferten Git-Blob-IDs. Eine vor der Job-Zuweisung abgelehnte
Workflow-Fassung ist gesondert in `rejected-workflow.json` dokumentiert.
Die erste große Appium-Logzeile wurde durch eine Unterprozess-Ausgabe vermischt;
diese konkrete Datenlücke ist erhalten und ausdrücklich kein vollständiger
nativer Capture. Spätere große Belege verwenden nummerierte, SHA-256-gebundene
Fragmente. Der Parser und die Ablehnung verlorener/veränderter Fragmente wurden
mit synthetischen Unicode-/Mehrzeilen-Daten geprüft.

`evidence/verifyCapturedHistory.py` prüft alle vierzehn vollständigen
Jobprotokolle gegen ihre Git-Blob-IDs und erfasst deren SHA-256. Der Bericht
`evidence/verified-history-summary.json` trennt ab Version 2 die Integrität der
gesicherten Jobdateien von der Vollständigkeit aller ursprünglichen Records.
Letztere ist ausdrücklich **falsch**. Neben der historischen unvollständigen
nativen Zeile enthält der neueste große Compilerrecord einen maskierten
`export ***`-Block. Seine 1053 Fragmente sind vorhanden, aber ihr ursprünglicher
Sender-SHA-256 passt nicht mehr. Der Ursprung der Maskierung wird nicht behauptet.

Dieser genaue Compilerrecord bleibt vollständig im unveränderten Jobprotokoll
erhalten und wird nur für dessen exakt gepinnte Blob-ID von den akzeptierten
strukturierten Records ausgenommen. Sender- und empfangener SHA-256 sind im
Prüfer festgehalten. Die allgemeine Fragmentprüfung wird nicht gelockert.
Zudem war die lokale Compilerdatei 3148545 Byte groß, während nur ihr Ende
von maximal 2 MiB ausgegeben wurde. Ein vollständiger oder bytegetreu geprüfter
Compiler-Capture wird deshalb nicht behauptet.

Die drei nativen Oberflächen, der vollständige Appium-Record und das einzelne
Fehler-JPEG bestehen dagegen ihre Fragment-/Sender-Hash-Prüfung. Das JPEG wird
zusätzlich als JPEG mit 133627 Byte und passendem SHA-256 geprüft. Es zeigt nur
die konstante lokale Kontrollseite, keine Spielszene oder Besitzerdatei.
Alle Datenlücken bleiben gezählt; diese Belegprüfung bedeutet keine bestandene
Spielprüfung, physische Geräteabnahme oder White-Screen-Behebung.

Der zusätzliche Mac-/Linux-Buildvergleich bestätigt gleiche Bytes der elf
JS-/CSS-Dateien des bereits gebauten Mac-Pakets gegenüber allen sechs früheren
Linux-Captures. Das ist keine unabhängig geprüfte Identität mit dem entfernten
Vercel-Deployment und kein kausaler Speichervergleich. Der Simulator, seine
Host-Prozessdaten und seine Architektur ersetzen kein physisches Handy.
