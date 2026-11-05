# Native WebView-Messumgebung, 5. November 2026

**Aktuell bestanden:** vollständiger nativer Gast-Spielpilot, Quelle
`1fe2e2b01a640d4b696ad07336d0195a0b2e181f`,
[CI 41977882747](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41977882747).
Vierzehn Auswertungsprüfungen und ein echtes XCTest bestehen. Elf Messpunkte
behalten dieselbe Dokumentkennung; Pause, Menüs, regulärer Ausstieg und normaler
Bericht sind abgenommen. Schlussuhr: 50.435 ms, ended, in allen drei Berichten gleich.
Kein physisches Smartphone, kein Prozess-/Speicherverlauf und kein White-Screen-Fix.
Die folgenden Abschnitte erhalten den tatsächlichen Untersuchungsverlauf;
Originalfehlschläge bleiben Fehlschläge. Details des aktuellen Erfolgs stehen unten.


Der bestätigte neue Handy-White-Screen bei letztem Stand 23:09,540 enthält auch
im korrekt zugeordneten kritischen Journal kein gespeichertes Fehlerereignis.
Das beweist keinen nativen Absturzgrund. Weitere unveränderte Handy-Dauertests
werden daraus nicht angefordert.

Dieser Aufbau ersetzt ausschließlich die bisher unzuverlässige externe Safari-/
Appium-Steuerung durch einen eigenen kleinen UIKit/WKWebView-Host mit direktem
XCTest. Die erste Stufe enthält nur eine konstante Kontrollseite. Das Spiel wird
noch nicht gebaut oder geladen. Eine sichtbare Seite allein reicht nicht: genau
eine native, vom Browser als vertrauenswürdig gemeldete Berührung, anschließend
korrekt ausgelesenes DOM und der vollständig geprüfte Schlussdatensatz sind nötig.
Ein vorzeitiger Abschluss muss ausdrücklich abgewiesen werden.

Der native `WKNavigationDelegate` speichert WebContent-Prozessbeendigungen ohne
automatischen Reload. Ein Callback allein nennt keinen Speicher-/GPU-Abbruchgrund.
Sein tatsächliches Auslösen wird in der normalen Kalibrierung nicht behauptet.
Alle Daten stammen aus dem wegwerfbaren Simulator, nicht vom Besitzergerät.
Keine Spielquelle, Uhr, Grafik, Eingabe, Audio-, Konto- oder Backendregel ändert
sich. Die fünf geschützten Runtime-Bäume und vercel.json bleiben exakt auf b092f646.
Automatische Vercel-Deployments bleiben abgeschaltet; kein neues Geräte-Preview.

Werkzeuge im neuen Kontrollversuch: vorinstalliertes Xcode 16.4 mit passendem
iOS-18.5-SDK, iOS-18.5-Simulator und offizielles XcodeGen
2.44.1 mit geprüftem Release-SHA256. Keine Appium-/WDA-/Remote-Debugger-Sitzung,
kein Gerät/USB, keine automatische Wiederholungs-/Resume-Schleife.
Kein Bildschirmvideo wird angefordert; automatische Bildschirm-Anhänge werden
nicht behalten. Die Aufbewahrungseinstellung beweist nicht, dass XCTest intern
niemals ein Bild erfasst. Das Spiel wird in dieser Kalibrierung nicht geladen.
Das ist nicht iOS 26.6, Pi Browser, ein physisches Smartphone oder schon ein
Spieltest. Die Host-Bedienleiste verkleinert den Kontroll-WebView; spätere
Spielmessungen müssten ihre Geometrie ausdrücklich erfassen.

Vorab festgelegte Grenze: Erst nach vollständiger Kalibrierung darf ein kurzer
unveränderter Gast-Spielablauf vorbereitet werden. Bei Toolfehlern kein langer
Spieltest und kein neuer Besitzertest. Ein Spieleinstieg oder eine White-Screen-
Behebung werden aus einem grünen Kontrolllauf nicht abgeleitet.

Primärquellen:
- https://developer.apple.com/documentation/webkit/wknavigationdelegate/webviewwebcontentprocessdidterminate(_:)
- https://developer.apple.com/documentation/xcode/adding-tests-to-your-xcode-project
- https://github.com/yonaskolb/XcodeGen/blob/2.44.1/Docs/ProjectSpec.md

Ergebnis beim Vorbereiten dieser Quelle: noch kein nativer Build oder Kontrolllauf.

## Erster Einrichtungsversuch und konkrete Korrektur

