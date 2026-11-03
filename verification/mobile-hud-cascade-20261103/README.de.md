# Gezielter Smartphone-HUD-Kandidat

Die eingefrorenen Spielquellen bleiben auf ac98e95166b0e2013186257904da46323840dab5.
Diese Vorbereitung speichert ausschließlich einen kleinen Patch und dessen
Verifikation. Es wird keine neue Spielversion veröffentlicht.

In frontend/src/index.css steht die mobile Regel mit backdrop-filter:none
unmittelbar vor der allgemeinen HUD-Regel mit backdrop-filter:blur(10px).
Bei gleicher Spezifität gewinnt die spätere allgemeine Regel. Die
nachgeladenen CSS-Dateien aus main.tsx setzen diesen HUD-Wert nicht zurück.
Die mobile Entlastung ist deshalb unwirksam.

Der Patch vertauscht genau diese beiden unveränderten Zeilen. Die Hintergrund-
weichzeichnung des HUD fällt auf Breiten bis einschließlich 700 CSS-Pixeln weg.
Andere Breiten behalten den bisherigen Filter. Die ursprünglichen Farben,
Hintergründe, Geometrien und sämtliche Spiel-/Grafik-/Tondateien bleiben gleich.
Dies stellt die bereits im Code vorgesehene mobile Regel wieder her, garantiert
aber keine identischen gerenderten Pixel: Der Unterschied des Hintergrundfilters
ist die ausdrückliche untersuchte Darstellungskomponente.

Die Prüfung verwendet alle tatsächlichen CSS-Imports der main.tsx und einen
synthetischen HUD. Chromium und WebKit müssen an sechs Breiten den alten Fehler
sowie das korrigierte Ergebnis liefern; alle anderen berechneten HUD-Eigenschaften
und die Geometrie müssen gleich bleiben. Fehlende Browser oder Assertions
beenden den Job mit Fehler. Ein grüner Stiltest ist kein bestandener Spieltest,
keine RAM-/GPU-Messung und keine White-Screen-Behebung.

Die lokale direkte Browserprüfung konnte nicht starten, weil die Browserdateien
in dieser Arbeitsumgebung fehlen. Sie zählt nicht als bestanden. Der Patch
wird deshalb mit dem bereits im Projekt verwendeten Playwright 1.62.1 auf dem
kostenlosen Standard-Linux-Runner des öffentlichen Repositorys geprüft.
Es werden keine Konten, Zahlungen, privaten Besitzerberichte, Gerätesitzungen,
Vercel-Deployments oder Produktionsversionen verändert.

Technische Primärquelle zum zu prüfenden Performance-Risiko:
https://web.dev/articles/backdrop-filter
