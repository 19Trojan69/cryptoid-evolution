# Cryptoid Evolution – Reaktor, Übergänge und Zielverfolgung

Nur Testnet veröffentlicht: https://cryptoid-evolution-testnet.vercel.app/

Commit: 2e560d77b35679d301083adc4c27702b69b0cbfc. Baum: 95b4f1dfde230f7f79e7ff3c14d43ff3e2c290d9.
Deployment: dpl_BV99zfYJHZJBWy1GZXQHe2xwboFq (READY).
Branch: codex/reactor-health-20261106. CI: 42198350864, alle drei Jobs SUCCESS, 508 Tests ohne Fehler, TypeScript/Vite erfolgreich.

## Verhalten

- Bei Bossvernichtung zuerst ein lokaler, 650 ms langer Reaktor-Blast. Danach die bisherigen 5 Sekunden Absinken. Gesamtexplosion und deren Audio beginnen nach 5650 ms; Siegesmusik und Abschlussdauer sind um dieselben 650 ms verschoben. Keine zusätzlichen Timer oder RAF-Schleifen. Eigener endlicher DOM-Knoten wird über sein natives Animationsende entfernt und pausiert mit den vorhandenen Kampfeffekten.
- Kompakte, eckige HP-Anzeige direkt über dem geöffneten Reaktor, 52–76 px breit, 14 px hoch, mit Kernsymbol und Prozentwert. Die Geschützanzeigen bleiben.
- Ab genau 50 Prozent Restenergie wird ausschließlich der vorhandene SVG-Kern zunehmend orange/gelb eingefärbt. Keine neue Canvas, Textur, Partikel, Filter oder Animation; Geschossfarbe beim Feuern bleibt erhalten.
- Die neun Übergangsblöcke rotieren rückwärts; die einzelne Binärreihe bewegt sich nach rechts. Mehrzeilige Reihen wechseln links/rechts/links/rechts/links. Nur die Übergangswürfel sind jetzt auch bei reduzierter Kampfbewegung aktiv; die übrigen Einstellungen bleiben. Vorher konnte genau diese Einstellung die Würfel weiterhin stilllegen.
- Zielverfolgung berechnet dieselben Koordinaten unmittelbar als Zahlen und überspringt zerstörte Geschütze vor dieser Berechnung. Keine neuen Positionsobjekte je Geschütz und Bild. Keine Änderungen an Winkeln, Erfassung, Schüssen, Kapazitäten, Treffern, Geschwindigkeiten oder Zufall.
- Einfluggeschwindigkeit unverändert: Es gibt keinen gemessenen Einflug-Befund, der eine Drosselung als Speicherkorrektur rechtfertigt. Langsamere Bewegung ist nicht automatisch weniger Rechenarbeit je Bild und verlängert die Verweildauer.

## Nachweise und Grenzen

Chromium und WebKit prüfen die tatsächlichen React-Komponenten und Original-CSS. Je Engine: vier Kombinationen aus Betriebssystem-/App-Bewegungseinstellung, alle neun Würfel, tatsächliche unterschiedliche Bildpixel zweier Drehpositionen, Binärbewegung, 50 Reaktor-/Fallpositionen, Pause/Fortsetzen und Entfernen des lokalen Blasts. Die normale Arena-Pause bleibt wirksam. Nur der Sprachkontext ist im isolierten Komponentenprüfstand ersetzt. Dies ist keine vollständige Smartphone-Spielabnahme.

Der Vergleich der alten und neuen Zielverfolgung umfasst 90000 Schritte auf zwei Viewports, alle 50 Bosse, wechselnde Bildzeiten, bewegtes Ziel und zerstörte Geschütze. Bosszustände und alle 3476 abgefeuerten Geschosse sind exakt gleich. Im Quellcode entfallen in diesem Ablauf 526848 Positionsobjekt-Erzeugungen; das ist keine Messung tatsächlich allokierter Heap-Bytes oder dauerhaft belegten RAMs.

Die vorhandene Geschützfärbung hält nur eine Farbtextur je lebendem Geschütz. In beiden Engines durch alle 50 Bosse geprüft: maximal 2945984 logische RGBA-Bytes pro Boss (ca. 2,81 MiB) für diese Texturen. Weitere Schadensstufen häufen keine Stufen an; Tod und Dispose setzen die jeweiligen Canvas-Abmessungen auf null. Der Reaktor-Farbwechsel fügt null Canvas und null SVG-Filter hinzu und verändert die Zahl seiner SVG-Knoten nicht. Diese Ergebnisse messen Ressourcenbesitz und logische Pixel, nicht gesamten Prozess-/GPU-/Smartphone-Speicher.

150 Geometriefälle je Engine (50 Bosse × drei Viewports): Anzeigefläche insgesamt 145474 statt 595106,25 CSS-Pixel², etwa 75,55 Prozent kleiner. DOM-Anzahl bleibt gleich. Daraus folgt ausdrücklich keine entsprechende RAM-Ersparnis.

Gegnergeschosse: Quellprüfung bestätigt ein Gerätebudget (Smartphone höchstens 5, Desktop höchstens 8), feste Flugrichtung nach dem Abschuss, Entfernung bei Treffern/außerhalb des Feldes und DOM-Abgleich nur lebender Geschosse. Vorhandene bestandene Tests prüfen 6000 aufeinanderfolgende Salven ohne Anwachsen der Darstellung. Keine Änderung ihrer Flugbahnen, Darstellung oder Geschwindigkeit übernommen.

Ein früher WebKit-Lauf zeigte beim allgemeinen FinishedEffect-Abschluss noch einen verbliebenen lokalen Reaktorknoten; der neue Ein-Animations-Knoten entfernt sich direkt bei seinem eigenen Animationsende. Die allgemeinen Effekte wurden nicht geändert. Eine weitere frühere Prüfabweichung betraf ausschließlich CSS-Zahlenserialisierung (29,3436 vs. 29,343600000000002); der Geometrievergleich hat jetzt 0,001 px Toleranz.

Öffentlich ohne Authentifizierung: Start und API 200, Admin-Status 401. Commit/Baum, kompakte Anzeige, lokale Explosion, Kernfarbe, lokale Schussfarbe und Bewegungsregeln sind in den tatsächlich ausgelieferten Modulen bestätigt. public-smoke.json enthält Asset-Fingerprints. Kein Login, Zahlung oder Spielstand geändert.

Produktion und main bleiben ce073547cf573375d141bf846f70e294138dbd73 / dpl_6N3FdS9XGXasCWrpMksngxCPNPRk. Unmittelbarer Testnet-Rückfall ist dpl_7GPUCjpJA9gNEmiLk8biHvPCeSva / c638241f82570d1c8d30bcfe1b25f5a06b69bcf4. Kein Main-Merge und keine Schutzänderung. Auto-Git-Deployments der Arbeitsbranches bleiben ausgeschaltet.

Kein gemessener Gesamtspeichergewinn und keine bestätigte Verbesserung der mobilen Langzeitstabilität. Der historische White Screen ist nicht als behoben abgenommen. Das Reaktivieren dekorativer Bewegung kann zusätzliche Renderarbeit erfordern; eine pauschale Speichersenkung wird deshalb nicht behauptet.

Name: Cryptoid Evolution; „CryptoID“ ist nicht die Spielmarke und soll in der Kommunikation nicht verwendet werden.
