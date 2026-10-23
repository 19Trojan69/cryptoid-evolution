# Fehlergrenze für die lokale Diagnoseaufzeichnung

Vorbereitung auf `codex/diagnostic-idb-callback-guard-20261023`.
Ausgangscommit: `19de3e692f75a1c3e2eddf3438acc937c9dcac19`, Tree
`e7be9574df3dbf443c65ac4dea027f82499df766`.

## Reproduzierter Fehler

Ein zusammenhängender lokaler Test der Original-GamePage begann bei Sektor 51.
Nach etwa 587 Sekunden war Sektor 64 erreicht, einschließlich Boss 60 und seiner
Bonusrunde. In `appendFullSessionChunk` warf `chunks.add` innerhalb des
`get.onsuccess`-Callbacks einen `TransactionInactiveError`. Die globale
Fehlerbehandlung pausierte das Spiel technisch. Die Oberfläche blieb sichtbar;
der Test reproduzierte keinen White Screen und keine OS-Speicherbeendigung.

Das `try/catch` im aufrufenden Recorder kann zwar die abgelehnte Schreib-Promise
behandeln, fängt aber keine Exception ab, die aus einem späteren IDB-Event-Handler
entweicht. Dasselbe fehlende Fehlerende bestand in verschachtelten Aufräum- und
Export-Callbacks sowie in synchroner Anforderungserzeugung nach Transaktionsstart.

## Korrektur

Die bestehende Transaktionsüberwachung stellt eine eigene Fehlergrenze bereit.
Einrichtung und IDB-Callbacks führen ihre Arbeit innerhalb dieser Grenze aus.
Bei einer Exception wird die zugehörige Operation sofort abgelehnt und, soweit
noch möglich, atomar abgebrochen. Bereits abgeschlossene/abgebrochene Vorgänge
werden nur einmal beendet. Der vorhandene Timeout wird weiterverwendet.

Der Recorder erreicht dadurch seinen bestehenden `storage-error`-Pfad, beendet
nur die Diagnose, leert deren Warteschlange und hält den letzten tatsächlich
bestätigten Stand fest. Er startet weder eine neue Aufnahme noch einen
Schreibwiederholungsversuch. `TransactionInactiveError` erhält die vorhandene
feste Kategorie `write-failed`; beliebige Fehlertexte werden nicht gespeichert.
Aufräumen erhält bei einem Fehler die vorher bestätigten zwei Läufe; ein
fehlgeschlagener Export liefert keinen scheinbar vollständigen Teil-Blob.

Die Anwendungskorrektur betrifft ausschließlich `fullSessionStore.ts`.
GamePage, Recorder-Verhalten, Grafiken, Sternenhintergrund, CSS, Sounds, Spielzeit,
Waffenregeln, Pi-Authentifizierung, Käufe, Kontodaten, Speicherschemata,
Spielstand-Warteschlange und Backend bleiben unverändert. Lokale Testpiloten,
verkürzte/erzwungene Abläufe und simulierte Transaktionsfehler werden nicht in
die Anwendung übernommen. Frühere Sternen-Zuschnittkandidaten sind ausgeschlossen.

## Prüfungen

- 36 bestehende Aufzeichnungs-, Transfer- und Grafikdiagnosefälle bestanden.
- Sieben neue build-gatete Callback-Regressionen bestanden, einschließlich
  atomarem Rollback, erhaltenen Altaufzeichnungen, Export-Wiederholung und
  unverändert vollständiger Aufzeichnung.
- 24 native Browserfälle in Linux-WPE-WebKit und Chromium bestanden. Die zehn
  injizierten Fehlerkontrollen des Originals erzeugten globale Fehler. Alle
  zwölf Kandidatenfälle einschließlich der normalen Erfolgsfälle blieben ohne
  globale Fehler. Die Fehler werden kontrolliert an den Aufrufer zurückgegeben.
- Der vollständige Szenentest mit Originalgrafik/-audio lief 90 Sekunden von
  Sektor 69 bis zum Boss-Abschluss von Sektor 70. Trotz gezieltem Abbruch einer
  Diagnose-Schreibtransaktion gab es keine globale JS-Exception und keinen
  Canvas-Kontextverlust. Die Diagnose meldete korrekt `storage-error`, während
  das Spiel weiterlief. Vier lokale Aktivierungen verbrauchten vier von zwölf
  Testladungen; zurückgemeldet wurden jeweils die ursprünglichen 60 Sekunden.
  Nur die vorherige Ladung wurde durch den lokalen Testpiloten gezielt auf ihr
  Ende gesetzt. 13 Checkpoints, darunter zehn Kampfstände, bestanden die
  unveränderten Originalvalidatoren. Transport/Benutzer/Vorrat waren Testdaten;
  dies war kein echter Kauf oder Test der Backend-Aktivierungslogik.
- Strenge TypeScript-Prüfung des geänderten Moduls und seiner importierten
  Typen: keine Fehler, ebenso in der Ausgangskontrolle. Lokaler GamePage-Bundle
  mit 283 Eingaben kompiliert. Kein vollständiger Projekt-/Vite-Build oder
  Gesamt-Lint-Erfolg wird behauptet; die Umgebung ist ein isolierter Prüfbestand.

Die neuen sieben Node-Fälle sind Teil von `test:full-session` und damit des
vorhandenen Build-Gates. Die native Browserprüfung ist zusätzliche lokale
Evidenz. Details stehen in der gleichnamigen JSON-Datei. Private Spielaufzeichnungen,
OS-Berichte, native Speicherauszüge und Browserbilder werden nicht hochgeladen.

## Grenze und Veröffentlichung

Dieser Befund erklärt einen tatsächlichen zusätzlichen Abbruchpfad der Diagnose.
Er beweist nicht, dass die historischen White Screens oder die dokumentierten
Prozess-Speicherbeendigungen dadurch verursacht wurden. Die lokalen Linux-
Speicherwerte sind keine iPhone-/PiBrowser-Messungen. Auch der genaue Auslöser
der inaktiven Originaltransaktion ist noch offen.

Der neue Zweig hat bereits in seinem ersten Commit automatisches Deployment
deaktiviert. Keine Veröffentlichung, kein Aliaswechsel, keine Änderung von
Mainnet oder festen Release-/Rollbackreferenzen. Veröffentlichung bleibt ein
eigener ausdrücklich freizugebender Schritt gemäß `frontend/AGENTS.md`.
