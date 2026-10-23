# Verdeckte Zeichenflächen des Sternenhintergrunds

Vorbereitung auf `codex/starfield-bounds-audit-20261023`, ohne Veröffentlichung.
Basis ist der im Gerätebericht genannte Commit
`19de3e692f75a1c3e2eddf3438acc937c9dcac19`, Tree
`e7be9574df3dbf443c65ac4dea027f82499df766`. Dessen Dirty-Marker erlaubt keine
Behauptung, alle privaten Laufzeitänderungen seien rekonstruiert.

## Konkreter Befund

Die beiden animierten Stern-SVGs verwenden `xMidYMid slice` und sichtbaren
Overflow. Auf schmalen und breiten Feldern liegen dadurch große Teile ihrer
nativen Zeichenflächen außerhalb des sichtbaren Spiels. Der um drei Prozent
vergrößerte Hintergrund bietet bei ausreichend großen Feldern bereits Platz
für die vollständige bestehende Bewegung.

Die Vorbereitung begrenzt ausschließlich diesen Overflow. Beide SVGs, sämtliche
Sterne, ViewBoxes, Farben, Radien, Glanzformen, Bewegungszeiten und der bestehende
Frame-Pacer bleiben erhalten. Ein ResizeObserver prüft den tatsächlichen
Hintergrund und dessen sichtbares Elternfeld. Mindestens elf Pixel Reserve auf
beiden horizontalen Seiten und acht Pixel auf beiden vertikalen Seiten decken
die bisherigen Bewegungen ab. Kleine Felder und Browser ohne ResizeObserver
behalten den bisherigen Overflow. Beim Unmount wird der Beobachter entfernt.
Es gibt keinen neuen Timer, keine neue RAF-Schleife und keine Arbeit pro
Animationsbild.

## Gemessene Teilersparnis

Native Linux-WPE-WebKit 26.5, Softwaredarstellung; LayerTree-Schätzung für die
zwei Sternebenen, jeweils bei Sektor 1 und derselben gehaltenen Animationsphase:

| Testfläche | Vorher, Bytes | Kandidat, Bytes | Verringerung |
| --- | ---: | ---: | ---: |
| 430 × 825, DPR 3 | 7.360.500 | 3.192.000 | 56,63 % |
| 1024 × 768, DPR 2 | 7.237.104 | 7.080.720 | 2,16 % |
| 1440 × 900, DPR 1 | 14.326.528 | 11.661.696 | 18,60 % |

Diese Werte sind weder der gesamte Browser-RAM noch eine gemessene Ersparnis
auf dem iPhone. Insbesondere erfolgt keine Hochrechnung mit dem Quadrat des
DPR. Die zwei nativen Sternebenen bleiben erhalten und werden während ihrer
Bewegung im lokalen WebKit-Test nicht in jedem Frame neu gemalt.

## Darstellung und Verhalten

72 Rastervergleiche: zwei Engines, drei Feldgrößen, zwei Sektoren, Nebel an/aus
und drei Animationszeitpunkte. Zufällige Sternflares werden für diese statischen
Vergleiche durch die originale Pause-Eigenschaft ausgenommen.

Alle 36 WebKit-Paare sind pixelgleich. Die 36 Chromium-141-Paare unterscheiden
sich weiterhin: maximal 5.238 Pixel auf der schmalen DPR-3-Fläche, maximal
86 Kanalstufen. SVG-Inhalt und Bildschirmmatrizen bleiben bei den zusätzlichen
Geometrieprüfungen exakt gleich. Die Pixelabweichungen werden deshalb als
Rasterisierungsunterschiede eingeordnet; plattformübergreifende Pixelgleichheit
ist ausdrücklich **nicht** nachgewiesen. Das bleibt vor einer Freigabe offen.

Acht Verhaltensgruppen bestehen in WebKit, sieben in Chromium: Größenwechsel
einschließlich 320 × 600 und 900 × 240, tatsächliche Containerverkleinerung,
Originalbewegung/Pause/Fortsetzen, beide bestehenden Reduced-Motion-Wege,
Beobachter-/DOM-Freigabe und fehlender ResizeObserver. WebKit prüft zusätzlich
die zwei weiterverwendeten nativen Ebenen und deren unveränderte Paint-Zähler.

