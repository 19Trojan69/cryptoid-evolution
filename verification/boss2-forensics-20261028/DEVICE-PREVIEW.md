# Getrennte Boss-2-Testversion

Die geschützte Diagnosevorschau ist bereit:
https://cryptoid-evolution-testnet-5b3yzzd2b-19-trojan69.vercel.app/

Vercel Preview `6fzP2Q2y46xKmHYYcj1sg3vHmVtD` ist READY, mit Quelle
`388587e2016d9bd8da4dd9405a837743b47b0805` und Tree
`f270e3230e5acae97db4302c751bc1d116e0fc29`. Die vorhandene Vercel
Authentication/Standard Protection bleibt aktiv. Keine Bypasslinks oder neuen
Zugriffsrechte wurden eingerichtet. Die Vorschau ist kein bestätigter Fix und
keine Freigabe für Spieler.

Der Zweig `codex/boss2-device-preview-20261028` bleibt getrennt von Main und dem
ursprünglichen Prüfzweig. PR199 bleibt unverändert als offener Draft auf
`9a0532801f6c733d89fe340a0efb84fc6c99edad`. Main steht unverändert auf
`ce073547cf573375d141bf846f70e294138dbd73`; die öffentliche Testnet-Produktion
ist weiterhin `239zEifRV84KCpbyHumnuHmSGm9T`. Kein Merge, keine Änderung der
öffentlichen Testnet-/Mainnet-Domains und kein Mainnet-Deployment.

## Ablauf auf dem Gerät

1. Die genaue Vorschauadresse im bisherigen Pi Browser öffnen. Falls verlangt,
   mit dem bereits berechtigten Vercel-Konto anmelden.
2. Die Standardoptionen zunächst beibehalten: offener Reaktor, lokale Diagnose
   und Testschutz. Auf **Testszene vorbereiten** warten, danach
   **Boss-2-Test öffnen** wählen. Der Kampf öffnet absichtlich angehalten.
3. Im Spiel selbst auf **Fortsetzen** tippen. Die Aktionen einzeln prüfen:
   normal spielen, schnell nach links wischen, einen System-Screenshot machen,
   anschließend einen App-Wechsel. Eine tatsächliche Pause nur selbst fortsetzen.
4. Nach einer auffälligen Pause oder einem weißen Bildschirm dieselbe Adresse
   im selben Browser erneut öffnen. Vor einem weiteren Lauf den neuesten
   **Bericht vorbereiten** und **Bericht speichern** wählen. Teilen ist eine
   ausdrücklich manuelle Aktion; es gibt keinen automatischen Upload.

Die Aufzeichnung gehört zur exakten Vorschauadresse und zum Browserprofil.
Ein anderes Deployment oder ein anderer Browser hat einen anderen lokalen
Speicher. Der letzte noch nicht geschriebene Abschnitt kann nach einem harten
Abbruch fehlen. Ein fehlender Eintrag belegt keine bestimmte Absturzursache.
Der Bericht misst weder den gesamten nativen RAM/GPU-Speicher noch einen
Betriebssystem-Grund für eine Prozessbeendigung.

## Testbedingungen und Isolation

Das Menü lädt Spielcode und Originalbilder erst nach ausdrücklicher Vorbereitung.
Die ursprünglichen Warmup-Pläne mit jeweils höchstens zwölf Einträgen werden
separat gehalten; der aktive Boss-Plan übernimmt die Cache-Nutzung, bevor die
Menü-Leases freigegeben werden. Jedes neue Dokument öffnet zunächst das Menü,
auch wenn die Browserhistorie auf `/game` zeigt. Kein automatischer Kampfstart
oder automatisches Fortsetzen.

Die Szene startet bei Boss2 mit Geschützen oder offenem Reaktor. Der Reaktorstart
entfernt Geschütze und setzt die Bossgesundheit auf die Hälfte. Der abschaltbare
Testschutz verlängert künstlich den Trefferschutz und setzt einen
40-Prozent-Gesundheitsboden für Boss2. Dies erleichtert längere Messungen und
entspricht keiner normalen Schwierigkeit. Spieluhren und der ursprüngliche
Watchdog bleiben unverändert: strikter Abstand über 2500 ms, Prüfung alle 500 ms.

Die Gast-Diagnosefähigkeit ist synthetisch und keine Pi-Owner-Verifikation.
Echte Anmeldung, Konten, Fortschritt, Käufe, Ranglisten und Live-Datenbanken
werden nicht benutzt. Der Builder schreibt keine Originaldatei unter
`frontend/src`. Ausschließlich im Build werden Menü, Auth, Transport und Usage
ersetzt sowie die genaue Boss-Vorgabe und vorhandene Laborhaken eingefügt.
Die Controller-Ergänzungen sind exakt reversibel; der normalisierte vollständige
Release-Hash bleibt
`625fecc2cb959e4ed4ba690f7867d0a07b247b9a136a8ce308afecaf6dcd94fa`.
Die 1740 originalen bemalten Varianten und die Originalassets behalten ihre
Auflösung. Der Builder verwendet diesen exakten Hash und benötigt keine
Vorfahren-Historie im flachen Vercel-Checkout.

