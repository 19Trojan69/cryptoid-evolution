# Formationen nahe dem HUD: getestete Teilkorrektur und offene Platzgrenze

## Vorgabe und bestätigter Fehler

Am 13. Oktober meldet der Nutzer, dass neue Formationen in den erreichbaren oberen Spielerraum geraten und mit dem hoch platzierten Spieler kollidieren. Hintere Schiffe sollen knapp unter dem oberen HUD stehen, ohne ihn zu berühren. Die neun unterschiedlichen Formationen, Grafikgrößen, kompakter HUD, unsichtbare Marker, Einflugtempo, Schwenken, Steuerung und echte Kollisionsregeln bleiben geschützt.

Der bisherige HUD-Schutz konnte die ganze Formation ausschließlich nach unten verschieben und reservierte zusätzlich 28 px. Er prüfte keinen Abstand zur höchsten erlaubten Spielerposition (Mittelpunkt bei 50 % der Feldhöhe, Kontakt-Radius 27 px). Bei bereits genügend hohem hinterem Reihenplatz verschob er nicht nach oben. Eine neue Formation konnte somit im Spielerbereich enden; Einflüge sind monotone Bögen zwischen ihren Endpunkten und umgehen dieses Platzproblem nicht.

## Implementierte, begrenzte Korrektur

Normaler Testnet-Kampf berechnet einen gemeinsamen Y-Versatz, sodass die vorhandene konservative sichtbare Formationshülle 8 px Abstand zum gemessenen HUD hält. Alle X-Werte und sämtliche relativen Y-Abstände, Größen, Reihenfolge und neun Silhouetten bleiben unverändert. Geprüft wird anschließend, ob jede Zielposition einschließlich echtem Gegner-Radius und Spieler-Kontakt-Radius oberhalb der 50-%-Spielergrenze bleibt. Wenn die unveränderte Formation dort nicht hineinpasst, wird die bisherige Platzierung beibehalten: keine heimliche Kompression, kein Abschalten von Kollisionen, keine verkleinerten Schiffe, keine neue Steuergrenze oder Ladepause. Diese Fälle sind weiterhin offen; die Korrektur ist ausdrücklich KEIN vollständiger Fix für alle Bildschirmgeometrien.

Resize-/HUD-Messung verwendet denselben bidirektionalen Y-Versatz und dieselbe Sicherheitsprüfung. Ein noch einfliegender, restaurierter oder bei Resize versetzter Gegner wird vor der nächsten Swept-Kontaktprüfung mit dem vorhandenen moveAsteroid bei Delta 0 auf seine neue Kurven-Y-Position gesetzt. Der tatsächliche alte Restore-Zweig reproduziert sonst einen falschen Kontakt aus dem alten Frame-Endpunkt. Einflugfortschritt, Dauer, Gesundheit und andere Spielwerte bleiben erhalten; bereits laufende Angriffe werden nicht versetzt. Wiederholte Messungen sind idempotent. Bestehende Wiederherstellung berechnet ihre Ziele über createFormationSlots und verwendet damit die korrigierte Platzierung, wenn sie passt; keine neuen Speicher-/Belohnungswege. Mainnet-Placement, Boss/Eskorten/Bonus, Angriffsmanöver und Einflugdauern bleiben unverändert. Sichtbare Pixeländerung in diesem Schritt ausschließlich die vom Nutzer gewünschte vertikale Platzierung normaler Formationen.

„8 px“ bezeichnet den vorhandenen konservativen Grafik-/Effekt-Envelope. Kein behaupteter pixelgenauer Abstand jedes unterschiedlich geformten Schiffsrumpfs oder native Screenshot-Nachweis.

## Tatsächliche Vorher-/Nachher-Prüfung

Die tatsächliche createFormationSlots-Funktion vor/nach Änderung und die tatsächlichen placePlayer/contactWithEnemy-Regeln wurden für alle 450 normalen Stufen, inklusive aller vorhandenen Flight-Pläne/Offsets, ausgeführt. Die folgenden Maße sind fest definierte Testgeometrien, NICHT gemessene Daten vom Gerät des Nutzers.

