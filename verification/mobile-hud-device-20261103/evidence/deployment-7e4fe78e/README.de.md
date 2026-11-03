# Bereitgestellter, freigegebener HUD-Handytest

Quelle 7e4fe78e4889457a181d06543f50551658a83aa2, Baum 8a905c3e1647632db19f3ddeca00a7a7be81cdfc.
Vercel-Vorschau dpl_6MAuVaYw8UjJhrQ6dLXxgYuBgn7E ist READY. Die öffentlichen
Stammadressen und der vorherige Diagnose-Link behalten ihre bisherigen Ziele.
Alle fünf Runtime-Quellbäume bleiben identisch zur Ausgangsversion ac98e951.
Nur die freigegebene statische HUD-Eigenschaft wird dem gebauten HTML hinzugefügt.

Die erhaltenen ausgelieferten HTML-Bytes entsprechen exakt dem erwarteten
Kandidatenhash. Entfernen genau dieser einen Regel ergibt den ursprünglichen
Build-HTML-Hash. Kein Toolbar-Skript wird eingeschoben. Drei ausgelieferte
Stoppuhr-Dateien stimmen in Länge und SHA-256 mit den Build-Metadaten überein;
die Zustandslogik bleibt der unveränderte bekannte 5e5845d5-Stand.

Ein neuer zeitlich begrenzter Freigabelink wurde ausschließlich für diese
Vorschau erzeugt. Sein Aufruf wurde mit einem anonymen HTTP-Client geprüft:
HTTP 200, Kandidaten-HTML und danach geschütztes Metadaten-JSON erreichbar.
Der geheime Linkbestandteil und Browser-Cookies sind hier NICHT enthalten.
Keine Schutzfunktion eines bestehenden Projekts wurde abgeschaltet.

Der tatsächliche Desktop-Chromium-Ablauf erreicht 114.007,7 aktive ms, hält die
sichtbare Uhr bei der Pause an, setzt manuell fort, öffnet/schließt das
Waffenmenü, beendet normal und lädt den normalen Diagnosebericht als Datei.
Uhr, Kurzbericht und Ressourcenpunkt stimmen überein. Der Rohbericht enthält
zwei vorübergehende Zustände stalled; ein unterbrechungsfreier Lauf wird
ausdrücklich NICHT behauptet. Die begrenzte Konsoleabfrage enthielt zehn
Erweiterungs-Metadatenfehler und belegt keine vollständige App-Fehlerfreiheit.

Viewport 1363×936, DPR 1: kein Handy und kein iOS-Safari-Test. Bei dieser
Desktop-Breite bleibt blur(10px) erwartungsgemäß aktiv; die ausgelieferte
einzelne Regel gilt bis 700 CSS-Pixeln. Eine echte mobile Breite ließ sich
über die Browser-Zoom-Tasten in dieser Umgebung nicht herstellen; daraus
wird keine bestandene mobile CSS-Messung abgeleitet. Der exakte mobile
Regelinhalt entspricht den zuvor geprüften zwölf CSS-Fällen und beiden
30-Minuten-Kandidaten-Läufen. Die Wirkung auf den physischen White Screen
ist weiter offen und muss im Handytest geprüft werden.

Nur synthetische Gastdaten aus der eigenen Browserprüfung. Keine privaten
Besitzerberichte, Zugangslinks, Tokens, Cookies oder aktiven Bildschirmbilder.
