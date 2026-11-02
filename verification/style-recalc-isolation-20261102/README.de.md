# Native Style-Arbeit bei gleicher Darstellung – 2. November 2026

Fortsetzung von `8df4879e`. Die ganze Detailserie einschließlich beider
verfehlter Druckziele bleibt erhalten; ihre unabhängige Offline-CI
[41418106940](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41418106940)
besteht alle 70 Fälle. Es wird kein weiterer gleicher Langlauf angehängt.
Die neue Frage ist enger: Wie viele tatsächliche native Element-Style-
Berechnungen lösen die beiden häufig wechselnden Custom Properties aus?

## Reversibler synthetischer Vergleich

Die bestehende vollständige Original-Gastszene startet regulär. Nach geöffnetem
Boss-2-Reaktor und mindestens einer Salve öffnet ein echter UI-Tap den bestehenden
Home-Dialog. Erst nach bestätigter manueller Pause und eingefrorener Stoppuhr
beginnen die Messungen. Keine Spiel-/Animationsuhr wird verändert; keine
automatische Wiederaufnahme, kein neuer App-Timer/RAF und keine GC gehören dazu.

Alle Bedingungen bearbeiten denselben bestehenden DOM-/Animationszustand mit
derselben festen Folge aus 16 Werte-Paaren. Es werden ausschließlich die beiden
Deklarationen beziehungsweise ihre bereits vorhandenen Verbraucher verändert:

| Bedingung | Schub | Ladung |
| --- | --- | --- |
| `root` | Vorhandene Variable am Boss-Container | Vorhandene Variable am Waffen-SVG |
| `charge-opacity` | Unveränderte große Vererbung | Direkte Opazität an den bestehenden Pfaden |
| `thrust-height` | Direkte Höhe an den vorhandenen Flammen | Unveränderte SVG-Vererbung |
| `both-local` | Direkte Flammenhöhe | Direkte Pfadopazität |

Die direkte Höhe ist eine eigene Diagnosebedingung und wird nicht mit der
früheren lokalen Schub-Custom-Property-Variante gleichgesetzt. Dies sind noch
keine geänderten React-Komponenten und kein übernommener Runtime-Patch.

Die Ausgangs-CSS-Verbraucher werden exakt geprüft: eine Verwendung der
Schubvariable für die Höhe, zwei Ladeverwendungen für Opazität sowie die
bestehende Sonderregel, die beim Feuern Mündungspfade auf Opazität 1 setzt.
Diese Sonderregel wird in der lokalen Formel ausdrücklich erhalten. Zusätzlich
werden zehn native Vergleichszustände geprüft: Feuern aus/ein und fünf Ladewerte.
Gemessene Schritte behalten dagegen die unveränderte ursprüngliche Feuern-Klasse.

Nach jedem Schritt werden echte berechnete Höhen/Opazitäten gelesen. Alle vier
Bedingungen müssen für dieselbe Wertefolge exakt dieselben Browserwerte liefern.
Danach werden sämtliche ursprünglichen Inline-Attribute und die ursprüngliche
Feuern-Klasse exakt wiederhergestellt. Die vorherigen berechneten Werte sowie
identische native Animationsobjekte, Startzeiten und Raten sind Pflicht. Auch
Fehlerpfade führen die Wiederherstellung aus. Anschließend folgt der normale
bestätigte Home-Ausstieg. Nach-Scope und begrenzte Artefaktsicherung laufen auch
bei einem fehlgeschlagenen Diagnoseziel.

## Was nativ gemessen wird

