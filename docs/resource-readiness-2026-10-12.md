# Gerätestest-Rückmeldung: Einflug, vollständige Grafik und Boss-Ressourcen

## Neue ausdrückliche Vorgaben und Umfang

Am 12. Oktober meldet der Nutzer weiterhin zu schnelle Gegner-Einflüge, langsamere Darstellung beim Boss und Flammen vor vollständig aufgebauten neuen Schiffen nach dem Boss. Er fordert 25 % weniger Einfluggeschwindigkeit und etwa 25 % größere Boss-Verteidiger. Diese schmalen autorisierten Änderungen ergänzen die vorherige Forderung, Power-ups ausschließlich aus Abschüssen zu erzeugen. Der genehmigte Testnet-Stand und seine Originalgrafiken bleiben die Grundlage; keine Rückkehr zum älteren Mainnet-HUD oder den sichtbaren Positionsmarkern.

| Verhalten | Bisherige private Testansicht | Neuer Stand |
|---|---|---|
| Normaler früher Einflug | 1.430 ms | 1.907 ms: 75 % Geschwindigkeit, gerundet |
| Boss-Verteidiger-Einflug | 1.850 ms | 2.467 ms: 75 % Geschwindigkeit, gerundet |
| Boss-Verteidiger-Grafik | bisheriger Durchmesser | Durchmesser × 1,25 |
| Trefferflächen, Schaden, Angriffe, Power-up-Wirkung/-Timer | bestehende Regeln | unverändert |

25 % weniger Geschwindigkeit erfordern bei gleicher Strecke ein Drittel mehr Zeit. Die zuvor genehmigten 10 % längeren Einflüge bilden den Ausgangswert. Alle Pfade, Formationstypen und die langsame Seitwärtsbewegung bleiben erhalten. Die Eskorte-Vergrößerung wirkt ausschließlich auf die Grafik; Radius 18, Gesundheit und Kollisionsregeln bleiben erhalten. Bereits gespeicherte ältere Einflüge werden einmalig auf den neuen Wert umgestellt, ohne Sprung im Pfadfortschritt oder in der Alterung ruhender Formationen. Aktuelle und benutzerdefinierte Dauern werden nicht erneut verlängert.

## Bestätigter Grafik-Aufbaupfad und Korrektur

Vorher forderte der montierte PaintedShip-Hook sein Material erst nach dem Rendern an und zeigte solange die Quellgrafik. Triebwerke, Flammen und andere CSS-Teile benötigten diese Bitmap nicht. Download, Materialberechnung, PNG-Encoding und Dekodierung konnten deshalb sichtbar nach dem ersten Schiffs-Render erfolgen. Das existiert im regulären Code, nicht nur im privaten Hosting.

GamePage besitzt nun genau ein Ressourcen-Gate für den bestehenden Loop. Vor einem neuen Einflug werden die originalen benötigten Materialbilder und die Erde geladen und dekodiert; bei Bossen auch Hülle, Wrack und Waffenatlas. Die nächste endliche Formation beziehungsweise Eskorte wird über denselben bestehenden Cache vorbereitet. Das Forecast-Ready-Promise blockiert eine bereits bereite aktuelle Gruppe nicht. Auch restaurierte Gegner und die zwölf Bonus-Schiffe werden berücksichtigt. Ein Layout-Check deckt Konto-/Schiffswechsel ab, die bereits vor dem nächsten RAF neue Props committen.

Während notwendiger Vorbereitung bleibt das Spielfeld montiert, einschließlich seiner Geometrie und Eingabe-Observer, aber unsichtbar hinter dem vorhandenen „Preparing mission“-Dialog. Keine Flammen-only-Vorschau, keine unsichtbar fortlaufende Simulation. Kampf, Punkte, Leben und Power-up-Timer stehen; Effektalter und CSS-Effekte werden geschützt. Beim Ende des Wartens erfolgt keine Zeitsprung-Nachsimulation. Bei Ladefehlern pausiert die bestehende Fehlerbehandlung und schützt den Fortschritt; sie navigiert nicht zur Startseite. Bild-/Atlaszugriffe haben ein 20-Sekunden-Limit. Späte oder abgebrochene Batches dürfen eine andere Szene nicht wieder einblenden. Nicht mehr benötigte, noch nicht gestartete Materialaufträge werden verworfen.

