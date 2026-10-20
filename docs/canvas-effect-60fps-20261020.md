# Canvas-Effekte mit 60-Hz-Zeichentakt

Der Owner hat am 20. Oktober 2026 um 17:42:41 Uhr (Europe/Vienna)
die vorgeschlagene Begrenzung der Canvas-Effekte beauftragt. Ausgangspunkt
ist Audit-Commit `a20f6465fc59ef321a660835186005cb859e97c9`; dessen Runtime
entspricht dem zuletzt veröffentlichten Testnet `927dc5a`.

## Anlass und Änderung

Das iPhone wird beim Spielen deutlich warm. Der neue Bericht endet kurz nach
Bonusabschluss; der Owner bestätigt automatischen weißen Bildschirm und
Rückkehr zur Startseite. Ein heutiger Jetsam-Bericht fehlt. Wärme bleibt eine
Arbeitshypothese, keine bewiesene Ursache.

Die normale Smartphone-Szene begrenzt ihre React-Aktualisierungen bereits.
Die separate Canvas-Fläche für gewöhnliche Explosionen und Trümmer zeichnete
dagegen bisher bei jedem RAF-Aufruf. Auf einem tatsächlich mit 120 Hz laufenden
Browser konnte sie dadurch 120-mal pro Sekunde vollständig neu zeichnen.

Nur `CanvasEffects.tsx` erhält einen 60-Hz-Zieltakt für diese Zeichenvorgänge.
Ein gemeinsamer nächster Zeichentermin überspringt überzählige Aufrufe.
Eine Toleranz von einer Millisekunde berücksichtigt gerundete Browserzeitstempel.
Der Termin bleibt phasenstabil; verpasste Bilder werden nicht nachgezeichnet.
Die Animation wird weiterhin anhand ihrer originalen verstrichenen Zeit berechnet.
Nach Pause wird der erste wieder aktive Aufruf gezeichnet. Freigabe beziehungsweise
Unmount setzt den Termin zurück. React-Neuregistrierungen setzen das Budget
nicht zurück.

Der bestehende RAF prüft weiterhin, ob gezeichnet werden muss. Es gibt keinen
zusätzlichen RAF, Timer, Listener, Schalter oder Diagnose-Sampler. Die Änderung
ist keine globale Begrenzung aller CSS-/Browseranimationen. Sie ändert keine
Spielsimulation, Steuerung, Kollision, Flugbahn, Dauer, Auflösung, Bilddatei,
Effektanzahl, Sound, Belohnung oder Speicherung. Auf hochfrequenten Bildschirmen
hat diese Effektfläche bewusst weniger zeitliche Zwischenbilder.

## Kontrollierter Vergleich

`verifyCanvasEffectCadence.mjs` führt das tatsächliche Ausgangs- und
Kandidatenmodul mit kontrollierten RAF-Zeitstempeln und Hooks aus.

| RAF-Aufrufe pro Sekunde | Zeichnungen vorher, 2 s | Zeichnungen danach, 2 s |
| ---: | ---: | ---: |
| 30 | 60 | 60 |
| 59,94 | 120 | 120 |
| 60 | 120 | 120 |
| 90 | 180 | 120 |
| 120 | 240 | 120 |
| 144 | 288 | 120 |
| 240 | 480 | 120 |

Gerundete, auf-/abgerundete sowie leicht schwankende 60-Hz-Zeitstempel behalten
alle 120 Zeichnungen in zwei Sekunden. Für jedes tatsächlich gezeichnete Bild
stimmen die Zeichenbefehle mit der Ausgangsversion zum selben Zeitstempel überein.
Pause, erster Aufruf nach Wiederaufnahme, React-Neuregistrierung, lange Lücken,
Leerlauf, spätere Explosion, Context-Verlust und Remount bestehen.

Der bestehende native Rastervergleich besteht mit 275 identischen RGBA-Bildern:
echter Schiffsrumpf, Feuer, Rauch und vier Trümmer; fünf Alter bei fünf DPRs,
zentrale/randnahe/gebrochene Positionen und gleichzeitige Explosionen. Die
Zeichenfunktion ist bytegleich, die Flächengrößen-Zuweisungen bleiben gleich.
Der neue Testparameter `CRYPTOID_CANVAS_PIXEL_SAME_SURFACE_LIFETIME=1`
verlangt in diesem Vergleich explizit unveränderte Flächenzuweisungen;
die bisherige historische Wiederverwendungsprüfung bleibt als Standard erhalten.

