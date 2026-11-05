# Native WebView-Messumgebung, 5. November 2026

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
