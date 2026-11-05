# Referenzbesitzer aus vorhandenen Speicheraufnahmen

Offline-Fortsetzung vom 05.11.2026. **Kein neuer Browserlauf, kein Runtime-Patch,
kein White-Screen-Fix.** Die Simulatorserie bleibt beendet. Die ausgelieferte
Vorschau bleibt `b092f646`.

Die drei vorhandenen synthetischen Actions-Archive liefern sechs Heap-Snapshots:
je Pause und Home nach ausdrücklich angeforderter inaktiver GC. Zwei stammen
aus derselben Originalquelle nach 60 bzw. 1.200 aktiven Sekunden; ein weiterer
aus dem späteren 1.200-Sekunden-Kontrollarm mit direkter Boss-Style-Verteilung.
Die zwei Laufzeiten sind unabhängige unseeded Prozesse, keine gematchten Zustände.
Quelle, Zeit, ZIP-Digest und alle komprimierten/rohen Snapshotgrößen, Digests,
Knotenzahlen und Self-Byte-Summen sind gegen ihre ursprünglichen Quittungen geprüft.

## Methode

Der veröffentlichte, **unveränderte** Google-`HeapSnapshotManager` aus
`chrome-devtools-mcp@1.12.0` berechnet Dominatoren, Retained Sizes und Referenzen.
Der genaue Paketdigest und DevTools-Commit stehen im Manifest. Es wird nur seine
Offline-Auswertung importiert; kein MCP-Server, Browser oder Login wird gestartet.
`analyze.mjs` implementiert keinen eigenen GC-/Kanten-/Dominatoralgorithmus.
Die Methode entspricht der [Chrome-Dokumentation zu Heap-Snapshots](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots)
und [Speicherbesitzern](https://developer.chrome.com/docs/devtools/memory-problems/get-started).

Alle Klassenaggregate und die 100 größten Einzelknoten werden gespeichert.
Die benannten Ressourcengruppen filtern explizit nach nativen bzw. Objektknoten:
Quelltextstrings, Funktionsnamen und Prototypen sind keine zusätzlichen Canvas,
AudioBuffer oder Animationen. Angezeigte Referenzbäume sind auf Tiefe 14,
120 Knoten und acht Geschwister begrenzt; die originalen Trunkierungsmarker
bleiben erhalten. Die Dominatorberechnung verwendet den vollständigen Graphen.
Die Standardparser-Warnung zu 76 ausschließlich schwach gehaltenen Knoten pro
Aufnahme bleibt in `evidence/analysis.log`, ohne Umwertung zum Spielfehler.

## Ergebnis und Grenzen

| Originalaufnahme | Snapshot-Bytes Pause / Home nach GC | Matched-Style-Cache: zugeordnete Snapshotbytes nach Home |
|---|---:|---:|
| Original, 60 aktive Sekunden | 19.102.536 / 17.288.242 | 416.296 |
| Original, 1.200 aktive Sekunden | 19.411.437 / 17.415.860 | 349.704 |
| spätere Kontrolle, 1.200 aktive Sekunden | 19.407.394 / 17.423.970 | 368.528 |

Die Snapshot-Gesamtwerte umfassen V8 und die dort exponierten nativen Objekte;
sie sind **weder JS-usedHeap noch Prozess-RAM/PSS, GPU- oder Pixelspeicher**.
Verschachtelte Retained Sizes werden nicht addiert. Auch die Canvas-Metadaten
erfassen nicht die vollständigen Pixel-/Renderkosten.

Neu konkret zugeordnet:

- Die sieben 192×192-Canvas nach Home haben denselben Modul-Map als Dominator.
  Das passt zum auf sieben Schlüssel begrenzten `BonusRockLayer.textures`.
  Es sind offscreen genutzte Flächen, keine stehengebliebene Spielfeldszene.
- Die neun Bildknoten nach Home führen über Promise-/Map-Besitzer. Acht gehören
  zum begrenzten Quellbildbestand, einer zum Boss-Waffentexturpfad. Verschiedene
  Schiff-IDs der unseeded Läufe werden nicht als wachsende Anzahl ausgegeben.
- Der große verbleibende Matched-Style-Cache führt über StyleResolver/StyleEngine
  zum Dokument. Er ist nach GC in diesen Aufnahmen kleiner als 0,4 MiB an
  exponierten Snapshotbytes; dies beziffert nicht seinen früheren aktiven Bestand.
- Nach Home jeweils null AudioBuffer, null CSSAnimation und null KeyframeEffect;
  ein AudioContext bleibt vorhanden. Eine native Geräteursache folgt daraus nicht.
- Die jeweils 150 LayoutShift-Einträge und ihre Rechtecke hängen am nativen
  Performance-Besitzer, nicht an einer belegten anwachsenden Spielliste.
  Der größte Performance-Knoten hält hier 120.736 / 139.224 / 140.424 Snapshotbytes.

Das erweitert die früheren Klassenzählungen und einzelnen kürzesten Pfade um
die tatsächliche Standard-Dominatoranalyse. Es beweist weiterhin kein dauerhaft
wachsendes JavaScript-Spiel-Leck. Die bereits gemessenen großen **vor GC**
auftretenden nativen Style-/Heapbestände werden dadurch nicht widerlegt:
Ein Snapshot nach GC kann sie nicht nachträglich rekonstruieren.

## Neuer offizieller WebKit-Abgleich

Die beiden genauen nativen Fix-Commits und der Anwendungsbezug stehen in
`webkit-source-match.json`:

- [Bug 312236](https://bugs.webkit.org/show_bug.cgi?id=312236),
  [Fix ebcf88c1](https://github.com/WebKit/WebKit/commit/ebcf88c1bc303388b4d1ed89f3bd812631b719e2):
  WebKit begrenzt einen möglicherweise wachsenden MatchedDeclarationsCache.
  Der berichtete Reproduktionsfall nutzt registrierte animierte Custom Properties.
  **Alle 39 Anwendungs-CSS-Dateien der eingefrorenen Quelle sind geprüft und
  enthalten keine solche Registrierung.** Ein JavaScript-Suchlauf auf Main ist
  gesondert markiert und beweist nicht den gesamten eingefrorenen Modulbaum.
  Kein identischer Spiel-Reproduktionsfall, keine behauptete iPhone-Ursache.
- [Bug 305864](https://bugs.webkit.org/show_bug.cgi?id=305864),
  [Fix 45684cc8](https://github.com/WebKit/WebKit/commit/45684cc85f9f3fbdd873b03a237528d3433e6138):
  Ein intern berechneter Style-Hash konnte einen nativen Release-Assert auslösen;
  der veröffentlichte Stack führt auch über SVG-Style-Auflösung. Die API-Arten
  sind im Spiel vorhanden. Ein entsprechender Telefon-Stack und die Zuordnung
  zur tatsächlich installierten OS-/Browserfassung fehlen weiterhin.

Main-/GLib-Fixes werden keinem bestimmten iOS-Release zugeschrieben, solange der
Releasebeleg fehlt. Die installierte iOS- und Pi-Browser-Version bleiben unbekannt.
Ein eingefrorener User-Agent seit iOS 26 ersetzt diese Angaben nicht; siehe
[offizielle WebKit-Versionshinweise](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/).
Diese Browserkorrekturen lassen sich nicht als C++-Patch im JavaScript-Spiel
installieren. Sie sind konkrete Prüfpunkte, keine gefundenen Smartphone-Fixes.

## Wiederverwenden

Die drei unveränderten Original-ZIPs sind zusätzlich in
`Cryptoid_Original-Heaps_20261105.zip` gesichert, unabhängig von der befristeten
Actions-Aufbewahrung. Sie enthalten ausschließlich die bestehenden synthetischen
Gastaufnahmen. Private Handyberichte und Zugangsparameter fehlen.
Das Paket entpackt die Originale unter `downloads/`.

```bash
python3 verification/heap-owner-analysis-20261105/prepare.py /pfad/zu/downloads
node verification/heap-owner-analysis-20261105/analyze.mjs
```

Python ≥3.12 und eine unterstützte Node-Version werden benötigt. Die erste
Vorbereitung lädt das exakt gepinnte DevTools-Paket mit Digestprüfung; sie führt
kein Installationsskript aus. Die sechs Originalinputs und die vorhandenen
Rohresultate bleiben getrennt. Kein neuer Handytest, kein Deployment und kein
Wiederanlauf des Simulators folgen aus dieser Offline-Auswertung.

## Ergänzung: Besitzergerät mit iOS 26.6

Der Besitzer nennt iOS 26.6. Apple dokumentiert Safari 26.6 mit WebKit
20624.4.5; der eingefrorene öffentliche Branchstand
`b56845f9fe0bd77577734c768ceb35b14af44231` weist im Versionsfile
624.4.5 aus. `ios-26.6-source-match.json` sichert die genauen Blob-IDs.

Die Korrektur des reservierten Style-Hashwerts (Bug 305864) ist dort enthalten.
Diesen bereits korrigierten Fehler als unmittelbaren nächsten Fix zu verfolgen,
ist daher nicht begründet. Das schließt andere native CSS-/SVG-Abstürze nicht aus.

Die spätere globale 16k-Begrenzung des MatchedDeclarationsCache aus Main
(Bug 312236) fehlt dagegen in diesem passenden Quellstand. Dessen Grenze von
vier Einträgen je Hashbucket begrenzt nicht die Gesamtzahl unterschiedlicher
Hashschlüssel. Der allgemeine Hash-/Besitzpfad berücksichtigt geerbte
Custom-Property-Daten und hält Kopien der Eltern-Styles. Damit ist die
Vererbungsreichweite der häufig geänderten Spielvariablen ein konkreter
WebKit-Prüfpfad; der registrierte CSS-Reproduktionsfall und tatsächliches
Wachstum auf dem iPhone bleiben unbewiesen.

Die frühere negative Chromium-Ressourcenentscheidung zum lokalen Mündungslicht
bleibt vollständig erhalten. Sie beantwortet keinen direkten Speichervergleich
des gerade identifizierten Apple-Quellstands. Eine neue Geräteversion oder
Reparatur folgt daraus noch nicht. Keine neue Messung, kein Simulatorstart,
kein Runtime-Patch oder Deployment. Pi-Browser-Version weiterhin offen.

Der zusätzliche Vergleich des öffentlichen 625.1.29.10.29-Quellstands
`862f17dcae0aace47ea0ec16e209d960abfd553c` (passend zur Safari27-Core-Version)
bestätigt dort die globale Begrenzung. Der niedrigere WPE-Sonderwert wird nicht
iOS zugeschrieben. Apple führt iOS27.2 als regulär veröffentlichten Stand und
das iPhone15 Pro Max als unterstützt. Ein reguläres angebotenes iOS-Update
ist deshalb ein gezielter nächster iPhone-Schritt mit konkretem Engine-Unterschied.
Dies ist eine Empfehlung, kein durchgeführtes Update und kein White-Screen-Pass.
Eine Android-Reparatur oder ein neuer Spiel-Patch wird daraus nicht abgeleitet.
