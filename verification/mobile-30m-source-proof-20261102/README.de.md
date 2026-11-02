# Wiederholte 30-Minuten-Prüfung der eingefrorenen Gerätequelle

Dieser reine Testzweig verändert keine Spielquelle, Builder-Behandlung,
Spielmechanik, Grafik, Auflösung, Audiowiedergabe oder Spieluhr. Automatische
Vercel-Bereitstellung bleibt ausgeschaltet. Keine Veröffentlichung nach Main.

Jeder der vier frischen Linux-Runner verwendet zwei getrennte Checkouts:
die Testanleitung aus diesem Zweig und die exakt eingefrorene Gerätequelle
`b042c8e50ad3f05a70418ae5ee6bb4412809035b` mit Baum
`921fe9212ce0ccfeaa7dc46352d3d6385c7f3fb2`. Der zweite Checkout wird ohne
Quelldatei-Overlay über den vorhandenen minimalen Geräte-Builder erstellt.
Vorhandene Quellbereichs-, Paket- und Hash-Prüfungen müssen bestehen.

Chromium und WebKit laufen je zweimal. In jedem Job muss zuerst ein frischer
vollständiger 60-Sekunden-Ablauf bestehen. Danach beginnt in einem neuen Browser
der bestehende, unveränderte Ablauf mit 1800 realen aktiven Sekunden, echter
Pause/Fortsetzen, Waffenmenü, bestätigtem Home-Ausstieg, zweimaligem erneutem
Start mit je zehn aktiven Sekunden und dem normalen Kurzbericht. Unveränderte
Gates verlangen dasselbe Dokument, Fortschritt der Spiel-Frames und Reaktor-
Salven, unveränderte Stoppuhr-ID, null Beobachtungslücken und keine technische
oder unerwartete Pause. Ein Fehler bleibt ein Fehler; kein automatisches Resume.

Der zusätzliche Treiber liest nur von außen alle fünf Sekunden die vorhandene
Linux-Prozessmessung aus. Er zeichnet PSS/RSS nach Browserprozessrollen auf,
einschließlich erkannter und nicht klassifizierter Nachkommen. Er verändert
keine Seite und fügt dort weder Timer noch Frames, Listener, Profiler,
Screenshots, GC oder Diagnosepuffer hinzu. Die alte QA-Inspektionsbrücke und
begrenzte Gerätediagnose bleiben unverändert. Auf Host-Scheduling kann die
externe Messung trotzdem Einfluss nehmen.

Installierte Paketversionen, Lock-Digest, gebaute JS-/CSS-Digests und tatsächliche
Build-Identität werden archiviert. Es gibt keine eingecheckte npm-Lockdatei;
frische Auflösung ist deshalb ausdrücklich keine Behauptung bytegleicher
Artefakte mit dem gehosteten Gerätetest. Unterschiede werden sichtbar gehalten.

Alle vier vollständigen Laufbelege und etwaige Fehlschläge bleiben getrennt.
Es gibt hier nur eine Bedingung, keine gematchte A/B- oder Speicher-Leck-
Behauptung. Linux-PSS ist weder iPhone-RAM noch GPU-residenter Speicher.
Fortschritt von DOM und Spieluhr beweist keine fehlenden weißen Pixel auf einem
physischen Gerät. Auch vier bestandene Läufe wären keine White-Screen-Behebung.

## Fehler der ersten Testvorbereitung

CI `41506829900`, Testquelle `d2559d11`, besteht Installation und Paket-Build.
Der neue Treiber scheitert vor dem eigentlichen Browserstart an seiner pauschalen
Forderung nach leerem Git-Status. Tatsächlich hat npm exakt zwei neue Dateien
erzeugt: `frontend/package-lock.json` und
`verification/boss2-forensics-20261028/package-lock.json`. Das ist ein Fehler
dieser neuen Testvorbereitung; kein Spielabsturz und kein gestarteter Langlauf.

Die korrigierte Prüfung erlaubt ausschließlich diese zwei ungetrackten Dateien,
prüft gültige npm-Lockdaten und zum jeweiligen Paket passende Namen und hält ihre
Digests vor/nach jedem Lauf fest. Jede getrackte Änderung, auch eine gestagte,
jede zusätzliche Datei und jede spätere Lockänderung bleibt ein Fehler. Das
tatsächliche Buildmerkmal `workingTreeDirty:true` wird wahrheitsgemäß erhalten.
Sechs lokale Git-Integrationsfälle prüfen genau diese Grenzen. Die fehlgeschlagene
CI wird nicht durch nachträgliche Umklassifizierung zu einem bestandenen Lauf.

## Abgeschlossene neue Messung

Testanleitung `9c4eb24f`, [CI 41507411505](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41507411505):
alle vier Jobs bestehen. Jeder hat einen vollständigen 60-Sekunden-Kurzlauf
und anschließend einen unabhängigen vollständigen 30-Minuten-Langlauf mit
zwei weiteren Zehn-Sekunden-Neueinstiegen abgeschlossen. Es gab kein
automatisches Resume, keine beschleunigte Spieluhr und keinen zusätzlichen
aktiven Clock-/Frame-Ring. Acht vollständige Ablaufbelege liegen vor.

