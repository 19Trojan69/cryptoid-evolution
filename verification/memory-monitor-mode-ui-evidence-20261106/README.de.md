# Speicherlabor: aktueller Spielmodus und kompakte Anzeige

Die Besitzeraufnahme zeigte Kreismarkierungen des älteren Ablaufs und einen zu großen Diagnosekasten. Das war ein Fehler im Labor-Build: Der Quellbaum stimmte mit Testnet überein, aber die unabhängige Adresse enthält kein „testnet“. Ohne gültiges window.__ENV.appNetwork wählte shipSaveNetworkForHost deshalb den anderen Spielmodus. Der bisherige Nachweis gleicher Quelltexte allein genügte nicht; die vorherige Abnahme prüfte diesen Schalter nicht.

Geliefert: https://cryptoid-evolution-memory-lab.vercel.app/
Commit a51bb9fe292a780ed8819d64af820003c01c3519, Baum 1290f22bec36b204da069f46e4e58a8f9c6ea683.
READY dpl_BGskVWNftZKdnwbbGCcGBbrgNEBz im eigenen Projekt prj_0uk2EWyJzzKfIHoLUMrDZMaJZY4W.

Der Builder setzt appNetwork jetzt ausdrücklich auf „testnet“, bevor Module laden, und prüft die eindeutige Konfiguration. Dies wählt nur die aktuellen Spielregeln; Transport, Anmeldung, Zahlungen und Upload bleiben lokal deaktiviert. Keine Kreise per CSS versteckt. Der ursprüngliche frontend-Baum bleibt unverändert 6e0cdc1bea4b6c84972382f636fa66caf2739010 (Testnet-Basis d9e0897a9396dd8f1f0a9c4a9a0536aa1fb7208d). Messpunkte protokollieren zusätzlich rulesMode. Frühere Laborberichte sind im Menü als abweichender Spielmodus gekennzeichnet.

Der Monitor startet verkleinert, mit 80 % transparentem Hintergrund, vier Teilwerten und neutralem Hinweis auf den nicht messbaren Gesamt-RAM. Details und Graph erscheinen über +. Keine Blurfilter, Animationen oder neue RAF-Schleife. Auf dem geprüften mobilen Viewport 390×760 beträgt seine Breite 170 und Höhe 121.75 CSS-Pixel. Die zentrale Reaktorbahn bleibt frei.

Rot bedeutet deutlicher Anstieg gegenüber einer eingefrorenen Startreferenz: Median aus drei aktiven Messpunkten nach mindestens 10 Sekunden, mindestens 50 % und 8 MiB mehr; beim JS-Heap mindestens 16 MiB mehr. Fehlende Messwerte bleiben unverfügbar, ohne rote oder vermeintliche Sicherheitsaussage. Die Schwellen sind Vergleichsmarken, keine ermittelten iPhone-RAM-Grenzen. Gesamtprozess-, GPU- und Compositing-Speicher bleiben ungemessen. Ressourcen können sich überlappen.

15 Modell-/Speicher-/Quelltests bestehen. GitHub Actions 42238296475 prüft Chromium und Linux-WebKit mit jeweils normalem Start, Boss 2 mit Geschützen und Boss 2 mit Reaktor bei 55 %. Alle sechs Abläufe bestehen: tatsächliche aktuelle Regeln; normale Gegner erschienen ohne instanziierte formation-target-Markierungen; kleiner transparenter Standardmonitor; normale und rote CSS-Farbe; Details, Pause/Fortsetzen, lokale Speicherung, Bericht nach Reload ohne Autostart und valider Download. Bossprüfungen warten auf echten boss-fight, Waffen-Canvas und Reaktor-SVG. Keine unerwarteten Backendanfragen oder ungefangenen Browserfehler.

Prüfcommit 04e46ed93ed9c179bc13df9b22624e9666b65151 unterscheidet sich vom gelieferten Commit ausschließlich in .github/workflows/cryptoid-memory-lab.yml: Die bereits vorhandene Vertrauenseinstellung des Checkoutverzeichnisses wird vor dem Test mit git show gesetzt. App, CSS, Builder und alle Spielquellen sind identisch. Der erste Lauf 42237827790 scheiterte vor der Browserprüfung am Container-Dateibesitz; der korrigierte Lauf besteht vollständig.

Jobs: Chromium 127961609098, WebKit 127961609523. Resultatobjekte sind aus den Originaljoblogs übernommen. WebKit-Artefakt 13513845266, SHA256 07e56c749406e48056ee0e4b440cc43520706aeeeb063d947158864cfe42183a; Originalarchiv vor Entnahme gehasht. Normal- und Reaktoraufnahme visuell geprüft: wesentlich kleinerer, durchsichtiger Monitor, kein alter Positionskreis. Original-CI-Artefakte verfallen am 06.12.2026; diese Textnachweise bleiben im Repository.

Testnet bleibt dpl_3tcnig7RC16aLXm3jdGC9Mfh2DvF / d9e0897a9396dd8f1f0a9c4a9a0536aa1fb7208d.
Produktion bleibt dpl_6N3FdS9XGXasCWrpMksngxCPNPRk / ce073547cf573375d141bf846f70e294138dbd73.

Kein physischer iPhone-/Pi-Browser-Langlauf und keine Behebung des historischen White Screens nachgewiesen. Die jüngste Besitzeraufnahme ist eine Modus-/UI-Rückmeldung, kein neuer bestätigter Absturz. Letzter bestätigter Absturz bleibt Boss 2, Level 2, Geschütze zerstört, Reaktor ungefähr 50 % oder etwas darüber.