Der Cache bleibt bei 48 Materialbildern/24 MiB geschätztem Budget und acht Quellbildern. Die existierenden Pin-Regeln schützen aktive Ressourcen; das Budget ist wie zuvor bei gepinnten Ressourcen keine harte native Speicherobergrenze. Es gibt keine parallele Material-Cache-Struktur. Blob-URLs werden vor Übergabe dekodiert; fehlerhafte URLs werden widerrufen. Die Materialberechnung nutzt optional einen einzigen wiederverwendeten Worker und unverändert denselben Algorithmus. Bei Worker-Fehlern gilt der originale Fallback; ein zusätzlicher Transferpuffer ist bei den 282×282-Hüllen etwa 0,303 MiB groß. Worker-Laufzeit-/GPU-Speicher wurde nicht gemessen. Der Worker beendet sich nach 30 Sekunden ohne neuen Auftrag.

## Boss-Arbeit: bestätigt optimiert, mobile Bildrate offen

Der Waffenrenderer verwendete Stringschlüssel und durchlief für einzelne tote oder neu erhitzte Geschütze wiederholt den Heat-Tile-Cache. Er greift nun direkt auf den einen Eintrag pro Geschütz zu. Erzeugung, Entfernung und Dispose der Canvas-Flächen bleiben erhalten. Keine reduzierte Auflösung, kein reduzierter Waffen-/Partikelumfang, keine geänderte sichtbare Aktualisierungsfrequenz.

Der echte Vorher-/Nachher-Renderer erzeugt in 36 kontrollierten Fällen (Bossstufen 10, 250, 500; mehrere Hitzezustände, zerstörte Geschütze und frozen/live) dieselben 5.862 aufgezeichneten Canvas-Zeichenbefehle. Cacheeinträge wurden vorher 1.757-mal durchlaufen, danach nullmal. Beide Varianten erzeugten 112 Canvas-Flächen und gaben sie vollständig frei. Das beweist die Beseitigung dieser redundanten Arbeit, keinen mobilen FPS-Zuwachs. Rasterisierung, GPU-Upload und Pi-Browser-Rendering sind damit nicht gemessen.

## Ausgeführte Prüfungen

- 398 Frontend-Tests und 106 Backend-Tests bestanden; beide Produktionsbuilds, TypeScript und Frontend-i18n-Gates bestanden.
- Material-Worker und Fehler-Fallback mit dem tatsächlichen Worker-Handler: 20 deterministische RGBA-Fälle sind pixelgleich zum originalen Algorithmus; Wiederverwendung eines einzelnen Workers geprüft.
- Echtes Ressourcenmodul mit kontrollierten Node-Image-/Canvas-Objekten: vollständige Decode-Schranke, Boss-Texturen, gescheitertes Bild mit erfolgreichem Retry, 1.000 deduplizierte Gate-Checks, nicht blockierender Forecast. Nach 100 Batches: 48 Material-/acht Quellcacheeinträge, kein pending Paint; temporäre Canvas-Flächen freigegeben und ungenutzte Blob-URLs widerrufen. Die kleinen synthetischen Bytezahlen sind keine realen 282×282-Speichermessung.
- Echter GamePage-Step: zehn Sekunden Ressourcenwartezeit ohne Simulation, Änderung von Fortschritt oder Power-Timern; Effektalter geschützt; danach 16 ms statt Zeitsprung.
- Echte GamePage-Node-Simulation: 30 normale Blöcke und drei Bosse, Meme Nebula Block 5/9, Projektile/Effekte, Pause, Hintergrundwechsel und Wiederherstellung bestanden. Grafikbereitschaft im reinen Physikharness ausdrücklich gestubbt und separat geprüft.
- Engine-Schleife: alle 500 Stufen, 50 Bosse und 50 Bonusrunden bis Victory, mit kontrollierten Clears/Schutz und gestubbter Ressourcenbereitschaft. Kein echtes Langzeitspiel.
- Erhalt-Prüfung: geschützte Simulation weiterhin identisch bis auf den zuvor autorisierten Power-up-Pfad; Einflugerzeugung und Restore enthalten exakt die genehmigte Geschwindigkeitsänderung. Normales Markup bleibt nach Abzug von Ressourcenwartezeit und Escort-Skalierung identisch. Alle CSS-Dateien und 464 Originaldateien sowie die geschützten Audioeigenschaften unverändert.