| Feld und angenommener gemessener HUD-Unterrand | Kollidierbare Ziele vorher → nachher | Kleinster vertikaler Kontaktabstand vorher → nachher |
|---|---:|---:|
| 390×844, HUD 80 px, Spielerdiameter 104 | 698 → 0 | −12,394 → +7,606 px |
| 430×932, HUD 90 px, Spielerdiameter 107,5 | 0 → 0 | +14,580 → +39,456 px |
| 390×844, HUD 100 px, Spielerdiameter 104 | 1.048 → 792 | −32,394 → −32,394 px: einige Formationen passen nicht |
| 390×700, HUD 64 px, Spielerdiameter 104 | 1.599 → 1.598 | −68,394 → −68,394 px: überwiegend unveränderter offener Konflikt |
| 844×390, HUD 64 px, Spielerdiameter 112 | 3.477 → 3.477 | −169,369 → −169,369 px: unveränderter offener Konflikt |

Gezählt werden überprüfte Zielpositionen über die gesamte Kampagne, keine beobachteten Ereignisse oder verlorenen Leben. Negativer rein vertikaler Abstand zeigt unzureichende Trennung; echte Kontakte berücksichtigen auch das erlaubte X des Spielers. Vollständige acht Geometrien in geometry.json. Dort ist auch der 768×1024-Fall mit verbleibenden zehn Zielen enthalten. Keine Verschlechterung der Kontaktanzahl in diesen Fixtures durch erzwungenes Verschieben einer nicht passenden Formation.

## Tests und unveränderte Darstellung

- 407 Frontend-Tests und 106 Backend-Tests bestanden; Frontend-Produktion einschließlich TypeScript/i18n erfolgreich. Backend-Quellen unverändert; bestehender erfolgreich gebauter Backend-Stand erneut mit 106 Tests geprüft.
- Fünf neue Regressionstests: tatsächliche Platzierung aller normalen Flights, tatsächlicher Einflug/moveAsteroid und Swept-Kontaktprüfung gegen den höchstmöglichen Spieler auf 390×844/HUD 80, bidirektionale/idempotente HUD-Messung plus unverändertes Mainnet-Placement, Beibehaltung bei nicht passender Kurzgeometrie sowie tatsächliche Restore-Zielzuweisung bei einem noch einfliegenden gespeicherten Gegner. Vier scheitern am bisherigen tatsächlichen GamePage-Code; alle fünf bestehen nach der Korrektur. Ein erster neuer Test verlangte irrtümlich zusätzlich 8 px Spielerabstand; das ist nicht die bestehende Kontaktregel. Der Test wurde auf deren tatsächliche Grenze korrigiert, nicht die Treffererkennung geändert.
- Tatsächlicher Node-Simulationsharness: 30 normale Blöcke/drei Bosse, Meme Nebula 5/9, Objektstress, Pause, Hintergrundwechsel, technische Fehlerpause, Save/Restore und null RAF/Timer/Listener nach Unmount. Zusätzlicher Engine-Harness alle 500 Stufen/50 Bosse und Boni bis Victory mit kontrollierten Clears/Schutz. Kein mobiles Langzeitspiel.
- Ressourcenpipeline vom vorherigen Fix weiterhin: 76 vorbereitete Übergänge, 96 Formation-Checks, null erneute Waiting-Callbacks nach Vorbereitung; keine neue Ladeblende durch die Positionsänderung.
- Source-Erhaltprüfung erfolgreich: exakte Ausnahme createFormationSlots, dessen Resize-Auswahl und die Zielzuweisung im Restore über den gemeinsamen retargetFormationY-Helfer. Simulation, Spawn/Bewegung, übriger Restore, Beschädigung/Waffen/Timer, kompletter normaler HUD-/Schiffs-Renderer und geschützte Audiofunktionen bleiben gegenüber vorher unverändert. Alle CSS-/Originalasset-Dateien unverändert. Private Build-Verifikation: alle 464 Originaldateien bytegleich und alle sechs CSS-Hashes erhalten.

