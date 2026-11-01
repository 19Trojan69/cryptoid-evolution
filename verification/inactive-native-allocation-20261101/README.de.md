# Native Allokatoren nur an inaktiven Grenzen – 1. November 2026

**Ergebnis:** Nach einem vollständig beobachteten 20-Minuten-Lauf liegt eine
große bereinigbare Belegung konkret im nativen Blink-Heap: **398,6 → 18,5 MiB**
vor/nach angeforderter inaktiver GC. Dessen größte Objektgruppen betreffen
CSS-Variablen und berechnete Styles. Die gemessene Canvas-Kategorie bleibt dabei
unverändert. Das grenzt die nächste Prüfung ein, beweist aber weder einen
bestimmten fehlerhaften Spielpfad noch den Smartphone-Absturzgrund. Kein
Runtime-Patch und keine Smartphone-Freigabe werden daraus abgeleitet.

Direkte Fortsetzung des isolierten Mini-Start-Vergleichs `0725adda`:
zwei Original-Läufe mit 809/923 MiB gegenüber zwei Guard-Läufen mit 1009/877 MiB
letztem Minutenmedian. Der Guard liefert keine nachgewiesene Speicherkorrektur.
Alle bestehenden Spielfunktionen bleiben erhalten. Vollständige Belege und die
vier Verläufe stehen in `../isolated-mini-pacing-20261101/`.

Die vorhandenen 90-Sekunden-Allokatorbelege und ihr korrigierter Parser bleiben
Grundlage dieser Fortsetzung. Die neue Erfassung startet erst **nach** 60 bzw.
1200 tatsächlich beobachteten aktiven Sekunden und nach bestätigter manueller
Pause. Originalgrafik, ursprüngliches Pacing und vorhandene Spielszene bleiben
erhalten. Keine API-Wrapper, aktive Traces, Heap-Snapshots, erzwungene GC oder
zusätzlichen Animationsscans während des aktiven Spiels.

