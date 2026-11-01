# Speicherbesitzer und Freigabegrenzen – 1. November 2026

Fortsetzung direkt nach Quelle `a9d46266`. Die vorherigen Messungen bleiben in
`../systematic-stability-20261101/evidence/` unverändert. Die Originaldarstellung
in Chromium zeigte im 20-Minuten-Lauf 463,1 → 818,9 MiB Median-PSS; das ist eine
konkrete Speicherspur, kein nachgewiesenes Leck oder physischer Absturzgrund.

## Dieser nächste Vergleich

Ein frischer 60-Sekunden-Kontrolllauf prüft zunächst den kompletten neuen
Diagnoseablauf. Erst nach dessen Erfolg beginnt ein separater frischer Lauf mit
20 Minuten tatsächlich gemessener aktiver Zeit. Beide verwenden ausschließlich
die vorhandene Originaldarstellung, dieselbe geschützte Gastszene, offene
Boss-2-Reaktorszene, Testschutz und ausgeschaltete Vollaufzeichnung. Die Szenen
bleiben unseeded; unterschiedliche Zufallsarbeit ist keine gematchte A/B-Messung.

Die einzige zusätzliche virtuelle GamePage-Zeile ist ein separat geprüftes,
genau umkehrbares Modulpräfix. Es liest drei vorhandene Ressourcen-Getter aus.
Es hält keine GamePage-Instanz und besitzt keine Timer, Frames, Listener oder
Animierungsabfragen. Der bestehende Preview-Builder schaltet dieses Präfix nur
mit `CRYPTOID_LIFETIME_ATTRIBUTION=1` zu. Ohne Flag bleibt der alte Buildpfad ohne
diesen Getter. Eingefrorene Geräte-Zweige/URLs werden nicht verschoben.

Während des aktiven Intervalls werden bestehende skalare CSS-/Hull-/Canvas-/Audio-
Zähler und externer Linux-PSS pro Prozessrolle abgelesen. Es gibt dabei keinen
Heap-Profiler, erzwungene Speicherbereinigung, Heap-Snapshot, Screenshot oder
zusätzlichen nativen Animationsscan. Die Abfragen können die Messung trotzdem
beeinflussen und sind als eigener Diagnoseaufbau gekennzeichnet.

Nach der aktiven Zeit öffnet der Test den bestehenden Home-Bestätigungsdialog.
Erst bei tatsächlich `paused`, nicht-technischer Pause und pausierter Stoppuhr
beginnen schwere Aufnahmen:

1. Heap-/DOM-/CSS-/Prozesszähler sofort nach der Pause und nach fünf Sekunden.
2. Dieselben Zähler nach einer ausdrücklich nur hier erlaubten GC-Anforderung.
3. Heap-Snapshot mit Größen-/Klassensummen; der Snapshot selbst bekommt einen
   gesonderten Nachmesspunkt, weil er den Prozessspeicher beeinflusst.
4. Bestätigter Home-Ausstieg, Entfernung des bestehenden QA-Controller-Inspektors,
   erneute Messpunkte vor/nach Ruhezeit und GC sowie zweiter Heap-Snapshot.
5. Absichtliche Navigation auf `about:blank` als vollständige Dokumentfreigabe;
   Messung vor/nach GC. Das ist eine Diagnosegrenze, keine Spiel-Reparatur.

Die schwere Erfassung ist durch eigene Regressionen gesperrt, solange ein Spiel
aktiv, ladend, verborgen oder technisch unterbrochen ist. Alte Spielquellen,
Spieluhren, Input, Ton, Kauf-/Speicher-/Rewardregeln bleiben unverändert.

## Was daraus eine Behebung rechtfertigen würde

| Nachweis | Nächster technischer Schritt |
| --- | --- |
| Wachsende noch aktive CSS-Registrierungen oder DOM-/Listenerbestände, die nach Home bleiben | Konkreten Retainer-/Freigabepfad verfolgen und exakt dafür einen Gegenbeispiel-Test erstellen |
| Größerer JavaScript-Heap nach inaktiver GC bei vergleichbaren Zuständen | Tatsächlich gehaltene Klassen und Referenzen zwischen Snapshot-Zuständen prüfen; kumulierte Arbeitszähler sind kein Lecknachweis |
| Kleiner Heap, aber wachsender Renderer-/GPU-/Browser-PSS | Native Bild-/Canvas-/Renderressourcen weiter zuordnen; die Differenz wird nicht einfach als GPU-Speicher bezeichnet |
| Rückgang erst beim vollständigen Dokumentwechsel | Besitz innerhalb des Dokuments und dessen Freigabepfade priorisieren; kein automatischer Reload als angebliche Reparatur |
| Speicher bleibt auch danach hoch | Prozess-/Browser-Caches oder Profilerfolgen getrennt untersuchen; nicht ungeprüft dem Spielkern zuordnen |

Ein Runtime-Patch folgt erst auf einen reproduzierten, konkreten Defekt. Danach
müssen Gegenbeispiel, Korrektur, unverändertes Spielverhalten und derselbe
Belastungsfall geprüft werden. Bis dahin wird keine Smartphone-Reparatur behauptet
und kein weiterer Besitzer-Langzeittest benötigt.

## Bisherige technische Vorprüfung dieser Fortsetzung

Vier neue Inspektions-/Profiling-Gate-Tests und vierzehn wiederverwendete Preview-/
Heap-Tests bestehen lokal. Die komplette virtuelle TypeScript-GamePage besteht
die Projekt-Typprüfung. Default- und Inspektions-Build werden separat geprüft:
kein neuer Getter im Default, genau ein entsprechendes Modul im Diagnosebuild.
Die originalen Frontend-/Backend-/API-/Asset-/Private-Preview-Quellbäume bleiben
gepinnt; automatische Vercel-Auslieferung bleibt deaktiviert.

Aktuelle native Ergebnisse werden nach Abschluss ergänzt. Ein gestarteter Job
ist keine bestandene Speicher- oder Stabilitätsprüfung. Die vorherige rote
WebKit-Original-Vorprüfung bleibt separat offen; sie wird hier nicht als Ursache
des mobilen White Screens umgedeutet.

```bash
node --test verification/memory-retention-attribution-20261101/inspection.test.mjs
node verification/memory-retention-attribution-20261101/preflight.mjs
VERCEL_ENV=preview CRYPTOID_SOAK_CONDITION=original CRYPTOID_LIFETIME_ATTRIBUTION=1 node verification/systematic-stability-20261101/prepareSoakBuild.mjs
CRYPTOID_ATTRIBUTION_SECONDS=60 node --experimental-strip-types verification/memory-retention-attribution-20261101/profileLifetime.mjs
```