Quelle a6f296a869c647f802e26b3aa5292608cfe654cb, CI 41964912601 endet vor
Simulator/Build mit failure. Die fünf Auswertungsprüfungen, Xcode 26.2 und der
SHA-geprüfte XcodeGen 2.44.1 funktionieren. Die selbst geschriebene Prüfung
erwartete danach fälschlich `disableAutomaticScreenCapture=YES`. Der tatsächliche
pinnierte Generator bildet `captureScreenshotsAutomatically:false` auf
`systemAttachmentLifetime=keepNever` ab; die bereits verlangte Video-Abschaltung
bleibt `preferredScreenCaptureFormat=screenshots`. Genau diese zwei tatsächlichen
Felder werden nun geprüft und die erzeugte XML zusätzlich gesichert. Die Aussage
zur Aufbewahrung wird ausdrücklich von tatsächlicher interner Aufnahme getrennt.

Primärquellen des korrigierten Schemapfads:
- https://github.com/yonaskolb/XcodeGen/blob/2.44.1/Sources/XcodeGenKit/SchemeGenerator.swift
- https://github.com/tuist/XcodeProj/blob/b1caa062d4aaab3e3d2bed5fe0ac5f8ce9bf84f4/Sources/XcodeProj/Scheme/XCScheme%2BTestAction.swift

Originalresultat des fehlgeschlagenen Versuchs und Prüfsumme seines unveränderten
577-Byte-Artefakt-ZIP sind in evidence/attempt-41964912601 erhalten. Kein Spiel
war geladen; dies ist kein Spielabsturz und kein bestandener nativer Kontrolllauf.

## Zweiter Versuch: Apple-Simulatorkatalog blockiert

Quelle f9713840b09f612c5db7922e88de85b37fff3244, CI 41965265740 besteht die
konkrete Generator-/XML-Prüfung einschließlich keepNever und screenshots. Dann
endet `xcrun simctl list --json` in seiner unverändert begrenzten 150-Sekunden-Frist.
Keine Simulator-ID, kein App-Build, keine App-Öffnung, kein Spiel und keine
vertrauenswürdige Kontrollberührung werden diesem Versuch zugeschrieben.
Das 1.707-Byte-Artefakt enthält den Schlussdatensatz und die erzeugte Scheme-XML;
GitHub-SHA256 6aeeafacdba94b4abdfdcdea052285131fecb5e1d644545863893d564430dde5.

Der nächste einzelne kontrollierte Vergleich wählt das ebenfalls vorinstallierte
Xcode 16.4 mit nativ passendem iOS-18.5-SDK. Die 150-Sekunden-Katalogfrist,
App-Quellen und alle Berührungs-/DOM-Abnahmekriterien bleiben gleich. Ein Erfolg
dieses anderen Werkzeugsatzes würde nicht beweisen, dass Xcode 26.2 allein die
vorige Blockade verursacht hat. Falls auch dessen Katalog blockiert, kein weiterer
gleicher Startversuch und kein nachfolgender Spieltest aus dieser Kalibrierung.

## Dritter Versuch: native Kalibrierung vollständig bestanden

Quelle fcce1647bbb9d06c6babb8051866ee814936b845, Baum
7b08527615076c5facfaf5755f7cb723baa4a26d, CI 41965934543 und Job 127042814031
enden mit success. Tatsächlich verwendet: Xcode 16.4 / 16F6, XcodeGen 2.44.1,
iOS 18.5 / 22F77 auf einem neu erzeugten iPhone-16-Pro-Max-Simulator.

- Der Simulatorkatalog antwortet nach 9.416 ms. Bootstatus besteht nach 112.863 ms.
- Der eigene native App-/UI-Test-Bau besteht nach 146.075 ms.
- Der Testaufruf besteht nach 48.298 ms; das einzelne tatsächliche XCTest besteht
  nach 19,710 Sekunden mit null Fehlern.
- Genau eine native Kontrollberührung wird auf der Seite empfangen, isTrusted:true.
  Der vorzeitige Abschluss wurde vorher tatsächlich abgewiesen.
- Der spätere DOM-Lesezugriff liefert dieselbe Überschrift, count:1, visible,
  readyState:complete, einen passenden iPhone/iOS-18.5-User-Agent sowie 440×652
  CSS-Pixel und DPR 3. Kein Remote-Debugger/WebDriver-Ersatz wurde verwendet.
- controlComplete:true, navigationErrors:0, nativeContentTerminations:0.
  gameLoaded:false und physicalDeviceTest:false bleiben ausdrücklich gesetzt.

