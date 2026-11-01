# Isolierter Mini-Start-Pacing-Vergleich – 1. November 2026

Fortsetzung von `a193945e`: Die vorherige Originalmessung zeigte 464,0 → 908,8 MiB
Median-PSS und nach inaktiver GC einen Rückgang von 911,5 auf 427,9 MiB. Der
bereinigte JS-/DOM-Bestand blieb nahe am Kurzlauf. Das ist eine konkrete Spur,
kein bewiesener mobiler Absturzgrund. Die vorherigen Belege bleiben unverändert.

Hier wird ausschließlich das bereits vorhandene Paar reversibler Guards aus
`../boss2-mini-start-control-20261101/miniStartControl.mjs` verglichen, erstmals
bei ansonsten **vollständiger Originalszene**. Die früheren Flat-, Filter-,
Canvas-, Masken-, Hotspot- und Completion-Kontrollen bleiben ausgeschaltet.

`control` lässt das komplette ursprüngliche CSS-Pacing-Modul bytegleich.
`bypass` überspringt für Boss-Mini-Treffer und ihre Spark-Nachkommen die optionale
Start-Discovery/Registrierung samt Timing-Schreibzugriffen, Listenern und zusätzlicher
60-Hz-Fortschrittsquantisierung. Diese Aspekte ändern sich gemeinsam; das ist
kein reiner Vergleich eines einzelnen nativen API-Aufrufs. Die ursprünglichen
CSS-Animationen, Markup, Abschlussprüfung und übriges Pacing bleiben erhalten.
Spieluhr, Simulation, Input, Ton, Speicher-/Kaufregeln und Fortschritt werden
nicht verändert. Alle Game-Dateien bleiben gepinnt, Auslieferung deaktiviert.

## Gates vor längeren Messungen

1. Vier neue Regressionen prüfen exakte Reversibilität, verbotene Fremdflags,
   notwendige positive/negative Nachweise und die tatsächlich installierten
   QA-Wrapper einschließlich korrektem Entfernen von Listenern. Bestehende
   Pacing-/Inspektions-/Auswertungsprüfungen bleiben erhalten (zusammen 15 Fälle).
2. Beide virtuellen vollständigen TypeScript-Varianten müssen bestehen.
3. Zwei frische 60-Sekunden-Chromium-Läufe prüfen die echten Mini-Start-Abfragen
   und Timing-Schreibzugriffe: im Original positiv, mit Guard null; sichtbare
   native Start-/End-Ereignisse und andere Timing-Pfade müssen positiv bleiben.
   Nur diese Kurzläufe installieren native API-Zähler. Sie verändern keine
   Aufrufargumente/-ergebnisse, setzen keine Uhren und fragen keine zusätzlichen
   Animationslisten ab. Ihre Heap-/PSS-Werte sind kein unveränderter Kontrollwert
   für die nachfolgenden Läufe ohne diese Wrapper.
4. Erst wenn beide Kurzläufe bestehen, beginnen vier unabhängige 20-Minuten-
   Messungen: zwei Wiederholungen pro Bedingung auf frischen Browserprozessen.
   Diese verwenden den vorhandenen Lebensdauer-Profiler ohne aktive API-Wrapper,
   Heap-Profiler, GC, Snapshot oder nativen Animationsscan. Die vorhandenen
   skalaren Besitzerzähler werden weiter abgelesen. Schwere Aufnahmen folgen
   ausschließlich nach bestätigter Pause beziehungsweise regulärem Home-Ausstieg.

Die Szenen sind unseeded. Quellen, Engine, tatsächlich installierte Bibliotheken,
gemessene aktive Zeit, Volleys und alle Freigabegrenzen müssen gemeinsam geprüft
werden. Zwei Wiederholungen liefern noch keine Smartphone-Freigabe oder belastbare
allgemeine Effektgröße. Ein grüner Erfassungslauf bedeutet keinen reparierten
White Screen. Die offene WebKit-Original-Startlücke bleibt ein gesonderter Befund.

## Bestätigte Kurzkontrollen

