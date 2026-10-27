# Cryptoid Evolution – geräteübergreifende White-Screen-Prüfung

Stand: 27. Oktober 2026. Der gemeldete Fehler betrifft iPhone und Android-Smartphone.
Ein tatsächlicher Ausfall auf Android-Tablet ist noch nicht bestätigt. Der zeitliche
Zusammenhang zwischen einem System-Screenshot und einem White Screen bleibt ein
möglicher Auslöser; eine Ursache ist damit nicht bewiesen.

## Ergebnis

Drei externe Browserläufe mit jeweils 30 Minuten normaler Zeitmessung sind
abgeschlossen. In den geprüften Bedingungen wurde kein White Screen reproduziert.

| Simulation auf Linux | Browser | Spielzeit | Endstand Level / Block | Boss-/Bonus-Abschlüsse mit Fortsetzen | Ergebnis |
| --- | --- | --- | --- | --- | --- |
| Android-Smartphone | Chromium 151.0.7922.34 | 30 Min. | 7 / 3 | 6 | bestanden |
| Android-Tabletprofil | Chromium 151.0.7922.34 | 30 Min. | 6 / 9 | 5 | bestanden |
| iPhone | WebKit 26.5 | 30 Min. | 6 / 2 | 5 | bestanden |

Insgesamt: 90 Minuten Beobachtungszeit, 16 Boss-/Bonus-Abschlüsse, 30
Browseraufnahmen. In allen drei Läufen wurden normale Kämpfe, Boss-Intro,
Bosskampf, Bossabschluss, Bonus, Karten und manuelles Fortsetzen beobachtet.
Pause und Resume wurden jeweils ausdrücklich bedient. JavaScript-, Konsolen-,
API- und erfasste Canvas-Ressourcenfehler: jeweils null.

Die Protokolle zeigen regelmäßigen Spielfortschritt. Der größte Abstand ohne
Änderung der ausgewerteten Spielmerkmale betrug 31, 16 bzw. 32 Sekunden; es blieb
kein Lauf dauerhaft an einem Menü stehen. Dies ist keine Messung des Frameabstands.

Die bekannten Canvas-Cache-Spitzen lagen bei ca. 3,50 MiB, 3,50 MiB und 3,19 MiB.
Diese Zähler erfassen einen Teil der Ressourcen und ersetzen keine Messung des
gesamten Prozess-, Geräte- oder GPU-Speichers. Daraus wird keine Aussage abgeleitet,
dass ein nativer Speicherfehler ausgeschlossen sei.

**Die Ursache auf echten Geräten bleibt offen. Der historische Fehler ist durch
diese Ergebnisse nicht nachweislich behoben.** Die gesamte Kampagne mit 500
Abschnitten wurde hier nicht vollständig durchgespielt. Das Smartphone- und
Tabletprofil passierten Abschnitt 54 aus dem früheren Bericht; das iPhoneprofil
endete bei 52.

## Nachweise und unveränderter Spielstand

- [Drei bestandene 90-Sekunden-Probeläufe](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/40570077403).
- [Drei bestandene 30-Minuten-Läufe und Artefakte](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/40571082434).
- [Maschinenlesbare Zusammenfassung](completed-results.json), einschließlich
  SHA-256-Prüfsummen der drei heruntergeladenen und auf ZIP-Integrität geprüften Artefakte.
- Ausgeführter Test-Commit: `bab964304bda63a94be1a840260b1f1342bed89b`.
- Spielcontroller aus Main: `97d74b412f7dc7ea2f4f8c05f483d87eb3451dba`.
  SHA-256 von GamePage: `8c70e6a2010fa6349dc7b70ae43a8b304ff380a7d45d21359935c458dd81511a`.

Die veröffentlichten Gameplay-Dateien sind unverändert. Beobachtungshaken werden
ausschließlich im isolierten Vite-Testserver eingesetzt. Die vorhandene
Backend-Handler-Testumgebung wird wiederverwendet. Artefakte enthalten Zustände,
Ereignisse, Bilder und einen Playwright-Trace des künstlichen Testkontos; die
Aufbewahrung wurde auf drei Tage eingestellt. Die letzten Aufnahmen aller drei
Profile wurden zusätzlich visuell geprüft.

Diagnose-Entwurf #194 bleibt separat und ungemergt. Dieser Testentwurf #195 bleibt
ebenfalls ungemergt; automatische Vercel-Veröffentlichung ist für den Prüfzweig
deaktiviert. Private Originalberichte werden nicht in dieses öffentliche Paket kopiert.

## Umfang und Grenzen

Die drei Profile verwenden Pixel 7 (412 × 839, DPR 2,625), Galaxy Tab S4
(820 × 1180, DPR 2,25) und iPhone 15 Pro Max (430 × 825, DPR 3).
Die Gerätebezeichnungen und User Agents sind Emulationsvorgaben. Sie belegen
keinen Test auf einem echten Android-Gerät, dem Xiaomi Pad 7 oder einem iPhone.

Pi-Anmeldung, Konto, Datenbank und Kaufbestand sind künstlich. Es wurden keine
echten Zahlungen durchgeführt. Der echte Controller läuft mit echten Uhren,
reproduzierbarem Zufall, geskripteten Eingaben und offengelegtem Kollisionsschutz
für die Dauerprüfung. Dies prüft nicht Sterblichkeit, Balance oder die reale
Pi-Anmeldung.

