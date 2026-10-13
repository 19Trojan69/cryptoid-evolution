# Spielerbereich, Stärkengrößen und Formationsvielfalt — 13.10.2026

## Grundlage und bestätigte Probleme

Fortsetzung auf `codex/stability-audit-20261012`, Draft-PR 160. Vorheriger Remote-Stand `80b7b364e2e3f820c417bebf10178436ace7450f`, lokal gleicher Baum bei `c070f7e0745401abd3dd2ceabd79e36be329e725` (Baum `dd41e366c703b6d50e46021d942d4ae2fd076434`). Lokaler datierter Rücksetzpunkt `backup/combat-areas-20261013-80b7b36`. Bestehende Arbeit und die genehmigte Testnet-Linie bleiben erhalten.

IMG_5312 zeigt Level 1, Block 6/9 und ein Spielerschiff zwischen den unteren Gegnern. Die gemessene DOM-Feldhöhe und tatsächliche HUD-Unterkante dieses Geräts sind unbekannt. 393×659/HUD64/Spieler94 ist eine ausdrücklich angenommene Testgeometrie.

Bestätigte Codebefunde:

- Bis Stufe 29 wurden Block 1/6 auf ausschließlich leichte Gegner reduziert. Weitere frühe Blöcke hatten ebenfalls eine reduzierte Mischung. Ein tatsächlich leichter Gegner kann keine höhere Stärkengröße darstellen.
- Die bestehende 1,5-fache leichte Darstellung war bei Basis-Spielerdurchmesser 94 etwa 82,5 px groß; ein mittlerer Gegner war etwa 79,2 px groß. Damit fehlte eine konsistente Größenhierarchie.
- Die feste obere Spielergrenze bei 50 % reservierte keinen Platz für die vollständige Formation. Die vorige reine HUD-Verschiebung konnte kurze Felder nicht beheben.
- Derselbe Block wählte bei aufeinanderfolgenden sichtbaren Levels dieselbe Formation. Die neun vorhandenen Vorlagen wurden nicht ausreichend über Levels und zusätzliche Flüge variiert.

Das sind unabhängige Befunde der Darstellung/Platzierung. Keiner ist als Ursache des ursprünglichen Rücksprungs zur Startseite nachgewiesen.

## Korrekturen und ausdrücklich sichtbare Auswirkungen

Die jüngsten Nutzeranweisungen erlauben Stärkegrößen, Formationsvielfalt, die Begrenzung des Spielerraums und zurückhaltende seitliche Einflüge. Diese Ausnahmen sind in frontend/AGENTS.md festgehalten.

- Normale Testnet-Gegner erhalten nach vorhandener Klasse die Basisdiameter 82,5 / 110 / 137,5 / 165 px (leicht/mittel/schwer/Elite), gemeinsam mit dem bisherigen Spielerskalierungsfaktor. Leichte Schiffe behalten ihre bisherige Größe; Boss-Verteidiger behalten separat die genehmigten 125 %. Physische Radien bleiben unverändert.
- Die vollständige originale Mischung der vorhandenen Stärkeprofile wird auch früh verwendet. Pro Profil bleiben Gesundheit, Schaden, Punkte und Shards original. **Die Gesamtgesundheit und Gesamtbelohnungen früher Blöcke unterscheiden sich dadurch von der zuvor vereinfachten Leicht-Mischung.** Vorhandene gespeicherte Gegnerprofile/Gesundheit und bereits gebuchte Belohnungen werden nicht neu geschrieben.
- Alle neun vorhandenen Formationsformen bleiben; ihre Auswahl rotiert über sichtbare Levels und weitere Flüge. X-Geometrie bleibt aus diesen Vorlagen. Nur notwendiger vertikaler Abstand/Platzierung wird angepasst. Der oberste sichtbare Umschlag aus Originalhülle, Healthbar und bestehender Flamme beginnt 8 px unter dem HUD.
- Der Spieler bleibt unter dem unteren Formationsextent inklusive Hülle/Schutzabstand. Die Grenze ist für alle neun normalen Blöcke desselben Levels und deren endliche Folgeflüge stabil. Eliminieren von Gegnern öffnet keinen gegnerischen Raum. Touch, Maus und Tastatur nutzen denselben Wert. Normale Angriffe können weiterhin den Spielerraum betreten und Schaden verursachen.
- Seitliche Einflüge beginnen außerhalb der nächstgelegenen Kante im Gegnerbereich. Sie werden nur verwendet, wenn ihre abgetastete Spitzengeschwindigkeit höchstens der ursprünglichen Route entspricht. **Einflugdauer und Bereitschaft werden dabei nicht verlängert.** Sonst bleibt der ursprüngliche obere Einflug. Kein neuer Lade-/Überblendungszustand.
- Die Bereichsgeometrie wird nur bei Level-, Boss-/Bonus-, Größen-, Regel- oder Restore-Wechsel gerechnet; pro Frame wird ein kleiner Cache geprüft. Kein Layoutlesen und keine Formationsberechnung im Schießcode.
- Reload/Restore invalidiert den Cache. Eine erforderliche Positionskorrektur setzt auch die letzte Kollisionsposition, sodass die Korrektur keinen künstlichen Swept-Hit erzeugt. Gesundheit, Save-Format und Belohnungsbuchungen bleiben unverändert.
- Mainnet benutzt weiterhin die alten Größen, Platzierung und Spielergrenze. Kein Main-Merge oder öffentlicher Deploy.

