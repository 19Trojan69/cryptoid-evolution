# Wiederholte 30-Minuten-Prüfung der eingefrorenen Gerätequelle

Dieser reine Testzweig verändert keine Spielquelle, Builder-Behandlung,
Spielmechanik, Grafik, Auflösung, Audiowiedergabe oder Spieluhr. Automatische
Vercel-Bereitstellung bleibt ausgeschaltet. Keine Veröffentlichung nach Main.

Jeder der vier frischen Linux-Runner verwendet zwei getrennte Checkouts:
die Testanleitung aus diesem Zweig und die exakt eingefrorene Gerätequelle
`b042c8e50ad3f05a70418ae5ee6bb4412809035b` mit Baum
`921fe9212ce0ccfeaa7dc46352d3d6385c7f3fb2`. Der zweite Checkout wird ohne
Quelldatei-Overlay über den vorhandenen minimalen Geräte-Builder erstellt.
Vorhandene Quellbereichs-, Paket- und Hash-Prüfungen müssen bestehen.

Chromium und WebKit laufen je zweimal. In jedem Job muss zuerst ein frischer
vollständiger 60-Sekunden-Ablauf bestehen. Danach beginnt in einem neuen Browser
der bestehende, unveränderte Ablauf mit 1800 realen aktiven Sekunden, echter
Pause/Fortsetzen, Waffenmenü, bestätigtem Home-Ausstieg, zweimaligem erneutem
Start mit je zehn aktiven Sekunden und dem normalen Kurzbericht. Unveränderte
Gates verlangen dasselbe Dokument, Fortschritt der Spiel-Frames und Reaktor-
Salven, unveränderte Stoppuhr-ID, null Beobachtungslücken und keine technische
oder unerwartete Pause. Ein Fehler bleibt ein Fehler; kein automatisches Resume.

Der zusätzliche Treiber liest nur von außen alle fünf Sekunden die vorhandene
Linux-Prozessmessung aus. Er zeichnet PSS/RSS nach Browserprozessrollen auf,
einschließlich erkannter und nicht klassifizierter Nachkommen. Er verändert
keine Seite und fügt dort weder Timer noch Frames, Listener, Profiler,
Screenshots, GC oder Diagnosepuffer hinzu. Die alte QA-Inspektionsbrücke und
begrenzte Gerätediagnose bleiben unverändert. Auf Host-Scheduling kann die
externe Messung trotzdem Einfluss nehmen.

Installierte Paketversionen, Lock-Digest, gebaute JS-/CSS-Digests und tatsächliche
Build-Identität werden archiviert. Es gibt keine eingecheckte npm-Lockdatei;
frische Auflösung ist deshalb ausdrücklich keine Behauptung bytegleicher
Artefakte mit dem gehosteten Gerätetest. Unterschiede werden sichtbar gehalten.

Alle vier vollständigen Laufbelege und etwaige Fehlschläge bleiben getrennt.
Es gibt hier nur eine Bedingung, keine gematchte A/B- oder Speicher-Leck-
Behauptung. Linux-PSS ist weder iPhone-RAM noch GPU-residenter Speicher.
Fortschritt von DOM und Spieluhr beweist keine fehlenden weißen Pixel auf einem
physischen Gerät. Auch vier bestandene Läufe wären keine White-Screen-Behebung.
