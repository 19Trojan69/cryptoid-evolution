# Wechselnden Mündungslichtwert am tatsächlichen Verbraucher setzen

Der vorige Versuch, gleiche Werte vor setProperty abzufangen, zeigte keine
vermiedenen nativen Attributmutationen. Dieser neue Vergleich verändert einen
anderen Pfad: den Vererbungsbereich des tatsächlich wechselnden Mündungslichts.
Die unveränderte Variable --muzzle-light wird direkt am vorhandenen einzelnen
.player-muzzle-flash gesetzt. Originalformel, Alpha, CSS und übrige Schiffswerte
bleiben gleich. Der kleine Cache besitzt ausschließlich schwache Besitzer;
fehlende Verbraucher behalten den ursprünglichen Root-Fallback. Er wird beim
späteren Mount entfernt, ersetzte Elemente werden neu gefunden.

Nur der exakte Controller SHA256 6b500123cb1443bbcb52809f0dbd06520ea0aee02a550ec346ab5ce1f186f277
ist zugelassen. Die ganze virtuelle Controller-Änderung muss sich exakt zurück-
führen lassen. Die gescannten Runtime-Quellen erlauben nur den bekannten
Schreibpfad und den einen CSS-Verbraucher. Originaldateien aller fünf Runtime-
Verzeichnisse, Clock, Bilder, Audio, Steuerung und vercel.json bleiben unverändert.
Es gibt keine neuen Spieltimer, Frames, globalen Listener oder automatisches Resume.

Die Einmal-Builder leiten die bestehenden drei geprüften Gast-/Uhr-/Telefon-
Builder ab und entfernen ihre temporären Dateien nach dem Build. Beide Arme
behalten dieselbe direkte Boss-Style-Verteilung und dieselbe mobile HUD-Regel
wie die zuletzt geprüfte Telefonversion. Die tatsächliche im Vite-Compiler
angekommene Controller-Variante und alle Basis-Builder erhalten Digests.

Vor längeren Vergleichen müssen Chromium und WebKit den unveränderten echten
60/10/10-Sekunden-Gastablauf bestehen: Intro, offener Reaktor, tatsächlicher
neuer Schreibpfad, Pause/Resume, Waffenmenü, Home und normaler Dateibericht.
Nur in der bestätigten ersten Pause prüft eine reversible native DOM-Prüfung
acht Lichtwerte, dieselben gemounteten Knoten, berechnete Verbraucherwerte und
Geometrie sowie Animationsobjekte/Startzeiten/Raten. Fehlender Verbraucher,
späterer Mount, Ersatz und neuer Besitzer sind eigene reale DOM-Gegenbeispiele.
Diese kurze Diagnose ist kein unbeeinflusster Ressourcenvergleich.

Erst nach beiden erfolgreichen Kurzabläufen folgen je zwei frische Chromium-
Prozesse pro Bedingung mit 1.200 tatsächlich beobachteten aktiven Sekunden.
Der vorhandene Lebensdauer-Collector und sämtliche harten Prüfungen bleiben
erhalten. Kein aktiver Heap-Profiler, Trace, Snapshot oder angeforderte GC.
Die bestehenden vier nativen Dumps und zwei Heaps folgen ausschließlich nach
bestätigter Pause bzw. Home. Ausfall, technische Pause und fehlende Daten
bleiben Fehler. Die vollständigen synthetischen Ergebnisse werden archiviert.

Vorab festgelegte Ressourcenentscheidung: Alle vier Langläufe müssen vollständig
sein. Als begründeter nächster Kandidat zählt der Eingriff nur, wenn beide
Wiederholungen mindestens 15 Prozent niedrigeren Renderer-PSS-Schlussmedian
und niedrigere native Blink-Style-/Objektbelegung vor der angeforderten GC
zeigen. Fehlende oder unvollständige Kontrollen erfüllen die Entscheidung nicht.
Unseeded Linux-Vergleiche, kleine Stichproben und inaktive Dumps beweisen noch
keinen nativen Telefon-Absturzgrund oder dauerhafte iOS-/Android-Behebung.
Kein öffentliches Deployment und kein neuer manueller Handytest werden allein
aus grünen Quell-/Darstellungsprüfungen abgeleitet. Private Handydateien fehlen.

## Erster Paketversuch, vor Spieleinstieg gestoppt

Quelle 092a1e05675a5cb4892e8d3247051bd1fac17e69, CI 41769337197:
Beide Controller-Quellprüfungen und Vite-Kompilierungen bestehen. Der anschließende
Paketvertrag scheitert in beiden Engines, weil der Analysezweig die separate
HUD-Build-Ergänzung des Telefonzweigs nicht enthält. Es gibt keinen erfolgreichen
Spielablauf in dieser Serie; alle vier Speicherjobs bleiben übersprungen.
Das ist ein Fehler meiner Testzusammenstellung, kein beobachteter Spielabsturz.
Der folgende Stand wendet ausdrücklich denselben bytegleichen geprüften HUD-
Helper auf beide Arme an. Die Forderung nach der HUD-Regel wird nicht gelockert.

## Abgeschlossener Vergleich: kein nachgewiesener Ressourcen-Fix

Quelle 2a2bef5eb5fd57279eb5349dfa297246adc05803, CI 41769708523:
Beide kurzen echten Gastablaeufe bestehen in Chromium 151.0.7922.34 und
Linux-WebKit 26.5 einschliesslich Pause/Resume, Waffenmenue, Home und Bericht.
Die nativen DOM-Pruefungen bestehen. Neue Feldkontakt-/Bewegungssequenzen
wurden in dieser Serie nicht ausgefuehrt. Das ist keine physische iOS-Freigabe.

Alle vier Chromium-Laeufe beobachten mindestens 1.200.000 aktive ms und 428
fortgeschrittene Salven. Schlussmedian des Linux-Renderer-PSS in MiB:

| Wiederholung | Kontrolle | Verbraucher | Abnahme | native Blink-Objektbytes Kontrolle / Verbraucher |
|---|---:|---:|---:|---:|
| 1 | 304.7090 | 281.6465 | 7.5687 % | 8.224.136 / 10.430.456 |
| 2 | 285.6328 | 286.4570 | -0.2886 % | 9.660.576 / 13.610.856 |

Kein Paar erfuellt die vorab festgelegte Ressourcenentscheidung. Die unabhaengigen
unseeded Prozesse begruenden auch keine kausale Verschlechterung. Der Kandidat
wird nicht als White-Screen-Fix uebernommen und rechtfertigt keinen neuen langen
Handytest. Kein neues Telefon-Preview, kein Deployment, keine Runtime-Aenderung.

Alle sechs CI-Artefakt-ZIP-Hashes und ihre erfassten JSON-/Trace-Dateien wurden
abgeglichen; alle 16 nativen Dumps wurden mit dem unveraenderten bisherigen
Parser neu gelesen. Roh-Heaps sind archiviert, wurden hier nicht neu ausgewertet.
manifest.json beschreibt die exakten gzip-Quellbytes. Native Trace-Dateien haben
zwei gzip-Huellen (.gz.gz); die erste ist die unveraenderte Capture-Transporthuelle.
compare.py, comparison.json und verifyNative.mjs/native-reparse.json halten die
Entscheidung und die Nachpruefung mit ihren Grenzen fest. Keine privaten
Telefondateien sind Bestandteil dieser Belege.