## Testnachweise

Rohdaten in `docs/combat-areas-2026-10-13/`.

- 408 Frontend-Tests, 106 Backend-Tests erfolgreich. Produktions-Build inklusive TypeScript/i18n und Backend-Build erfolgreich. Bestehende große Bundle-Warnung bleibt.
- Sieben angenommene Felder: 393×659, 320×568, 390×844, 430×932, 768×1024, 1280×720, 800×600. Alle 450 normalen Stufen mit insgesamt 5.635 Flügen und 5.769 seitlichen Schiffsrouten geprüft. Keine Kontaktkollision am höchsten legalen Spielerstand, auch bei 32 abgetasteten Einflugpositionen. Formations-/HUD-Nachweise prüfen zusätzlich tatsächliche Grafikextents.
- Tatsächliche GamePage-Cachefunktion: 10.000 unveränderte Prüfungen etwa 15 ms insgesamt auf dieser Node-Maschine; eine Geometrieberechnung über neun Blöcke. Diese Zahl ist keine mobile Framezeit und kann je Lauf schwanken.
- Tatsächlicher Schießcode vorher/nachher exakt gleich: in 10 s Waffenlevel 1/2 je 31 Salven, Level 3/4/5 je 45, mit identischen Zeitpunkten, Schaden und Seitengeschwindigkeiten. Projektilbewegung unverändert 64 px/100 ms. Durch den tieferen legalen Spielerstand kann der Flugweg bis zum Gegner länger sein; Geschwindigkeit und Feuerrate bleiben gleich.
- Reale Simulation mit kontrollierten QA-Clears/zusätzlichen Leben: 30 normale Blöcke, drei Bosse, Meme Nebula 5/9, dichtes Feuer/Effekte, Pause/Hintergrund/Fehlerpause/Save-Restore. 771,764 simulierte Sekunden. Separate Engine-Prüfung alle 500 Stufen/50 Bosse/Bonus bis Victory. Nur Testfixtures verschieben einen Pickup vor künstlicher Sammlung in den legalen Spielerraum; die ausgelieferte Version enthält keine Cheats.
- Ressourcenpipeline unverändert erfolgreich: 76 warme Übergänge, 96 Formationsprüfungen, null erneute Waiting-Callbacks nach Vorbereitung. 1.321 temporäre Canvas-Flächen freigegeben, 685 Blob-URLs widerrufen; kontrollierter Cache nach 100 Batches 48 Einträge/8 Quellen/0 pending. Node-Images/Canvas sind begrenzt aussagekräftig.

| Vergleich gleicher 30-Block-Harness | Vorher | Nachher |
| --- | ---: | ---: |
| Spitzen Gegner / Spielerprojektile / Gegnerprojektile | 6 / 82 / 80 | 6 / 82 / 80 |
| Spitzen Effekte | 14 | 16 |
| GC-Heap erster → letzter Snapshot, MiB | 29,243 → 29,787 | 29,311 → 29,931 |
| GC-Heap Minimum / Maximum, MiB | 29,087 / 29,946 | 29,195 / 30,117 |
| RAF / Timer / Listener nach Unmount | 0 / 0 / 0 | 0 / 0 / 0 |

Gegnerstärken und damit Ereignisse unterscheiden sich absichtlich; diese Einzelmessungen beweisen weder ein mobiles Speicherlimit noch eine FPS-Verbesserung. Keine monoton unbeschränkte Objektliste im endlichen Harness. Keine neue mobile Framezeiten-, GPU- oder Prozessspeichermessung möglich.

Der kumulative Erhaltungscheck prüft zuerst die bisherigen genehmigten Korrekturen am unveränderlichen Stand c070f7e gegen 16fcfb4 und anschließend den aktuellen Quellcode mit dem neuen konkreten Geometrie-/Schießcheck. Simulation außer Spielergrenze, Save/Restore außer Cacheinvalidierung, Bossrenderer, Audiosamples/-logik, Styles und Original-Assets werden eng geprüft. Die alten Berichte bleiben historisch unverändert.

## Grenzen, Geräteprüfung und Absturzstatus

Das extrem flache Feld 844×390/HUD64/Spieler112 bietet mit unveränderter Grafik keinen Platz. Es wird vor Kampf kontrolliert technisch pausiert, ohne Rückkehr zur Startseite oder unsichtbaren Kampf. Das ist eine dokumentierte Einschränkung, kein Nachweis für jeden möglichen Browserrahmen.