Ein kurzer Test der tatsächlichen GamePage mit lokalem Transport und einem
kontrollierten Piloten besteht in beiden Engines: Boss 70, vier Größenwechsel,
Pause/Fortsetzen, Originalgrafik und Originalaudio; keine JavaScript-Fehler oder
Canvas-Kontextverluste. WebKit endet nach 35 Sekunden im Boss-Abschluss,
Chromium im Bonus-Einflug. Das ist kein vollständiger Kampagnendurchlauf.
Eine lokale WPE-Unterbrechung durch den bestehenden Loop-Stall-Schutz wurde
über den Original-Fortsetzen-Button fortgesetzt und im Ergebnis aufgeführt.
Beim Musikwechsel bzw. Schließen werden noch laufende MP3-Anfragen abgebrochen
(WebKit eine, Chromium zwei). Chromium protokolliert außerdem die im lokalen
Host vor dem ersten Benutzertippen gesperrten Autoplay-/Vibrationsaufrufe und
einen fehlgeschlagenen Ressourcenaufruf. Das wird nicht als fehlerfreie Konsole
ausgegeben. Die Audioausgabe eines physischen Geräts wurde nicht geprüft.

Der geänderte Baustein besteht die strenge TypeScript-5.9.3-Prüfung; der lokale
GamePage-Bundle mit 283 Eingaben kompiliert. Alle 231 ursprünglichen Quellblobs
bleiben im Prüfbestand unverändert. Ein vollständiger Projekt-/Vite-Build und
ein Lint-Erfolg werden nicht behauptet: Die isolierte Umgebung besitzt nicht
alle Abhängigkeiten; ein Offline-Lint-Setup scheitert am fehlenden Cacheeintrag
für `@humanfs/types`.

## Wiederholbare lokale Prüfung

Die optionalen Skripte gehören nicht zum Anwendungsbundle und erzeugen keine
Konten, Käufe, Serverzugriffe oder Übertragung von Berichten. Sie verwenden die
Originalquelle aus dem festgelegten Git-Commit und die aktuelle Starfield-Datei.
Es werden nur ein lokaler HTTP-Server und native Testbrowser gestartet.

Mit installierten Frontend-Abhängigkeiten, einem separat bereitgestellten
Playwright samt Browsern und vorhandenem Basis-Commit:

```sh
node frontend/scripts/starfieldRenderingAudit.mjs
node frontend/scripts/starfieldBehaviorAudit.mjs
```

`CRYPTOID_AUDIT_PLAYWRIGHT` kann einen vorhandenen Playwright-Modulpfad wählen.
`CRYPTOID_AUDIT_CHROMIUM_PLAYWRIGHT` erlaubt eine getrennte Chromium-Installation.
Optionale ausführbare Browserpfade heißen `CRYPTOID_AUDIT_WEBKIT_EXECUTABLE` und
`CRYPTOID_AUDIT_CHROMIUM_EXECUTABLE`. Native Linux-Bibliothekspfade müssen zur
jeweiligen Installation passen. Ergebnisse und Vergleichsbilder bleiben im
ausgegebenen temporären Verzeichnis. Der Rastervergleich protokolliert die
Abweichungen; er erklärt Chromium-Bilder nicht automatisch zu pixelgleichen
Erfolgen. `STARFIELD_FAIL_FAST=1` bricht bei jeder Pixelabweichung ab.

## Grenze des Ergebnisses

MongoDB hält dauerhafte Konto- und Spielstanddaten. Sie ersetzt weder die
lokalen Grafik-/Audioflächen noch den laufenden Spielzustand im Browser-RAM.
Der bisherige Spielzähler erfasst nur bekannte Teilmengen dieses RAM.

Die native Speicherprüfung und die Aufräumtests identifizieren die große
ungeklärte Browserbelegung noch nicht vollständig. Audioabschaltung und eine
pauschale Filterabschaltung werden nicht als Lösung übernommen. Der hier
belegte Teilgewinn erklärt keinen Prozessanstieg bis zum Speicherlimit und
beweist keine Behebung des White Screens. Kein neuer langer Spieltest des
Eigentümers und kein Warten auf einen weiteren OS-Bericht sind erforderlich,
um diesen lokalen Befund zu prüfen. Testnet, Mainnet und feste Referenzen
bleiben unverändert; automatisches Deployment des neuen Zweigs ist bereits
in dessen erstem Commit deaktiviert.
