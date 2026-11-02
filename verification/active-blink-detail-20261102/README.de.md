# Native Objektklassen während hoher aktiver Last – 2. November 2026

Fortsetzung von `a8131250`, ohne Änderung an Spielquellen, Spielfunktionen,
Spieluhren, Grafik, Audio oder den eingefrorenen Geräte-Kandidaten. Die vorige
leichte Serie und ihr knapp fehlgeschlagener zweiter Drucknachweis bleiben
unverändert. Die neue Phase untersucht, welche nativen Objektklassen während
eines großen Blink-Bestands tatsächlich gemeldet werden. Eine Objektklasse
identifiziert noch keinen JavaScript-Aufrufer, Allokationsstack oder Retainerpfad.

## Vorab festgelegtes Diagnoseprotokoll

- Gleiche vollständige Originaldarstellung und bestehende geschützte Gastszene
  Boss 2/offener Reaktor. Kein echter Account, Backendkontakt oder Bezahlschritt.
- Ein eigener aktiver Detail-Collector; die bisherigen leichten und inaktiven
  Collector-Module und ihre Grenzen bleiben bytegleich.
- Genau eine native Anforderung: `levelOfDetail:'detailed'`, `deterministic:false`.
  Keine automatischen Dumps, angeforderte GC, aktiven Heap-Snapshots/-Profiler,
  Screenshots, API-Wrapper, Animationsscans oder automatische Wiederaufnahme.
- Nach mindestens 60 tatsächlich beobachteten aktiven Sekunden ist der Trigger
  **832 MiB Renderer-PSS**. Die Annahmegrenze bleibt **768 MiB** an allen vier
  externen Grenzen: Trigger, vor Dump, nach Dump, nach Tracing-Ende. Die Reserve
  berücksichtigt die kleinen Schwankungen der alten Serie; deren zweiter Lauf
  wird dadurch nicht nachträglich zum Erfolg. Dies ist keine Smartphone-Abbruchgrenze.
- Höchstens 20 aktive Minuten pro Drucklauf; keine erreichte Schwelle oder
  verlorene Annahmegrenze ist ein verfehltes Diagnoseziel, kein gemessener Crash.
- Zuerst muss eine eigene aktive Minuten-Kalibrierung mit Detailtabellen bestehen.
  Erst danach beginnen zwei unabhängige Druckläufe. Die Kalibrierung ist kein
  hoher Drucknachweis und kein unbeeinflusster Speicher-Kontrolllauf.
- Sichtbarkeit, Quelle/Baum, Dokument, Stoppuhr-ID/-Quelle, echte frische Frames,
  Spielzustand und fehlende technische Pause/Beobachtungslücke bleiben geprüft.
  Vor/nach Tracing werden aktive Zustände gespeichert; die echte Framezeit
  nach der Aufnahme muss weiter als vor ihrem Beginn sein. Unerwartete Pausen bleiben Fehler.
- 128 relevante Events, 32 MiB gefilterte Rohdaten, 16 MiB Tracing-Puffer und
  4.096 globale Typzeilen pro Prozessfragment bilden feste Grenzen. Die frühere
  detaillierte Originalaufnahme hatte bereits 16,25 MB in einem Snapshot; das
  8-MiB-Limit der leichten Serie wäre dafür ungeeignet. Überlauf/Datenverlust
  oder fehlende benannte Klassen können keine erfolgreiche Aufnahme ergeben.
- Normale Home-Pause und bestätigter Ausstieg erfolgen erst anschließend.
  Scope-Prüfung und Artefaktsicherung laufen auch bei einem Diagnosefehler.

Native Detailaufnahmen können den Bestand selbst verändern oder normale
Browserbereinigung beeinflussen. Die vier PSS-Grenzen und echten Zustände werden
deshalb mitgespeichert; sie sind keine lückenlose Speicheraufzeichnung. Diese
Diagnosen ersetzen weder die bisherigen unbeeinflussten aktiven Langmessungen
noch eine physische iOS-/Android-/Pi-Browser-Abnahme.

## Auswertung ohne Doppelzählung

Der Parser verarbeitet die bereits global über Seiten zusammengefassten
`blink_objects/blink_gc/main/... (0xID)`-Zeilen. Gleich benannte unterschiedliche
Typ-IDs bleiben getrennt. Einzelne Seitenzeilen, globale Typzeilen, Eltern,
Heapräume, Prozessfragmente und Shared-Memory-Aliase werden nicht addiert.
Objektzähler sind wie Bytewerte hexadezimal. Fehlende Werte bleiben fehlend;
zu große unsigned Skalare bleiben mit exakter Hexdarstellung erhalten.

