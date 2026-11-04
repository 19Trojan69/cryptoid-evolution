# Begrenztes kritisches Fehlerjournal – 4. November 2026

Dies korrigiert nachgewiesene Lücken der privaten Fehleraufzeichnung. Es ist kein nachgewiesener White-Screen-Fix und keine neue Speicheroptimierung.

## Befund

Der unveränderte Kurzrekorder sichert kritische Ereignisse innerhalb von 250 ms nach einem Schreibpunkt nicht sofort, mit Ausnahme von `pagehide`. Sein passiver Browserlistener überspringt zudem alle Ereignisse, sobald `.game-shell` fehlt. Kritische Gesten und Fehler teilen sich ein Limit von acht Ereignissen pro Sekunde; der gemeinsame 32-Ereignis-Ring kann frühere Fehler verdrängen. Ein fehlender Fehlereintrag im bisherigen Handybericht schließt einen JavaScript-Fehler deshalb nicht aus.

## Änderung ausschließlich im getrennten Gast-Test

Die exakten privaten Browser- und Berichtsmodule werden nur beim Build virtuell ergänzt; beide Änderungen lassen sich bytegenau zurücknehmen. Die Originaldateien und sämtliche Spielquellen bleiben unverändert. Der bisherige Kurzbericht bleibt kompatibel.

Das zusätzliche Journal hält höchstens zwei Laufkennungen mit je sieben Ereignisarten. Es sichert das erste Ereignis jeder Art unmittelbar, wiederholte Ereignisse höchstens einmal je Sekunde und abschließende `hidden`/`pagehide`-Signale sofort. Pro Art bleiben erster und letzter Eintrag sowie ein Zähler erhalten. Normale Kontakte landen nicht in diesem Journal. Normale Uhrenpunkte verursachen keine zusätzlichen periodischen Schreibvorgänge. Der gespeicherte Journal-Uhrenpunkt ist daher ohne Ereignis nicht aktuell; die bestehende Stoppuhr bleibt maßgeblich.

Es werden nur erlaubte Fehlerklassen, vereinfachte Routen und bei gleichursprünglichen Skripten eine begrenzte Skriptkennung/Zeile/Spalte gespeichert. Fehlermeldungen, Stacktexte, vollständige URLs, Zugangsdaten und Konten werden nicht aufgenommen. Es gibt keinen automatischen Upload, keine neuen Listener/Timer/RAF-Schleifen und keine Eingriff in Eingaben, Ton, Grafik oder Spieluhren.

Das Vorhandensein eines Browserereignisses beweist keine native Absturzursache. Ein Betriebssystemabbruch kann weiterhin ohne letztes Ereignis geschehen. Fehlende Ereignisse beweisen keinen fehlerfreien Ablauf. Speicherzugriff kann verweigert werden.

## Prüfungen

`node --test verification/critical-failure-journal-20261104/state.test.mjs` prüft die reproduzierbare alte Schreiblücke, unabhängige Fehlersicherung, Ereignisfluten, Schreib- und Größenbegrenzung, reguläres Ende, neue Dokumente/Laufkennungen, verweigerten Speicher, Metadatenbegrenzung und exakte Rücknahme der privaten Transformationen. Lokal: zehn Prüfungen bestanden.

`fixture.mjs chromium|webkit` erzeugt native, vom Browser gemeldete Fehler und unbehandelte Promise-Ablehnungen vor/nach dem Entfernen der synthetischen Szene und navigiert danach in ein neues Dokument. Kontrollarm und Journalarm müssen das unterschiedliche Speicherverhalten zeigen. Das ist kein Betriebssystemabbruch und kein physischer Smartphone-Test.

`build.mjs` verwendet den vorhandenen privaten Paketaufbau mit unverändertem Controller, bestehender direkter Bossdarstellung und bereits gemeinsam verwendetem HUD. Verworfene Mündungs-/Projektilkandidaten werden nicht aktiviert. `run.mjs chromium|webkit` behält den bisherigen vollständigen kurzen Spielablauf und seine Fehlergates bei; zusätzlich muss der normale Bericht das Journal mit passender Laufkennung und Quellkennung enthalten. Physischer White-Screen-Nachweis und Freigabe stehen aus.

Keine öffentliche Veröffentlichung, kein Merge in den Spielzweig und keine neuen Handytests aus diesem Commit.

## Abgeschlossene Browserbelege

Quelle `3511b0b59ddebd97b6dfa5e4b79fb450eb407849`, CI-Lauf [41799229475](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41799229475): beide Jobs erfolgreich. Zehn Zustandsprüfungen pro Job bestanden. Je Engine drei echte Browserfehler-Fälle im Kontrollarm und drei im Journalarm bestanden, insgesamt zwölf Fälle. Der alte Stand verliert die betreffenden Ereignisse vor und nach der folgenden Navigation; das zusätzliche Journal erhält sie bereits vor der Navigation. Das reparierte Beobachtungstor kann beim Verlassen danach auch den alten Kurzring sichern.

WebKit meldet die unbehandelte Promise-Ablehnung in diesem Fixture mit `isTrusted:false`, Chromium mit `true`; normale Fehler beider Engines sind hier `true`. Die beobachteten Werte bleiben unverändert erhalten. Die Testfehler werden durch echte Skriptfehler/Promise-Ablehnungen ausgelöst und von Playwright als unbehandelte Browserfehler beobachtet; Fehlerereignisse werden nicht manuell mit `dispatchEvent` erzeugt. Daraus folgt keine Klassifikation nativer Smartphone-Abbrüche.

Beide vollständigen kurzen Spielabläufe bestehen mit jeweils drei Zyklen: Chromium 60.000/10.000/10.000 aktive ms; WebKit 60.322/10.318/11.412 aktive ms. Alle sechs Zyklen bestehen Pause mit eingefrorener Uhr, Fortsetzen, Waffenmenü und normalen Home-Ausstieg. Beide normalen Exporte enthalten das korrekt nach Laufkennung und Quellkennung zugeordnete Journal sowie den bestehenden Ressourcenpunkt. Letzter und vorletzter Lauf sind regulär beendet; keine normalen Spiel-Fehlereinträge wurden aufgezeichnet. Das ist keine Langzeit- oder physische Geräteabnahme.

Zwei anfängliche Fehlversuche bleiben unter `evidence/earlier-attempts.json` dokumentiert: zuerst eine falsche Erwartung zum zusätzlichen alten Ring-Flush, danach eine falsche allgemeine Annahme über `isTrusted`. Nur Fixture-Erwartungen wurden korrigiert; die Diagnoseimplementierung blieb gleich. Der Zwischenlauf bestand in Chromium bereits vollständig, WebKit übersprang dort den Spieltest.

Die beiden endgültigen ZIP-Archive wurden gegen ihre GitHub-SHA-256-Werte geprüft. Alle 18 enthaltenen Ergebnisdateien sind mit Originalhash und reproduzierbarer Gzip-Kopie erhalten. `python3 verification/critical-failure-journal-20261104/evidence/verify.py` prüft die Archivdateien und die genannten Erfolgsgates erneut. Die ursprünglichen ZIPs haben sieben Tage CI-Aufbewahrung. Es wurden ausschließlich synthetische Gastdaten archiviert.
