# Schussgeschwindigkeit und iPhone-Unterbrechungen, 20. Oktober 2026

## Nachgewiesener Fehler und Korrektur

Der bisherige GamePage-Tick setzt `delta = Math.min(34, frameGap)` und die letzte
Framezeit anschließend auf die aktuelle Zeit. Überschüssige Zeit geht damit
dauerhaft verloren. Das betrifft Spieler- und Gegnergeschosse, Bewegung,
Feuerintervalle, Gegnerabläufe und aktive Ausrüstungstimer. Es ist ein konkreter
Grund für die gemeldete Zeitlupe; die Ursache der langsamen Frames selbst ist
damit noch nicht erklärt.

Der Test bündelt und startet die tatsächliche GamePage mit kontrollierten
Framezeiten. Grafikausgabe, Audiohardware und Konto-APIs sind isolierte Stubs.
Ein vorhandenes Spielerprojektil soll in einer Sekunde 640 Pixel zurücklegen:

| Frame-Abstand | Vorher: simulierte Zeit | Vorher: Schussstrecke | Nachher |
|---|---:|---:|---:|
| 16,667 ms | 1000 ms | 640 Pixel | 1000 ms / 640 Pixel |
| 33,333 ms | 1000 ms | 640 Pixel | 1000 ms / 640 Pixel |
| 50 ms | 680 ms | 435,2 Pixel | 1000 ms / 640 Pixel |
| 88 ms, inklusive letztem Restframe | 406 ms | 259,84 Pixel | 1000 ms / 640 Pixel |

Die neue Zeitaufteilung verbraucht bis 136 ms vollständig in höchstens vier
gleichmäßigen Schritten mit maximal 34 ms. Dadurch bleibt die bisherige maximale
Schrittweite für Kollisionsprüfungen erhalten. Zwischenstände werden nicht
gerendert: Szene und direkte Schiffsstile werden höchstens einmal je RAF
veröffentlicht. Der vorhandene gemeinsame 60-Hz-Scheduler und die langsameren
mobilen Szenenschwellen bleiben bestehen.

Bei größeren Aussetzern bleibt die Arbeit auf vier Schritte begrenzt; es wird
kein Rückstand für spätere Frames angesammelt. Extreme Aussetzer können daher
weiter Zeit verlieren. Der vorhandene Schutz pausiert einen erkannten langen
Vordergrundstillstand. Pause und Hintergrundzeit werden weiterhin nicht
nachgespielt. Die optionale Diagnose zählt Wandzeit und simulierte Zeit einmal
je ursprünglichem RAF, damit Unterteilungen die Messung nicht verfälschen.

## Prüfung

- 66 gezielte Tests bestehen, darunter tatsächliche GamePage-Schussbewegung,
  beide Projektilrichtungen, aktive Timer und Pause bei 60/30/20 Hz, 88 ms und
  unregelmäßigen Abständen. Die zwei Hilfstests begrenzen Schrittweite und Arbeit.
- Je 25 normale Sektoren und zwei Bosse bei kontrollierten 60-Hz- und 50-ms-
  Frames bestehen: Übergänge, Stressobjekte, Pause, Hintergrund, Fehlerpause,
  Spielstandwiederherstellung und vollständige Host-Bereinigung.
- Der 60-Hz-Spielzustands-Trace stimmt exakt mit dem vorherigen Quellstand
  `ea8946a56924d79af6b491f7315fe80188230b4d` überein: SHA-256
  `b77d2ff029222b3f4e24f06d6d4db1b2d025300a90718c639d481f9afcae593f`.
- TypeScript, Vite-Produktionsbuild und 12 Sprachtests bestehen. Der bekannte
  Hinweis auf große Build-Chunks bleibt bestehen.

Die Untersuchungen von Boss-Reaktor, Rumpfschäden, Waffen-Canvas, bemalten
Schiffen, Quellen-/Textur-Caches und Effektbereinigung fanden in den geprüften
Pfaden kein unbeschränkt wachsendes Objektarchiv. Das schließt einen WebKit-,
GPU- oder Compositor-Speicherfehler ausdrücklich nicht aus.

## Forschungsgrundlage und offene Whitescreen-Ursache

Glenn Fiedlers ursprüngliche Beschreibung kleiner, begrenzter Simulationsschritte
erklärt die Korrektur und die Gefahr unbegrenzter Aufholarbeit:
https://gafferongames.com/post/fix_your_timestep/

WebKit empfiehlt, CPU-/Layout-/Paint-Arbeit und verdeckte Animationen zu messen
und zu reduzieren. Ein 60-Hz-Ziel allein begrenzt nicht die Kosten eines Frames:
https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/

Die ausführliche Apple-/WebKit-Recherche, bestehende Ressourcenbefunde und die
Grenzen des alten Jetsam-Berichts stehen in
[iphone-webkit-research-20261020.md](iphone-webkit-research-20261020.md).

Die verfügbaren Berichte beweisen weder Hitze als Auslöser noch einen konkreten
Cryptoid-WebContent-Speicherabbruch. Der letzte bekannte Lauf endet mitten im
Bosskampf; ein neues Dokument folgt 2,388 Sekunden später, ohne aufgezeichnete
Home-Absicht. Das passt zu einem abrupten Abbruch, ist aber keine eindeutige
Prozessdiagnose. Der alte Jetsam-Bericht betrifft einen anderen Zeitpunkt und
enthält keine belastbare Zuordnung zu dieser Website.

Für einen Nachweis am betroffenen iPhone fehlen ein reproduzierter Lauf mit dem
aktuellen Build, die vorhandene 90-Sekunden-Owner-Zeitmessung und ein zum selben
Zeitpunkt gehörender WebContent-/GPU-/Jetsam-Befund. Die entfernte Chrome-Prüfung
kann diese Hardware- und Host-Browser-Daten nicht liefern. Diese Korrektur wird
deshalb als nachgewiesene Zeitlupen-Korrektur veröffentlicht, nicht als bewiesene
vollständige Beseitigung des Whitescreens.
