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
kein Gerät/USB, keine Aufnahme, keine automatische Wiederholungs-/Resume-Schleife.
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
