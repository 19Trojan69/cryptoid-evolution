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
Simulators und kein Besitzergerät. Nach einem Fehlschlag darf zusätzlich genau
ein Bild des eigenen Simulators zur internen Diagnose erfasst werden; es gibt
keine Aufnahme während der eigentlichen Kontrolle und kein Video.

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
kostenlosen Standard-Runner `macos-15-intel`, keine Artefakt-Uploads oder Zusatzdienste.

## Erster Kontrollversuch auf dem 7-GB-ARM-Runner

Quelle `9ad59a8014662e93a3202f126064537b80213c51`,
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41601229054

Beide bereits installierten Runtimes ließen sich booten. Anschließend wurde
der Appium-Server innerhalb der vorgesehenen 30 Sekunden nicht bereit; seine
Konsolendatei blieb leer. Es gab noch keine native Sitzung, keinen DOM-Zugriff
und keine erfolgreiche Berührung. Auch diese Kontrolle ist fehlgeschlagen,
nicht ein bestandener Safari- oder Spieltest.

Die Vorher-/Nachher-Messungen melden jeweils 7 GiB Host-RAM und keine Swap-
Nutzung. Der belegte Kompressor stieg von rund 175/271 MiB auf 1582/1828 MiB
für iOS 18.5/26.2. Das misst die belastete Testumgebung, nicht das Spiel oder
einen Handy-Abbruchgrund. Niedrige freie Seiten allein beweisen keinen OOM.

Die nächste Kontrolle verwendet deshalb den ebenfalls kostenlosen Standard-
Intel-Runner mit 14 GB und bringt Appium vor dem Simulator auf Betriebsbereitschaft.
Ein vorzeitiges Serverende wird gesondert erfasst. Für den Serverstart gelten
höchstens 60 Sekunden; die native Kontrollseite und die echten Spielgates werden
nicht abgeschwächt. Das ist eine neue funktionale Einrichtung, kein kausaler
Speichervergleich der beiden Host-Konfigurationen.

## Erste Intel-Kontrolle: Transport bereit, kalte SDK-Abfrage nicht fertig

Quelle `3ed179dae4a16414fde0025da4f4ab73425e8800`,
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41602272635

Appium 3.9.0 samt geladenem XCUITest 12.22.8 war in beiden Jobs tatsächlich
betriebsbereit: nach 3612 ms für den angeforderten 18.5-Job und 4152 ms für
den 26.2-Job. Beide Rechner meldeten `x86_64` und 15032385536 Byte Host-RAM.
Das ist ein bestandener Transportstart, noch keine native Safari-Sitzung.

Die darauffolgende kalte Abfrage `xcrun simctl list --json` erreichte die eigene
45-Sekunden-Grenze. Es wurde daher noch kein Simulator für diesen Job erzeugt.
Auch diese beiden Kontrollen bleiben insgesamt fehlgeschlagen.

Die folgende Einrichtung initialisiert den Katalog zuerst in einem eigenen
Schritt vor Appium-Installation und -Start. Die kalte SDK-Abfrage hat höchstens
150 Sekunden; bei Fehlschlag werden die weiteren Schritte nicht ausgeführt.
Der folgende Probe liest ausschließlich den Katalog desselben frischen Jobs.
Einzelne Kommandofehler nennen nun Befehl, Argumente und tatsächliche Dauer.
Dieses separate Startbudget verändert keine Spieluhr und kein Safari-/Spielgate.

## SDK-Initialisierung bestanden, native Begleit-App noch nicht erreichbar

Quelle `c992d328954c2f17dcaa8b8e1c1a46774fc15e48`,
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41603725777

Beide SDK-Kataloge und Appium-Serverstarts bestanden. Unter iOS 18.5 bootete
der Simulator; die WebDriverAgent-Begleit-App antwortete innerhalb der separaten
120-Sekunden-Startfrist nicht auf Port 8100. Appium beendete danach den laufenden
`xcodebuild`-Prozess. Ohne dessen bisher ausgeblendete Bauausgabe ist nicht
belegt, ob der Compiler noch arbeitete oder die fertige App nicht startete.
Unter iOS 26.2 lief dagegen bereits `simctl bootstatus` in sein eigenes Limit.
Beide Kontrollen bleiben fehlgeschlagen, ohne native Sitzung oder Spielzugriff.

Die weitere Kalibrierung konzentriert sich deshalb auf die bereits bootende
Runtime 18.5. Das dokumentierte `prebuildWDA:true` trennt den ersten Bau vom
Verbindungsstart; `showXcodeLog:true` sichert die konkreten Compiler-/Testmeldungen.
Die gesamte kalte Sitzungseinrichtung ist auf zehn Minuten begrenzt. Es bleibt
bei genau einem WDA-Startversuch; die 120-Sekunden-Verbindungsfrist, die benötigte
Webview und die echte Berührung werden nicht ersetzt oder als Erfolg umgedeutet.
Ein eventuelles einzelnes Fehlerbild wird begrenzt, mit SHA-256 versehen und
als reine Simulator-/Werkzeugdiagnose gekennzeichnet. Das Spiel bleibt ungeladen.
