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
