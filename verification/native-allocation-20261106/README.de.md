# Native Allokationen beim pausierten Szenenaufbau

Neuer reiner Zuordnungslauf nach dem negativen Hintergrundvergleich. Kein Spielcode, Grafik, Ton, Steuerung, Uhr oder Simulationsdelta wird geändert. Kein aktiver Spieltest, normaler Spielausstieg oder Export behauptet.

Zuerst muss Heaptrack eine bekannte4-MiB-Malloc-Funktion mit vorhandenem Debugsymbol erkennen. Danach eine konstante WebKit-Kontrollseite; nur bei tatsächlichem Heaptrack-Preload im über die vorhandene Prozesssammlung erkannten Inhaltsprozess geht es weiter. Startprofiling über WebKits offiziellen WEB_PROCESS_CMD_PREFIX, keinen laufenden Prozess injizieren und keine ptrace-/Sandbox-Einstellungen abschwächen. Ein exec-Wrapper erhält die bestehenden IPC-Dateideskriptoren.

Danach zwei frische Browserprozesse mit identischer bestehender9f3-Gastbasis: vorbereitetes Menü und vollständig aufgebaute, weiterhin pausierte Spielszene. Je drei externe Prozess-/Kernelabbildungen. Ein Profil muss genau dem beobachteten Inhaltsprozess über seine Wrapper-Elternkennung zugeordnet sein und vollständig dekomprimierbar sowie durch heaptrack_print lesbar sein. Die bisherige ursprüngliche Laufzeitquelle wird vor/nach Build unverändert geprüft.

Zusätzlich werden Linux-smaps-Werte nach Heap/Anonym/Stack/Bibliothek/Grafikgerät/Shared Memory aggregiert. Keine rawen Mappingadressen oder vollständigen Pfade werden gespeichert. Mappingklassen sind keine Allokationsbesitzer; virtuelles Size ist kein belegtes RAM. Heaptrack erfasst ausgewählte Allokationsfunktionen und grundsätzlich nicht sämtliche mmap-/GPU-Bytes. Analyser-Speicherspitzen oder am Prozessende unfreigegebene Bytes sind kein bewiesenes Spiel-Leck.

Instrumentierung kann Laufzeit und Speicher stark beeinflussen. Der Lauf endet absichtlich vor aktivem Spielen; die Bestätigung ist Werkzeug-/Szenen-Zuordnung, keine normale Funktions-, Leistungs-, Smartphone- oder White-Screen-Abnahme. Einzelne Profil-Ausgabedateien sind durch RLIMIT_FSIZE auf128MiB begrenzt, die vollständige Kohortensumme muss danach ebenfalls unter128MiB liegen; bei fehlender Kontrolle, fehlender Zielprozessmessung oder beschädigten Daten kein Null-/Erfolgsersatz.

Originalquellen zur Mechanik: WebKit-Upstream343e13bf22dca9d0ec227801419aab0f9001a32f, AuxiliaryProcessProxy.cpp/ProcessLauncherGLib.cpp und Playwrightv1.62.1 bootstrap.diff; KDE/heaptrack Shell-/Preload- und Printquellen, einschließlich Tagv1.4.0. Tatsächliche Binärunterstützung und aufgelöste Symbole müssen erst im Lauf bestehen. Keine still angenommene Vollständigkeit der Symbole.

Keine Bereitstellung, neuer Handytest, Merge, Alias- oder Zugriffsschutzänderung. Vercel-Autodeployment bleibtfalse.

Vor Spielstart wird die tatsächlich installierte Hilfe gelesen. Nur bei ausdrücklich unterstütztem --record-only wird das Flag gesetzt; ältere CLI-Versionen sind ausschließlich ohne vorhandene automatische GUI zulässig. Diese Korrektur ersetzt die zunächst fälschlich versionsübergreifend vorausgesetzte Option. Zwei zusätzliche Fälle prüfen beide CLI-Generationen und die unzulässige alte GUI-Kombination.

Korrektur nach42160855021: Die bekannte4-MiB-Funktion und quantitative Kontrolle bestehen tatsächlich mit Heaptrack1.5.0; der Browser ignoriert den Developer-Prefix. Der Lauf endet deshalb an der konstanten Kontrollseite vor irgendeinem Spielstart. Nun wird ausschließlich im temporären Container der eine tatsächliche WPE-ELF-Worker bytegleich umbenannt und an seinem bisherigen Pfad ein Startwrapper eingesetzt. IPC-Dateideskriptoren bleiben erhalten. Original-ELF-Hash wird vor/nach geprüft und der ursprüngliche Dateipfad im finally wiederhergestellt. Keine Änderung des Browsercodes, kein Ersatzbrowser und kein Abschwächen von ptrace-/Sandbox-Regeln. Der Prefix-Ansatz wird nicht als funktionsfähig beibehalten.

Da Profilershells den Workerpfad in ihren Argumenten tragen, werden sie vor der Inhaltsprozessauswertung zusätzlich über /proc/PID/exe ausgeschlossen; die ursprüngliche Klassifikationssumme und ausgeschlossene Wrapper bleiben ausdrücklich gespeichert. Die echte Worker-ELF-Identität, Elternkennung, Wrapperbeleg und tatsächlich geladene Preload-Bibliothek müssen zusammen passen.