Alle globalen Klassen sowie die größten 30 werden gespeichert. Style-/HashTrie-
Klassen werden zusätzlich mit ihren vorhandenen nativen IDs ausgewiesen, ohne
andere große Klassen auszublenden. Heapgröße, gemeldeter Objekt-Payload, Pool,
Fragmentierungsprozent und Räume bleiben getrennte Messwerte. Insbesondere sind
Objekt-Payload und Klassenwerte keine nach GC nachgewiesen zurückgehaltenen Bytes.
Der bereits gesicherte echte Trace deckte vor dem neuen Browserlauf eine
Exportbesonderheit auf: Sein `fragmentation`-Skalar trägt im Legacy-JSON die
Einheit `objects`, obwohl der Provider ein Prozentattribut anlegt. Die Roh-Einheit
und der Wert bleiben unverändert erhalten; der daraus unabhängige aus Heap-/
Objektbytes berechnete Anteil wird ausdrücklich als abgeleitet gespeichert.
Er wird weder als Objektzählung noch als gesichert freigebbarer Speicher ausgegeben.

Die [Chromium-Quelle des gemessenen 151.0.7922.34-Providers](https://github.com/chromium/chromium/blob/151.0.7922.34/third_party/blink/renderer/platform/heap/blink_gc_memory_dump_provider.cc)
bestätigt die zusätzliche Detailseite-/Typstatistik und ihre globale Aggregation.
Der explizite GC-Pfad hängt dort an ForceGc; dieser wird hier nicht angefordert.
Das schließt normale interne Bereinigung oder einen Diagnoseeinfluss nicht aus.

## Technische Gates und Nachweise

Die neuen Tests führen den tatsächlichen Collector und die tatsächliche
Klassifikation aus. Sie prüfen native Hex-Objektzähler, doppelte Klassennamen,
globale/Seiten-Doppelzählung, Light-/Unknown-/Heap-only-Fehldaten, Triggerreserve,
verlorene Druckgrenzen, Pausen, Datenverlust, Byte-/Eventbudget und Cleanup.
Ein schon gesicherter echter detaillierter Chromium-Dump wird zusätzlich als
Parser-Fixture wiederverwendet; er zählt ausdrücklich nicht als neuer Spieltest.

```bash
node --test verification/active-blink-detail-20261102/collector.test.mjs
node verification/boss2-mini-start-control-20261101/verifyScope.mjs
```

Quellen-Gates und echte Browserprüfungen stehen in
[cryptoid-active-blink-detail.yml](../../.github/workflows/cryptoid-active-blink-detail.yml).
Neue Ergebnisse werden erst nach den tatsächlich beendeten Läufen ergänzt.
Es wird keine neue Spielversion veröffentlicht und kein manueller Handy-Dauertest
für diese technische Eingrenzung verlangt.

## Abgeschlossene Serie: kein neuer großer Heap reproduziert

Messquelle `79f70ae9868151de2e01f5e0d0c7b67e230656a8`, Baum
`5517bb7b76cd16baca31d31ff3710919c6655011`,
[CI 41413213131](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41413213131).
Quellen-Gates mit 28 Fällen sowie beide virtuellen TypeScript-Varianten bestehen.
Die neue aktive Detail-Kalibrierung besteht ebenfalls. Beide Druckläufe sind
anschließend **fehlgeschlagen, weil die vorab festgelegte Schwelle nicht erreicht
wurde**. Deshalb ist die gesamte Mess-CI rot; es wurde kein Spielabsturz beobachtet.

| Lauf | Tatsächlich beobachtete aktive Zeit | Kernsalven | Größte gemessene Renderer-PSS | Native Detailaufnahme | Normaler Home-Ausstieg |
| --- | ---: | ---: | ---: | --- | --- |
| Kalibrierung | 1:00,003 | 21 | 309,3 MiB | Eine, ohne Druckqualifikation | Bestanden |
| Druck 1 | 20:00,000 | 428 | 388,9 MiB | Keine: Trigger nicht erreicht | Bestanden |
| Druck 2 | 20:00,000 | 428 | 347,5 MiB | Keine: Trigger nicht erreicht | Bestanden |

Die Druckläufe hängen Tracing tatsächlich nie an. Ein fehlender Heap-/Klassenwert
bleibt **nicht gemessen**, nicht null. Die niedrigen PSS-Verläufe bei unveränderten
Spielquellen sind keine Verbesserung durch einen Patch. Sie zeigen erneut, dass
ein guter Einzel-/Doppellauf und fehlender hoher Bestand keine mobile Reparatur
beweisen. Der frühere qualifizierte aktive 456,9-MiB-Blink-Dump bleibt gültig;
dieser neue Versuch konnte ihn nicht mit einer Detailtabelle ergänzen.

Alle drei Aufnahmen verwenden Chromium 151.0.7922.34, dieselben fünf erfassten
Top-Level-Paketversionen und denselben Lock-Digest wie die vorige leichte Serie.
Die Build-Markierung ist jeweils `workingTreeDirty:true`. Die nun zusätzlich
erfassten Statuspfade nennen ausschließlich zwei ungetrackte, durch die
Installation erzeugte Paket-Lockfiles; kein getrackter Pfad ist verändert.
Die Quellen-Pins bestehen vor sowie nach **allen drei** Läufen. Die neue separate
Nachprüfung wurde auch nach den beiden Exitcode-2-Ergebnissen ausgeführt.

## Tatsächlich gelieferte Klasseninformation

Die Kalibrierung fordert genau einen detaillierten Dump an: 389 ms für die
Anforderung, 1.800 ms für die gesamte Sammlung/Verarbeitung/Beendigung. Der rohe
gefilterte Trace enthält 19 Events und 6.571.927 Byte, ohne gemeldeten Verlust.
Vor/nach Tracing sind Quelle/Dokument/Stoppuhr gleich, das Spiel spielt,
echte Frames sind frisch und fortgeschritten, und es gibt keine technische
Pause oder unbeobachtete Lücke. **Dies ist kein Hochlastnachweis.**

Der Renderer meldet 100.565.232 Byte Heap, 26.054.760 Byte Objekt-Payload und
3.145.728 Byte Pool. Diese Werte werden nicht addiert. 1.224 globale native
Typzeilen sind enthalten, darunter:

| Globale Klasse | Berichtete Bytes | Berichtete Objekte |
| --- | ---: | ---: |
| `HashTrieNode<CSSVariableData>` | 3.531.648 | 12.984 |
| `CachedMatchedProperties` | 1.850.824 | 13.609 |
| `ComputedStyleBase::StyleSurroundData` | 1.726.920 | 5.535 |
| `ComputedStyle` | 1.622.304 | 22.532 |
| `ComputedStyleBase::StyleMiscData` | 1.497.936 | 17.022 |
| `ComputedStyleBase::StyleSVGData` | 1.204.960 | 15.062 |

Native Typ-IDs bleiben pro Fragment erhalten; die verkürzten Namen in dieser
Tabelle sind nur Leselabels. Die globale Aggregation des Providers wird nicht
noch einmal mit Seitenwerten summiert. Die Klassen benennen keine aktuellen
Retainer, Allokationsstacks oder nach GC verbleibenden Objektbestände.
Insbesondere sind 13.609 `CachedMatchedProperties`-Objekte kein gemessener
aktueller Cache-Eintragszähler. [Quellbezüge und Grenzen](evidence/engine-source-notes.de.md)
erläutern den vorhandenen Style-Cache-/GC-Mechanismus ohne daraus einen
nachgewiesenen Spiel-/Browserfehler zu behaupten.

## Konsequenz: Schreibpfad direkt prüfen statt die gleiche Langrunde wiederholen

Die Frage nach den Klassen des **großen aktiven** Heaps bleibt offen. Ein weiterer
identischer unseeded Dauerlauf ist deshalb nicht der nächste priorisierte Test.
Die vorhandenen häufigen geänderten Root-/SVG-Custom-Property-Werte und die
tatsächlich gelesenen Style-Klassen begründen jetzt eine **begrenzte native
Neuberechnungsprüfung** an der bestehenden, regulär pausierten Szene.

Sie soll für dieselbe feste Wertefolge die bisherige große Vererbung mit lokal
gesetzten, nachweislich gleich berechneten Flammenhöhen/Ladeopazitäten vergleichen.
Native Style-Recalc-Events müssen zeigen, wie viel tatsächliche Style-Arbeit
ausgelöst wird; die bisherigen CSS-API-Aufrufzahlen allein können das nicht.
Ein solcher synthetischer Diagnoseaufbau wird ausdrücklich von echter aktiver
Spielzeit und unveränderten PSS-Langvergleichen getrennt. Er darf keine App-Uhr
oder automatische Wiederaufnahme ändern und muss alle Inline-Styles sowie
vorhandenen Animationsinstanzen wiederherstellen. Erst ein belegter Pfad
rechtfertigt die anschließende virtuelle Renderänderung und deren Laufzeitvergleich.

[Manifest](evidence/manifest.json), [reproduzierbare Zusammenfassung](evidence/results.json)
und drei verlustfreie Captures sichern auch beide verfehlten Druckziele. Alle
drei ZIP-Digests und ZIP-Integritäten, Point-Logs, Nach-Scope-Belege und der eine
vollständige gefilterte Detailtrace sind geprüft. Roh-Besitzerberichte und
Heap-Snapshots sind nicht enthalten. 28 Quellen-Gate-Fälle und sechs neue
Offline-Auswertungsfälle bestehen; die erweiterte gesamte Offline-Serie umfasst
70 Fälle. Diese Prüfungen beweisen weiterhin keine mobile White-Screen-Reparatur.
