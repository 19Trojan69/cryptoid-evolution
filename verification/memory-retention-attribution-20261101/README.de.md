# Speicherbesitzer und Freigabegrenzen – 1. November 2026

Fortsetzung direkt nach Quelle `a9d46266`. Die vorherigen Messungen bleiben in
`../systematic-stability-20261101/evidence/` unverändert. Die Originaldarstellung
in Chromium zeigte im 20-Minuten-Lauf 463,1 → 818,9 MiB Median-PSS; das ist eine
konkrete Speicherspur, kein nachgewiesenes Leck oder physischer Absturzgrund.

**Neue Eingrenzung:** Ein weiterer kompletter Original-Lauf reproduziert den
Anstieg mit 464,0 → 908,8 MiB Median-PSS. Nach angeforderter GC in der Pause
fallen 911,5 auf 427,9 MiB; der bereinigte JavaScript-Heap unterscheidet sich
gegenüber dem Kurzlauf nur um 168.056 Byte. Ein konkretes dauerhaftes
JavaScript-/Spielbesitz-Leck oder der mobile Absturzgrund sind damit weiterhin
nicht bewiesen. Der Befund priorisiert kurzlebige Browserbestände und deren
Erzeugungskosten; es gibt hier noch keinen Runtime-Patch.

## Ausgeführter Vergleich

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

## Bestätigter Kurzlauf und abgeschlossener Langlauf

Quelle `9cfe6ae1df777524d84c1a7301694490a4ed3a13`, Baum
`44fe46c19cfd3d13838866457ea9cbadf6c153f7`,
[CI 41339737350](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41339737350).
Die CI ist vollständig erfolgreich abgeschlossen. Der Kurzlauf bestand
60.000 ms aktive Zeit und 20 zusätzliche Boss-Kernsalven. Der danach gestartete
frische Langlauf bestand **1.200.992,3 ms aktive Stoppuhrzeit**, 1.202.215 ms
beobachtete Wandzeit und 428 zusätzliche Kernsalven. Beide bestanden alle zehn
Freigabe-Messpunkte und beide Heap-Snapshots. Keine aktive Zwangs-GC und kein
aktiver Heap-Profiler wurden eingesetzt.

Die tatsächlich installierten CI-Pakete sind diesmal direkt erfasst:
React/ReactDOM 19.2.4, React Router DOM 7.13.2, Vite 7.3.1, TypeScript 5.9.3.
Das entspricht den zuvor gelesenen Lock-Einträgen; das ist kein allgemeiner
Nachweis identischer kompletter Installationen zwischen allen Versuchen.

| Zustand im Kurzlauf | Linux-Prozess-PSS | belegter JS-Heap | CSS aktiv / Bild-Pins | Canvas-Effektcache |
| --- | ---: | ---: | ---: | ---: |
| Pause vor GC, nach fünf Sekunden Ruhe | 432,7 MiB | 13.780.616 B | 10 / 15 | 740.932 B |
| Pause nach GC | 371,4 MiB | 10.503.472 B | 10 / 15 | 740.932 B |
| Home nach GC | 355,9 MiB | 9.892.436 B | 0 / 0 | 0 B |
| neues leeres Dokument nach GC | 291,3 MiB | 1.096.496 B | nicht mehr geladen | nicht mehr geladen |

| Vergleich derselben Messgrenze | 60-Sekunden-Lauf | 20-Minuten-Lauf |
| --- | ---: | ---: |
| Pause nach fünf Sekunden Ruhe, vor angeforderter GC: Prozess-PSS | 432,7 MiB | 911,5 MiB |
| Pause nach GC: Prozess-PSS | 371,4 MiB | 427,9 MiB |
| Pause nach GC: belegter JavaScript-Heap | 10.503.472 B | 10.671.528 B |
| Home nach GC: belegter JavaScript-Heap | 9.892.436 B | 9.926.252 B |
| Home nach GC: DOM-Knoten / JS-Listener laut CDP | 247 / 210 | 247 / 210 |
| Home nach GC: aktive CSS-Registrierungen / Bild-Pins | 0 / 0 | 0 / 0 |
| Home nach GC: Effektcache / Effektoberfläche | 0 / 0 B | 0 / 0 B |
| Home nach GC: Prozess-PSS | 355,9 MiB | 409,1 MiB |
| Leeres neues Dokument nach GC: Prozess-PSS | 291,3 MiB | 313,6 MiB |

Die beiden Läufe sind unabhängig und unseeded; unterschiedliche zufällige
Momentzustände bleiben möglich. „Vor GC“ meint vor unserer expliziten Anforderung,
nicht die Abwesenheit der normalen Browser-Speicherbereinigung. Profiler und
Snapshots können die Messwerte nach der aktiven Strecke beeinflussen.

Im Langlauf entfallen zwischen erster und letzter aktiver Stichprobe rund
535,3 MiB PSS-Zunahme auf die Renderer-Prozessrolle, 9,3 MiB auf die GPU-
Prozessrolle und 4,9 MiB auf andere Browserprozesse. Das sind Prozessrollen,
keine Zuordnung zu einem bestimmten nativen Allokator oder physischem GPU-RAM.
Der Unterschied zwischen 60 Sekunden und 20 Minuten nach Home-GC beträgt im
belegten JavaScript-Heap nur **33.816 Byte**. Der höhere verbleibende Prozess-PSS
wird dadurch ausdrücklich nicht erklärt oder als beseitigt dargestellt.