Maschinenlesbare Nachweise und Reproduktionsskripte: `resource-readiness-2026-10-12/`, `frontend/scripts/verifySceneResources.cjs`, `verifyBossRendering.cjs`, `verifySimulationStability.cjs`, `verifyStabilityPreservation.cjs`; Engine mit `node checks/build.mjs`, danach `node --experimental-strip-types checks/run-engine.cjs`.

## Grenzen, nächster Gerätetest und Rücksetzweg

In diesem Arbeitsschritt stand kein ausführbarer lokaler Chromium, Pi Browser oder WebKit zur Verfügung. Der zuvor dokumentierte Chromium-Lauf prüfte den früheren Auditstand und ist kein Nachweis für dieses neue Ressourcen-Gate. Es wurde kein neuer Desktop-/mobiler Framezeiten- oder Heap-Vergleich behauptet. Das tatsächliche Nachladen auf dem Nutzergerät, der Boss-Bildratenabfall und der ursprüngliche Rücksprung zur Startseite bleiben bis zum Gerätetest ungeklärt beziehungsweise unbewiesen behoben. Dekodierte Bilder allein garantieren weder GPU-Bereitschaft noch Langzeitstabilität.

Die private Gast-Testansicht erneut öffnen und neu laden. 30–60 Minuten mit normalen Leben spielen: auf erstmals vollständige Hüllen/Erde, langsamere Einflüge, vergrößerte Verteidiger, Boss-Explosion/Herz/Bonus und die folgenden Formationen achten; außerdem Pause und einen Hintergrundwechsel prüfen. Festhalten: Zeitpunkt, angezeigter Level/Block, ob „Preparing mission“ erscheint, ob innerhalb eines bereits laufenden Bosskampfs das ganze Spiel langsamer wird, und ob nochmals Flammen vor dem Schiff erscheinen. Bei einem Fehler den freiwilligen lokalen Diagnosedownload verwenden. Die private Gastansicht hat keine realen Konten, Käufe oder Server-Saves; Konto-Wiederherstellung und Belohnungs-Idempotenz benötigen zusätzlich den regulären geschützten Testablauf aus dem vorhandenen Geräteplan. Produktions-Website-Daten nicht für den Test löschen.

Runtime-Rücksetzpunkt vor diesen Änderungen: lokaler Ref `backup/private-playtest-20261012-d28f2fd`; derselbe Runtime-Tree liegt im GitHub-Commit `93d9f54b08fdca4631ab2f0403161b504a2296fd`. Die vorige private Sites-Version `appgprj_6acd33650fcc8191a7e718e40b8acea5~appgver_9d0a30ba20588191a12efda1ce69726d` ist der Ausgangsstand dieser Testansicht. Code-Rücksetzung ist keine Datenbank-Rücksetzung.

Nur die isolierte, für den Eigentümer private Testansicht wird aktualisiert. Kein Main-Merge, öffentliches Testnet-/Mainnet-Release, Datenbankzugriff oder kostenpflichtige Änderung. Der tatsächliche Datenbankbackup-/Restore-Nachweis bleibt unbestätigt und sperrt die öffentliche Freigabe. Keine Garantie der Absturzfreiheit.
