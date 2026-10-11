# Freigegebene Testnet-Kampfvariation

Basis ist der tatsächlich bereitgestellte Testnet-Commit `08aec53a98d2a693656e6beee2a78da9ba64204b`. Die Integration gilt ausschließlich bei `shipSaveNetwork === 'testnet'`, für alle 450 normalen Kampfblöcke der 50 sichtbaren Level. Git-main und das Mainnet-Projekt bleiben unberührt.

## Verhalten

- Erste Gegner nach ungefähr 0,7 Sekunden. Frühe Einflüge dauern 1,3 Sekunden (schwere Gegner 1,9 Sekunden); spätere Einflüge werden schrittweise schneller. Normale Blockübergänge dauern 1,15 bis 1,75 Sekunden.
- Einflug von oben, links, rechts, beiden Seiten und versetzten Bahnen. In ausgewählten Blöcken bewegt sich die ruhende Formation langsam seitlich. Bestehende Angriffsmanöver werden schrittweise eingeführt; 900 ms Warnung vor Angriffen. Die vorhandenen Obergrenzen gleichzeitiger Angreifer und Projektile bleiben maßgeblich.
- Die ersten drei sichtbaren Level haben kuratierte leichte, mittlere und schwere Gegner. Danach wird lediglich die bestehende Zusammensetzung innerhalb einer Gruppe umgeordnet: dieselben Profile, HP, Größen, Punkte und Shards. Kein neuer Gegner- oder Schusstyp.
- Vorhandener Waffenfund nach mindestens 18 aktiven Sekunden an einem sicheren, erreichbaren Ort. Ein maximal ausgerüstetes oder bereits durch die Schiffsstufe verbessertes Schiff erhält ein sinnvolles vorhandenes Rapid-/Overdrive-Power-up. Gemeinsame Typenliste, maximal drei aktive Pickups, bestehende Dauer und Sammellogik bleiben erhalten. Fehlende sichere Position verschiebt den Fund.
- Kurze Hinweise auf Formation, Combo und unbeschädigte Welle; Erfolg nutzt die bestehenden Combo-/Formationswerte und einen vorhandenen Erfolgssound. Keine zusätzlichen Erfolgsbelohnungen.
- Gelegentliche Gesteinsasteroiden: erster möglicher Versuch nach 28 Sekunden, danach 25–50 Sekunden Abstand mit 72 % Zufallswahrscheinlichkeit. Maximal zwei gleichzeitig und zwei Ereignisse je Block; bei unsicherer Position entfällt der Versuch. Keine Boss-/Bonus-/Belohnungsphasen, kein Schiffskollisionsschaden. Kleine/große Ziele benötigen 2/5 Schadenspunkte und geben 75/150 % der Punkte eines leichten Gegners (anfangs 8/15), keinerlei Shards oder zerstörte-Gegner-Zähler.
- Steinmaterial entspricht dem 192-px-Minigames-Material mit Kratern, Körnung, Rissen, Licht und Schatten. Sieben gecachte Texturen, höchstens sechs Treffer-/Zerbersteffekte mit höchstens neun Fragmenten, Canvas-DPR maximal 1,5. Eigenes kurzes Bruchaudio mit vier gecachten Puffern und bestehendem Stimmenlimit.

## Speicherung und Kompatibilität

Die bestehenden endlichen Gruppenpläne (`rulesVersion` 1/2) werden unverändert verwendet. Insbesondere werden keine neuen Gruppengrößen eingeführt, da die etablierte Testnet-API diese serverseitig validiert.

Optionale Kampfmetadaten sind im vorhandenen, erweiterbaren `combat.state.combo.variety` gespeichert. Der bestehende Checkpoint-Parser der bereits laufenden Proxy-API erhält dieses Objekt. Es umfasst aktive Uhr, bereits erzeugten frühen Fund, nächste Asteroidenzeit, Ereignislimit und Rest-HP/Position lebender Asteroiden. Punkte bleiben ausschließlich im bestehenden Snapshot. Fortsetzen spielt keine Zerstörung erneut ab. Ältere Speicherstände bleiben lesbar; dort wird der garantierte frühe Fund konservativ als bereits vergeben behandelt. Normale Speicher-, Inventar-, Zahlungs- und Ranglistenfunktionen werden nicht ersetzt.

## Prüfung

- 332 Frontend-Regeltests, 106 Backend-Regel-/Handler-Tests sowie 12 Sprachtests bestanden. Frontend- und Backend-Build erfolgreich; vollständige Freigabe-Sprachprüfung erfolgreich.
- Zusätzlich actual-engine-Simulation: früher Gegner, eingesammelter Single→Twin-Fund, Pause/Fortsetzen, einmalige Asteroidenpunkte ohne Shards, kompatibler Checkpoint-Roundtrip, Neustart, maximales Loadout. Der echte Übergangsloop erreicht alle 500 Stufen, 50 Boss-/Herz-/Bonusrunden und den Kampagnensieg; Gegner und Bosse werden in diesem Test skriptgesteuert besiegt. Das beweist keine menschliche Schwierigkeit oder Gewinnrate.
- 307 originale Größen-/Schiffs-/Power-up-/Projektildateien und Audio-/Schiffsassets bytegleich. Sämtliche vorhandenen GameAudio-Methoden bytegleich; einzig eine neue eigene Rock-Audiomethode ergänzt.
- Smartphone-/Tablet-Pfade numerisch geprüft. Physischer Pi Browser, iPhone und Xiaomi Pad 7 sowie reale Geräte-FPS noch nicht geprüft.

Engine-Simulation: im Frontend `node checks/build.mjs && node checks/run-engine.cjs`. Die Hooks/UI werden in diesen Tests ersetzt, der eigentliche Spielablauf kommt aus dem unveränderten Produktions-GamePage-Modul mit ausschließlich temporären Test-Inspektionszugängen. Keine Testzugänge werden in den Spielbuild eingebaut.
