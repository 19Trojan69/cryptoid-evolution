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