Reproduktion: Backend-Build vor Tests, sämtliche src/**/*.test.mjs; frontend npm run build; node --experimental-strip-types scripts/verifyFormationPlacement.mjs; node scripts/verifyStabilityPreservation.cjs; node --expose-gc scripts/verifySimulationStability.cjs; node scripts/verifySceneResources.cjs; node checks/build.mjs und node --experimental-strip-types checks/run-engine.cjs. Die Geometrieprüfung verwendet standardmäßig GitHub-Vorstand 640c43a5fb34fcc935fc449a31683f5c6a82c1aa. Lokal wurde CRYPTOID_FORMATION_BASE=2fa0b3e6158ab62751718f5f02c82a040685eaff gesetzt: beide haben denselben verifizierten Tree 7015697633e3227e9c12c6c0cd56801cbd54d972. Für Vorher-Regressionen kann CRYPTOID_FORMATION_SOURCE auf die aus diesem Vorstand extrahierte GamePage.tsx zeigen. Kein Test-Hook im ausgelieferten Spiel.

## Noch notwendige Entscheidung und Geräteprüfung

Bei kurzen Feldern reicht eine gemeinsame Verschiebung mit unveränderten Reihenabständen nicht. Ein vollständiger nächster Fix würde mindestens die vertikalen Abstände innerhalb der vorhandenen Formationen anpassen müssen; besonders flache Landscape-Geometrien können darüber hinaus auch bei engeren Reihen nicht alle unveränderten Grafiken/Abstände zwischen HUD und bisheriger Spielergrenze aufnehmen. Keine kleinere Grafik, neue Spielergrenze oder andere Kampflogik stillschweigend eingeführt. Vor der zusätzlichen sichtbaren Änderung werden dem Nutzer diese konkreten Befunde zur Freigabe vorgelegt. Das ist eine vorsichtige Auslegung seiner ursprünglichen strengen Erhalt-Vorgabe, keine neu erfundene automatische Freigabeprüfung.

Keine native Browser-/Pi-/WebKit-Ansicht verfügbar, keine mobilen Frame-/GPU-/Heap-/Audio-Messungen. Tatsächliche Nutzer-Feldhöhe/HUD-Unterkante unbekannt; deswegen kein Nachweis, dass sein konkreter Kollisionsfall vollständig behoben ist. Private Ansicht neu laden und insbesondere höchster Spielerstand, neue Reihen/Ersatzformation, HUD-Berührung und Restore prüfen; ursprünglicher 30–60-Minuten-Geräteplan bleibt gültig. Ursprünglicher Rücksprung zur Startseite weiterhin nicht reproduziert oder nachweislich behoben.

## Speicherung und Freigabegrenzen

Erster Runtime-Schritt GitHub 80b925378c2ea2fc72809f481ab0ccae11127723. Finaler Runtime einschließlich Restore-Korrektur: GitHub 2ac65439ea7302574382977cb8e5a21016c26576; lokal 985cd4e7924062231bd1f89a89050d57ffa60bda; identischer Tree b6defce72624a3d0c812652bebc5b5995bb6bc4b. Draft PR160 bleibt offen und ungemerged. Datiertes lokales Backup backup/formation-anchor-20261013-640c43a zeigt auf den verifizierten vorherigen Tree; derselbe vorherige Code bleibt im GitHub-Commit 640c43a5fb34fcc935fc449a31683f5c6a82c1aa. Vorige private Site-Version appgprj_6acd33650fcc8191a7e718e40b8acea5~appgver_22c4eba9c6a08191a5366a02d8ab73ec.

Nur owner-private isolierte Gastansicht, keine Konten/API/Käufe/Datenbank. Öffentliches Testnet/Mainnet und main werden nicht geändert. Datenbankbackup-/isolierter Restore-Nachweis bleibt unbestätigt; öffentliche Freigabe gesperrt. Code-Rücksetzpunkt ist kein Datenbankbackup.

Private Aktualisierung bestätigt: Source 85be0bf04b2d001d688520b5e30c734b3d433583, Deployment appgdep_6acda7f0f87c81919fb329e1dacface0, Version appgprj_6acd33650fcc8191a7e718e40b8acea5~appgver_e4dfbd3057648191a908efbbe4c8a466; succeeded am 13. Oktober 2026, 03:39:47 UTC / 05:39:47 Wien. URL https://cryptoid-stability-private-20261012.xwsk9s27cg.chatgpt.site. Der teilkorrigierte Stand wird als solcher übergeben; Freigabe für engere vertikale Reihenabstände wird anschließend gezielt eingeholt.