Kein echter Pi Browser/WebKit und keine unterstützte Browser-QA verfügbar. Die private Ansicht übernimmt dieselben Ressourcen/Styles; ein pixelgenauer und hörbarer Gerätevergleich ist nicht erfolgt. Flüssigkeit beim Boss und tatsächliche neue Formationsabstände müssen auf dem Gerät geprüft werden. Der ursprüngliche Rücksprung ist weiterhin nicht reproduziert oder als behoben nachgewiesen; OS-Beendigung, History/Auth und Frontendfehler sind keine bewiesenen Ursachen.

Konkreter Gerätetest (30–60 Minuten): private Ansicht neu laden; ein normaler Durchlauf mit mindestens 30 Blöcken einschließlich Bossen und Meme Nebula 5/9. Am oberen Spielerlimit neue Reihen und Ersatzformationen beobachten, Formationswechsel/Seiteneinflüge über mehrere Levels vergleichen, alle Waffenstufen und dichte Boss-Effekte testen. Zwischendurch mehrfach Pause, Hintergrund/Sperrbildschirm 30–60 s, Resume, bestätigten lokalen Save und Reload/Restore prüfen. Derselbe Spielfortschritt darf nicht doppelt Belohnungen erhalten. Bei Auffälligkeit URL, Build-ID, Gerät/Browser, Level/Block und Zeitpunkt festhalten und die vorhandenen lokalen Diagnosen manuell exportieren. Lange Frames, Lifecycle-Lücken, Fehler-/Navigationskategorie und letzte bestätigte Speicherung auswerten; Neustarthinweise bleiben vorsichtig. Keine automatische Diagnoseübertragung. Reale Konto-/Kauf-/Backend-Wiederherstellung ist im isolierten Gastspiel absichtlich nicht verfügbar und braucht separat ein geschütztes Testkonto.

## Schutz und Rücksetzen

Nur der bestehende owner-private Site wird aktualisiert; keine öffentliche Testnet-/Mainnet-Veröffentlichung, kein Kostenupgrade, keine Live-Datenänderung. Datenbankbackup und isolierter DB-Restore weiterhin **nicht verifiziert**; damit bleibt öffentliche Veröffentlichung gesperrt. Ein Codebranch und ein Gameplay-Save sind kein DB-Backup.

Code-Rückweg: Baum dd41e366 am lokalen datierten Backup bzw. Remote-Commit 80b7b364. Private Site-Rückweg: bisheriger Source-Commit 85be0bf04b2d001d688520b5e30c734b3d433583, Version appgprj_6acd33650fcc8191a7e718e40b8acea5~appgver_e4dfbd3057648191a908efbbe4c8a466, Deployment appgdep_6acda7f0f87c81919fb329e1dacface0. Neue Deploymentprovenienz wird nach erfolgreicher privater Aktualisierung separat ergänzt.


## Erfolgreiche private Testansicht

13.10.2026 06:34:50 Europe/Vienna: Native private Veröffentlichung erfolgreich. URL https://cryptoid-stability-private-20261012.xwsk9s27cg.chatgpt.site . Bestehender Eigentümerzugriff unverändert.

- Runtime lokal `637171ab6e2459b00112d5d83d1c6feede440599`, Remote `b665800ef431ea030d050ac581ad7e4e822403bf`, verifiziert gleicher Baum `e8941bb3303bb8414054a804e89d78ffe4878645`.
- Site-Source `3aafe636764d1bab962c56b29c6ca6ebbc1102b7`.
- Version `appgprj_6acd33650fcc8191a7e718e40b8acea5~appgver_6c6ac94ee0e08191bb94f7b4db6f2878`; Deployment `appgdep_6acdb4d32df88191a189834852eb03a4`, Status succeeded. Kein Browsernachweis durch diesen Status.
- Alle 464 Original-Assets bytegleich; die sechs tatsächlich erzeugten CSS-Hashes sind mit der vorherigen privaten Version identisch.
- Die Nachweis-Scripts verwenden jetzt den gemeinsamen unveränderlichen Basisbaum dd41e366 statt einer nur lokal existierenden Commit-Metadaten-SHA. Erneuter kumulativer Erhaltungscheck erfolgreich; Änderungen betreffen keine Laufzeitfunktion. Nachweisdaten refreshed.

Die Ansicht neu laden. Für die neue vollständige Stärkemischung einen neuen Gastdurchlauf beginnen: eine bereits gespeicherte Gegnerformation behält absichtlich ihre originalen Klassen/Gesundheit, bis der nächste reguläre Flug entsteht. Keine realen Konten, Käufe oder Backend-Saves in dieser isolierten Ansicht. Kein öffentlicher Deploy oder Main-Merge.
