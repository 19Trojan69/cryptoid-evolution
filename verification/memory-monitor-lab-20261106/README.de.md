# Cryptoid Evolution – separates Speicherlabor

Eigener Hosting-Projektwert prj_0uk2EWyJzzKfIHoLUMrDZMaJZY4W, eigener Arbeitsbranch codex/memory-monitor-lab-20261106. Das Projekt hat keine Git-Autoveröffentlichung. Testnet und Produktion werden nicht verwendet. Die gesamte frontend-Quellstruktur bleibt bytegleich mit dem zuletzt veröffentlichten d9e0897a9396dd8f1f0a9c4a9a0536aa1fb7208d (Frontend-Baum 6e0cdc1bea4b6c84972382f636fa66caf2739010).

Nur dieser externe Builder ersetzt das App-Menü, Login, Netzwerkadapter und Nutzungszählung. Der Gast startet Level 1 im normalen Ablauf oder eine ausdrücklich vorbereitete Szene von Boss 2: Geschütze lebend oder zerstört mit Reaktor bei 55 Prozent. Optionaler Schutz verhindert Spieler-Lebensverlust, nicht Bossende; Standard ist aus. Keine Käufe, Online-Scores, echten Konten, Datenbank oder Pi-Anmeldung. Das Deployment ist statisch ohne API-Funktionen. Die eigene CSP erlaubt Verbindungen nur zur eigenen Adresse; der lokale Adapter beantwortet zwei Leseanfragen und verweigert alle anderen ohne Netzverbindung.

Ein reversibler, ganzer-Quellcode-gepinnter Build-Hook gibt ausschließlich technische Skalare heraus. Ein existierender Framecallback zählt aktive Zeit/Frames, ohne Uhr, Delta oder Ablauf zu verändern. Nicht beobachtbare Frameabstände über eine Sekunde werden separat als Lücke gezählt, nicht als präzise Spielzeit ausgegeben. Der Monitor selbst hat einen einzigen 5-Sekunden-Timer und ein Ereignis für Sichtbarkeitswechsel; Cleanup entfernt beides. Die kleine SVG-Kurve hat keine Animation oder eigene Frame-Schleife. Der Monitor verändert Messbedingungen und verursacht zusätzliche Arbeit.

## Aussagegrenzen

- Kein Browser-Gesamt-RAM auf iPhone/WebKit verfügbar. Die Anzeige sagt das ständig und zeigt keinen erfundenen Prozentwert.
- Der optionale Chromium-JS-Heap ist ein ungenauer, nicht standardisierter Teilwert; fehlend bleibt null, niemals 0 MiB. Die neue experimentelle Memory-API wird nicht periodisch aufgerufen und erzwingt keine Speicherbereinigung.
- Bildcache, Effektcache und Audio-PCM sind logische appseitige Byte-Schätzungen. DOM-Canvas-Abmessungen, Effektoberfläche und andere Kategorien können sich überlappen. Keine Summe wird als Gesamtverbrauch ausgegeben. Interne GPU-/Prozess-/Compositing-Speicher bleiben ungemessen.
- DOM und vom bestehenden Controller gehaltene Animationen werden gezählt. Cumulative configured ist eine Ereignisanzahl, kein aktiver Speicherbestand.
- 360 Punkte mit 5-Sekunden-Abstand: maximal 30 Minuten rollierender Verlauf, höchstens 512000 Zeichen lokal. Speicherfehler bleiben sichtbar und unterbrechen das Spiel nicht. Ein erzwungenes Prozessende kann die letzten bis zu fünf Sekunden oder mehr bei einer Blockade verlieren. Der letzte Punkt ist kein exakter Absturzzeitpunkt.
- Nach einem neuen Dokument erscheint zuerst das Menü mit dem letzten Bericht. Kein automatischer Neustart/Fortsetzen. Ein neuer Lauf ersetzt den alten Bericht erst nach ausdrücklicher Auswahl; manueller JSON-Download, Teilen und Berichttext sind vorhanden. Keine automatische Übertragung.

Bau: node verification/memory-monitor-lab-20261106/build.mjs. Deployment ausschließlich im separaten Laborprojekt; der Builder lehnt andere Vercel-Projekt-IDs ab. Native Prüfung und Bereitstellungsergebnis werden separat ergänzt. Kein physischer Handytest und kein White-Screen-Fix werden durch den Bau behauptet.
