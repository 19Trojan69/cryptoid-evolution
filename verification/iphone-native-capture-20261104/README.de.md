# Native iPhone-Diagnose mit dem vorhandenen Windows-Laptop

Zuerst nur die Verbindung pruefen, noch kein weiterer Spiel-Dauertest:

1. Das ZIP auf dem Windows-Laptop in einen eigenen Ordner entpacken.
2. iPhone per USB anschliessen und entsperren. Eine angezeigte Vertrauensabfrage am iPhone bestaetigen.
3. PRUEFEN.cmd doppelklicken. Bei der ersten Verwendung wird das kostenlose Hilfsprogramm eingerichtet.
4. Die neue Datei aus dem Unterordner Ergebnisse hier im Projekt-Chat senden.

Voraussetzungen: Python ab 3.9 mit Windows-Python-Launcher sowie Apples Mobile-
Device-Dienst, zum Beispiel aus iTunes. Fehlt etwas, zuerst diese Voraussetzung
beheben; eine fehlgeschlagene Verbindungspruefung ist kein Spieltest. Es wird
kein Mac benoetigt. Paketquelle ist ausschliesslich das offizielle PyPI, Version
pymobiledevice3 11.49.5. Keine Zahlung und kein neues Benutzerkonto erforderlich.

Erst nach bestaetigter erfolgreicher Pruefung dient AUFZEICHNEN.cmd zum Mitschnitt:
Pi Browser am iPhone verwenden, auf einen neuen Fehler warten und danach etwa
zehn Sekunden spaeter am Laptop Enter druecken. Das beendet nur den lokalen
Leser. Es pausiert, beendet oder veraendert kein Spiel. Auch USB-Abbruch und das
einstuendige Leserlimit werden als eigene Endgruende festgehalten.

Es werden nur feste USB-Diagnosebefehle verwendet: Geraeteauflistung, lokale
Geraetebestaetigung und nativer Meldungsstrom. Kein Entwicklermodus, Tunnel,
Profil, App-Installations-, Neustart-, Screenshot- oder Spieleingriff wird angefordert.
USB-Vertrauen ist die gewoehnliche Apple-Verbindungserlaubnis am eigenen PC.
Der Leser nutzt die direkte Programmierschnittstelle mit connection_type='USB'.
Er ruft keine allgemeinen CLI-Transportregeln oder deren Tunnel-Fallback auf.

Die Pruefdatei enthaelt nur Verbindungsergebnis und grobe Modell-/Systemversion,
keine Geraetekennung und keine Beispielmeldung. Ein spaeterer Mitschnitt behaelt
hoechstens 3.000 passende technische Meldungen bzw. 2 MiB im rollierenden Puffer.
URLs/Kennungen werden gekuerzt; Meldungen mit erkannten Zugangsdaten-/Zahlungs-
begriffen werden durch einen Platzhalter ersetzt. Das ist keine Garantie einer
vollstaendigen Anonymisierung. Dateien bleiben auf dem Laptop; kein automatischer
Upload. Keine echten iPhone-Dateien in das oeffentliche GitHub-Repository laden.
Im Arbeitsspeicher durchlaufen auch andere native Meldungen den lokalen Filter;
gespeichert werden nur passende technische Eintraege. Verlorene Puffer-Eintraege
und zu grosse Zeilen werden gezaehlt. Ein USB-Mitschnitt ist eine zusaetzliche
Messung und kann das Laufzeitverhalten beeinflussen.

Die Protokollierung kann die Diagnose unterstuetzen, garantiert aber keinen
bestimmten nativen Fehlergrund. Die reale USB-/iOS-Verbindung muss am vorhandenen
iPhone geprueft werden; Tests ohne angeschlossenes Geraet ersetzen das nicht.

Primaerquellen, am 04.11.2026 geprueft:
https://github.com/doronz88/pymobiledevice3
https://github.com/doronz88/pymobiledevice3/blob/103647ae12ed50d955fa6910d7d3a9363cc36608/docs/installation.md
https://pypi.org/project/pymobiledevice3/11.49.5/