Nur der Vorschauzweig ersetzt `api/index.ts` durch einen importfreien
Gast-/Sperrhandler. Kein Backend-, MongoDB- oder echtes Pi-SDK wird importiert.
Der Browsertransport erlaubt ausschließlich leere Gast-Leseantworten; andere
Aufrufe scheitern lokal. Der Server verweigert Konto-, Fortschritts-, Admin-
und Zahlungsoperationen und sperrt außerhalb `VERCEL_ENV=preview` vollständig.
Auch der Builder bricht außerhalb Preview vor dem Build ab. Die zweigeigene
`vercel.json` deaktiviert automatische Deployments. Dieser Zweig ist nicht zum
Merge nach Main bestimmt.

## Verifikation und offene Befunde

24 Isolations-/Diagnosetests, die instrumentierte Controller-/Boss-Typprüfung und
der Vite-Build sind bestanden. Der vorhandene Hinweis auf große JavaScript-Chunks
bleibt; ein bereinigter Gesamtprojekt-Lint oder eine neue vollständige
Releaseabnahme wird nicht behauptet. Die frühere Releasebasis hatte 514
bestandene Frontend-Prüfungen.

Der abschließende CI-Lauf `40767561502` auf `fc7f2cf7` besteht in Linux-Chromium:
30,813 aktive Sekunden, 30 Proben, Reaktorsalven 0 bis 10, reguläre Pause,
bestätigtes lokales Schreiben, kontrollierter Reload und ein heruntergeladener
Bericht mit 130 lückenlosen Einträgen und passenden Testoptionen. Gegenüber der
bereitgestellten App-Quelle unterscheiden sich ausschließlich die Workflowdatei
und `verifyDevicePreview.mjs`; Anwendungs- und Builderdateien sind identisch.
Der frühere kurze Chromium-Lauf direkt auf der bereitgestellten Quelle
`388587e2` war ebenfalls vollständig erfolgreich.

Der abschließende Linux-WebKit-Lauf ist **fehlgeschlagen**: Der Resume-Klick
begann den Countdown, kehrte aber nicht rechtzeitig zurück. Kein erster
Spielframe und keine aktive Probe wurden aufgezeichnet. Auch ein einzelner
nativer RAF-Probeaufruf blieb über zwei Sekunden ohne Rückruf. Zu diesem
Zeitpunkt war die Pause nicht als technische Pause markiert. Frühere Versuche
beobachteten auch einen `loop-stall` vor dem ersten Frame; ein anderer kurzer
Lauf auf `388587e2` erreichte acht aktive Proben. Damit ist die WebKit-
Startstörung weiterhin offen. Kein Renderer-Absturz, kein iPhone-Fehlergrund
und kein Speicherleck sind dadurch bewiesen. Der Matrixlauf ist insgesamt
fehlgeschlagen und wird nicht als vollständige Browserabnahme ausgewiesen.

Ein früherer Chromium-Lauf auf `67b83d1d` erreichte 900,159 aktive Sekunden und
320 Reaktorsalven ohne technische Pause im aktiven Fenster. Sein gesamter Job
scheiterte anschließend an einer inzwischen korrigierten Export-Prüfbedingung.
Dieser ältere kalte Gaststart ist Teilbeleg, kein bestandener Gesamtablauf und
kein identischer Vergleich mit der finalen vorbereiteten Szene. PSS stieg dort
von 371,50 auf 851,48 MiB, mit 881,43 MiB Spitze. Ohne Heap-Snapshot oder
erzwungenen GC trennt dies vorübergehende und gehaltene Belegung nicht und
beweist weder ein Leck noch ein langfristiges Plateau. Die Playwright-Verbindung
war in den Laborläufen vorhanden. Linux-Prozesswerte sind keine iPhone-RAM-Werte.

Auf der tatsächlichen geschützten Vercel-Adresse wurde zusätzlich der sichtbare
Ablauf in angemeldetem Cloud-Chromium geprüft: Menü, Vorbereitung, angehaltener
Boss2, manuelles Fortsetzen, laufender Kampf, manuelle Pause, neues Dokument,
Berichtsvorbereitung und Download. Der lokale JSON-Bericht hat 260445 Bytes,
109 lückenlose Einträge, passende Optionen und den Eintrag `manual-pause`.
Die Quelle im Bericht stimmt mit `388587e2` überein. Dies ist kein physischer
iPhone-/Android-/Pi-Browser-Test und keine Prüfung echter Systemgesten.

Alle genauen Quellen, Teilbefunde, Artefakt-Hashes und Grenzen stehen in
[`device-preview-results.json`](device-preview-results.json). Das Bild
[`device-preview-evidence/deployed-report-menu.jpg`](device-preview-evidence/deployed-report-menu.jpg)
zeigt den vorbereiteten Bericht auf der tatsächlichen Vorschau. Private
Owner-Anhänge und vollständige Geräteberichte wurden nicht in Git übernommen.
Der nächste erforderliche Beleg ist der lokale Bericht nach dem Fehler auf
dem echten Gerät; aus dieser Vorschau wird noch keine Produktionsfreigabe
abgeleitet.
