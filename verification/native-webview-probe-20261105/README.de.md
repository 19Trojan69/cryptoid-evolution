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

Werkzeuge: vorinstalliertes Xcode 26.2, iOS-18.5-Simulator und offizielles XcodeGen
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
