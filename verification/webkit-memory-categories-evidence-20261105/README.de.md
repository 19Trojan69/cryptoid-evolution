# Neue WebKit-Kategorien ausgewertet und Anschluss wiederhergestellt

Die rote Gesprächsmeldung wurde ohne genauen Wortlaut nicht diagnostiziert. Der tatsächliche Projektstand wurde direkt aus den neueren GitHub-Quellen und dem abgeschlossenen Lauf wiederhergestellt. Die ältere Übergabedatei endete noch vor dieser Messung.

Quelle fa6239bedb24b4e417d28ec8a94a7195acd168d6, Baum bffd905a711f57ad3fa8f92fdd5218e0a2e92973.
CI 42095718896, Job 127485093224: vollständig success. Unveränderte 9f3-Renderingbasis, Controller-SHA256 00e3796f3eb0bbaec3f2ae16bb5ac46a2d88c8abc6647fee0e1a5b634249a18d. Linux-WebKit 26.5, Playwright 1.62.1, feste offizielle Containerbasis, 430 × 825 CSS-Pixel, DPR 3; kein physisches Smartphone.

Das Original-ZIP 13447572510 hat 24.322 Bytes und SHA256 3ee581995988039bf84bd95c9c88a38f5827d8413f1a7486198643cb9b38f80c. Integrität und Mitgliedsnamen geprüft. Die drei enthaltenen Originaldateien bleiben unverändert. analyze.py rechnet sämtliche PSS-Punkte unabhängig nach, prüft Prozesssummen und den normalen Journal-/Stoppuhr-/Ressourcenexport und erzeugt independent-summary.json. Native Kategorien und LayerTree wurden bereits im ursprünglichen Lauf instrumentiert; das ist keine unbeeinflusste PSS-Abnahme.

| Phase | gesamte Prozess-PSS, Mittel MiB | native JS-Kategorie, Mittel MiB | native Bilder, Mittel MiB | native other, Mittel MiB |
|---|---:|---:|---:|---:|
| leeres Dokument | 351,63 | 1,39 | 0,00 | 106,79 |
| Menü | 460,33 | 5,84 | 0,00 | 165,13 |
| vorbereitetes Menü | 518,25 | 22,39 | 3,55 | 188,64 |
| Szene aufgebaut, pausiert | 884,30 | 27,31 | 4,00 | 536,82 |
| Spiel aktiv | 1159,16 | 31,35 | 14,99 | 806,45 |
| Home nach Freigabe der Testbrücke | 857,28 | 27,09 | 3,76 | 510,44 |
| leere Seite nach Navigation | 855,75 | 16,32 | 3,76 | 518,84 |
| neuer Kontext nach echtem Kontextschluss | 374,13 | 1,32 | 0,00 | 105,21 |

Diese Spalten verwenden verschiedene Zähler und Zeitraster; nicht addieren oder als vollständige Besitzaufteilung interpretieren. Alle neun Phasen einschließlich Home mit noch gehaltener Testbrücke stehen vollständig in den Rohdaten und der Nachrechnung. Kurzfenster und instrumentierte Schwankungen sind keine kausalen Langzeitgewinne.

Wichtige Quellenkorrektur: Im zur Playwright-Version gehörenden öffentlichen WebKit-Upstream ist other eine Restrechnung aus resident minus shared abzüglich ausgewählter Kategorien. Unter Linux werden die Kategorien nicht vollständig wie unter Cocoa aufgeteilt. Dass layers/page/jit hier null melden, beweist keinen Grafik-/DOM-/JIT-Verbrauch von null. Die gesonderte LayerTree-Summe beträgt beim aktiven Phasenende rund 12,96 MiB und ist nur die backingStoreMemoryEstimate-Schätzung. Die beiden großen Sternen-SVGs haben zusammen rund 7,06 MiB geschätzte Backing Stores. Keine dieser Zahlen erfasst nachweislich alle temporären Filter-/Zeichenpuffer oder weist ihnen die mehreren Hundert MiB in other zu. Die gelesenen Upstream-Quellfingerprints sind in source-review.json genannt; keine exakte Gleichheit aller gepatchten Binärquellen wird behauptet.

Der aktive und die bisherigen Phasen verwenden Webprozess PID 1009. Nach echtem Kontextschluss erscheint PID 1127; die niedrigeren Werte sind deshalb keine gemessene Freigabe im selben Prozess. Navigation zu about:blank allein hat den alten Inhalt nicht nachweislich vernichtet. Ein non-critical Memory-Pressure-Ereignis bleibt im Original erhalten; daraus folgt weder der physische Handy-Auslöser noch ein gemessener mobiler Grenzwert.

Normaler Ausstieg und Export bestehen, die vollständige Journaluhr passt zu ID/Quelle/mode/elapsedMs; Ressourcenpunkt gehört zur Stoppuhr. Der erste Versuch 42095393806 / 127483941935 auf d4265d49 bleibt failure vor Spielstart: falscher interner Zugriff _delegate statt delegate. Die korrigierte Quelle ändert genau zwei dieser Zugriffe. Kein Spielabsturz und kein bestandener Spieltest aus dem fehlgeschlagenen Versuch.

Nächster eng begrenzter Test: codex/milky-band-attribution-20261105, Quelle dace335f944d25734464fb68890dc07f8fa50838, Baum f50e24d0eb4c004dc5ef4d642aab4353f42066f7, CI 42110696282. Die große gedrehte Fläche .milky-band mit inset:-40% und blur(11px) wird in nur einer internen Vergleichsbedingung absichtlich ausgeblendet. Das ist Diagnose mit bewusst anderer Darstellung, kein veröffentlichbarer Patch. Alle übrigen kompletten Collectorbedingungen sind bytegleich rückgewinnbar. Vorprüfungen/Syntax/YAML und alle fünf Runtime-Bäume plus vercel.json wurden vor Veröffentlichung dieses Testrezepts geprüft. Zum Schreiben dieser Quittung läuft der Test; kein Ergebnis vorweggenommen.

Keine Vercel-Bereitstellung, kein Merge oder Aliaswechsel; keine neue Geräteaufforderung. Originale Grafik-/Ton-/Steuerungs-/Zeit-/Simulationsquellen bleiben unverändert. Hoher nativer Verbrauch ist weiter Gegenstand der Zuordnung; Ursache und dauerhafte Behebung des physischen White Screens sind nicht nachgewiesen.