Das ist ein beobachteter Unterschied nach einer **Diagnosemaßnahme**, keine
implementierte Verbesserung. Eine GC-Anforderung kann neben JavaScript weitere
verbundene Browserbestände beeinflussen. Die PSS-Differenz wird deshalb weder
vollständig JavaScript noch GPU zugeschrieben. Ein automatischer Reload und
regelmäßige Zwangsbereinigungen werden daraus nicht als Reparatur abgeleitet.

Nach Home sind null Spiel-Canvas im Dokument, null native Dokumentanimationen,
null CSS-Registrierungen, null Bild-Pins und null Canvas-Effektcache bestätigt.
Das gilt für beide Laufzeiten. Der nach GC verbleibende Heap enthält keine native `CSSAnimation`, keinen
nativen `KeyframeEffect` und keinen nativen `AudioBuffer`. Die insgesamt sieben
verbleibenden Offscreen-Canvas sind jeweils 192 × 192 Pixel. Das passt zum
explizit auf sieben Schlüssel begrenzten Steintexturcache in `BonusRockLayer`
(1.032.192 rechnerische Pixelbytes); der bloße Detached-Canvas-Zähler wäre hier
kein Lecknachweis. Browser-Backing-/Layerkosten sind damit nicht gemessen.

## Zusätzliche Quellenprüfung der Ressourcenbesitzer

Neben den bereits verglichenen acht Kernmodulen wurden die weiteren Canvas-/
Bildbesitzer geprüft:

| Pfad | nachgewiesene Quellregel | verbleibende Grenze des Nachweises |
| --- | --- | --- |
| `bossWeaponRenderer` / `BossWeaponsView` | Quelllayer und Heizkacheln werden bei Freigabe auf null dimensioniert; höchstens eine Heizstufe pro Kanone | native Freigabelatenz nicht aus Quelltext ableitbar |
| `bossWeaponTextures` | zwei fertige Cacheeinträge; laufende Anforderungen teilen denselben Promise | kein gemessener kompletter Browser-Bildcache |
| `bossArtwork` / `shipArtwork` | acht bzw. zwanzig Ergebnis-Canvas; temporäre Quellflächen werden im `finally` freigegeben | Menü-/Sammlungsnutzung ist nicht derselbe Boss-Langlauf |
| `BonusRockLayer` | genau sieben 192-px-Texturen; Spieloberfläche und Vorbereitungstimer werden beim Unmount freigegeben | gemeinsamer Modulcache bleibt absichtlich warm |
| `bossCombat` | Maskenschlüssel ist eine der fünfzig Boss-IDs; je Maske 128 × 48 Bits | kein unbeschränktes Zeit-/Trefferprotokoll |

Vorhandene Aufräumroutinen allein gelten weiterhin nicht als Laufzeitbeweis.
Es wurde hier kein zusätzlicher konkreter Freigabefehler nachgewiesen. Im
gemessenen Pfad bleiben die bereinigten Bestände auch nach 20 Minuten in
derselben Größenordnung und erreichen dieselben beobachteten Freigabegrenzen.

Die Versionsprüfung wurde um acht weitere Ressourcenmodule erweitert; zusammen
mit der vorigen Untersuchung sind damit **sechzehn Module** in den sieben
ausgewählten Quellen bytegleich, darunter auch `paintedShip`, Boss-Waffentexturen,
Boss-Waffenrenderer, Artwork-Erzeuger und natives Easing. Die späteren Quellen
`67dabc71`, `d72db0a8`, `2dc37bdb` und die Analysequelle haben zudem denselben
gesamten Frontend-Quellbaum. Das frühere längere Protokoll `0868671b` und Main
haben andere Frontend-Bäume: unter anderem Eingabe-/Pausendiagnostik, Bedienung,
HUD-/Waffenhinweise und ältere Balance-/Speicherstandsänderungen unterscheiden
sich. Deshalb wird weder der gesamte frühere Code als identisch noch eine
bestimmte spätere Änderung als Absturzursache dargestellt.

Die buildseitigen Szenen-/CSS-/Canvas-Kontrollen verändern den tatsächlich
ausgeführten Code trotz identischer Frontend-Dateien. Die bestehende Mini-Start-
Variante enthält mehrere vorherige Vergleichsänderungen; ihr niedrigerer PSS
belegt daher **nicht** isoliert die Wirkung der zwei Mini-Start-Guards. Ein
gezielter Folgevergleich muss eine einzelne Änderung am sonst gleichen
Aufbau prüfen. Alle Blob-/Unterbaum-IDs stehen in
`evidence/extended-version-comparison.json`.

