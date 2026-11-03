# Safari-Werkzeugkontrolle ohne das Spiel

Diese kurze Prüfung untersucht die noch nicht erfolgreich verbundene mobile
Testumgebung. Sie lädt weder das Spiel noch dessen Gast-Build. Zwei unabhängige
Standard-Mac-Runner prüfen die bereits installierten iOS-Runtimes 18.5 und 26.2.
Eine fehlende Runtime bleibt ein Vorprüfungsfehler; es werden keine SDKs
nachgeladen oder Konten/Dienste eingerichtet.

Appium 3.9.0 und der kompatible XCUITest-Treiber 12.22.8 starten zuerst eine
native Sitzung mit MobileSafari, ohne `browserName=Safari`. Damit lässt sich
die tatsächliche native Oberfläche lesen, bevor eine Web-Inspector-Verbindung
vorausgesetzt wird. Die Prüfung akzeptiert keine unbekannten Einführungs- oder
Berechtigungsdialoge. Erfasst wird nur die Accessibility-XML des eigenen frischen
Simulators, keine Bildschirmaufnahme und kein Besitzergerät.

Danach wird eine konstante HTML-Seite auf dem lokalen Rechner geöffnet. Ein
gültiger Erfolg verlangt die passende Safari-Webview, die tatsächliche lokale
DOM-Überschrift und genau eine native Berührung mit `event.isTrusted=true`.
Eine nur gestartete Begleit-App oder eine vorhandene XML-Oberfläche reicht
nicht aus. `includeSafariInWebviews=true` stellt sicher, dass Safari-Kontexte in
dieser anfangs nativen Sitzung überhaupt berücksichtigt werden.

Native Quellen und Appium-Protokolle werden begrenzt und mit dem bereits
getesteten Fragment-/SHA-256-Verfahren gesichert. Unterprozesse schreiben in
eine getrennte Datei. Host-Swap und `vm_stat` dienen ausschließlich der
Einordnung der Simulatorumgebung, nicht einer iPhone-RAM-Messung.

Das ist eine Werkzeugkalibrierung und kein Spiel-, Stabilitäts- oder
White-Screen-Nachweis. Die Simulatorprofile sind eigenständige
Testkonfigurationen und erlauben keine physische Geräteabnahme.
Alle Spiel-/Grafik-/Tonquellen und `main` bleiben unverändert.
Die beiden Jobs verwenden ausschließlich den für das öffentliche Repository
kostenlosen Standard-Runner `macos-15`, keine Artefakt-Uploads oder Zusatzdienste.