Tatsächliche Engines: Chromium `151.0.7922.34`, WebKit `26.5` unter Linux.
Alle acht Belege verwenden React/ReactDOM `19.2.4`, Router `7.13.2`, Vite
`7.3.1`, TypeScript `5.9.3`, Playwright `1.62.1`, denselben ursprünglichen
Yarn-Lock-Digest und denselben JS-/CSS-Buildmanifest-Digest. Dies beweist
Bytegleichheit der erfassten CI-Skripte und Styles über die vier Builds;
es ist kein unabhängiger Byteabruf des gehosteten Bundles.

| Lauf | Beobachtete aktive Millisekunden | PSS erste aktive Minute, Median | PSS letzte aktive Minute, Median | PSS-Spitze aktiv |
| --- | ---: | ---: | ---: | ---: |
| Chromium 1 | 1.800.000,1 | 410,0 MiB | 502,4 MiB | 511,2 MiB |
| Chromium 2 | 1.800.999,9 | 399,9 MiB | 490,5 MiB | 496,1 MiB |
| WebKit 1 | 1.800.381 | 1.080,5 MiB | 1.088,6 MiB | 1.144,5 MiB |
| WebKit 2 | 1.801.615 | 1.082,0 MiB | 1.123,0 MiB | 1.137,5 MiB |

Diese PSS-Werte sind **summierte klassifizierte Linux-Browser-Nachkommen**,
nicht nur der Renderer, kein nativer Heap und kein physischer Telefonspeicher.
Sie dürfen insbesondere nicht mit älteren Renderer-only-Zahlen gleichgesetzt
werden. Die gemessenen frühen WebKit-Bestände sind schon hoch; eine genaue
Blank-Page-/Allokator-Zuordnung ist damit nicht gegeben. Unterschiedliche Peaks
der separat erfassten Prozessrollen liegen nicht notwendig gleichzeitig vor.

In allen vier Langläufen bleiben die erfassten Canvas-Fehlerlisten leer und
die Audio-Uhrstillstandszähler null. Der beobachtete Effektcache bleibt bei
maximal 1.059.028 Byte; höchstens fünf gleichzeitige Audio-Stimmen wurden
gelesen. Das begrenzt genau diese gemessenen Besitzer und beweist nicht die
vollständige Freigabe aller nativen Grafik- oder Browserressourcen.

Vier GitHub-ZIP-Digests und ZIP-Integritäten sind geprüft. Alle 64 gelieferten
Originaldateien sind deterministisch komprimiert archiviert; der Offline-Leser
berechnet sämtliche acht Ergebnisse erneut, verlangt Vollständigkeit und
erhält die fehlgeschlagenen Vorstufen. Aufruf:

```bash
python3 verification/mobile-30m-source-proof-20261102/evidence/verify.py
```

## Zusätzliche getrennte Kontrollfälle

Die [Kontakt-/Reload-Prüfung](INPUT-RELOAD.de.md) hält neun native neutrale
Kontaktfälle, zwölf wiederholte Folgen und vier Hauptprüfungen als abgeschlossenen
Teil eines ausdrücklich fehlgeschlagenen Gesamtlaufs fest. Der danach getrennte
Reload-Kontrollfall [CI 41511453451](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41511453451)
ist vollständig erfolgreich: neuer Dokumentstart vom Typ `reload`, erhaltene
Testzeit und Run-ID, `boot-after-active-session` und keine automatische
Kampfwiederaufnahme. Ein absichtliches Neuladen bleibt keine native Kill-Simulation.

Im tatsächlich gehosteten ursprünglichen Preview war zusätzlich
`https://vercel.live/_next-live/feedback/feedback.js` als Script im DOM vorhanden;
die lokale Testauslieferung enthält diese Hosting-Injektion nicht. Ein neuer
getrennter Preview verwendet deshalb denselben eingefrorenen Spielquellstand
und nur auf seinem eigenen Zweig `VERCEL_PREVIEW_FEEDBACK_ENABLED=0`.
Die [offizielle Toolbar-Anleitung](https://vercel.com/docs/vercel-toolbar/managing-toolbar)
beschreibt diese zweigspezifische Steuerung.

Deployment `dpl_DsTqBdzB8JrwLhaQ12KR6joCmgK1` ist READY/Preview (`target:null`),
Quelle und Baum entsprechen exakt `b042c8e5`/`921fe921`. Im authentifizierten
Browser sind der identische Spiel-Bundle-Name, dieselbe Stoppuhrkennung und das
Fehlen des Toolbar-Scripts tatsächlich abgelesen. Spielquellen, Projekt-weite
Toolbar-Einstellung und Zugangsschutz wurden dafür nicht geändert. Die neue
immutable Deployment-Origin verändert allerdings auch Cache-/Speicherkontext;
dies ist kein perfekt gematchter kausaler A/B-Nachweis. Ein Einfluss der Toolbar
auf den physischen White Screen ist **nicht belegt**.

Für diesen neuen Hosting-Kontrollfall sind bisher Menü und ausgelieferte
Metadaten geprüft; kein gehosteter 30-Minuten-Spielablauf und kein physischer
Gerätetest werden behauptet. Die ursprüngliche Geräteadresse bleibt die Referenz.
Die positiven Linux-Prüfungen ersetzen keinen Nachweis auf den betroffenen
Smartphones. Es gibt weiterhin keinen als behoben ausgegebenen White Screen.