Der Erfolg mit Xcode 16.4 ist ein konkreter neuer funktionierender Aufbau, kein
Beweis, dass die vorige Katalogblockade ausschließlich an Xcode 26.2 lag.
Die früheren beiden Fehlversuche bleiben unverändert erhalten. Alle drei
Original-Artefakt-ZIPs sind über GitHubs SHA256 geprüft und bytegenau im Git
archiviert; alle gelieferten Dateien sind mit ihren eigenen Digests erfasst.
`python3 verification/native-webview-probe-20261105/verify_evidence.py` prüft die
Archive und das tatsächliche native Ergebnis erneut offline.

Ein Prozessabbruch wurde weder natürlich beobachtet noch absichtlich erzeugt;
die tatsächliche Zustellung des nativen Termination-Callbacks ist damit noch
nicht abgenommen. Ebenso wurden kein Spiel, kein vollständiger Gastzyklus,
kein nativer Ressourcenverlauf und kein physisches Smartphone geprüft. Die
erfolgreiche Kontrollseite ist keine White-Screen-Behebung.

## Nächster begrenzter Schritt vor dem Spieltest

Vor einem Gast-Spielpiloten muss der äußere Collector App-Teilberichte auch bei
einem fehlgeschlagenen XCTest übernehmen. Der jetzige Kalibrator kopiert den
App-Datensatz nach einem erfolgreichen Test; der native Delegate allein garantiert
noch keine CI-Sicherung nach einem Testabbruch. Ebenso müssen Zwischenstufen und
teilweise Prozessausgaben an den Zeitgrenzen erhalten werden. Diese Erweiterung
ist hier ausdrücklich noch nicht implementiert oder als bestanden behauptet.

Danach folgt ein kurzer unveränderter Gastablauf mit ursprünglicher Stoppuhr,
echten manuellen Start/Pause/Waffenmenü/Home-Aktionen und normalem Bericht.
Erst bei vollständig bestandenem Piloten ist eine native Ressourcenbeobachtung
sinnvoll. Kein neuer Besitzer-Dauertest wird aus der Kontrollseite abgeleitet.

## Umsetzung: Abbruchdaten und kurzer nativer Spielpilot

Die historische Einschränkung oben wurde jetzt gezielt bearbeitet. `collector.py`
sichert vor und nach jedem Prozess einen atomaren Zwischenstand und schreibt die
Ausgabe direkt in eine Datei. Bei einer Zeitüberschreitung wird die eigene
Prozessgruppe beendet; die bis dahin geschriebene Ausgabe bleibt erhalten. Der
native Teilbericht wird in `finally` vor dem Löschen des eigenen Simulators aus
dem App-Container übernommen, unabhängig vom XCTest-Ergebnis. Fehlende/ungültige
App-Daten werden separat vermerkt und verdecken den ursprünglichen Fehler nicht.
Drei neue Collector-Prüfungen umfassen echte fehlgeschlagene Unterprozesse,
eine Zeitgrenze, eine während des Prozesses lesbare Zwischenstufe und fehlende
App-Daten. Das sind keine absichtlich ausgelösten nativen WebContent-Abstürze.

Der neue Modus `--mode pilot` baut mit dem vorhandenen Journal-Build-Einstieg den
isolierten Gaststand und lädt ausschließlich diesen über Loopback in den eigenen
WKWebView. Keine Vercel-Anmeldung oder neue Bereitstellung. Alle ausgelieferten
Dateien werden vorher und nachher gehasht. Derselbe Runtime-Baum b092f646, dieselbe
Uhr und bestehende Gast-Testschutzregel werden verlangt. Die Build-Quellkennung
gehört zum neuen Prüfcommit; Identität mit remote ausgelieferten HTML-Bytes wird
nicht behauptet. Das ist kein sauberer Produktions-Spieldurchlauf ohne Testschutz.

Ein einziges neues XCTest soll die Originaloberfläche durchlaufen: vorbereiten,
angehalten öffnen, Fortsetzen, echte aktive Zeit, Pause/Stillstand, Fortsetzen,
Waffenmenü/Zurück, Home/Verlassen und den normalen Berichtstext anzeigen. Die
Bedienung erfolgt durch native XCTest-Berührungen. Elf gezielt ausgelöste,
lesende Beobachtungen prüfen Dokument, Uhr und vorhandene QA-Daten. Keine neue
Schleife im Spiel, Zustandsschreiboperation, automatische Wiederaufnahme,
Zeitbeschleunigung oder explizite Screenshot-/Videoanforderung. Die native
Bedienleiste bleibt Teil des Messaufbaus und verkleinert den WebView; dessen
wirkliche Geometrie wird protokolliert. Ein interner XCTest-Bildzugriff ist aus
der Aufbewahrungseinstellung weiterhin nicht ausgeschlossen. Dieser Pilot ist
keine Speichermessung und ersetzt keinen physischen Pi-Browser.

