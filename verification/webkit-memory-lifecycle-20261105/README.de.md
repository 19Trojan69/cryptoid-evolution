# WebKit-Grundbedarf und Szenenphasen getrennt messen

Der vorhandene alte WebKit-Langlauf enthält schon früh etwa 1 GiB Linux-Prozess-
PSS, aber keinen leeren Browser-/Menü-Basiswert. Aus dem gesamten Wert lässt
sich deshalb kein reiner Spiel-, Bild-, Cache- oder Telefonbedarf ableiten.
Der neue kurze Lauf verwendet ausschließlich die unveränderte aktuelle 9f3-
Renderingbasis. Kein Kandidatenvergleich und kein weiterer Smartphone-Dauerlauf.

Gemessen werden nacheinander: leeres Dokument, Menü, vorbereitetes Menü,
montierte pausierte Szene, 15 Sekunden echtes Spiel, normaler Home-Ausstieg,
Home nach Freigabe der vorhandenen Testbrücke und explizite Dokumentzerstörung.
Pro Sekunde werden nur externe vorhandene Linux-Prozesswerte gelesen; der
bisherige Spielinspektor wird nur an Phasengrenzen gelesen. Keine aktiven
Profiler, Speicherdumps, Snapshots, GC oder neuen App-Timer/RAF. Idle-Fenster
von fünf/fünfzehn Sekunden beweisen keine abgeschlossene Speicherbereinigung.

Die vorhandene QA-Brücke hält eine Test-Controller-Closure. Ihr explizites
Löschen nach dem normalen Ausstieg ist Harness-Cleanup, kein neuer Spielfix.
PSS vor und nach diesem Schritt bleibt getrennt erhalten. Prozess-IDs, Rollen
und unklassifizierte Nachfahren bleiben pro Punkt sichtbar; ein Prozesswechsel
wird nicht als In-Process-GC ausgegeben. Die Summen sind keine RAM-Werte des
iPhones und keine native Abbruchursache. Phasendifferenzen sind keine
automatischen Allokator-/Besitzerzuordnungen.

Die vorherige WebKit-Nebenprüfung brach nach zwanzig Minuten während langsamer
Ubuntu-Paketdownloads ab. Dieser Lauf nutzt stattdessen das offizielle bereits
vollständige Playwright-1.62.1-Noble-Abbild, passend zur vorhandenen Bibliothek,
gepinnt auf den zuvor über MCR geprüften OCI-Indexdigest
sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e.
Keine erneute apt-/Browserinstallation, kein Versionswechsel der Spielbibliothek.
Primärgrundlage: https://playwright.dev/docs/docker und https://playwright.dev/docs/ci.

Alle fünf Runtime-Bäume und vercel.json bleiben unverändert. Quellen-/Dokument-/
Uhridentität, echter Kernsalvenfortschritt, regulärer Ausstieg, normaler Export
und vollständige Journal-/Uhrzuordnung müssen bestehen. Kein Auto-Resume oder
Retry. Das Ergebnis ist noch kein White-Screen-Fix oder physischer Telefontest.
