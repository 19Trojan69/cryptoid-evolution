# Feste 50/50-Aufteilung und sichtbare Stärkegrößen — 13.10.2026

## Korrigierte Vereinbarung

Der Nutzer stellt ausdrücklich klar: Die Hälfte des Spielfelds gehört dem Spieler, die Hälfte den Gegnern; Größen und Formationen müssen hineinpassen. Die vorige formationsabhängige Grenze verletzte diese Vereinbarung. Im angenommenen 393×659/HUD64-Feld konnten normale Levels den Spieler-Mittelpunkt erst ab etwa 69,95–74,10 % der Feldhöhe erlauben. Diese Verkleinerung ist aufgehoben.

Neu wird der nutzbare Bereich unter der gemessenen HUD-Unterkante genau halbiert:

`Trennlinie = HUD-Unterkante + (Feldhöhe − HUD-Unterkante) / 2`.

Beispiel 393×659, HUD64: nutzbar 595 px, obere Gegnerhälfte 297,5 px, untere Spielerhälfte 297,5 px, Grenze y=361,5 px. Schiffsmittelpunkte haben innerhalb ihrer Hälfte einen Hüllen-/Schutzrand; ein Spieler-Mittelpunkt beginnt daher bei y=430,5 px. Das verkleinert nicht die reservierte Hälfte. Der vorhandene untere Bewegungsrand bleibt erhalten. Keine sichtbare Trennlinie/Marker hinzugefügt.

Die Fläche bleibt gleich groß über sämtliche normalen Blöcke, Formationswechsel, Boss/Bonus, eliminierte Gegner und gespeicherte Ziele. Ein ungültiges Ziel vergrößert nicht mehr den Gegnerraum: Schutzpause statt unsichtbarem Kampf oder Startseiten-Navigation.

## Sichtbare Größen und Formationen

Der Nutzer meldete weiterhin ähnlich große erste Gegner. CSS-Kästchen allein belegen keine sichtbare Größenhierarchie: Original-Sprites besitzen stark unterschiedliche transparente Ränder. Die bestehenden 20 Alpha-Bounds wurden direkt gegen alle Original-PNGs geprüft; maximale Rundungsabweichung unter 5e-9.

Normale Testnet-Hüllen werden nach ihrer tatsächlich sichtbaren längsten Alpha-Ausdehnung normiert. Leicht : Mittel : Schwer : Elite = 1 : 1,5 : 2 : 2,5, für sämtliche 20 Hüllen. Ein gemeinsamer deterministischer Größenfaktor hängt nur von der verfügbaren Feldhöhe und dem bestehenden Spielerdurchmesser ab, nicht von FPS, Gerätelast, Kills, Formation oder Qualitätsstufe. In der angenommenen 393×659-Geometrie sind die sichtbaren längsten Hüllen etwa 33,39 / 50,09 / 66,79 / 83,48 px groß. Das sind bewusst passende Layoutgrößen für die obere Hälfte; keine veränderten Texturen oder Partikelbudgets.

Alle neun originalen Formationsvorlagen und ihre zuletzt genehmigte Level-/Flugvariation bleiben. Das stärkste sichtbar größte Schiff bekommt den vorhandenen Zentralanker. Vertikale Abstände werden innerhalb der oberen Hälfte angepasst. Eine obere Reihe bleibt mit kompletter Hülle/Healthbar/Flamme 8 px unter dem HUD. Rumpfabstände berücksichtigen sichtbare Größen; Gegner haben keine gegenseitige Schadenskollision. Physische Radien für Spieler-/Projektiltreffer bleiben unverändert. Normale Angriffe können wie vorher in den Spielerraum eindringen und Schaden verursachen.

Normale Einflugdauern, langsames Pendeln, Seiteneinflug-Geschwindigkeitsgrenze, Bossgrößen und separat genehmigte 125%-Verteidiger bleiben erhalten. Seiteneinflüge verwenden den tatsächlichen Sprite-Kästchendurchmesser der platzierten Hülle, damit der Start außerhalb der Kante liegt. Kein neuer Ladezustand oder Warteintervall. Mainnet behält die ursprünglichen Größen/Grenzen.

## Zusätzlich gefundener Übergangsfehler

Die erste vollständige 50/50-Version steckte nach Boss 1 fest: Die bisherige feste Herz-/Shard-Position bei 58 % lag außerhalb des erreichbaren Spielerraums. Beide echten Simulationsharnesses scheiterten dadurch vor Bonus/Levelwechsel. Das wurde vor Aktualisierung der Testansicht gefunden und korrigiert.

