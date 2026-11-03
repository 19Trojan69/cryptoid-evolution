# Unveränderter Spiel-Dauerlauf in der kalibrierten Safari-Umgebung

Die konstante Safari-Kontrolle besteht in Lauf 41617489198 auf Intel/macOS mit
Xcode 26.2, iOS 18.5, Appium 3.9.0, XCUITest 12.22.8 und WDA 16.17.7.
Diese Fortsetzung verwendet denselben Startweg: Appium vor dem Simulator,
getrennter WDA-Vorbau, lokale Seite vor der Safari-Sitzung, noReset:true und
keine initiale WDA-Deep-Link-Capability. Es gibt keine Host-/Gerätekonten oder
kostenpflichtigen Dienste. Der Standard-Mac-Runner gehört zum öffentlichen Repo.

Der Gast-Build entsteht unverändert aus ac98e95166b0e2013186257904da46323840dab5
auf einem geprüften Dateisystem mit unterscheidbarer Groß-/Kleinschreibung.
Es wird zuerst die konstante lokale Seite einschließlich gezählter echter
Kontrollberührung verlangt. Erst danach erhält der vorhandene Spieltreiber
eine neue Safari-WebDriver-Sitzung. Jede Phase hat einen eigenen lokalen
Gastserver-Ursprung. Die neue externe Client-Klasse ersetzt ausschließlich
den Einrichtungsweg; die Spiel-, Uhr-, Dokument-, Pausen-, Waffenmenü-,
Ausstiegs-, Paket- und normalen Exportprüfungen des bisherigen Treibers bleiben.

Ein vollständiger Pilot mit 60/10/10 echten aktiven Sekunden ist Voraussetzung
für den anschließenden frischen Ablauf mit 1800/10/10 Sekunden. Fehler stoppen
die Kette; keine automatische Fortsetzung oder beschleunigte Zeit. Während des
Spielbetriebs gibt es keine Bildschirmaufnahme, Screenshots oder erzwungene GC.
Ein eigenes Simulatorbild darf weiterhin nur bei gescheiterter Vorprüfung vor
jedem Spielversuch angefordert werden. Danach werden höchstens vorhandene
gefilterte native Fehlerprotokolle gelesen. Die Simulator- und Appium-Freigabe
gehört weiterhin dem äußeren Lauf.

Die vorhandene Prozessbeobachtung verlangt tatsächlich ermittelte WebContent-
Dienste des gewählten Simulators. RSS bleibt eine unvollständige Host-Messung:
kein gesamter GPU-Speicher, kein physisches iPhone, kein Android und kein Pi Browser.
Der bestätigte Handyabbruch bei 23:45,681 bleibt ungeklärt. Auch ein bestandener
Simulatorlauf beweist keine dauerhafte Behebung.

Der separat geprüfte HUD-Regel-Kandidat wird hier noch nicht eingebaut. Dieser
Lauf ermittelt zuerst die bisher fehlende native Spiel-Baseline auf dem exakt
eingefrorenen Paket. Ein direkter Kandidatenvergleich benötigt denselben Ablauf
und eine ausdrücklich dokumentierte einzige CSS-Abweichung.

Alle ursprünglichen Spielverzeichnisse bleiben identisch. Kein Vercel-Deployment
oder Änderung der veröffentlichten Spielversionen. Nur externe Testdateien.
