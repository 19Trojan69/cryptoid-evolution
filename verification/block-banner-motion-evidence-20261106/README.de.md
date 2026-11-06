# Cryptoid Evolution – Bewegung im Block-Abschluss

Nur Testnet: https://cryptoid-evolution-testnet.vercel.app/

Quellcommit d9e0897a9396dd8f1f0a9c4a9a0536aa1fb7208d, Baum 237af363e03e8fc669d60080842dafd7c8db369d, Branch codex/reactor-health-20261106.
Deployment dpl_3tcnig7RC16aLXm3jdGC9Mfh2DvF, READY. Vorheriger Testnet-Stand: dpl_BV99zfYJHZJBWy1GZXQHe2xwboFq /2e560d77b35679d301083adc4c27702b69b0cbfc.

Der Besitzer zeigte den Abschluss von Block 8/9 (IMG_5793.jpeg): Auch diese neun Blöcke sollen drehen, die einzelne Binärzeile soll gegensätzlich laufen. Die pauschale Regel `.game-field .sector-banner.readable-transition * { animation: none; }` in transitionNotices.css unterdrückte beide Animationen innerhalb genau dieses Rahmens. Die bisherigen isolierten Komponentenprüfungen hatten den Rahmen und die separat nachgeladene GamePage-CSS-Datei nicht einbezogen. Ihre positive Bewegungsprüfung belegt daher nicht diesen tatsächlichen Abschlusskontext.

Die einzige Änderung an ausgelieferten Spielquellen ist ein CSS-Selektor: Die Rotoren und die einzelne Binärspur sind von dieser Abschaltung ausgenommen. Alle anderen Nachfahren behalten ihre bisherigen statischen Titel-/Dekorationsregeln. Die eigene Pausenregel bleibt vollständig unverändert. Keine zusätzlichen Elemente, Bilder, Canvas, Timer oder RAF; keine Änderung an Anzeigedauer, Layout, Spiellogik, Konten, Geschwindigkeit oder den vorherigen Reaktoränderungen.

## Native Regression

CI42202983302 vollständig erfolgreich. 508 bestehende/fokussierte Prüfungen ohne Fehler, TypeScript und Vite. Jobs127842601054(WebKit),127842601469(Chromium),127842601612(Spiel).

Die neue Prüfung baut mit Vite die vollständigen tatsächlich verwendeten Stylesheets: globales index-CSS, gemeinsam verwendetes powerUps-CSS und dynamisch nachgeladenes GamePage-CSS. Sie rendert die echte BlockchainProgress-Komponente innerhalb des Abschlussrahmens aus GamePage, einschließlich derselben Ahnenklassen und der bestehenden nativen60-Hz-Animationssteuerung. Nur die Beschriftungsübersetzung ist im lokalen Prüfstand ersetzt. Es werden keine echten Konten/Spielstände oder Zahlungen benutzt.

Beide Engines reproduzieren mit der alten vollständigen CSS-Kette zunächst den Stillstand aller neun Rotoren und der Binärspur. Mit der korrigierten Regel bestehen je 72 Kombinationen aus Block 1–9, Smartphone-/Desktopgröße und vier OS/App-Bewegungseinstellungen. Die echten laufenden Animationsuhren und Matrizen werden verglichen; es wird für diese Fortschrittsprüfung nicht perJavaScript vorwärtsgesucht. Nach dem Start drehen die Rotoren nach links, die Binärspur bewegt sich nach rechts. Zusätzlich unterscheiden sich die tatsächlich gerenderten Bildpixel zweier kontrollierter Drehstellungen. Die Elementanzahl bleibt gleich. Eine echte Pause friert beide Spuren ein; Fortsetzen führt dieselben Uhren weiter. Titel und Halo bleiben statisch. Original-ZIPs, JSON und generierte Bildausschnitte sind erhalten.

Die erste Erweiterung des Prüfstands nahm fälschlich eine einzige CSS-Datei an; Vite gibt sechs für verschiedene Routen aus. Die Prüfung lädt jetzt exakt die für Hauptanwendung und GamePage benötigten drei Dateien in Abhängigkeitsreihenfolge. Ein erster WebKit-Schnappschuss konnte noch eine nicht gestartete Animationsuhr beobachten; die Prüfung wartet jetzt höchstens 2 Sekunden auf tatsächlich laufende Uhren und prüft anschließend deren Fortschritt. Die Produktionskorrektur bleibt dieselbe einzelne CSS-Zeile.

Die ursprüngliche transitionNotices.css ist durch exakte Rücksetzung des einen Selektors bytegleich wiederherstellbar: SHA256 139bb3bcc3ae24b1233e67cf110b8cf8b6f72e9b295885a5d23e6003c0083c7b. Gemeinsamer Hash der geladenen alten Styles:50cfc664f12b93bd8d678617bae9bd81df946a1cda7657b60f124e6678c8023e; neu594fa7eb76f64dcf5d0b94422211f93d2e6bb7955c483c06c730f09f36accf99.

Vite-CSS-Namen im geprüften Build: index-q-Ze66t1.css und powerUps-DLSJWH8A.css bleiben gleich; GamePage-CyY0jnEz.css wird GamePage-l3ww3aPu.css. Die öffentliche Nachprüfung muss diese zusätzliche Spielseiten-CSS ausdrücklich mitlesen. Sie darf nicht nur die globale index-CSS prüfen.

Kein physischer iPhone-/Pi-Browser-Langzeittest, kein gemessener Gesamtspeichergewinn und kein bestätigter White-Screen-Fix. Die wiederhergestellte Bewegung ist ausdrücklich gewünscht; ihr zusätzlicher Renderaufwand wird nicht als Speicherersparnis ausgegeben. Produktion/main bleiben unverändert ce073547cf573375d141bf846f70e294138dbd73 /dpl_6N3FdS9XGXasCWrpMksngxCPNPRk.

Öffentliche Schlussprüfung ohne Authentifizierung bestanden: Home/API200, Adminstatus401, richtiger Commit/Baum, neue Ausnahme in der separat ausgelieferten GamePage-CSS und alle vorherigen Reaktor-/Bewegungsregeln bestätigt. Der gemeinsame SHA256 der drei öffentlich geladenen Stylesheets stimmt exakt mit der in beiden Engines getesteten neuen CSS-Kette überein (594fa7eb76f64dcf5d0b94422211f93d2e6bb7955c483c06c730f09f36accf99). Aktuelle Skripte index-DBhFovXC.js und GamePage-3YBvjlXs.js. Details in public-smoke.json.
