# Audio beim Fortsetzen im Pi Browser

## Befund und begrenzte Korrektur

Der Nutzer meldet fehlenden Ton nach erneutem Einstieg in den Pi Browser und
„Fortsetzen“. Ein Geräte-Reproduktionslauf liegt noch nicht vor.

Die bisherigen allgemeinen Audio-Gestenhandler überspringen die Statuswerte
`loading` und `paused`. Genau diese Werte gelten beim Tipp auf das gespeicherte
Spiel beziehungsweise beim Start des 3–2–1-Countdowns. Die späteren Audioaufrufe
nach Kontoanfrage oder Countdown liegen außerhalb dieses ursprünglichen Tipps.
Ein vom Browser unterbrochener AudioContext kann so bis zu einem weiteren Tipp
auf das Spielfeld unterbrochen bleiben.

Beide Fortsetzen-Wege rufen jetzt die vorhandene Effekt-Audioinitialisierung
und die Freigabe des vorhandenen Musik-Audiographen direkt im Ereignishandler
auf. Darauf wird nicht gewartet: Eine verzögerte oder abgelehnte Audio-Promise
blockiert weder Kontoanfrage noch Countdown. Ein verborgenes Dokument startet
keinen Freigabeversuch. Die Musikeinstellung wird berücksichtigt.

`MusicPlayer.unlock()` gibt nur den Audiographen frei. Das pausierte
Medienelement startet dadurch nicht während des Countdowns. Musikposition,
Lautstärke, Quellen, Samples, Effekte und der vorhandene Pause-/Close-Lebenszyklus
bleiben erhalten. Eine ausstehende Freigabe kann einen geschlossenen Player
nicht wieder aktivieren. Spielstände, Konto-APIs, Käufe und Simulation wurden
nicht geändert.

## Prüfung am 16. Oktober 2026

- Vor der Korrektur scheiterten drei neue Regressionstests an der fehlenden
  Audiofreigabe innerhalb des tatsächlichen Fortsetzen-Handlers.
- Danach bestanden alle 28 gezielten GameAudio-/MusicPlayer-/Resume-Tests.
- Die komplette Frontendprüfung bestand mit 415 Tests, null Fehlern und null
  übersprungenen Tests, einschließlich Seiten, i18n, Hooks und Bibliothekscode.
- Frontend-Releasebuild mit `VITE_CRYPTOID_DIAGNOSTICS=0`, TypeScript und
  Sprachprüfung erfolgreich; Backend-TypeScript-Build erfolgreich. Der bestehende
  Vite-Hinweis auf große Chunks bleibt bestehen.
- Quellenvergleich mit `1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220` bestanden.
  Die einzige zusätzliche JSX-Ausnahme ist der exakt bezeichnete gespeicherte
  Resume-Handler; Knopf, Text, Klassen und alle anderen Handler bleiben Teil des
  exakten Vergleichs. Die Simulation bleibt wie beim vorherigen Stabilitätsstand.
- Alle elf erzeugten JavaScript-Dateien enthalten keine der geprüften privaten
  Diagnose-/Isolationsmarkierungen.

Reproduktion im Repository:

```sh
cd frontend
node --experimental-strip-types --test src/pages/*.test.mjs src/*.test.mjs src/hooks/*.test.mjs src/lib/*.test.mjs
node scripts/verifyDiagnosisPreservation.cjs
cd ..
VITE_CRYPTOID_DIAGNOSTICS=0 npm run build --prefix frontend
npm run build --prefix backend
```

Diese Prüfungen verwenden kontrollierte Audioklassen und echte UI-Callback-
Quellen. Sie belegen keine erfolgreiche Tonausgabe auf einem iPhone oder im
Pi Browser. Die gemeldete Schussverlangsamung ist ein separater, weiterhin
offener Gerätebefund; diese Korrektur ändert keine Schusszeit oder Bewegung.

## Veröffentlichung und Rückfall

Die Korrektur wird im vorhandenen, für automatische Deployments gesperrten
Branch `codex/testnet-stability-20261016` vorbereitet. Ausgangspunkt und direkter
Elterncommit des neuen Release-Stands ist die derzeit öffentlich geprüfte
Testnet-Version `5f025e92b6eafd9523512e7b5b048e6777bd923e`. Dieser unveränderliche
Commit und das bestehende Deployment erlauben einen Rückfall ohne neue Branches.

Das Release übernimmt ausschließlich die Audioquellen, zugehörigen Tests, den
engen Erhaltungsprüfer und diesen Bericht. Die bisherige Release-Konfiguration
bleibt exakt erhalten: private Diagnostik ausgeschaltet, beide Arbeitsbranches
ohne automatische Git-Deployments. Es gibt keine Änderung an `main` oder am
separaten Haupt-App-Projekt.

Vorbereitungsstand: noch nicht öffentlich bereitgestellt. Vor dem Branch-Update
wurden die Aliase erneut gelesen: Testnet zeigt auf
`dpl_EHy1xmbgB8GqNs9azTYacqEVSg3k` (Commit `5f025e9`), die Haupt-App weiterhin auf
`dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe` (Commit `907d2a7`).

Die Vercel-Verbindung dieses Chats verweigerte zuvor Production-Deployments im
Testnet-Projekt mit HTTP 403; der CLI-Fallback war durch die Netzwerksperre zu
`api.vercel.com` blockiert. Diese Einschränkungen sind nicht durch eine erneute
Anmeldung behoben. Die Veröffentlichung muss über das Dashboard des Nutzers im
Projekt `cryptoid-evolution-testnet` erfolgen. Nach der Veröffentlichung sind
Commit, READY-Status und fester Testnet-Alias erneut zu prüfen.

## Anschließender Gerätetest

1. Die neu veröffentlichte feste Testnet-Adresse im Pi Browser neu laden und
   ein Spiel mit hörbarer Musik und hörbaren Schüssen beginnen.
2. Pi Browser für mindestens zehn Sekunden verlassen, wieder öffnen und auf
   „Fortsetzen“ tippen. Nach dem Countdown auf Musik und Schüsse achten.
3. Zusätzlich über Home zum Spiel zurückkehren und den gespeicherten Lauf
   fortsetzen. Dieselbe Prüfung wiederholen.
4. Bei erneutem Ausfall Musik und Effekte getrennt festhalten sowie prüfen,
   ob ein einzelner zusätzlicher Tipp auf das Spielfeld den Ton zurückbringt.

Bestandener Test bedeutet: Nach Fortsetzen sind beide aktivierten Tonarten ohne
zusätzlichen Freigabetipp hörbar; während einer Pause bleibt die Wiedergabe
pausiert. Erst dieses Ergebnis bestätigt die Korrektur für das getestete Gerät.
