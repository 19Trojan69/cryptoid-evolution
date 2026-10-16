# Neuer Boss-Abbruch – gesicherte Beobachtung vom 16.10.2026

Stand: private V4, Diagnosebranch `codex/crash-diagnosis-20261015`, Ausgangscommit
`7cd65b16c0dec072ca4110af31b1940e4c533b58`. Keine Spieländerung und kein Deployment.

Marc meldet nach dem nächsten Boss erneut einen Abbruch, bezeichnet ihn als
„Boss 31“. Der zuletzt bestätigte V4-Lauf wurde automatisch abgerufen: Revision
49, Serverzeit **16.10.2026 10:01:11,063 Europe/Vienna**. Diese Zeit passt zum neuen
Fehlerbericht um 10:01:51. Die gespeicherte interne Stufe ist 39, zweiter Flug.
Der folgende reguläre Boss würde intern bei Stufe 40 beginnen. Die Zuordnung zur
Nutzerbezeichnung ist noch zu bestätigen.

Letztes Ereignis: `SECTOR_CLEAR` beginnt bei 465.615 ms Laufzeit. Letztes Messfenster:
467.616 ms, `normal/SECTOR_CLEAR/playing`, noch ein Herz, Clear-Zähler 1.377 ms,
20,94 FPS und 119 ms maximaler Frame. Gemessene Simulation P95 etwa 1 ms.
Bildcache: 48 Einträge, geschätzt 17.631.796 Bytes; 119 gestartete/119 beendete
Aufträge, keine ausstehende Bildvorbereitung. 527 DOM-Knoten. Die Cachezahl misst
keinen gesamten JS-/GPU-/WebView-Speicher.

Kein Home-Aufruf, Unmount, Game Over, JavaScript-Fehler oder Loop-Stall am Ende der
bestätigten Spur. Das beweist weder das Ausbleiben eines späteren Fehlers noch
einen Browser-/WebView-Neustart. Die letzten nicht bestätigten Sekunden können
fehlen. Der Bossbeginn selbst ist nicht enthalten. Es darf nicht behauptet werden,
dass ein bestimmter Fehler oder Speicherproblem nachgewiesen sei.

Der unabhängige Server-Prüfpunkt wurde nach dem gemeldeten Ausfall erfolgreich
wiederhergestellt. Der native Tabellenabruf kürzt große JSON-Zellen; die vollständige
Spur wurde deshalb authentifiziert über die bestehende private API abgerufen und
hier komprimiert gesichert. Keine Zugriffsdaten sind enthalten. Server-Fehlerlogs
für das betrachtete Zeitfenster enthalten keine Fehler; sie decken Browserfehler
nicht ab.

Quellenkontrolle: Der Übergang erzeugt bei Stufe 40 zuerst das Bossmodell und
veranlasst anschließend Grafik-/Texturvorbereitung. Der Waffenbildcache ist bereits
auf zwei Einträge begrenzt; ein unbegrenztes Wachstum dieses konkreten Caches ist
im Code nicht vorhanden. Das schließt andere Ressourcenprobleme nicht aus.
Die vorhandenen Simulationen ersetzen Bilddekodierung, Browser und Hardware-Audio;
ein weiterer gleicher Simulationslauf würde den Gerätefehler nicht nachweisen.

Noch benötigt: Browser dieses Laufs und genauer Abbruchzustand (eingefrorenes Bild,
Rückkehr zum privaten Testmenü oder Browser-/Seitenneustart). Danach gezielter
Vergleich von Bossstart, Bild-/Canvas-/Audio-Ressourcen und Navigation. Weiterhin
keine Änderungen an HUD, Bewegungen, Schiffgrößen, Spielmechanik, Testnet oder Produktion.

## Nachtrag

Marc hat Safari bestätigt. Ob nach dem Abbruch ein weißer Bildschirm erschien,
ist ausdrücklich unsicher. Das wird nicht als bestätigter Renderfehler oder
Browser-Neustart behandelt. Siehe `BOSS_ENTRY_V5.md` für die gezielte Messergänzung.
