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
  mit 283 Eingaben kompiliert. Anschließend besteht der vollständige Frontend-
  Produktionsbuild alle 94 Testfälle, die Sprach-Freigabeprüfung, Projekt-
  TypeScript und Vite. ESLint des geänderten Anwendungsmoduls ist fehlerfrei;
  ein Gesamt-Lint-Erfolg wird nicht behauptet.

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


## Ergänzende Gesamtprüfung des Kandidaten

Runtime-Commit `4c384023a4fae3d84403ade7beae7934e22e39fd` wurde vollständig
geklont und über denselben NPM-Abhängigkeitsweg wie in der Vercel-Konfiguration
aufgebaut. Die Versionsbereiche im Manifest bleiben unverändert. Die tatsächlich
installierten Versionen sind in der JSON-Datei festgehalten. Ein zusätzlicher
Yarn-Versuch mit eingefrorener Lockdatei scheiterte bereits bei der Auflösung;
dieser Weg wird nicht als bestanden gewertet oder als Vercel-Buildweg ausgegeben.

Der originale Vorbuild erzeugt 1.740 Varianten bei unveränderter Originalauflösung
mit `@napi-rs/canvas` 0.1.100. Anschließend bestehen 12 Sprach-, 43 Diagnose-,
15 Canvas-URL- sowie 24 Nachlade-/Kaufbestätigungsfälle, insgesamt 94 ohne
Fehlschlag oder Skip. Der getrackte Arbeitsbaum bleibt nach dem Build unverändert.
Die vorhandene Vite-Warnung zum großen Index-Bundle bleibt bestehen; daraus wird
keine Aussage zu iPhone-RAM oder Spielleistung abgeleitet.

Der gebaute Produktionsstand besteht den unveränderten Router-Ablauf Home →
Spielen → Pause → Fortsetzen → Home in Chromium 141 und einzeln in WPE-WebKit
26.5 bei 430 × 825 und DPR 3. Keine Gameplay-Testhaken, keine globale JS-Exception,
keine Konsolen- oder HTTP-Fehler. Die Originalschriftdateien werden im lokalen
Testhost bereitgestellt. Nur SDK und Transport sind synthetisch; echte
Pi-Anmeldung, Konten und Zahlungen werden hierdurch nicht verifiziert. Abbrüche
noch laufender MP3-Anfragen bei Musik-/Routenwechseln sind separat erfasst.
Die Spiel-Audiokontexte schließen; der globale Kartenkontext bleibt bestehen.

Ein paralleler WebKit-Bedienlauf und ein paralleler längerer Szenentest erreichen
den bestehenden Loop-Stall-Schutz. Der längere Lauf endet nach 345,684 Sekunden
in Sektor 59 technisch pausiert; zuvor wurde eine solche Pause über den originalen
Resume-Button fortgesetzt. Es gibt keine ungefangene JS-Exception und keinen
Canvas-Kontextverlust; die Diagnose ist weiterhin im Zustand `recording`.
Dieser Lauf ist ausdrücklich **nicht bestanden**. Seine native Prozessspitze
beträgt etwa 1.100,5 MiB unter Linux, nicht auf einem iPhone. Der anschließend
einzeln ausgeführte Produktions-Bedienlauf besteht ohne solche Fortsetzung.
Ein zuvor unterbrochener Lauf mit spärlicher Fortschrittsausgabe ist ebenfalls
kein bestandener Langtest. Auch der anschließende einzelne Langlauf mit Originalschriften endet am
bestehenden Loop-Stall-Schutz: nach 260,945 Sekunden in Sektor 57, nach einer
vorher über den originalen Resume-Button fortgesetzten Pause in Sektor 56.
Keine ungefangene JS-Exception, Konsolen-/Anforderungs-/Assetfehler oder Canvas-
Kontextverluste; 1.300 Diagnoseeinträge sind bestätigt, Status `recording`.
Die Prozessspitze beträgt etwa 1.135,5 MiB unter Linux. Dieser Lauf ist ebenfalls
**nicht bestanden**. Parallele Browser allein erklären den Befund somit nicht.

Die vollständige Langlauf-Abnahme bleibt offen. Der bestehende Stillstandsschutz
und die Resume-Semantik bleiben unverändert. Linux-Softwaredarstellung belegt
weder die Ursache einer iOS-Prozessbeendigung noch die Behebung des historischen
White Screens. Die bestätigte Diagnose-Fehlergrenze ist separat überprüfbar;
eine vollständige Spiel-Stabilitätsfreigabe wird daraus nicht abgeleitet.