Der normale Bericht wird über die vorhandenen Menüaktionen als Text angezeigt
und unverändert im App-Container als `normal-report.json` gesichert. Eine native
Download-/Teilen-Dialogprüfung wird daraus nicht behauptet. Die unabhängige
Python-Abnahme verlangt denselben Lauf und dieselbe Quelle, ended, identische
Schlussuhren in Journal/Kurzbericht/Stoppuhr, den passenden Ressourcenpunkt sowie
keine gespeicherten error-/unhandledrejection-Ereignisse. Zusätzliche negative
Prüfungen verwerfen alte Ressourcenpunkte, abweichende Journaluhren, Fehler,
Dokumentwechsel, versteckte Seiten, unerwartete Pause und unbeobachtete Lücken.

Vor dem CI-Start: elf lokale Python-Prüfungen und Syntaxprüfungen bestanden.
Ein erfolgreiches natives Spielergebnis wird erst mit dem tatsächlichen
CI-Schlussdatensatz dokumentiert. Der bisherige native Kontrolltest wird nicht
noch einmal ausgeführt; der Pilot verwendet `-only-testing:.../GamePilotTests`.

## Aktueller Stand: vollständiger nativer Pilot bestanden

Geprüfte Quelle `1fe2e2b01a640d4b696ad07336d0195a0b2e181f`, Baum
`9a32595120bfca370383c2a1a1c8245a70ebcf6d`, CI
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41977882747.
Linux-Job 127080901985 und nativer Job 127081334820 bestehen. Tatsächlich gemessen:
arm64 / Darwin, 7.516.192.768 Bytes Hostkapazität, Xcode 16.4 / 16F6,
XcodeGen 2.44.1, iOS 18.5 / 22F77, iPhone-16-Pro-Max-Simulator.
Die Hostkapazität ist keine Messung des Spiels oder eines physischen Telefons.

Vierzehn Python-Prüfungen bestehen. Das einzelne echte XCTest besteht mit null
Fehlern nach 128,813 Sekunden; die unabhängige Auswertung besteht ebenfalls:

- Elf Beobachtungen, dieselbe Dokument-UUID, genau ein nativer Navigationsstart,
  ein Commit und ein Abschluss. Die Rohwerte von timeOrigin bleiben erhalten.
- Ursprüngliche Startpause, aktiver Bosskampf, Pause und unveränderter Uhrstand
  36.434 ms, Fortsetzen, Waffenmenü und Rückkehr, Home/Verlassen und normaler
  Berichtstext aus der vorhandenen Oberfläche.
- Schlussuhr ended bei 50.435,000000000015 ms, unobservedGaps:0. Stoppuhr,
  Kurzbericht und kritisches Journal enthalten vollständig identische Schlussuhren.
  criticalMatchesLatestStopwatch:true, briefMatchesLatestStopwatch:true.
- Kein gespeicherter error-/unhandledrejection-Eintrag; zwei popstate-Ereignisse
  gehören zu den geplanten Menüwechseln. Keine Fehlerfreiheit daraus abgeleitet.
- Passender Ressourcenpunkt: Audio running, clockStalls:0, recoveries:3,
  blockedSounds:0, PCM:7.660.648 Bytes; Canvascache:422.836 Bytes, Surface:4,
  registrierte Effekte:0, Fehler:0. Kein Gesamt-RAM-, GPU- oder Prozessverlauf.
- Gleiche Linux-Paketdateien vor/nach dem Ablauf. Kein automatischer Reload,
  keine automatische Wiederaufnahme und keine beschleunigte Spieluhr.

