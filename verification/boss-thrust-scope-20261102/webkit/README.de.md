# Kurzer WebKit-Kompatibilitätsvergleich

Ergänzung zur bereits laufenden Chromium-Langmessung der Quelle `60089264`.
Der neue WebKit-Lauf verwendet dieselben unveränderten Spielquellen und dieselbe
einzelne virtuelle Schubvariablen-Verteilung, hat aber eine eigene Messquelle
und eigene Ergebnisdateien. Seine Daten werden nicht in den sechs Chromium-
Captures mit identischem Commit/Baum als gematchte Speicherwerte eingerechnet.

Je zwei frische WebKit-Browser pro Bedingung müssen zuerst die unveränderte
strikte Startprüfung bestehen: gleiche Dokument-/Quellidentität, kein verstecktes
Fenster, kein unerwarteter Pausenzustand und null unbeobachtete Stoppuhrlücken.
Danach eine echte aktive Minute, Pause mit eingefrorener Spieluhr, die identische
berechnete Flammenhöhe/Variablenverteilung und unveränderte native Animations-
instanzen im Pausenzustand. Waffenmenü, normaler Home-Ausstieg, zwei kurze
Neueinstiege und der reguläre Diagnosebericht folgen im selben Browserkontext.

Es gibt keine aktive API-Zählung, GC, Heap-Aufnahme, Screenshots, neue Spieluhren
oder automatische Wiederaufnahme. Der bereits verwendete Verifier bleibt ohne
neues Vergleichsflag in seinem bisherigen Modus. Die früher fehlgeschlagene
WebKit-Original-Startprüfung bleibt ein fehlgeschlagener historischer Versuch.
Auch eine neue fehlgeschlagene Prüfung wird mit letzter Beobachtung archiviert,
statt den Test durch gelockerte Gates oder Wiederaufnahme erfolgreich zu machen.

Dies ist ein kurzer synthetischer Linux-WebKit-Kompatibilitätsvergleich,
kein iPhone-/Pi-Browser-Test und kein bestätigter Speicher-/White-Screen-Fix.

Die [CI 41385089320](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41385089320)
ist vollständig fehlgeschlagen: Alle vier Abläufe erreichen beim Start oder
Neueinstieg das Gate für eine unbeobachtete Stoppuhrlücke. Original 2 besteht
vorher zwei UI-/Darstellungszyklen (60.736 und 10.763 ms aktive Messzeit), scheitert
dann am dritten Einstieg. Diese Teilprüfungen bleiben sichtbar, machen den
Gesamtablauf aber nicht erfolgreich. Vier verlustfreie Captures, ihre ZIP-
Digests und die abgeleitete Klassifikation stehen unter `../evidence/`.