Der vorhandene Belohnungspunkt wird jetzt im Bereichscache auf eine legal erreichbare Position innerhalb der Spielerhälfte gesetzt. Rendering und physische Sammlung nutzen dasselbe Objekt. Bild, Sammelradius 38 px, Sound, Wartezeit, Herz-/Shard-Wert und einmalige Vergabe bleiben exakt erhalten. Die Collection-Funktion erhält nur ein optionales Positionsargument; Mainnet/alte Aufrufer verwenden den Originalpunkt. Tests sammeln für nicht volle/volle Herzen, serialisieren den bereits vergüteten Zustand und belegen anschließend keine zweite Vergabe. Alte feste Position: Sammelregression scheitert; neue legale Position: erfolgreich.

## Nachweise

410 Frontend-Tests und 106 Backend-Tests erfolgreich. Produktionsbuild inklusive TypeScript/i18n und Backend-Build erfolgreich. Bestehende Bundle-Größenwarnung bleibt. Rohdaten in `docs/half-field-2026-10-13/`.

- Alle 450 normalen Stufen/5.635 Flüge auf sieben angenommenen Feldgrößen (393×659, 320×568, 390×844, 430×932, 768×1024, 1280×720, 800×600) passen in die feste obere Hälfte. Kein Kontakt am höchsten legalen Spielerstand, einschließlich abgetasteter Einflüge und echtem Swept-Kontaktcode. 6.230 geprüfte seitliche Schiffsrouten.
- Sichtbare Hüllenverhältnisse für alle 20 Original-Sprites und fünf Bildschirmgrößen geprüft; Zentralanker bekommt jeweils höchste sichtbare Klasse. Neues/gespeichertes Ziel kann den Teiler nicht verändern. Echte Cachefunktion bleibt in Normal-, Boss- und Bonusphase auf derselben Grenze.
- 10.000 unveränderte Cacheaufrufe rund 27,1 ms im parallel belasteten Node-Lauf, eine Formationsrechnung über neun Blöcke. Keine DOM-Layoutberechnung oder neue Allokation im Schießcode. Das ist keine mobile Framezeit; Unterschiede zum vorigen Einzellauf sind nicht als Leistungsregression/Verbesserung interpretierbar.
- Echte Schießlogik vorher/nachher bytegleich: Waffenlevel 1/2 je 31 Salven in 10 s, Level 3/4/5 je 45, identische Zeitpunkte/Schaden/Seitengeschwindigkeiten. Projektilgeschwindigkeit unverändert 64 px/100 ms. Gesamtsimulation bleibt außer genehmigter Spielergrenze und notwendigem Boss-Sammelpunkt identisch. Trefferlogik, Geschwindigkeit und Timer werden nicht herabgesetzt.
- 30 normale Blöcke/drei Bosse, Meme Nebula 5/9, dichte Projektile/Effekte, Pause/Hintergrund/Fehlerpause und Save/Restore erfolgreich. 500-Stufen-/50-Boss-/Bonus-Durchlauf bis Victory erfolgreich. QA-Clears/zusätzliche Leben und Hardware/API-Stubs existieren ausschließlich im Testharness.
- Bestehende Ressourcenprüfung: 76 vorbereitete Übergänge und 96 Formationschecks, null unnötige Waiting-Callbacks. Asset-/CSS-/Audio-Erhaltungscheck erfolgreich; keine neue Cache- oder Loop-Parallelstruktur.

| Gleicher kontrollierter 30-Block-Lauf | Vorher | Nachher |
| --- | ---: | ---: |
| Spitzen Gegner / Spielerprojektile / Gegnerprojektile / Effekte | 6 / 82 / 80 / 16 | 6 / 82 / 80 / 16 |
| GC-Heap erster → letzter Snapshot, MiB | 29,311 → 29,931 | 29,474 → 30,184 |
| GC-Heap Minimum / Maximum, MiB | 29,195 / 30,117 | 29,224 / 30,184 |
| RAF / Timer / Listener nach Unmount | 0 / 0 / 0 | 0 / 0 / 0 |

Einzelne Node-Messungen erfassen weder Grafik-/Audio-/Browser-Heap noch GPU-/OS-Speicher. Keine Behauptung gleichbleibender mobiler FPS oder garantierter Absturzfreiheit. Die ursprüngliche Startseiten-Rückkehr ist weiterhin nicht reproduziert oder als behoben nachgewiesen.

