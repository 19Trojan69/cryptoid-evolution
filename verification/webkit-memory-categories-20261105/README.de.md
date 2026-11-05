# Native WebKit-Speicherkategorien und Grafikflächen

Ein kurzer, instrumentierter Lauf auf dem unveränderten 9f3-Gerätekandidaten. Keine neue Handyaufforderung, keine native iOS-Simulation, keine Spielkorrektur. Playwright 1.62.1 und das bereits verifizierte offizielle Container-Abbild bleiben fest.

Die in-process-Verbindung und die WebKit-Protokollmethoden wurden im offiziellen Quellcode der festgelegten Playwright-Version nachgelesen. Memory.enable/startTracking liefern native Kategorien; LayerTree liefert die vom Browser geschätzten Flächenbytes, Knoten und Kompositionsgründe an Phasengrenzen. Fehlende Unterstützung oder fehlende Daten führen zum Fehler, nicht zu einer Nullmessung. Messung ist instrumentiert und kein unveränderter PSS-Abnahmelauf.

Zusätzlich wird der alte Browserkontext tatsächlich geschlossen und ein neuer leerer Kontext geöffnet. Eine Navigation allein wird ausdrücklich nicht als Vernichtung des vorherigen Dokuments bezeichnet. Die unveränderten Rohdaten des früheren Lebenszyklus-Laufs bleiben erhalten.

Keine erzwungene GC, kein Heap-Dump, keine zusätzlichen Spieltimer/Frames, keine Uhrschreibzugriffe. Alle vorhandenen Quell-, Asset-, Uhr-, Journal-, Ausstiegs- und Exportprüfungen bleiben erhalten. Prozess-PSS und native Kategorien sind Linux-WebKit-Daten, keine physische Smartphone-RAM-Messung oder belegte Absturzursache.