Die ersten 20 Minuten jedes Langlaufs enthalten keine Seitenaufnahmen, das letzte
Drittel etwa eine pro Minute. Eine Playwright-Seitenaufnahme ersetzt keinen
Android-/iOS-System-Screenshot. Die pixelbasierte Prüfung erkennt nahezu
vollständig weiße Aufnahmen; sie erkennt nicht jeden möglichen Darstellungsfehler.
Leichtes Tracing läuft durchgehend und kann selbst Aufwand verursachen.

## Wiederholen

Der vorhandene GitHub-Lauf kann bei Bedarf erneut ausgeführt werden. Der Workflow
liegt in `.github/workflows/cryptoid-cross-device.yml` und startet beim Ändern
seiner Testdateien auf `codex/cross-device-white-screen-20261027`.
Standarddauer: 1800 Sekunden je Profil.

Der ausgeführte Lauf hatte ein Joblimit von 55 Minuten. Nur die äußere
Zeitgrenze wurde danach auf 85 Minuten erhöht, damit die bereits erlaubte
3600-Sekunden-Eingabe samt Installation hineinpasst. Spiel- und Läufercode bleiben
dabei unverändert. Der Ergebnis-/Zeitgrenzen-Commit verwendet
[`[skip ci]`](https://docs.github.com/actions/managing-workflow-runs/skipping-workflow-runs),
damit das Sichern der Ergebnisse keinen weiteren Langlauf auslöst.

Lokal in einer Umgebung mit Browser- und Socket-Unterstützung:

```sh
npm install --prefix frontend --include=optional --no-audit --no-fund
npm ci --prefix backend --include=optional
npm run build --prefix backend
npm run prepare:hulls --prefix frontend
npm install --prefix verification/cross-device-white-screen-20261027 --ignore-scripts --no-audit --no-fund
cd verification/cross-device-white-screen-20261027
npx playwright install --with-deps chromium webkit
npm run preflight
CRYPTOID_TEST_PROFILE=android-phone CRYPTOID_TEST_SECONDS=1800 npm test
```

Preflight prüft Controller-Gleichheit, den instrumentierten TypeScript-Code und
Start/Inventar über die vorhandenen echten Handler. Es wurden keine
Produktionsdateien für diesen Check umgeschrieben.

## Vorherige Hindernisse

Die lokale Browserausführung scheiterte an der Socket-Richtlinie der Umgebung.
Vercel verweigerte das Erstellen einer Sandbox mit HTTP 403; ein angemeldeter
CLI-Zugang war nicht verfügbar. Deshalb erfolgten die Browserläufe bei GitHub.

Die ersten externen Aufbauversuche scheiterten an einem fehlenden Frontend-npm-
Lockfile, einer zu strengen Bewertung normaler Modal-Verlaufseinträge bzw. einer
zu kurzen Start-Klickfrist. Diese Fehler wurden im Testgerüst korrigiert. Sie
zählen weder als bestandene Spieldauer noch als reproduzierter White Screen.
Die früheren Actions-Läufe bewahren diese Abgrenzung.

## Nächster Nachweis: echter Android-Pi-Browser

Vorbereitet ist ein Lauf direkt im betroffenen Android-Pi-Browser. Dafür fehlt
hier der Zugriff auf ein echtes betroffenes Gerät bzw. eine dort aufgezeichnete
Diagnose. Zunächst Gerätemodell, Android-, Pi-Browser- und WebView/Chrome-Version,
Spieladresse/Build, Schiff, Einstellungen, Level/Block und Uhrzeit festhalten.
Bestehende Spielstände behalten; keine Speicherdaten löschen.

1. Vergleichbarer Vordergrundlauf ohne System-Screenshots.
2. Separater Lauf mit dem normalen Android-System-Screenshot während des Kampfs
   und gesondert an einem Übergang. Uhrzeit und Level/Block notieren. Kein
   gleichzeitiges Bildschirmvideo in diesen Vergleich einführen.
3. App-Wechsel und Rückkehr separat prüfen; normales manuelles Resume beibehalten.
4. Beim nächsten tatsächlichen Ausfall den vorhandenen Spielbericht erhalten und
   möglichst direkt einen Android-Systemfehlerbericht sichern. Android beschreibt
   dafür **Entwickleroptionen → Fehlerbericht erstellen** sowie
   [`adb bugreport`](https://developer.android.com/studio/debug/bug-report).

Für einen Tester mit bereits autorisierter USB-Debugging-Verbindung:

```sh
adb devices -l
adb -s DEVICE_SERIAL bugreport /privater/Pfad/cryptoid-android-bugreport.zip
```

Gerätekennung und privaten Ausgabepfad passend ersetzen. Diese Gerätebefehle
wurden hier nicht ausgeführt. Systemberichte vor dem Teilen prüfen und außerhalb
dieses öffentlichen Repositorys halten. Ein Systembericht garantiert noch keinen
Ursachennachweis; er kann die bisher fehlende native Ebene ergänzen.

Appium/UiAutomator2 kann nach vorhandenem Gerätezugriff die Automatisierung
übernehmen. WebView-Automatisierung setzt einen freigegebenen, debugfähigen Host
voraus; ob Pi Browser dies auf dem betroffenen Gerät anbietet, ist ungeklärt.
[Anforderungen des Android-Treibers](https://github.com/appium/appium-uiautomator2-driver#requirements).
