# Safari-Werkzeugkontrolle ohne das Spiel

Diese kurze Prüfung untersucht die noch nicht erfolgreich verbundene mobile
Testumgebung. Sie lädt weder das Spiel noch dessen Gast-Build. Die aktuelle
Kontrolle verwendet einen Standard-Mac-Runner mit der bereits installierten
iOS-Runtime 18.5. Frühere Kontrollen erfassten zusätzlich 26.2.
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
Die Jobs verwenden ausschließlich den für das öffentliche Repository
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


## Erster WDA-Vorbau: Verbindung beendet, Compiler noch tätig

Quelle `65258409506f659b565d71359626f3cc2520e744`,
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41606037254

Appium wurde nach 1803 ms bereit, und iOS 18.5 bootete. Die native Sitzung
scheiterte anschließend mit `fetch failed`. Im gesicherten Ende des Xcode-
Protokolls lief noch die statische Analyse von WebDriverAgent; ein erfolgreicher
Abschluss war darin nicht zu sehen. Die Fehlerursache des HTTP-Transports wurde
in dieser Fassung nicht erfasst. Ein bestimmter HTTP-Timeout oder Speichermangel
ist deshalb nicht bewiesen. Die Fehleraufnahme wurde zwar erzeugt, überschritt
aber die eigene 2-MiB-Grenze und wurde ausdrücklich nicht gesichert.
Auch dieser Versuch hat weder die Kontrollseite noch das Spiel erreicht.

Die nächste Fassung baut die tatsächlich installierte WebDriverAgent-Version
in einem eigenen `xcodebuild build-for-testing`-Unterprozess **vor** dem Booten
des Simulators und **vor** der HTTP-Sitzungsanforderung. Sie führt keine
zusätzliche `analyze`-Aktion aus. Projekt und Version werden aus der tatsächlich
installierten Treiberabhängigkeit ermittelt; der Simulator verwendet keine
Signierkonten (`CODE_SIGNING_ALLOWED=NO`). Nach spätestens sechs Minuten wird
der Compiler beendet. Rückgabecode, Signal, Dauer, SHA-256 und bis zu 2 MiB
Compilerprotokoll werden getrennt erfasst. Erst Rückgabecode 0 ohne Signal
erlaubt den nächsten Schritt.

Danach verwendet Appium `usePrebuiltWDA:true` und genau denselben
`derivedDataPath`. Es bleibt bei einem Startversuch und 120 Sekunden
WDA-Verbindungsfrist. Die HTTP-Sitzungsanforderung hat ein getrenntes
Vier-Minuten-Budget; Transportfehler erfassen nun auch ihre `cause`-Information.
Die native Kontrollseite und die vertrauenswürdige Berührung bleiben zwingend.
Ein einzelnes Fehlerbild verwendet das native JPEG-Ausgabeformat, mit derselben
2-MiB-Grenze; ein fehlendes Bild wird weiterhin als fehlend erfasst.


## WDA-Projektsuche korrigiert und vor dem Mac-Lauf geprüft

Quelle `47bed1ef078f74567f849fd0b70d2616cb4d1c78`,
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41609401004

SDK-Katalog und Werkzeuginstallation bestanden. Die folgende Projektsuche mit
`require.resolve('appium-webdriveragent')` scheiterte jedoch sofort mit
`ERR_PACKAGE_PATH_NOT_EXPORTED`: Das installierte Paket bietet keinen
CommonJS-Haupteinstieg an. Das war ein Fehler des Testskripts vor Appium-Start,
WDA-Bau, Simulator-Boot und Spielzugriff. Es gab daher noch keinen
`ENVIRONMENT_RESULT`-Datensatz; das vollständige Jobprotokoll bleibt erhalten.

Die korrigierte Suche liest Projektdaten über die tatsächlichen
Abhängigkeitssuchpfade des installierten XCUITest-Treibers, ohne das Paket als
CommonJS-Modul zu laden. Sie verlangt den passenden Paketnamen, eine Version
und das vorhandene Xcode-Projekt. Zwei lokale Tests bestätigen verschachtelte
und hochgezogene ESM-only-Pakete sowie die Ablehnung eines unvollständigen
Pakets. Dieselben Tests laufen im Workflow vor jeder Werkzeuginstallation.
Die Projektsuche liegt nun außerdem innerhalb des strukturiert protokollierten
Fehlerpfads. Keine Bau-, Safari-, Touch- oder Spielbedingung wurde gelockert.


## WDA-Bau und native Safari-Sitzung bestanden, Webkontext fehlt

Quelle `84687baee154b00dc8afbb6898210071c80bd15d`,
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41610544065

Die Vorprüfungen bestanden. Die tatsächlich installierte WebDriverAgent-Version
ist 16.17.7; deren separater Bau endete nach 136875 ms mit Rückgabecode 0 und
`TEST BUILD SUCCEEDED`. Die vollständige lokale Compilerdatei hatte 3148545
Byte; gesichert ist ausdrücklich nur ihr Ende von maximal 2 MiB samt Länge
und SHA-256 der vollständigen lokalen Datei. Das ist keine vollständige
Aufbewahrung der Compilerdatei.

Simulator-Boot, native iOS-Sitzung und Lesen der Accessibility-XML bestanden.
Nach dem lokalen Deep Link belegen XML und genau ein erst nach dem Fehlschlag
erstelltes JPEG die geladene konstante Kontrollseite. Das JPEG hat 133627 Byte;
sein SHA-256 ist
`b87e24a04c3c2716fbf6050ed76db4c68dd1201c10ec47931f194a92ba7c007b`.
Es gab keinen Einführungsdialog. Die Kontextabfrage lieferte jedoch nur
`NATIVE_APP`, keinen inspizierbaren Webkontext. Die zwingende DOM-/Touch-Prüfung
wurde daher nicht erreicht; `complete` bleibt falsch und das Spiel ungeladen.

Die veröffentlichte npm-Quelle von XCUITest 12.22.8 wurde zusätzlich gegen ihre
npm-SHA-512-Integritätsangabe geprüft (Archiv-SHA-256:
`59861cb31678fd630aba8aa22ccd7683a731240e457e7ae44af1c3e97abf38bd`).
Deren `configureAUT()` setzt den Safari-Modus ausschließlich bei
`browserName: Safari`; dieser Wert fließt auch in den Remote-Debugger ein.
Die folgende Variante prüft deshalb diesen Browsermodus mit demselben lokalen
Anfangslink. Anschließend wird für die native Quellenprüfung ausdrücklich auf
`NATIVE_APP` umgeschaltet. WDA-Bau, Startbudgets, DOM-Abgleich und genau eine
vertrauenswürdige Berührung bleiben unverändert. Das ist ein gezielter
Werkzeugvergleich, keine bereits bewiesene Ursache des fehlenden Webkontexts.