Beide vollständigen synthetischen Ergebnis-JSON sind komprimiert mit Digest
dauerhaft unter `evidence/` gesichert. ZIP-Digests/Integrität, alle vier Snapshot-Digests, entpackte Größen und
neu berechnete Heap-Klassen-/Größensummen stimmen. Fünf zusätzliche Offline-
Regressionen verhindern, dass falsche Quellen, kurze/abgebrochene Aufnahmen,
aktive Profiler, fehlende Messpunkte oder unvollständige PSS-Prozesssummen als
erfolgreicher Vergleich veröffentlicht werden. Ein verbliebener Home-Besitz
wird ausdrücklich als solcher ausgegeben und nicht durch einen grünen
Erfassungsstatus verdeckt.

## Priorisierte Behebungstaktik aus diesen Ergebnissen

**Nachgewiesen:** erneute starke PSS-Zunahme im Originalaufbau; der größte
beobachtete Zuwachs liegt in der Renderer-Prozessrolle. Nach einer inaktiven GC
werden große Bestände freigegeben. Gleichzeitig bleiben nach 20 Minuten die
bereinigten JS-/DOM-/Listener-/Besitzerbestände nahe am Kurzlauf. Die CSS-
Registrierung zählt kumuliert 23.305 Konfigurationen in aktiven Stichproben,
aber höchstens 24 gleichzeitig aktive Registrierungen. Das ist erhebliche
wiederholte Arbeit, kein Bestand von 23.305 gehaltenen Animationen.

**Arbeitshypothese:** kurzlebige Animations-/DOM-/Renderbestände und ihre
Bereinigung tragen zur Speicherbelastung bei. Welcher konkrete API-/Ressourcenpfad
diese Last erzeugt und ob sie den Smartphone-White-Screen verursacht, bleibt
offen. Die GC-PSS-Differenz allein beweist weder einen bestimmten Allokator noch
eine bestimmte CSS-Funktion als Ursache.

1. Als nächsten gezielten Vergleich die **vorhandenen zwei Mini-Start-Pacing-
   Guards einzeln auf die sonst vollständige Originalszene anwenden**. Alle
   früheren Flat-/Filter-/Canvas-/Masken-Kontrollen dabei ausgeschaltet lassen.
   Der bisherige reduzierte Kandidat ist dafür keine isolierte Kontrolle.
2. Kontroll- und Vergleichsaufbau zuerst kurz auf tatsächlich betroffenen
   Native-Startpfad und unveränderten übrigen Ablauf prüfen. Dann auf frischen
   Browserprozessen wiederholt dieselbe aktive Strecke und dieselben inaktiven
   Freigabegrenzen erfassen. Volleys, Stichproben und Zufallsarbeit mit auswerten;
   einzelne unseeded PSS-Endpunkte ergeben keine kausale Effektgröße.
3. Wenn dieser eine Pfad einen wiederholbaren Unterschied zeigt, dessen
   Erzeugungs-/Freigabeablauf weiter eingrenzen und den kleinsten Gegenbeispiel-
   Test plus Korrektur ableiten. Bleibt der Unterschied aus, Renderer-Allokatoren
   nach derselben Laufzeit nur an den inaktiven Grenzen zuordnen. Die früheren
   90-Sekunden-Allokatoraufnahmen werden dafür als Grundlage erhalten.
4. Erst eine solche geprüfte Änderung mit gesicherten Funktionen und tatsächlicher
   Ressourcenverbesserung rechtfertigt einen erneuten gezielten Gerätevergleich.
   Die offene WebKit-Original-Startlücke bleibt ein eigener Prüfpunkt.

**Bestätigte Verbesserung:** zuverlässigere automatische Eingrenzung und
reproduzierbare Nachprüfung der Belege. Eine Verbesserung des ausgelieferten
Spiels oder bestätigte iOS-/Android-/Pi-Browser-Stabilität wird nicht behauptet.

Zum Abschluss bestehen lokal **23 gezielte Tests** (vier neue Inspektions-Gates,
fünf neue Offline-Annahmefälle, vierzehn bestehende Preview-/Heap-Prüfungen), die
Digest-/Ergebnis-Reproduktion beider Aufnahmen und die unveränderten Spielquellen-
Pins. Die CI besteht beide Browserläufe, die virtuellen Typprüfungen und Builds.
Die gesamte Anwendung bleibt unverändert; die 539 Frontend-Release-Tests aus der
vorherigen Phase bleiben als eigener bereits bestandener Prüflauf dokumentiert.

Die vorherige rote WebKit-Original-Vorprüfung bleibt separat offen; sie wird
hier nicht als Ursache des mobilen White Screens umgedeutet.

```bash
node --test verification/memory-retention-attribution-20261101/inspection.test.mjs
node verification/memory-retention-attribution-20261101/preflight.mjs
VERCEL_ENV=preview CRYPTOID_SOAK_CONDITION=original CRYPTOID_LIFETIME_ATTRIBUTION=1 node verification/systematic-stability-20261101/prepareSoakBuild.mjs
CRYPTOID_ATTRIBUTION_SECONDS=60 node --experimental-strip-types verification/memory-retention-attribution-20261101/profileLifetime.mjs
node --test verification/memory-retention-attribution-20261101/evidence/attributionSummary.test.mjs
node verification/memory-retention-attribution-20261101/evidence/verifyEvidence.mjs
```
