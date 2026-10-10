# Startseite: Vollbild ohne Symbol – 10. Oktober 2026

Basis: `e1002312dbb5982f1f00a4b944f9ab0bc7f06551`.
Dieser Nachtrag ersetzt die Startseiten-Bedienung aus
`fullscreen-pilot-profile-2026-10-10.md`; die Profilverbesserungen bleiben erhalten.

- Das Vollbildsymbol neben dem Planeten und seine Hinweismeldungen sind entfernt.
- Die sichtbare Startseite versucht nach drei Sekunden einmal, Vollbild zu betreten.
  Die native Anforderung wird über den bereits vorhandenen, begrenzten Ablauf gestellt.
- Offene Menüs, versteckte Tabs und Navigation verhindern den ausstehenden Versuch.
  Beim Schließen eines Menüs oder Zurückkehren zum sichtbaren Tab beginnt die Wartezeit
  erneut, sofern noch kein Versuch erfolgte.
- Ist Vollbild bereits aktiv oder wird es vorher aktiviert, erfolgt keine zusätzliche
  Anforderung. Verlassenes Vollbild wird nicht erneut erzwungen. Ablehnungen lösen
  keine Schleife, Meldung oder blockierende Oberfläche aus.
- Der durch den Spielen-Knopf ausgelöste Vollbildablauf bleibt erhalten. Daten,
  Speicherung, Profilzugänge, übrige Buttons und Bilddarstellung sind unverändert.

## Browsergrenze

Viele Browser verlangen eine aktuelle Benutzerinteraktion für `requestFullscreen`.
Eine zeitverzögerte Anforderung kann deshalb trotz grundsätzlicher Unterstützung
abgewiesen werden. Diese Änderung garantiert kein automatisches Vollbild auf jedem
Gerät und simuliert keine Benutzerberührung. Die installierte App kann bereits ohne
Adressleiste dargestellt werden.

Referenz: https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen

## Prüfung

265 Frontendtests, Produktionsbuild mit TypeScript und Übersetzungsprüfung sowie
gezielte ESLint-Prüfung bestanden. Neue Prüfungen behandeln die Drei-Sekunden-Frist,
einen einzigen Versuch, Ablehnung, verborgene Tabs, offene Menüs, Navigation,
Listenerbereinigung und das Verlassen von Vollbild. Kein nativer Pi-Browser auf
dem Tablet steht in dieser Umgebung zur praktischen Prüfung zur Verfügung.

Veröffentlichung separat auf Testnet und Produktion aus demselben Commit;
Netzwerkzuordnung, ausgelieferte Dateien und bestehende Ranglisten werden geprüft.
