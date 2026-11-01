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

Neue Ergebnisse werden nach tatsächlicher Auswertung ergänzt. Es gibt hier
keine neue Geräte-URL und bisher keinen als Verbesserung akzeptierten Spiel-Patch.

```bash
node --test verification/isolated-mini-pacing-20261101/comparison.test.mjs
node verification/isolated-mini-pacing-20261101/preflight.mjs
VERCEL_ENV=preview CRYPTOID_SOAK_CONDITION=original CRYPTOID_LIFETIME_ATTRIBUTION=1 CRYPTOID_ISOLATED_MINI_PACING=bypass node verification/systematic-stability-20261101/prepareSoakBuild.mjs
CRYPTOID_SOAK_CONDITION=original CRYPTOID_LIFETIME_ATTRIBUTION=1 CRYPTOID_ISOLATED_MINI_PACING=bypass CRYPTOID_ISOLATED_PATH_PROOF=1 CRYPTOID_ATTRIBUTION_SECONDS=60 node verification/memory-retention-attribution-20261101/profileLifetime.mjs
```
