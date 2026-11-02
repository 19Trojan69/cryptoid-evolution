# Leichte Allokatoraufnahme bei aktivem Speicherdruck – 2. November 2026

Fortsetzung von `31ea2da1`. Die komplette vorige Vergleichsserie und die
fehlgeschlagenen WebKit-Prüfungen bleiben gesichert. In Original 2 wurden aktiv
2.378,4 MiB Prozess-PSS beobachtet. Nach Pause/Diagnosebeginn lagen noch
1.996,2 MiB vor, nach fünf Sekunden nur 522,9 MiB – vor unserer GC-Anforderung
und vor dem ersten nativen Dump. Die aktive Spitze ist deshalb nicht sicher
über die anschließenden Pausen-Allokatoren zuzuordnen. Der Thrust-Einzelversuch
wurde nicht als bestätigte Speicherkorrektur übernommen.

## Enges Diagnoseziel

Die vollständige Originalszene wird unverändert wiederverwendet. Nach mindestens
60 tatsächlich beobachteten aktiven Sekunden kann genau **eine leichte native
Aufnahme** ausgelöst werden, sobald die extern gemessene Chromium-Renderer-
Prozessrolle mindestens **768 MiB PSS** erreicht. Der Wert ist eine diagnostische
CI-Schwelle, keine behauptete iPhone-/Android-Abbruchgrenze. Die aktive
Beobachtung ist auf 20 Minuten begrenzt; eine nicht erreichte Schwelle ist
kein erfolgreicher Drucknachweis und kein Spiel-Fix.

Der eigene aktive Collector lockert den vorhandenen inaktiven Collector nicht.
Er prüft Trigger, aktive echte Spiel-/Stoppuhrzustände, Quelle, Dokument und
frische Game-Frames. Erst dann hängt er den nativen Tracer an, mit ausschließlich
memory-infra und ohne automatische Dumps. `Tracing.requestMemoryDump` verwendet
`levelOfDetail:'light'` und `deterministic:false`. Es gibt keine angeforderte GC,
keinen Heap-Profiler/-Snapshot, keine Animationserfassung und keine Spielquellen-
oder Clock-Änderung. Ein leichter Dump liefert Allokator-/Heapgrößen statt der
aufwendigen Detailseite-/Objektklassentabellen. Seine eigene Wirkung bleibt
möglich: Renderer-/Gesamt-PSS vor Tracing, vor/nach Dump und nach Tracing-Ende
sowie echte aktive Zustände und Aufnahmedauer werden getrennt gespeichert.
Die Druckbewertung gilt nur für diese vier externen Stichprobengrenzen;
ein zwischenzeitlicher Rückgang und Wiederanstieg ist damit nicht ausgeschlossen.

Fällt der Bestand schon während der Aufnahme unter die Schwelle, wird diese
Einschränkung explizit ausgegeben. Keine Wiederholschleife versucht, durch
verdeckte Wiederaufnahme oder eine zufällig günstigere Aufnahme einen Erfolg
herzustellen. Datenverlust, fehlende Renderer-Heapwerte und ungültige Zustände
bleiben Fehler; eine partielle Aufnahme wird soweit begrenzt möglich gesichert.
Maximal 128 relevante Events und 8 MiB Roh-Trace sind vorgesehen. Alias-/Eltern-
und Prozessfragmentgrößen werden nicht als Gesamt-RAM/GPU-RAM summiert.

Zuerst muss eine ausdrücklich als **Kalibrierung** bezeichnete aktive Minute
ohne Druckschwelle den echten leichten Ablauf bestehen. Sie ist kein hoher
Drucknachweis. Danach beginnen zwei unabhängige Original-Läufe mit der festen
Schwelle. Beide Modi sind instrumentierte Diagnosen, keine unveränderten
Speichervergleiche oder physische Geräteabnahmen. Der normale Home-Ausstieg und
nachfolgende externe Messwerte werden getrennt erfasst. Unerwartete Pausen
werden nicht automatisch fortgesetzt. Es wird keine neue Spielversion freigegeben.

## Tatsächlich bestandene Kalibrierung

