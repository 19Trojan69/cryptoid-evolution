# Testnet: langsames Gegnerpendeln und leicht langsamere Einflüge

Marc meldete nach der Testnet-Prüfung am 12. Oktober 2026, dass das langsame Hin-und-her-Pendeln fehlt und die Formations-Einflüge minimal zu schnell sind. Er präzisierte, dass er die ruhenden Gegner nach dem Formationsaufbau meint. Diese zwei Bewegungsänderungen sind ausdrücklich autorisiert; HUD, Markerfreiheit, Darstellung, Sounds und übrige Mechanik bleiben erhalten.

## Befund und Änderung

Die vorhandene Pendelfunktion war auf entryStage 3, 5 und 8 beschränkt. Andere Einflugkennungen und ältere gespeicherte Gegner mit internen Sektorwerten/fehlender Kennung blieben stationär. Die Einschränkung besteht bereits in der freigegebenen Testnet-Grundlage; sie wurde nicht durch den Resource-Cache eingeführt.

Normale ruhende Testnet-Gegner verwenden jetzt durchgehend die vorhandene Sinusbewegung: maximal 12 px bzw. 2,5 % der Spielfeldbreite, Frequenz .0009 pro Simulationsmillisekunde, Periode etwa sieben Sekunden. X bleibt innerhalb des Felds, Y und Formationsziele bleiben gleich. Der Pendelstart zieht die vorhandene Setzzeit ab und beginnt damit ohne den zuvor beobachteten kleinen ersten Versatz am Formationsplatz. Bewegung läuft im bestehenden Delta-Loop, ohne neue Timer oder zusätzliche React-Updates. Bossbegleiter und Mainnet behalten ihren bisherigen Bewegungspfad.

Normale Testnet-Einflugdauern werden mit 1,1 multipliziert (10 % länger, rund 9 % weniger Geschwindigkeit). Frühe normale Gegner: 1300 → 1430 ms; Heavy: 1900 → 2090 ms. Pfad, Start/Ziel, Reihenfolge, Spawn-Abstand, 180-ms-Setzzeit und alle Angriffsmanöver bleiben gleich. Bossbegleiter behalten 1850-ms-Einflug und 300-ms-Setzzeit; Bonusrunden/Bosse unverändert. Keine Änderung an Gesundheit, Radius, Schadenswerten, Punkten, Shards, Waffen oder Sounds.

## Verifikation

- Neue Tests führen die tatsächlichen spawnAsteroid/moveAsteroid-Funktionen aus GamePage per TypeScript-AST aus. Zwei neue Verhaltenstests scheiterten vor der Korrektur: fehlendes Pendeln bei anderen Kennungen und unveränderte Einflugzeit. Ein zusätzlich gefundener erster Pendelversatz wurde beim Start der Bewegung korrigiert.
- Danach alle **374 Frontend-Tests erfolgreich**, keine Ausschlüsse. Geprüft: Hin- und Herbewegung bei 320/390/768/1280 px, fehlenden sowie allen frühen und alten 26/500-Kennungen, begrenzte Amplitude, ruhiger Übergang, gleiche Position nach gleicher Zeit bei 30/60/120 Hz, unveränderte Mainnet-/Escortbewegung, alle 450 normalen Stufen und unveränderte Kampfprofile/Docking.
- Produktions-Build einschließlich TypeScript/i18n erfolgreich. Die CSS-Datei behält unverändert den Hash index-jaywVuOe.css; keine Style-/Audio-Datei wird in diesem Commit verändert. Die bestehende Warnung über große Vite-Chunks bleibt.
- Tatsächliche GamePage-Simulation erneut: 30 normale Blöcke und Bosse 10/20/30, Meme Nebula 5/9, alle neun Einflugskennungen, ursprünglicher HUD und keine Marker. Neue Einflugzeiten, Stressobjekt-Freigabe, Pause/Hintergrund/Fehlerpause, wiederholte Wiederherstellung und null RAF/Timer/Listener nach Unmount erfolgreich.
- Vorhandener Engine-Harness erneut bis zum Ende aller 500 Stufen, 50 Bosse und Bonusrunden erfolgreich; fallende Power-ups und geschützte Timer bleiben erhalten.
- Backend unverändert; der vorherige erfolgreiche Lauf mit 106 Tests bleibt gültig. Kein erneuter Backend-Lauf nötig.

Rohdaten: stability-performance-2026-10-12/simulation-restored-sway.json und campaign-500-restored-sway.json. Tests sind beschleunigte Node-Simulationen mit UI/Hardware/API-Stubs, keine reale Pi-Browser-/GPU-/Audio-Langzeitmessung. Der ursprüngliche Absturz bleibt nicht reproduziert; keine Garantie der Absturzfreiheit.

Release nur ins bereits autorisierte Testnet, kein Main-Merge oder Mainnet-Release. Die isolierte private Vorschau bleibt als dokumentierter vorheriger Stand 0c4a6e7 erhalten; sie ist nicht der öffentliche Testnet-Link.