Normale Berichtsdatei: 9.481 Bytes, SHA256
`1eb3714594b7c1c7afdc73b693356c49dc2a5dc5d120d49de555e8940d22778c`.
App-Beleg: 54.026 Bytes, SHA256
`103a02f45a16f36f3359e3029669633fa1e90f675d7518ded599439eb12f4b5c`.
Original natives Artefakt 13392937393: 138.714 ZIP-Bytes, SHA256
`f8d4b804327d90ded0ddfcc1930e36d793e4ff76175d866a169f32139d2ab608`.
Die tatsächliche Geometrie ist 440×652 CSS-Pixel, DPR 3. Die native Bedienleiste
verkleinert den WebView. Das ist kein physischer Pi-Browser oder iOS-26.6-Test,
kein Test ohne den bestehenden Gast-Testschutz und kein bewiesener White-Screen-Fix.
Kein nativer Termination-Callback wurde absichtlich ausgelöst. Pixelintegrität
oder interner Ausschluss sämtlicher XCTest-Bildzugriffe werden nicht behauptet.

### Konkrete Korrekturen und unveränderte Fehlschläge

| CI-Lauf | Tatsächlicher Ausgang |
| --- | --- |
| 41969672141 | Werkzeugsuche fand neben dem erzeugten Scheme historische Archivdateien; kein Simulator/Spiel. Suche auf genau das erzeugte Projekt begrenzt. |
| 41969925416 | Native App kompiliert. macOS-Auflösung von `./PaintedShip` findet `paintedShip.ts` statt `PaintedShip.tsx`. Kein Spielstart. Originale Module bleiben unverändert; Gast-Build nach Linux getrennt. |
| 41970945070 | XCTest-Bedienzyklus und normaler Bericht bestehen mit 38.515 ms Schlussuhr. Gesamtauswertung scheitert an 55 ms driftendem timeOrigin. Ursprünglicher roter Status bleibt erhalten. |
| 41972358978 | Nativer Bau besteht; Testtreiber scheitert vor Testbeginn an `AX loaded notification`. Keine Aussage über das Spiel oder die neue Dokumentkennung. |
| 41974173048 | Simulator-Anzeige geöffnet; unnötiger Dienstabruf läuft in 30 s. Signal-EPERM verdeckt im alten Collector die ursprüngliche Frist; genau eine Befehlsmetadatenzeile fehlt im Original. |
| 41975179593 | Eigener Syntaxfehler im Collector-Umbau wurde lokal erkannt, aber der Prüfcommit zu früh übernommen. CI bestätigt SyntaxError; Spiel-/Native-Jobs übersprungen. In der nächsten Quelle korrigiert, danach 14 lokale Prüfungen grün. |
| 41975243679 | XCTest startet, bleibt aber bei app.launch stehen. 360-s-Frist bleibt als ursprünglicher Fehler erhalten; 1.416 Testlog-Bytes und 162.394 Teil-Bytes des nativen Systemlogs gesichert. Kein belegter Spielstart. |
| 41977151858 | Intel-Bootstatus überschreitet 180 s, vor App-Bau. Reale spätere Signal-EPERM separat gespeichert, ursprünglicher Bootfehler und sämtliche vorhandenen Ausgabedigests bleiben erhalten. |
| 41977882747 | Vollständiger nativer Pilot auf Apple Silicon grün; keine alten Fehlschläge nachträglich aufgewertet. |

Die Ausgaben werden direkt geschrieben und nach Prozessende/Frist in unabhängige
Belegdateien kopiert. Gruppen-Signalfehler werden getrennt vermerkt; es wird nur
der eigene direkte Unterprozess zusätzlich signalisiert. Keine Rechteerhöhung.
Ein unbestätigter Gruppenstopp bleibt unbestätigt. Der neue Unit-Fall simuliert
EPERM; Lauf 41977151858 beobachtet diesen Fehler auch tatsächlich ohne erneutes
Verdecken des ursprünglichen Timeouts. Fehlende App-Dateien sind ausdrücklich
nicht dasselbe wie ein bestandener oder fehlerfreier Spielstart.

Der letzte Host speichert zusätzlich eine frühe, begrenzte `launch-stage.json`.
Der nicht abgenommene Zwischenaufbau verwendete WKContentWorld für die Dokument-
UUID. Der getestete letzte Aufbau verwendet stattdessen eine unveränderliche,
nicht aufzählbare Diagnoseeigenschaft `__cryptoidNativeDocumentToken` im
Seitenkontext, erzeugt einmal bei Dokumentstart. Kein Spielzustand, Timer,
Ereignislistener oder Eingabecode wird verändert. Die unabhängige
Python-Abnahme verlangt weiterhin dieselbe UUID und Navigationsgrenzen.
Der Erfolg des anderen Runner-Aufbaus beweist nicht, dass CPU-Architektur allein
oder die entfernte WKContentWorld die früheren Blockaden verursacht haben.
AX-/TTS-Fehler im Simulator sind kein nachgewiesener Handy-Abbruchgrund.