Messquelle `9a21529a247fb18e1e4dbec1036f1a24f7331d4d`, Baum
`1be9590fc563383da4a954adf9cb93ddef39d615`,
[CI 41390668660](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41390668660).
Quellen-Gates und Kalibrierungsjob sind erfolgreich. Der Kalibrierungslauf
beobachtet 60.000 aktive Millisekunden. Genau eine leichte Aufnahme dauert
291 ms, ihre eigentliche Dump-Anforderung 52 ms. Vor/nach der Aufnahme spielt
das sichtbare Dokument mit frischen echten Frames weiter; keine technische
Pause und keine unbeobachtete Stoppuhrlücke werden akzeptiert.

Der native Renderer meldet 62.324.816 Byte Blink-Heap, davon 15.659.968 Byte
als `allocated_objects_size` und 7.208.960 Byte als `pooled_size`. Die Kategorien
überschneiden sich und werden nicht addiert. Der leichte Dump liefert keine
Detailtabelle von `blink_objects`; der fehlende Wert bleibt `null`. Die
Renderer-PSS beträgt am Trigger 265,6 MiB, vor dem Dump 262,1 MiB, danach
263,0 MiB und nach Tracing-Ende 263,3 MiB. Das ist ausdrücklich **keine hohe
Druckaufnahme** und kein neuer Speichervergleich.

Alle 19 gefilterten nativen Events und das vollständige synthetische Ergebnis
sind gesichert. Die Roh-Trace-SHA, ZIP-SHA aus GitHub, ZIP-Integrität, Größen und
die exakte Gleichheit des ursprünglichen Point-Logs mit `capture.points` sind
geprüft. Alle tatsächlichen Dump-Fragmente melden `level_of_detail: light`.
Die Instrumentierung beendet Tracing und löst ihre CDP-Sitzung wieder.

Der normale Home-Ausstieg gelingt. Die gelesenen aktiven CSS-Registrierungen,
Bildbindungen und Effekt-Canvas-Ressourcen sind nach dem Unmount null. Die
spätere externe PSS wird nach fünf Sekunden ohne angeforderte GC gemessen;
die beigefügten Modulzähler stammen ausdrücklich vom bestätigten Unmount-Zeitpunkt.
Das beweist nicht die vollständige Freigabe jeder nativen Browserressource.

Der Build meldet `workingTreeDirty:true`; der neue unmittelbar vor dem Start
erfasste Diff enthält allerdings keine geänderten getrackten Pfade. Die
Spielquellen-Pins bestehen vor/nach dem Lauf. Damit wird kein vollständig
sauberer CI-Arbeitsbaum behauptet und keine ungeprüfte Ursache der Markierung
erfunden. Die tatsächlichen Engine-/Paketversionen und der Lock-Digest bleiben
im Capture erhalten.

Der ergänzende [Abgleich mit Browser-Primärquellen](evidence/browser-source-check.de.md)
trennt ähnliche historische oder fremde Reproduktionen ausdrücklich von den
tatsächlich gemessenen Spielpfaden. Daraus wurde kein Runtime-Patch abgeleitet.

## Abgeschlossene Lastläufe und unverändertes Fehlerkriterium

Die gesamte Mess-CI ist **fehlgeschlagen**: Quellen-Gates, Kalibrierung und
Lastlauf 1 bestehen; Lastlauf 2 liefert Exitcode 2 wegen einer knapp nicht
gehaltenen diagnostischen Grenze. Das ist kein beobachteter Spielabsturz.
Beide Lastläufe spielen bis zur geplanten Aufnahme weiter und bestehen danach
den normalen Home-Ausstieg. Es gibt keine automatische Wiederholung oder
Fortsetzung und keine nachträglich gesenkte Schwelle.

