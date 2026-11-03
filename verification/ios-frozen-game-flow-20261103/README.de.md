# Unveränderter Spiel-Dauerlauf über die verifizierte Safari-Sitzung

Die konstante Kontrolle ist auf Intel/macOS, Xcode 26.2, iOS 18.5, Appium 3.9.0,
XCUITest 12.22.8 und WDA 16.17.7 bestanden. Der Spielgast bleibt exakt
ac98e95166b0e2013186257904da46323840dab5, Baum
99092ec24e843fb1e419dc382bc2523a4edc0b42. Der Bau verlangt ein Dateisystem mit
unterscheidbarer Groß-/Kleinschreibung. Es gibt keine Geräte-/Hostkonten,
kostenpflichtigen Dienste, SDK-Downloads oder Vercel-Veröffentlichung.

## Nachgewiesene Grenze des ersten Spielversuchs

Lauf 41625231628 besteht die konstante Seite samt vertrauenswürdiger nativer
Kontrollberührung. Danach wird die Kontrollsitzung gelöscht. Der Aufbau einer
zweiten Safari-Sitzung scheitert, weil der Remote Debugger nach 7.262 ms keine
verbundene Web-App meldet. Der Pilot hat keine abgeschlossenen Spielzyklen;
der Dauerlauf wurde nicht gestartet. gameLoaded:null bleibt ausdrücklich
unbekannt. Das ist kein Beleg für einen White Screen oder eine Beendigung des
Spiels auf einem echten Handy. Die Ursache der fehlenden zweiten Debugger-
Verbindung wird nicht als geklärt ausgegeben.

## Begrenzte Korrektur der Testübergabe

Die Elternroutine behält jetzt genau die Safari-WebDriver-Sitzung, die gerade
Kontroll-DOM, iPhone-Kennung und echten vertrauenswürdigen Klick bestanden hat.
Sie übergibt ihre lokale Sitzungskennung und die geprüften Capabilities an
den Spieltreiber. Vor der Übergabe müssen erwarteter Ursprung und timeOrigin
gleich bleiben; ein laufendes Spiel darf nicht übernavigiert werden.

Der Treiber baut keine zweite Sitzung auf, öffnet Safari nicht erneut und
führt keinen Reset aus. Er verlangt den bestehenden Web-Kontext und navigiert
über den normalen WebDriver-Befehl POST /url zur jeweils neuen lokalen
Gastadresse. Ursprung und Dokument müssen wechseln. Ein stiller Fallback,
automatischer Wiederholungsversuch oder eine Wiederaufnahme des Spiels ist
ausgeschlossen. Der Kindtreiber löst am Ende nur seinen lokalen Verweis; nur
die Elternroutine löscht die native Sitzung nach dem gesamten Ablauf.

Jede Spielphase hat einen anderen lokalen Ursprung und ein neues Dokument.
Es wird ausdrücklich keine neue Safari-WebDriver-Sitzung oder ein neuer
nativer WebContent-Prozess pro Phase behauptet. Dieser neue Aufbau ist
deshalb keine unverändert vergleichbare Wiederholung der alten
Sitzungs-/Speicherumgebung.

## Unveränderte Spielprüfung

Zuerst muss der vollständige Pilot mit 60/10/10 echten aktiven Sekunden
bestehen, dann der vollständige Ablauf mit 1800/10/10 Sekunden. Der lange
Ablauf kann keine Übergabe vor einem bestandenen Piloten erhalten.
Ab Beginn der drei Spielzyklen bleiben sämtliche Uhr-, Dokument-, Frame-,
Pausen-, Waffenmenü-, Ausstiegs-, normalen Berichts-, Fehler- und Paketprüfungen
bytegleich mit dem Treiber aus 307929ca4c867e28b865097a2f249ce0f1686e02.
SHA-256 dieses unveränderten Quellabschnitts:
f9c8e2f6b902cef63448c5e97b5db18f029f974dafb4199e98933384875f8404.

Vier lokale Fehlerprüfungen bestehen: ungültige Übergaben vor HTTP stoppen;
falschen Kontext, ersetzte Dokumente und aktive Spiele vor Navigation stoppen;
neues Dokument im bestehenden Transport verlangen und nicht löschen;
langen Ablauf vor vollständigem Piloten ablehnen. Das ist Werkzeugprüfung,
keine bestandene native Spielminute.

Während des Spiels gibt es keine Screenshots, Aufnahme oder erzwungene GC.
Ein Fehlerbild darf nur vor jedem Spielversuch aufgenommen werden.
Die bestehenden gefilterten nativen Protokolle werden nach dem Versuch
angefordert. Die Host-RSS-Beobachtung muss tatsächlich ermittelte WebContent-
Dienste des Simulators enthalten. Sie misst keinen gesamten Grafik- oder
physischen Telefonspeicher.

## Grenze der Aussage

Der Simulator ist weder das physische iPhone 15 Pro Max mit iOS 26.6 noch
Android oder Pi Browser. Der bestätigte Handyabbruch nach 23:45,681 bleibt
ungeklärt. Ein bestandener Simulatorlauf beweist keine dauerhafte Behebung.
Der separat geprüfte HUD-Kandidat ist in diesem Original-Baseline-Lauf
weiterhin nicht aktiv. App-Quellen, Regeln, Bilder, Ton, Spielstände und
veröffentlichte Versionen bleiben unverändert.