### Belege unabhängig prüfen

`python3 verification/native-webview-probe-20261105/verify_pilot_evidence.py`
verifiziert sämtliche neuen Original-ZIPs, Git-Blob-IDs, enthaltene Dateilängen
und SHA256, Befehlsausgaben und den vollständigen grünen Schlussbericht offline.
Die exakt bekannte Metadatenlücke des alten EPERM-Versuchs wird nur dort als
Lücke behandelt; der ganze unveränderte ZIP-Hash bleibt geprüft. Der separate
Syntaxfehler besitzt einen klar abgegrenzten Original-Unit-Logauszug und den
Digest des vollständigen CI-Joblogs; er wird nicht als Original-ZIP ausgegeben.
Die früheren drei Kontrollarchive bleiben über `verify_evidence.py` erhalten.
Original-Geräteberichte und geheime Freigabeparameter werden nicht in Git kopiert.
Die großen Gast-Paket-ZIPs bleiben zeitlich begrenzte CI-Artefakte. Ihre IDs und
Digests sowie alle ausgelieferten Dateihashes liegen in den archivierten Belegen;
die Spielquellen und Generatoren bleiben vollständig reproduzierbar in Git.

Alle 18 ursprünglichen Wurzeleinträge außerhalb `.github`/`verification` sind
mit b092f646 identisch, einschließlich der fünf geschützten Runtime-Bäume und
vercel.json. Keine Produktions-/Vercel-Umstellung, kein Merge, keine Anmeldung.
Die Belegergänzung startet wegen `[skip ci]` keinen unveränderten nativen Lauf.
Die tatsächlich geprüfte Implementierung bleibt über ihre volle Quelle oben
benannt; ein neuer Belegcommit ist keine neue gemessene Runtime.

Die nächste Untersuchung ist ein zuerst kurz qualifizierter nativer Prozess-
und Speicherzugriff, danach ein begrenzter Verlauf. Der vorhandene selektive
Simulator-RSS-Helfer wäre vorher auf wirkliche PID-Zuordnung zu prüfen. Ein
langer Ressourcenlauf wurde hier nicht gestartet. Kein weiterer unveränderter
Besitzer-Handytest wird verlangt. Die physische Ursache und ein dauerhaft
wirksamer White-Screen-Fix bleiben offen.

## Nächste Stufe: externer kurzer Speicherzugriff

Der neue Modus `--mode memory` lässt App-Quellen, XCTest-Bedienablauf und alle
bestehenden Pilotbedingungen unverändert. Nach der App-Kompilierung wird nur die
App installiert, damit der externe Collector den richtigen Datencontainer kennt.
Ein begrenzter launchctl-/ps-Zugriff erfasst dann die ausgewählten Dienste genau
dieses Simulators vor dem App-Start. Nur ohne bereits vorhandenen WebContent-
Renderer kann die kalte Zuordnung dieses Versuchs bestehen.

Während des kurzen originalen UI-Ablaufs liest ein getrennter Python-Prozess
nur die ohnehin geschriebenen nativen Beobachtungsdateien und ausgewählte
Simulator-Dienste. Er ruft kein JavaScript auf und schreibt keinen Spielzustand.
Für mindestens zwei verschiedene, fortgeschrittene aktive Beobachtungspunkte
muss exakt ein neuer WebContent-Renderer mit positiver RSS, demselben PID und
Prozessstart-Fingerabdruck sichtbar sein. Lauf, Quelle und Dokumentkennung müssen
vor/nach den CLI-Aufrufen passen. Die externe Verankerung darf höchstens 10 s
alt sein und ist ausdrücklich kein zeitgleicher Frame. Der vollständige native
UI-/Dokument-/Uhr-/Berichtspilot muss zusätzlich unverändert bestehen.

Die Ausgabe enthält Host-RSS ausgewählter Prozesse; sie ist kein eindeutiger
PSS-Gesamtwert, keine GPU-/VRAM- oder physische Telefonmessung. Nicht zuordenbare,
fehlende oder veraltete Daten bleiben Fehler. Die normalen 2.500-ms-Grenzen der
Spieluhr werden nicht verändert. Vier neue lokale Prüfungen zu Parsern und
Zuordnung bestehen zusätzlich zu den 14 vorhandenen Prüfungen. Ein langer
Ressourcenlauf oder eine White-Screen-Behebung wird daraus noch nicht abgeleitet.
