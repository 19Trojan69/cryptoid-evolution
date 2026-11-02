# Vollständiger Gast-Spielablauf: Frame- und Stoppuhr-Lücken trennen

Fortsetzung des gesicherten Stands `36a8ec46`. Der aktuelle direkte Boss-Style-
Kandidat hat bereits den isolierten dynamischen Komponentenvergleich in beiden
Engines bestanden. Sämtliche älteren gescheiterten Zeitlücken-/Speicherbelege
bleiben erhalten; keine Beobachtung wird nachträglich korrigiert.

## Konkrete offene Frage

Die alten WebKit-Kurzläufe scheiterten an mindestens einer Stoppuhr-
Beobachtungslücke, während die letzte Szene `playing` und keine technische Pause
meldete. Daraus folgt weder ein nachgewiesener Spielstillstand noch ein rein
fehlerhafter Test. Wir erfassen jetzt zwei voneinander getrennte Messspuren.

## Begrenzte zusätzliche Beobachtung

Nur der isolierte Gast-Builder erhält unter dem expliziten Argument
`--clock-probe` drei exakt rückwärts wiederherstellbare Controller-Einfügungen:
lokaler skalarer Zähler, ein Aufruf am vorhandenen nativen `step` vor seinen
Simulations-Substeps sowie Freigabe in dessen bestehendem Cleanup. Der Zähler
speichert Callback-Anzahl, vorhandenen nativen Zeitstempel, größten beobachteten
Frame-Abstand während zweier laufender Zustände und höchstens 16 Abstände über
250 ms. Ein separater Generationswert verhindert das Vermischen neu angelegter
Loop-Instanzen. Keine Instanz-, DOM-, Grafik- oder State-Objekte werden gehalten.

Die bestehende diagnostische Stoppuhr erhält einen einzigen skalaren Read nach
ihrem bereits vorhandenen `clock.observe(snapshot)`. Sie verwendet denselben
schon gelesenen Snapshot und höchstens 96 Ringzeilen. Kein zusätzlicher Timer,
RAF, Listener, aktiver DOM-/Animationsscan, Profiler oder Speicher-Dump entsteht.
Die Zeitberechnung, bestehende Null-Lücken-Prüfung, 2.500-ms-Spiel-Watchdog und
500-ms-Überwachung werden nicht verändert. Die geänderte Diagnose-JS und ihre
unveränderte Basis erhalten getrennte Digests im tatsächlichen Build-Beleg.

Nach einem Testfehler bleibt der Lauf **fehlgeschlagen**. Ein einmaliger
begrenzter Scene-/Clock-Read wird gesichert. Vier Sekunden lang werden danach
nur die vorhandenen Clock-/Frame-Proben beobachtet, ohne Eingabe, Resume,
Zeitreset oder Neustart. Falls das Dokument nicht mehr lesbar ist, bleibt genau
diese fehlende Beobachtung erhalten.

Die Auswertung unterscheidet fortlaufende tatsächliche Spiel-Frames nach einer
Clock-Lücke, einen beobachteten langen Spiel-Frame-Abstand, eine technische Pause
und unzureichende Daten. Ein zwischenzeitlich fehlendes Intervall kann dadurch
nicht vollständig rekonstruiert werden; fehlende weiße Pixel, nativer Kill und
die Smartphone-Ursache werden nicht behauptet.

## Vorab festgelegter Ablauf

Die originalen Gastabläufe bleiben: reguläre Vorbereitung, manuelles Fortsetzen,
Boss-Intro, offener Reaktor, reale aktive Zeit, Pause/Fortsetzen, Waffenmenü,
Home-Ausstieg, zweimaliges erneutes Öffnen und normaler Bericht. Es ist der echte
Spielcontroller mit originaler Grafik und Ton in einer geschützten Boss-2-
Gastszene; kein vollständiger Kampagnen-, Konto-, Zahlungs- oder Balance-Test.
Der bestehende Testschutz bleibt ausdrücklich aktiv, die Vollaufzeichnung aus.

Zunächst laufen auf frischen Linux-Runnern zwei Kurzläufe pro Engine und
Bedingung: Chromium/WebKit, originale Kontrolle/derselbe exakt gepinnte virtuelle
direkte Boss-Style-Kandidat. Jeder Kurzlauf verlangt 60 echte aktive Sekunden,
danach zwei Remounts zu je zehn Sekunden sowie alle bisherigen UI-/Report-Gates.
Bereits eine verlorene Beobachtung, technische Pause oder fehlender Fortschritt
stoppt den Lauf. Jeder Fehlschlag und jeder Nach-Scope-Beleg wird archiviert.

Erst wenn **alle acht** Kurzläufe bestehen, starten vier Langläufe auf frischen
Runnern: eine Kontrolle und ein Kandidat je Engine, jeweils zwanzig reale aktive
Minuten mit anschließendem unverändertem UI-/Berichtablauf. Diese diagnostisch
instrumentierte Serie ersetzt weder die alte unvollständige Speicher-Kohorte
noch ihre vorab festgelegten Akzeptanzkriterien. Unseeded Zufall, Linux-PSS und
synthetischer Gast-Schutz erlauben keine physische Smartphone-Abnahme.

Spielquellen, Main, Produktion, Geräte-Referenzen und echte Konten werden nicht
geändert. Ein neuer manueller Handytest ist noch nicht erforderlich.

```bash
node --test verification/full-game-clock-gap-20261102/probe.test.mjs
node verification/local-boss-style-20261102/preflight.mjs --clock-probe
```
