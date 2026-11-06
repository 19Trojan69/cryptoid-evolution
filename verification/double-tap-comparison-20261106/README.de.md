# Doppeltipp-Vergleich im unveränderten Speicherlabor

Ziel: Prüfen, ob der heutige Doppeltipp-Handler beim schnellen zweimaligen Berühren des freien Spielfelds einen technischen Fehler, Seitenwechsel oder Dokumentneustart verursacht.

Der Test verwendet den unveränderten Labor-Build mit aktuellem Spielregelsatz auf Basis d9e0897a. Er erzeugt über Playwrights Browser-Touchscreen-API vertrauenswürdige Touch-Ereignisse. Je normaler Start, Boss 2 mit Geschützen und Boss 2 mit offenem Reaktor werden zwei Varianten in getrennten Browserkontexten geprüft: heutige Sperre und ausschließlich im Test entfernte Sperre. Der Test registriert die beiden bekannten nativen Feld-Listener (touchstart/touchend, capture:true/passive:false), prüft deren eindeutige Identifikation und entfernt nur diese. Eingabe-, Audio-, Pointer- und Navigationshandler bleiben erhalten. Die vorübergehende Registrierungserfassung wird vor den eigentlichen Berührungen zurückgesetzt.

Je Fall sechs Doppeltipps an drei freien Spielfeldpositionen, 65 ms zwischen den beiden Berührungen, 430 ms Abstand vor dem nächsten Paar. Der Test prüft tatsächlich verhinderte Ereignisse in der normalen Variante und deren Abwesenheit in der Variante ohne Sperre. Er erfasst Dokumentstartzähler, Hauptrahmen-Navigation, ungefangene Fehler/Prozessabsturz und aktive Spielzeit. Ein absichtlicher Reload danach ist die Positivkontrolle: neuer Dokumentstart und Laborübersicht müssen erkannt werden.

Keine produktive Änderung. Nur verify-touch.mjs und der zugehörige Prüfworkflow wurden geändert. App, CSS, Builder, Simulation und öffentliche Deploymentstände bleiben unverändert. Die CSS-Regeln gegen Zoom und Textauswahl sind in beiden Varianten weiterhin aktiv. Der Vergleich nimmt daher nicht das gesamte historische Maßnahmenpaket zurück.

Grenzen: Automatisierte Chromium- und Linux-WebKit-Läufe sind keine physische iPhone-, Betriebssystem-Lupen- oder Pi-Browser-Prüfung. Auch bei bestandenen Kurzabläufen sind verzögerte Fehler nach längerer Laufzeit und plattformspezifische Probleme nicht ausgeschlossen. Kein White-Screen-Fix behauptet.

Erster Lauf 42268681954 scheiterte an der Startseitenauflösung des neu geschriebenen lokalen Prüfservers, vor den Touch-Szenen. Das war ein Testaufbaufehler, kein Spielabsturz. Korrigiert: Rootpfad darf auf index.html aufgelöst werden, Verzeichnisgrenze gegen Pfadtraversal bleibt bestehen.

Korrigierter Prüfcommit dfb70ffab0daff5f4f73d612adc2454868d0d8d8. Workflow 42269291666.

Ergebnis: Beide Jobs erfolgreich, Chromium 128069349023 und WebKit 128069348538. Alle 12 Vergleichsfälle bestanden: insgesamt 144 einzelne Berührungen beziehungsweise 72 Doppeltipps. Mit Sperre jeweils 12 verhinderte Touch-Ereignisse je Fall (zweiter touchstart und touchend pro Paar), ohne die zwei Handler jeweils 0. Kein Seitenwechsel, kein neuer Dokumentstart, keine ungefangenen Seitenfehler; aktive Spielzeit lief weiter. Viewport-Skalierung blieb in beiden Varianten 1. Der absichtliche Reload wurde in allen zwölf Positivkontrollen erkannt. Das belegt, dass die Gegenprobe die Sperre tatsächlich entfernt hat; es bestätigt keinen kausalen White-Screen-Fehler.

Die zusätzlich vorangestellten 15 Modelltests und sechs regulären Spiel-/Monitorabläufe bestehen ebenfalls. Originalergebnisobjekte sind aus den Joblogs übernommen und in chromium-touch.json und webkit-touch.json dauerhaft gesichert.

Entscheidung: Kein belegter Anlass, die heutige Sperre im öffentlichen Spiel zu entfernen. Der historische Handyabbruch bleibt offen. Die fehlende Dokument-/Navigations-/Fehlerspur im Besitzer-Memory-Export bleibt eine getrennte Diagnoselücke. Ein harter Prozessverlust kann ohne letztes JavaScript-Ereignis erfolgen; ein neuer Dokumentstart beweist für sich weder Speichermangel noch einen Browserfehler.

Öffentliche Zuordnungen überprüft und unverändert:
Labor dpl_BGskVWNftZKdnwbbGCcGBbrgNEBz / a51bb9fe292a780ed8819d64af820003c01c3519.
Testnet dpl_3tcnig7RC16aLXm3jdGC9Mfh2DvF / d9e0897a9396dd8f1f0a9c4a9a0536aa1fb7208d.
Produktion dpl_6N3FdS9XGXasCWrpMksngxCPNPRk / ce073547cf573375d141bf846f70e294138dbd73.