| Aufnahme | Aktive Zeit bis Trigger | Zusätzliche Kernsalven | Renderer-PSS Trigger / vor Dump / nach Dump / Tracing-Ende | Gesamte Aufnahme / Dump-Anforderung | Bewertung |
| --- | ---: | ---: | --- | --- | --- |
| Kalibrierung | 1:00,000 | 21 | 265,6 / 262,1 / 263,0 / 263,3 MiB | 291 / 52 ms | Messablauf bestanden, kein Drucknachweis |
| Lastlauf 1 | 9:33,000 | 204 | 794,3 / 791,1 / 789,3 / 790,4 MiB | 418 / 76 ms | Alle vier Stichprobengrenzen mindestens 768 MiB |
| Lastlauf 2 | 9:35,000 | 205 | 769,9 / 767,4 / 768,2 / 767,7 MiB | 298 / 64 ms | Zwei Grenzen knapp unter 768 MiB; Druckkriterium nicht bestanden |

Der zweite Lauf verliert also **nicht** seine große Speicherspitze wie die frühere
Pausenaufnahme: Vor dem Dump fehlen rund 0,6 MiB zur festen Grenze. Die genaue
Regel bleibt trotzdem bindend. Sein nativer Dump bleibt als tatsächlich
gemessener, eingeschränkt qualifizierter Befund erhalten und wird nicht als
zweiter bestandener Drucknachweis gezählt. Die beiden Lastläufe sind
schwellenabhängig beendete Diagnosen, keine neuen 20-Minuten-Stabilitätstests.

Alle drei Aufnahmen verwenden tatsächlich Chromium 151.0.7922.34, React und
ReactDOM 19.2.4, Router 7.13.2, Vite 7.3.1, TypeScript 5.9.3 und denselben
Lock-SHA-256. Sie sind unabhängige unseeded Läufe; die kurze Kalibrierung ist
kein gepaarter identischer Renderzustand. `changedTrackedPaths` ist jeweils leer;
die Build-Markierung `workingTreeDirty` ist jeweils wahr. Der abschließende
Scope-Befehl lief in Kalibrierung/Lastlauf 1 erfolgreich; im fehlgeschlagenen
Lastjob 2 wurde er wegen Exitcode 2 nicht mehr ausgeführt. Das vorangehende
gemeinsame Quellen-Gate und die unveränderten Build-Fingerprints bleiben erhalten.

## Native Zuordnung unter laufender Last

Die Tabelle enthält jeweils die tatsächlich berichtete Allokatorzeile, in MiB.
Eltern/Kind-Zeilen, Heapattribute, Prozessfragmente und Shared-Memory-Aliase
überschneiden sich. Sie sind keine addierbaren Teile einer Gesamt-PSS-Bilanz.

| Native Renderer-Zeile | Kalibrierung | Lastlauf 1, qualifiziert | Lastlauf 2, Grenze knapp verfehlt |
| --- | ---: | ---: | ---: |
| `blink_gc/main/heap` | 59,4 | 456,9 | 441,3 |
| Heapattribut `allocated_objects_size` | 14,9 | 96,1 | 125,5 |
| Heapattribut `pooled_size` | 6,9 | 17,3 | 19,6 |
| `v8` | 27,2 | 69,4 | 69,1 |
| `partition_alloc` | 32,5 | 99,2 | 96,3 |
| `cc` | 47,5 | 41,1 | 41,4 |
| `canvas` | 1,793 | 1,793 | 1,852 |

**Nachgewiesen:** Der qualifizierte aktive Dump erfasst einen großen nativen
Blink-Heap, während die vier externen Renderer-PSS-Stichproben hoch bleiben.
Die Canvas-Kategorie wächst gegenüber der separaten Kalibrierung nicht ähnlich
stark. Es gibt keine gemessene technische Pause, keinen erfassten Audio-Uhrstillstand
und keinen Trace-Datenverlust. Vor/nach dem Dump schreiten echte Game-Frames fort.

**Noch nicht nachgewiesen:** Die leichte Aufnahme enthält keine nativen
Objektklassen-/Besitzertabellen. Sie belegt daher nicht, dass der gesamte große
Blink-Heap aus CSS-Variablen besteht. Die früheren detaillierten Pausen-Dumps
mit großen Style-/HashTrie-Beständen und die konkreten häufigen Style-Schreibpfade
bleiben die Begründung für diese Hypothese. `allocated_objects_size` wird nicht
als nach GC tatsächlich zurückgehaltener Objektbestand umgedeutet; Differenzen
der Heapattribute werden nicht pauschal zu freigebbarem RAM erklärt.