Vier explizite globale Dumps werden sequenziell angefordert: pausiert nach
fünf Sekunden Ruhe vor angeforderter GC, pausiert nach GC, Home nach GC und
leeres neues Dokument nach GC. Vor und nach jeder Anforderung wird der echte
inaktive Zustand erneut geprüft. Die Anforderung verwendet `deterministic:false`,
damit nicht schon diese Option eine GC erzwingt; die normalen Browser- und
Diagnoseeffekte bleiben möglich. Linux-PSS wird unmittelbar vor und nach dem
Dump getrennt gespeichert. Der Dump selbst kann die Messung beeinflussen.
Siehe [CDP Tracing.requestMemoryDump](https://chromedevtools.github.io/devtools-protocol/tot/Tracing/#method-requestMemoryDump).

Nur `disabled-by-default-memory-infra` ist eingeschlossen, Default-Kategorien
sind ausgeschlossen, automatische Dump-Trigger leer. Der Trace startet vollständig
nach der aktiven Strecke; ein aktiver 90-Sekunden-Profiler wird nicht als neue
unbeeinflusste Langmessung wiederholt. Das vollständige gefilterte synthetische
Trace-JSON wird komprimiert mit Digest auch vor der abschließenden Zuordnung
gesichert. Die bisherigen GUID-/Export-ID-Korrekturen und exakten oversized
unsigned-Hex-Werte werden wiederverwendet. Fehlende Kategorien bleiben null.
Eltern-/Kind-Allokatoren, Aliaswerte und Prozessfragmente dürfen nicht zu einem
angeblichen RAM-/GPU-Gesamtwert summiert werden.

Vier neue Collector-Regressionen prüfen die wirklichen Aufrufgrenzen,
unveränderte Parameter, einen großen irrelevanten Event-Burst, ungeeignete aktive
Zustände, verlorene Daten, fehlende Renderer-Werte, fehlgeschlagene Dumps und
vollständige Session-/Listenerfreigabe. Sieben bestehende Parserfälle werden
beibehalten. Erst wenn der reale 60-Sekunden-Ablauf alle vier Dumps liefert,
beginnt der separate 20-Minuten-Lauf. Fehler bleiben Fehler und werden gesichert.

Diese Phase verändert keinen Spielcode und veröffentlicht keine neue Spielversion.
Native Allokatorwerte aus Linux identifizieren noch keine physische iOS-/Android-
Ursache.

## Nachprüfbare Auswertung

`evidence/summary.mjs` prüft die gemessene Quelle und aktive Laufzeit mit dem
vorhandenen Lebensdauer-Verifier. Es entpackt den gesicherten Trace erneut und
vergleicht die tatsächlichen Prozessfragmente, Export-/Anforderungszuordnung,
Kategorien, größten Einträge und exakt gespeicherten unsigned-Hex-Werte mit dem
Ergebnis-JSON. Ein fehlender Wert bleibt null. Ein Kurzlauf darf nicht als
20-Minuten-Ergebnis gelten. Manipulierte Werte, falsche Quellen, aktive Traces,
Datenverlust und fehlende Dump-Grenzen scheitern in eigenen Regressionen.

Die Detailauswertung verwendet außerdem die bereits vom Browser aggregierten
Typzeilen unter `blink_objects/blink_gc/main/`. Deren Typ-ID bleibt erhalten;
gleichnamige Typen können im Browser unterschiedliche interne Typen sein.
Per-Page-Duplikate und diese globalen Zeilen werden nicht zusammengerechnet.
Heap-Seitengröße, allokierte Objektbytes und committed/pooled Bytes werden
getrennt angegeben. Vor angeforderter GC sind die Objektbytes kein Nachweis
noch erreichbarer Referenzen. Primärquelle für diese Dump-Struktur:
[Chromium BlinkGCMemoryDumpProvider, gemessene Browserversion 151.0.7922.34](https://github.com/chromium/chromium/blob/151.0.7922.34/third_party/blink/renderer/platform/heap/blink_gc_memory_dump_provider.cc).

Die zusätzliche CI `cryptoid-stability-evidence.yml` prüft die archivierten
Lebensdauer-, isolierten Mini-Start- und nativen Belege mit Node. Sie benötigt
keine erneute Browser-Langmessung und keine App-Abhängigkeiten. Neue Messungen
bleiben davon getrennt. Die bisherigen fehlgeschlagenen WebKit-Startprüfungen
werden dadurch nicht nachträglich erfolgreich.

## Abgeschlossene Messung und gesicherte Belege

Gemessene Quelle `ff01956a1726c43813180431d65a630c7ceda673`, Baum
`2803d77cdbd059c25a443c775b7bb9996aa41e4b`,
[CI 41347453214](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41347453214).
Alle drei Jobs sind erfolgreich abgeschlossen. Der Kurzlauf beobachtete
60.000 ms aktive Zeit und 21 zusätzliche Kernsalven. Der danach gestartete
frische Langlauf beobachtete **1.201.000 ms aktive Stoppuhrzeit**, 1.201.847 ms
Wandzeit und 428 zusätzliche Salven. Es sind zwei unabhängige, unseeded Linux-
Läufe der geschützten Boss-2-Gastszene, keine Wiederholungsserie oder vollständige
Kampagnen-/Geräteabnahme. Engine 151.0.7922.34, tatsächlich installierte fünf
Top-Level-Pakete und Lock-Digest stimmen überein.

Beide Captures, beide vollständigen gefilterten nativen Traces und die vier
neu berechneten Heap-Auswertungen sind unter `evidence/` gesichert. Beide
Original-ZIP-Digests/Integritäten stimmen. Alle acht nativen Dumps wurden aus den
Roh-Traces erneut zugeordnet; Kategorien, Fragmente und oversized-Hex-Werte
entsprechen den gespeicherten Ergebnissen. Alle vier Snapshot-Digests,
entpackten Größen und Heap-Größen-/Klassensummen stimmen. Die Roh-Snapshots
und Besitzerberichte werden nicht in Git übernommen.

### Getrennte Messgrößen

Die folgenden Zeilen überlappen teilweise; sie dürfen **nicht addiert** werden.
PSS ist die externe Prozessmessung, die weiteren Zeilen sind jeweils eine
einzelne native Allokator-Kategorie des Renderer-Fragments.

| Messgröße | Kurzlauf | 20-Minuten-Lauf |
| --- | ---: | ---: |
| PSS erste / letzte aktive Minute, Median | 432,9 / 433,0 MiB | 442,4 / 893,8 MiB |
| PSS Pause nach Ruhezeit, vor angeforderter GC | 437,6 MiB | 892,7 MiB |
| PSS Pause nach GC, vor nächstem Dump | 390,8 MiB | 446,6 MiB |
| Blink-Heap `blink_gc`, vor / nach GC | 55,4 / 9,6 MiB | 398,6 / 18,5 MiB |
| Blink-Objektbytes `blink_objects`, vor / nach GC | 10,4 / 3,6 MiB | 103,6 / 4,6 MiB |
| Canvas-Kategorie, vor / nach GC | 1,7932 / 1,7932 MiB | 1,7932 / 1,7932 MiB |
| `cc/image_memory`, vor / nach GC | 27,4 / 27,4 MiB | 16,3 / 16,3 MiB |
| `skia`, vor / nach GC | 13,0 / 13,0 MiB | 13,0 / 13,0 MiB |
| `malloc`, vor / nach GC | 54,0 / 52,1 MiB | 81,8 / 55,3 MiB |
| `partition_alloc`, vor / nach GC | 31,6 / 30,3 MiB | 88,2 / 61,6 MiB |

Im Langlauf meldet der Blink-Heap außerdem 139,25 MiB pooled Bytes vor GC und
null danach. Die Heap-Seitengröße sinkt um rund 380 MiB; die eigentlichen
Objektbytes sinken um rund 99 MiB. Pool-, Objekt- und Seitengrößen sind
unterschiedliche, überlappende Ansichten. Daraus wird kein exakter Anteil am
PSS-Rückgang und keine GPU-RAM-Messung berechnet.

Die Diagnose beeinflusst den Prozessspeicher: Das Tracing-Anhängen verändert
den Gesamt-PSS von 440,3 auf 445,2 MiB im Kurzlauf und von 894,7 auf 899,2 MiB im
Langlauf. Der erste native Dump verändert ihn anschließend von 437,6 auf
451,2 bzw. von 892,7 auf 913,2 MiB. Diese Wirkungen bleiben als eigene Grenzen
gespeichert. Es ist deshalb keine unbeeinflusste Messung des aktiven Spitzen-
Allokators. Vor GC bedeutet vor unserer expliziten Anforderung; normale
Browser-GC und Änderungen während der Diagnose bleiben möglich.

### Konkrete native Objektgruppen

Aus den globalen Typzeilen des Langlaufs, Bytewerte vor/nach angeforderter GC:

| Typ im Blink-Heap | vor GC | nach GC |
| --- | ---: | ---: |
| `HashTrieNode<CSSVariableData>` | 19.405.024 B | 78.608 B |
| `ComputedStyleBase::StyleSurroundData` | 7.262.736 B | 55.848 B |
| `ComputedStyle` | 6.777.720 B | 71.856 B |
| `CachedMatchedProperties` | 6.371.056 B | 34.952 B |
| `ComputedStyleBase::StyleMiscData` | 5.616.072 B | 56.056 B |
| `ComputedStyleBase::StyleSVGData` | 4.392.640 B | 43.760 B |

Im Kurzlauf belegen `HashTrieNode<CSSVariableData>` vor/nach GC
1.489.744 / 61.472 Byte. Die Werte machen CSS-Variablen-/Style-Erzeugung zur
konkreten nächsten Spur. Sie belegen keine Erreichbarkeit dieser Objekte vor GC
und ordnen sie noch keiner einzelnen Komponente oder nativen API zu.

### Freigabe und verbleibende Grenzen

Der bereinigte pausierte JS-Heap liegt im Kurz-/Langlauf bei
10.509.596 / 10.688.556 Byte, nach Home bei 9.892.764 / 9.928.524 Byte.
Nach Home stimmen DOM-Knoten/JS-Listener mit 247/210 überein; CSS-Registrierungen,
Bild-Pins, Spiel-Canvas, aktive native Dokumentanimationen und Canvas-Effektcache
sind null. Die Snapshots enthalten dann keine native `CSSAnimation`, keinen
nativen `KeyframeEffect` und keinen nativen `AudioBuffer`. Sieben jeweils
192×192 große Offscreen-Canvas bleiben wie zuvor im begrenzten Steintexturcache.
Auch der native Canvas-Dump meldet nach Home in beiden Läufen genau
1.032.192 Byte; nach dem leeren Dokument fehlt die Kategorie, statt null zu sein.
Die gelesenen CSS-Fallbacks, Canvas-Fehler und Audio-Uhrstillstände bleiben null.

Der Prozess-PSS normalisiert sich trotzdem nicht vollständig auf den Kurzlauf:
Nach Home-GC liegen 375,2 gegenüber 431,6 MiB vor. Unter anderem unterscheiden
sich verbleibende Partition-/Discardable-/Shared-Kategorien. Diese überlappen
und sind weder vollständig einem Spielbesitzer zugeordnet noch als dauerhaftes
Leck nachgewiesen. Die gesamte Speicherfrage gilt deshalb nicht als erledigt.

## Priorisierte nächste technische Prüfung

1. **CSS-Variablen und Style-Erzeugung im gemeinsamen Renderpfad zuordnen.**
   Die Quellen zeigen unter anderem direkte variable Style-Schreibzugriffe am
   Spielerschiff und wechselnde Energie-/Ladewerte am Boss-SVG. Die nativen Typen
   sind ein Grund, diese Pfade gezielt zu messen; sie beweisen noch keinen Defekt
   dort. Zuerst tatsächliche geänderte gegenüber identischen Schreibwerten und
   betroffene Besitzer in einem kurzen Diagnoseaufbau zählen, ohne zusätzliche
   Scans, Timer oder gehaltene Elementlisten. Alte Mini-Guards nicht als Lösung
   übernehmen: Ihre isolierte Wiederholungsserie zeigte keine Speicherverbesserung.
2. **Nur einen belegten Erzeugungspfad verändern.** Eine Korrektur muss gleiche
   berechnete Darstellung, native Animationen, sichtbare Effekte, Spieluhr und
   Freigabegrenzen bewahren. Erst den konkreten Gegenbeispiel-Test und den
   kurzen echten Browserablauf bestehen lassen. Der jetzige GC-Rückgang allein
   rechtfertigt weder einen Runtime-Patch noch regelmäßige Zwangs-GC/Reloads.
3. **Danach wiederholt denselben Langfall vergleichen.** Frische Prozesse,
   Originalszene, keine aktiven API-Wrapper oder schweren Aufnahmen; aktive Zeit,
   Salven, PSS-Verlauf und dieselben inaktiven Allokatorgrenzen gemeinsam prüfen.
   Ein einzelner niedriger Endpunkt oder ein bestandener 20-Minuten-Lauf genügt
   nicht. Die offene WebKit-Original-Startlücke gesondert beibehalten.
4. **Erst ein begründeter intern bestätigter Fortschritt rechtfertigt den
   nächsten gezielten physischen Vergleich** auf iOS/Android/Pi Browser. Aktuell
   ist kein erneuter Besitzer-Langtest nötig und keine neue Geräteversion freigegeben.

**Nachgewiesen:** bereinigbare native Blink-/Style-Bestände nach derselben realen
Laufzeit, acht korrekt zugeordnete Dumps und reproduzierte Freigabegrenzen.
**Vermutung:** Die wiederholte Style-/Variablenerzeugung trägt zur mobilen
Speicherbelastung bei; Quelle und kausaler White-Screen-Bezug sind offen.
**Bestätigte Verbesserung:** automatische Zuordnung, Integritätsprüfung und
Auswertungsregressionen. Keine bestätigte Verbesserung des ausgelieferten Spiels.

Lokal bestehen die 15 Collector-/Parser-/Inspektionsfälle sowie die sechs neuen
Offline-Annahmefälle. Die schnelle Archiv-CI prüft 25 Fälle einschließlich der
bisherigen Lebensdauer- und isolierten Vergleichsauswertung sowie alle drei
Beleg-Reproduktionen. Unveränderte Spielquellen-Pins bleiben Voraussetzung.
