# Getrennte Boss-2-Testversion

Die bestätigte Fortsetzung bereitet einen geschützten Testlink vor. Basis ist
der abgeschlossene Prüfstand von PR199, Remote9a053280/tree79ad62fb. Der neue
Zweig codex/boss2-device-preview-20261028 bleibt vom Prüfzweig und Main getrennt.
Kein Merge und kein Wechsel der öffentlichen Testnet-/Mainnet-Domains.

## Testablauf

Die neue Startseite bietet Boss2 mit Geschützen oder offenem Reaktor, eine
lokale Diagnose und abschaltbaren Testschutz. Der Reaktorstart entfernt die
Geschütze und setzt halbe Bossgesundheit. Der Testschutz entspricht dem früheren
Labor: künstlich verlängerter Trefferschutz und höchstens40-Prozent-Gesundheitsboden
für Boss2. Native Spieluhren, Originalgrafik/-audio, Pausen und manuelles Resume
bleiben erhalten. Der Schutz ist keine normale Schwierigkeitsabnahme.

Jedes neue Dokument startet im Menü. Nach einem Abbruch zuerst den Bericht
vorbereiten und speichern/teilen. Kein automatischer Neustart eines Kampfes,
kein automatischer Upload. Für Hosts ohne Dateifreigabe gibt es vorhandene
begrenzte Textteile des vollständigen Berichts. Der vorhandene begrenzte
IndexedDB-Mitschnitt, Crash-Tail und Flight-Recorder bleiben lokale Belege;
eine nicht geschriebene letzte Probe kann fehlen. Keine native RAM-/GPU- oder
Betriebssystem-Absturzursache wird von diesem Webbericht behauptet.

Die Diagnosefähigkeit der Gastfixture ist ausdrücklich synthetisch. Sie ist
keine echte Pi-Owner-Verifikation. Der Zugriff auf die gesamte Vorschau bleibt
durch die vorhandene Vercel Authentication/Standard Protection geschützt.
Keine Bypasslinks, keine Änderung dieses Schutzes, keine neuen Konten/Käufe.

## Isolationsgrenze

Der Builder schreibt keine Originaldatei unter frontend/src. Ausschließlich
im Build werden App-Menü, Gast-Auth, Axios-Transport und Usage ersetzt sowie
die genaue Boss-Vorgabe und vorhandenen Laborhaken eingefügt. Die Controller-
Ergänzung ist exakt reversibel; nach Rücknahme der bereits geprüften zwölf
Pause-Hunks bleibt der vollständige Release-Hash625fecc2cb959e4ed4ba690f7867d0a07b247b9a136a8ce308afecaf6dcd94fa.
1740 originale bemalte Varianten und sämtliche Originalassets werden ohne
Auflösungsänderung übernommen.

Nur dieser neue Zweig ersetzt api/index.ts durch einen importfreien
Gast-/Sperrhandler. Kein Backend-, MongoDB- oder Pi-SDK-Import. Der im Browser
isolierte Transport kann nur leere Katalog-/Ranglisten lesen; andere Aufrufe
scheitern lokal, bevor Netzwerkzugriff möglich ist. Der serverseitige Handler
verweigert Konto-, Fortschritts-, Admin- und Zahlungsoperationen und ist
außerhalb VERCEL_ENV=preview vollständig gesperrt. Auch der Builder bricht
außerhalb Preview vor dem Build ab. Projektweite Einstellungen werden nicht
geändert; vercel.json dieses Zweigs deaktiviert automatische Deployments und
weist den isolierten Buildausgang aus.

## Prüfung und Bereitstellung

Lokal sind23 Isolations-/Diagnosetests, die instrumentierte Controller-/Boss-
TypeScriptprüfung und ein vollständiger Vite-Produktionsbuild bestanden.
Die bestehende Releasebasis hatte514 bestandene Frontend-Prüfungen. Die
ursprünglichen Spielquelldateien bleiben gegenüber dieser Basis unverändert;
eine erneute pauschale Releaseabnahme oder bereinigter Projektlint wird nicht
behauptet. Der bestehende Warnhinweis für große JS-Chunks bleibt.

Der neue CI-Workflow prüft den tatsächlichen direkten Einstieg, reguläre Pause,
bestätigtes lokales Schreiben, kontrollierten Reload und Export eines zusammen-
hängenden Berichts in Chromium und Linux-WebKit. Chromium erhält zusätzlich
15 Minuten Produktionsbeobachtung mit ausschließlich äußeren Prozesszählern,
ohne Heap-Schnappschuss oder erzwungenen GC. Die Playwright-Verbindung bleibt
ein Messfaktor; es wird kein vollständig unbeobachteter Browser behauptet.

Der Vercel-Connector kann die Projekte auflisten, verweigert aber Projektdetails
mit404 und die Deploymentliste mit403. Keine CLI-Anmeldedaten sind vorhanden.
Der bereits freigegebene Dashboard-Weg ist verfügbar; vorab sind Testnet
Production239zEifRV84KCpbyHumnuHmSGm9T mit Quellece073547 und aktive Standard
Protection beobachtet. Neue Bereitstellung ausschließlich als Preview unter
dem bestehenden geschützten Projekt; keine neuen Projekt-/Schutz-/Abrechnungs-
einstellungen. Tatsächliche URL/Quelle/READY und die unveränderte öffentliche
Bereitstellung werden nach Abschluss gesondert festgehalten. Bis dahin ist
kein neuer Testlink als fertig ausgegeben.