Auch bei Home unterscheiden sich native Bestände: Trotz jeweils null gezählter
aktiver CSS-Registrierungen/Bildbindungen/Effekt-Canvas-Ressourcen beträgt die
Renderer-PSS nach fünf Sekunden ohne angeforderte GC in Lastlauf 1 **204,6 MiB**,
in Lastlauf 2 **748,7 MiB**. Diese kurze Ruhephase beweist weder einen neuen
dauerhaften Leak noch die vollständige native Freigabe. Die früheren separaten
GC-/Heap-/Home-Belege werden dadurch nicht ersetzt.

## Technische Konsequenz und gesicherte Belege

Priorität bleibt nun die Zuordnung des **aktiven großen Blink-Bestands zu
nativen Objektklassen**. Eine begrenzte einzelne Detailaufnahme kann diese offene
Frage gezielter prüfen als ein weiterer unveränderter Smartphone-Dauerlauf. Sie
braucht einen eigenen vorab festgelegten Aufbau, Kalibrierung, Vor-/Nachgrenzen
und dieselben strikten echten Aktivitätsprüfungen; die leichten Aufnahmen oben
werden nicht rückwirkend umbenannt. Eine vorab festgelegte Triggerreserve über
der Annahmegrenze kann Messjitter berücksichtigen, ohne diesen zweiten Lauf
nachträglich zum Erfolg zu machen. Es wird keine aktive GC erzwungen.

Erst ein begründeter, einzeln geprüfter Schreib-/Besitzpfad rechtfertigt die
nächste virtuelle Runtime-Variante. Sie muss ursprüngliche berechnete
Darstellung, Animationen und Spieluhren erhalten und einen wiederholbaren
Vorteil gegen die unveränderte Originalbedingung zeigen. Der frühere nur
gemischte Schubvergleich bleibt kein übernommener Fix. WebKit-Start-/Neueinstiegslücken
werden separat weitergeführt. Es gibt weiterhin keine bestätigte mobile
White-Screen-Reparatur, Freigabe oder neue Geräte-URL.

[manifest.json](evidence/manifest.json) weist drei gegen GitHub geprüfte ZIPs,
die verlustfrei komprimierten vollständigen synthetischen Captures und drei
vollständige gefilterte native Traces samt Digests aus.
[results.json](evidence/results.json) wird aus diesen Daten neu berechnet.
Roh-Besitzerberichte und rohe Heap-Snapshots sind nicht enthalten.
Der Offline-Verifier prüft alle drei Quellen/Bäume, Engine-/Paket-/Lock-Bezüge,
PSS-Grenzen, Dump-Level, Hex-Bytewerte, fehlende Werte, Fragmentzuordnung,
normalen Ausstieg und die unverändert fehlgeschlagene zweite Druckbewertung.

20 Collector-/Parser-/Inaktivitätsfälle bestehen im Quellen-Gate. Die gesamte
Offline-Serie umfasst jetzt 56 Fälle einschließlich neun neuer Auswertungsfälle;
die Fallzahlen verschiedener Aufrufe überlappen und werden nicht addiert.
Die unabhängige [Offline-CI 41393087399](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41393087399)
hat den gesicherten Stand `455ef632` erfolgreich geprüft: 34 + 8 + 14 Fälle,
null Fehler, alle archivierten Belege einschließlich der drei neuen Traces
erneut gelesen. Die ursprüngliche rote Mess-CI und der nicht bestandene zweite
Drucknachweis bleiben dadurch ausdrücklich unverändert.

```bash
node --test verification/active-pressure-attribution-20261102/collector.test.mjs verification/active-pressure-attribution-20261102/evidence/summary.test.mjs
node verification/active-pressure-attribution-20261102/evidence/verifyEvidence.mjs
node verification/boss2-mini-start-control-20261101/verifyScope.mjs
```