Der [Chromium-151-Document-Code](https://github.com/chromium/chromium/blob/151.0.7922.34/third_party/blink/renderer/core/dom/document.cc)
setzt bei `UpdateLayoutTree` einen `elementCount` aus der Style-Arbeit. Der
Collector speichert vollständige native Spans und eigene begrenzte Timing-Marker.
Nur Spans innerhalb des jeweiligen Schrittintervalls, im richtigen Renderer und
im bestätigten Dokumentframe zählen. Fehlende Zähler, Marker, vollständige Spans,
Datenverlust oder überschrittene Grenzen bleiben Fehler statt geschätzter null.

512 relevante Events, 2 MiB gefilterte Rohdaten und 4 MiB Trace-Puffer sind feste
Grenzen. Es gibt keine Heap-/Speicherdumps, Screenshots oder aktiven API-Wrapper.
Alle Messungen sind **instrumentierte synthetische Style-Arbeit während Pause**.
Wiederholte Berechnungen desselben Elements zählen als Arbeit; die Summe ist
keine Anzahl unterschiedlicher DOM-Knoten. Native Dauern werden mitgespeichert,
aber nicht als FPS-/CPU-/Temperatur-/Speichervorteil im laufenden Spiel ausgegeben.

Zwei frische Linux-Chromium-Läufe verwenden dieselbe Quelle, zuerst in normaler,
dann in umgekehrter Bedingungsreihenfolge. Innerhalb jedes Laufs bleibt der
pausierte Zustand für alle Bedingungen gleich. Der zweite Lauf beginnt erst,
wenn der vollständige erste Vergleich besteht. Diese Prüfung ersetzt weder
einen tatsächlichen Runtime-Speichervergleich noch physische iOS-/Android-/
Pi-Browser-Abnahme. Spielquellen und eingefrorene Geräte-Referenzen bleiben
unverändert; es wird keine neue Spielversion veröffentlicht.

```bash
node --test verification/style-recalc-isolation-20261102/probe.test.mjs
node verification/boss2-mini-start-control-20261101/verifyScope.mjs
```

Tatsächliche Browserergebnisse werden erst nach den beendeten Läufen ergänzt.

## Erster Browser-Gate-Fehler, unverändert erhalten

Quelle `5806d22ef61e37bd0c535d3c4b33bd5a5afc937e`,
[CI 41420951968](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41420951968):
17 Quellen-Gate-Fälle bestehen. Der erste native Lauf scheitert in der
unverändert strikten Prüfung der originalen Inline-Attribute. Die unabhängige
Wiederholung wird deshalb übersprungen. Das ist ein Fehler im neuen Prüfablauf,
kein reproduzierter White Screen und kein erfolgreicher Style-Vergleich.

Die vollständige fehlgeschlagene Beobachtung, ihr partieller Root-Timeline-Trace,
erfolgreicher Nach-Scope-Beleg und gegen GitHub geprüfter ZIP-Digest bleiben unter
`evidence/initial-*` erhalten. Der reale Trace validiert separat das native Format
mit echten vollständigen `UpdateLayoutTree`-Spans/Markerintervallen. Seine 16
Root-Schritte ergeben jeweils 95 berichtete Element-Style-Berechnungen. Diese
partiellen Daten werden nicht als abgeschlossener Vergleich gewertet.

Die nächste Quellenänderung ergänzt zunächst begrenzte Roh-/kanonische
Vor-/Nachwerte der abweichenden Inline-Attribute in der Fehlermeldung. Die
Wiederherstellungsanforderung wird nicht gelockert. Spielquellen bleiben gleich.

Der Diagnoseabruf `15ef6827`, [CI 41422549736](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41422549736),
grenzt die Abweichung auf drei SVG-Pfade ein: ursprünglich `style` nicht vorhanden,
nach dem nativen Read `style=""`, kanonische CSS-Texte jeweils leer. Alle anderen
Attribute erfüllen die exakte Prüfung. Auch dieser Lauf bleibt fehlgeschlagen;
die Wiederholung wird übersprungen. Die Korrektur ordnet die exakte erneute
Raw-Attribut-Wiederherstellung **hinter** die letzten berechneten Style-/Animations-
Reads. Die unveränderte strenge Prüfung der originalen Attribute folgt danach.
Eine neue Regression bildet die beobachtete Materialisierung leerer SVG-Styles ab.