## Grenzen und Geräteprüfung

Sehr flaches 844×390/HUD64-Feld: 30 spätere normale Stufen passen nicht mit unveränderten physischen Radien; kontrollierte Schutzpause. Die Spielerhälfte wird auch dort nicht verkleinert. Die tatsächlichen DOM-Maße des Nutzergeräts sind weiterhin unbekannt. Kein echter Pi Browser/WebKit oder unterstütztes Browser-QA verfügbar, daher kein aktueller Pixel-/Hör-/FPS-Gerätenachweis.

Private Ansicht nach Aktualisierung neu laden. Gleich große Stärkeprofile dürfen gleich groß erscheinen; bereits gespeicherte Klassen/Gesundheit bleiben original, die grafische Rumpfnormierung wirkt auch auf sie. Für die zuletzt restaurierte komplette Stärkemischung einen neuen Gastlauf beginnen. Mindestens 30–60 Minuten und 30 Blöcke einschließlich Bossen, Meme Nebula 5/9, Maximalwaffen/dichten Effekten, stärkstem Spieler-Hochflug, mehreren Level-/Formationswechseln und Boss-Belohnung bis Bonus prüfen. Pause, Hintergrund/Sperrbildschirm, Reload/Restore wiederholen. Auffälligkeiten mit URL/Build/Gerät/Browser/Level/Block/Zeit festhalten und begrenzte lokale Diagnosen manuell exportieren (Frames, Lifecycle, Kategorie, Navigation und bestätigter Save). Keine automatische Datenübertragung. Echte Konten/Käufe/Backend-Checkpoints sind im Gastspiel isoliert.

## Backup, Rücksetzen und Veröffentlichung

Vorheriger Remote-Stand `bb00de2b0411a751467875d686834bb45935d0f7`, lokal gleicher Baum `8d0d97bf7ef823e594028951c879e55da39c3890` bei `7ae4114488c5621133ec939ca83657dc0591ac09`. Datierter lokaler Rücksetzpunkt `backup/half-field-20261013-bb00de2`.

Bisheriger privater Site-Source `3aafe636764d1bab962c56b29c6ca6ebbc1102b7`; Version `appgprj_6acd33650fcc8191a7e718e40b8acea5~appgver_6c6ac94ee0e08191bb94f7b4db6f2878`; Deployment `appgdep_6acdb4d32df88191a189834852eb03a4`. Source wurde nach Workspace-Wartung über denselben privaten Site wiederhergestellt; keine Kopie realer Daten.

Nur bestehender owner-private Site wird aktualisiert. Kein öffentlicher Testnet-/Mainnet-Deploy, Main-Merge, Kostenupgrade oder Live-DB-Eingriff. DB-Backup und isolierter Wiederherstellungsnachweis weiterhin unverifiziert; öffentliche Veröffentlichung bleibt gesperrt. Neue private Provenienz wird nach erfolgreicher Aktualisierung ergänzt.


## Erfolgreiche private Aktualisierung

13.10.2026 07:31:00 Europe/Vienna: bestehender owner-private Site erfolgreich aktualisiert. URL https://cryptoid-stability-private-20261012.xwsk9s27cg.chatgpt.site .

Runtime lokal `c8994d549dbf3e768dc287384db05dce6e4d0d13`, Remote `e84281e747f5c67a1d599ae68d609d238d0508f1`; gleiche geprüfte Git-Tree `d0675c4ee9f20fe5b561d4e204e8beee48c81ad8`. Site-Source `bbe80e744c357c2ee80148674723d879fee89237`, Version `appgprj_6acd33650fcc8191a7e718e40b8acea5~appgver_195ba74ca99c8191a5ec7aa053d8f083`, Deployment `appgdep_6acdc201bacc81919215ee537ddf14c0`, succeeded. Provenienz separat in private-deployment.json.

Alle 464 Originaldateien bytegleich und alle sechs erzeugten CSS-Hashes identisch mit der vorigen privaten Version. Der finale kumulative Sourcecheck wurde erneut ausgeführt; seine Kategorien benennen jetzt sowohl Stärkegrößen als auch den notwendigen Boss-Sammelpunkt ausdrücklich (preservation-final.json). Diese Berichtsänderung beeinflusst keine ausgelieferte Laufzeitfunktion. Der erfolgreiche Deploy beweist die Bereitstellung, keinen mobilen Grafik-/Audio-/Langzeitlauf. Öffentliche Testnet/Mainnet-Domains wurden durch diese Arbeit nicht verändert.
