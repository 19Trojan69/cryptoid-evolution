# Getrennter Handytest: genau eine HUD-Eigenschaft

Der Besitzer hat die getrennte Vorschau am 03.11.2026 ausdrücklich freigegeben.
Die bestehenden Testlinks und öffentlichen Produktions-/Testnet-Adressen werden
nicht ersetzt oder neu zugewiesen.

Ausgangsstand ist ac98e95166b0e2013186257904da46323840dab5. Alle fünf Original-
Runtime-Bäume und vercel.json bleiben identisch. Der bestehende Gast-Builder
baut dieselbe Diagnose mit Originalgrafik/-ton, konservativer Stoppuhr und
normalem Bericht. Erst nach diesem ursprünglichen Build wird eine einzige
statische CSS-Regel am Ende des HTML-Kopfs eingefügt:

```css
@media (max-width:700px){.game-hud{backdrop-filter:none;}}
```

Dies ist die identische Behandlung aus dem vollständigen Browserlauf
41626481637: zwei Kurzabläufe und 30-Minuten-Ablauf pro Engine. Sie entspricht
dem geprüften Zweizeilen-Cascade-Patch aus Lauf 41624042675. Der tatsächliche
mobile Unterschied ist die HUD-Hintergrund-Weichzeichnung. Alle übrigen
Darstellungen und Spielabläufe werden hier nicht verändert.

Der neue Builder prüft die originale Quell-CSS, alle Gast-Sperren, unveränderte
Uhr und ausgeschlossene aktiven Diagnoseproben. Danach dürfen genau index.html
und device-preview-info.json abweichen. Jedes andere erzeugte Paketbyte,
insbesondere sämtliche JS-/CSS-Dateien, muss gleich bleiben. Keine neue
Spieldiagnose, Timer, RAF-Schleife oder automatische Wiederaufnahme.

Der Source-Commit der neuen Vorschau ist ihr eigener Test-Commit. Die
Metadaten nennen zusätzlich den exakten Ausgangsstand und CSS-Unterschied.
Es wird keine Bytegleichheit aller Build-Version-Metadaten mit der älteren
Vercel-Adresse behauptet. Das Testpaket bleibt ohne Live-Backend, Pi-Anmeldung
oder Zahlungen. Aufnahme aus und bestehender Schutz an bleiben die bisherigen
Einstellungen, kein neuer Eingriff.

Die vorherigen grünen Linux-Läufe sind keine physische iPhone-/Android-Abnahme;
auch das Original bestand dort 30 Minuten. Der mobile White Screen ist deshalb
weiterhin offen. Diese Vorschau prüft die Wirkung eines einzelnen Kandidaten.
