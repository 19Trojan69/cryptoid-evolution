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