Der Canvas-Lebenszyklustest mit 2.000 warmen und 400 bewegten Explosionen
sowie die Cache-/Abbruch-/Fehlerprüfungen bestehen. Der Release-Build mit
zwölf Locale-Tests, Übersetzungsprüfung, TypeScript und Vite besteht.
Die bekannten npm-Konfigurations-, CJS-fixture-import.meta- und
Vite-Chunkgrößen-Warnungen bleiben sichtbar.

## Reproduktion

```sh
cd frontend
node scripts/verifyCanvasEffectCadence.mjs
CRYPTOID_CANVAS_PIXEL_BASE=a20f6465fc59ef321a660835186005cb859e97c9 \
CRYPTOID_CANVAS_PIXEL_SAME_SURFACE_LIFETIME=1 \
node scripts/verifyCanvasSurfacePixels.mjs
node scripts/verifyCanvasLifecycle.mjs
node scripts/verifyCanvasEffects.mjs
npm run build
```

Der Rastertest verwendet das vorhandene runtime-eigene `@napi-rs/canvas`;
keine Projekt-Abhängigkeit wurde ergänzt. Maschinendaten stehen in
`canvas-effect-60fps-20261020.json`.

## Sicherung und Grenze

Die lokale Worktree-Verknüpfung verwies auf ein nicht mehr vorhandenes
Hauptverzeichnis. Die ursprünglichen Dateien und diese Verknüpfung bleiben
erhalten. Für Vergleich und Versionssicherung wurde der vorhandene Audit-Zweig
in ein separates Bare-Repository geladen und der unveränderte Ausgangsstand
mit `git status` überprüft. Alle Git-Vorgänge nutzen dieses Repository explizit.

Die vorherige Runtime bleibt über die feste Release-Referenz
`codex/testnet-card-pending-release-20261020` auf `927dc5a` gesichert.
Die neue Änderung wird auf dem Audit-Zweig mit abgeschalteter automatischer
Veröffentlichung gesichert. Für diese Vorbereitung wurde kein Deployment
ausgeführt.

Die 50 % weniger Zeichnungen bei 120 Hz gelten ausschließlich für diese
Effektfläche. Sie sind weder 50 % weniger Gesamtstrom noch eine gemessene
Temperatursenkung. Ein physischer iPhone-Vergleich und die tatsächliche
Whitescreen-Ursache bleiben offen.

## Veröffentlichung im offiziellen Testnet

Am 20. Oktober 2026 um 17:54:30 Uhr (Europe/Vienna) beauftragte der Owner
anschließend die Veröffentlichung. Runtime `30b8b2326b9514c066edbdf23c4f5dc61f15a14c`
mit geprüftem Tree `f43ffb18477b1d6055793b4f6ec46e58b6ecdb17` ist seit
18:04:25.539 Uhr als Production-Deployment
`dpl_5s1S5thJ7ps83dy4ZXkeiS7JWcGr` unter der offiziellen Testnet-Adresse bereit.
Die vorherige Runtime `927dc5a` bleibt zusätzlich unter
`backup/testnet-before-canvas-60fps-20261020` als unmittelbarer Rückfallstand
gesichert. Die feste neue Release-Referenz lautet
`codex/testnet-canvas-60fps-release-20261020`.

Die geschützte Vorschau und die offizielle Startseite laden. Öffentlich
ausgelieferte Build-Identität und 60-Hz-Zeichenlogik wurden geprüft. API,
anonyme Admin-Abweisung, alle drei Ranglistenantworten und das Kontroll-Artwork
stimmen mit dem unmittelbar vorher erfassten Stand überein. Mainnet behält
seine bisherige HTML-Datei und seinen Einstiegspunkt. Zwölf neue
Deployment-Anfragen zeigen keine Warning-/Error-/Fatal-Einträge; dies ist
eine begrenzte Abschlusskontrolle. Die bekannte Hydration-Warnung und
Browser-Erweiterungsfehler bleiben separat dokumentiert. Die ausgelieferte
Build-Metadatenkennung `workingTreeDirty` ist wie zuvor `true`.

Der Freigabenachweis mit Hashes, Grenzen und Screenshot steht in
`canvas-effect-60fps-release-20261020/release.json`. Die Freigabe ersetzt
keinen physischen Temperatur- oder Abbruchvergleich auf dem iPhone.