Gemessene Quelle `668d4115716bdb425947c4847e70113e8c497990`, Baum
`cb0bed431f842cad4067e23ebb3e2036c243b04c`,
[CI 41343318455](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41343318455).
Die Quellen-Gates und beide kurzen nativen Kontrollen sind erfolgreich. Die vier
längeren Messungen sind bis zu ihrer tatsächlichen Auswertung ausdrücklich offen.

| tatsächlich gezählter nativer Pfad | Original | Guard |
| --- | ---: | ---: |
| gemessene aktive Stoppuhrzeit | 60.000,1 ms | 61.000,0 ms |
| Mini-Start-Ereignisse | 1.022 | 1.022 |
| Mini-Zielabfragen während Start-Discovery | 1.022 | 0 |
| Timing-Schreibzugriffe bei aktuell zugeordnetem Mini-Ziel | 1.230 | 0 |
| verbleibende Mini-Abfragen außerhalb der Start-Discovery | 208 | 210 |
| native Mini-End-Ereignisse | 208 | 210 |

Damit ist der vorgesehene Startpfad im Original beobachtet und beim Guard
ausgeschlossen; die ursprüngliche Abschlussabfrage wird weiterhin tatsächlich
beobachtet. Der Zähler `otherTimingUpdates` bleibt in beiden Fällen positiv.
Er klassifiziert das Ziel beim Aufruf. Bei bereits entfernten Elementen kann die
frühere Mini-Zuordnung fehlen; er ist deshalb kein sauberer Mengenvergleich aller
anderen Animationen und kein Beweis identischer Arbeit außerhalb der Minis.
Die Quellenprüfung und die vorhandenen Nicht-Mini-Regressionen sichern den engen
Codeeingriff. Ungleiche End-Ereigniszahlen werden nicht in gleiche Renderarbeit
umgedeutet.

Beide Kurzläufe erreichen Pause, regulären Home-Ausstieg und leeres neues
Dokument. Die komprimierten Original-JSON bleiben verlustfrei gesichert. Beide
ZIP-Digests/Integritäten und alle vier Kurzlauf-Snapshots wurden geprüft und ihre
Größen-/Klassensummen erneut aus den Originalgraphen berechnet. Fünf weitere
Offline-Regressionen verhindern Quellen-/Bedingungsmischung, fehlende positive
Signale, als Langlauf umetikettierte Kurzdaten, API-Zähler im Langlauf und
unvollständige beziehungsweise doppelte Wiederholungen.

Der normale Buildpfad ohne neues Flag wurde zusätzlich gebaut: weder neuer
Vergleich noch Inspektionsbrücke sind darin enthalten. Die 14 bestehenden
Preview-/Heap-Prüfungen bestehen ebenso wie die 15 Quellen-/Inspektionsfälle
und die fünf neuen Offline-Annahmefälle (34 Fälle lokal, davon 15 auch in der CI).
Spielquellen-Pins sind unverändert. Neue Langlaufergebnisse werden nach Prüfung
ergänzt. Es gibt hier keine neue Geräte-URL und bisher keinen als Verbesserung
akzeptierten Spiel-Patch.

```bash
node --test verification/isolated-mini-pacing-20261101/comparison.test.mjs
node verification/isolated-mini-pacing-20261101/preflight.mjs
node --test verification/isolated-mini-pacing-20261101/evidence/summary.test.mjs
node verification/isolated-mini-pacing-20261101/evidence/verifyEvidence.mjs
VERCEL_ENV=preview CRYPTOID_SOAK_CONDITION=original CRYPTOID_LIFETIME_ATTRIBUTION=1 CRYPTOID_ISOLATED_MINI_PACING=bypass node verification/systematic-stability-20261101/prepareSoakBuild.mjs
CRYPTOID_SOAK_CONDITION=original CRYPTOID_LIFETIME_ATTRIBUTION=1 CRYPTOID_ISOLATED_MINI_PACING=bypass CRYPTOID_ISOLATED_PATH_PROOF=1 CRYPTOID_ATTRIBUTION_SECONDS=60 node verification/memory-retention-attribution-20261101/profileLifetime.mjs
```
