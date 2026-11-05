# Lokal gesetztes Mündungslicht mit bestehendem Fehlerjournal

Dieser getrennte Kandidat basiert exakt auf dem bereitgestellten `b092f646`.
Er verwendet den bereits vorhandenen, in Chromium und WebKit geprüften Helper,
der ausschließlich `--muzzle-light` am vorhandenen einzelnen Verbraucher setzt.
Formel, Werte, CSS, DOM, Bildmaterial, Spiel-/Animationsuhren und Audio bleiben
unverändert. Der schwache Besitzer-Cache besitzt keine neuen Frames oder Timer.
Der bestehende Fallback für einen noch fehlenden Verbraucher bleibt erhalten.

Die einzige geänderte Zeile im bisherigen Build-Einstieg importiert diesen
getrennten Builder. Er verwendet den bisherigen Journal-Builder, wählt dessen
bereits vorhandenen `leaf`-Arm und kennzeichnet den geänderten Controller korrekt.
Journalmodule, normale Berichte, Stoppuhr, direkte Boss-Styles und bestehende
mobile HUD-Regel bleiben bytegleich. Alle fünf Runtime-Quellbäume und die
vollständige Vercel-Konfiguration bleiben unverändert. Keine Veröffentlichung
auf Main/Produktion oder öffentliche Testnet-Adresse.

## Warum dieser gezielte Vergleich

Die tatsächlich eingefrorene GamePage enthält einen häufig geänderten Wert
am ganzen Spieler-Unterbaum, aber genau einen leeren `i`-Verbraucher in
GameShipVisual. Der native WebKit-Cache berücksichtigt geerbte Variablendaten.
Der inzwischen dokumentierte ältere Apple-Quellstand enthält noch nicht die
spätere globale Cachebegrenzung. Das ist ein konkreter Prüfpfad, keine belegte
White-Screen-Ursache und keine Forderung nach einer Geräteaktualisierung.
Die Nutzerangabe „alles aktuell“ wird akzeptiert; kein weiterer Versionsblocker.

Offizielle Grundlage ist die dokumentierte Vererbung von Custom Properties:
https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties
Die Chrome-Entwickler erläutern die Bedeutung der Vererbungsreichweite:
https://web.dev/blog/at-property-performance
Ihre Benchmarkprozente werden nicht auf dieses Spiel oder auf WebKit übertragen.
Es wird keine neue `@property`-Registrierung eingeführt. Die versionierten
WebKit-Quellbezüge stehen auf dem Analysezweig unter
`verification/heap-owner-analysis-20261105/ios-26.6-source-match.json`.

Die frühere negative Chromium-Ressourcenentscheidung zum Mündungslicht bleibt
unverändert. Beide damaligen Vergleiche erfüllten das historische 15%-Kriterium
nicht; es wird kein Bestehen nachträglich erfunden. Dieser neue Prüfschritt
erfasst stattdessen am echten bestehenden Spiel die Vererbungsreichweite und
die Integration mit dem späteren Journal. Das Ergebnis ist kein RAM-, Cache-
Eintrags-, FPS-, Wärme- oder Smartphone-Stabilitätsnachweis.

## Geprüfter Ablauf

Vor dem Build prüfen vier kleine Quell-/Bereitstellungs-Gegenbeispiele die exakt
umkehrbaren Anpassungen. Die bestehenden Listener-/Fehlerjournal-Fälle werden
nicht erneut unverändert durchlaufen. In Chromium und WebKit folgt jeweils der
vorhandene kurze 60/10/10-Ablauf: echter aktiver Boss, manuelle Pause/Fortsetzen,
Waffenmenü, bestätigter Home-Ausstieg und normaler Bericht. Zeit-/Lücken-/Quelle-
und Fehlerbedingungen des vorhandenen Treibers bleiben vollständig erhalten.

Nur in der ersten regulären Pause bestätigt der alte native Fidelity-Test
weiterhin die acht Lichtwerte, berechnete Darstellung, Geometrie, Knoten und
Animationsidentitäten. Die zusätzliche Prüfung zählt, welche bestehenden
Elemente denselben festen Custom-Property-Wert berechnet führen, wenn er am
Root beziehungsweise am Verbraucher liegt. Die erwartete lokale Reichweite
folgt aus dem tatsächlichen einzelnen kindlosen Verbraucher. Dieses Zählen
ist keine Messung ausgeführter Style-Neuberechnungen oder nativer Cacheeinträge.
Alle Inline-Styles werden vor Wiederaufnahme exakt wiederhergestellt.

Der normale Bericht muss weiterhin Lauf-ID, Quelle, `ended` und `elapsedMs`
zwischen Journal und Stoppuhr exakt abgleichen und den vorhandenen laufgebundenen
Ressourcenpunkt liefern. Fehlende Fehler beweisen keine native Fehlerfreiheit.
Keine künstliche Zeit, automatische Wiederaufnahme oder angeforderte GC.
Die Simulatorserie bleibt beendet. Ergebnisse werden erst nach den Läufen ergänzt.
