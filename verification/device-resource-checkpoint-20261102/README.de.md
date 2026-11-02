# Begrenzter Ressourcen-Checkpoint für den Gerätetest

Der Besitzer meldet weiterhin einen White Screen mit neu aufgebauter Testseite. Diese Diagnose-Erweiterung ist **keine Fehlerbehebung und kein Nachweis der Ursache**. Private Berichte und Videos werden nicht in diesem Repository veröffentlicht.

## Zweck und Umfang

Die bereits vorhandene Stoppuhr ruft den Spiel-Inspektor bei ihrer bestehenden Beobachtung auf. Dessen Audio- und Canvas-Werte wurden bisher nicht in den kleinen, dauerhaft gespeicherten Kurzbericht übernommen. Nun wird aus genau derselben Antwort höchstens **ein letzter Punkt je gespeichertem Lauf** übernommen, mit Uhr-ID, Zeitpunkt und verstrichener Zeit. Fehlende/ungültige Werte bleiben `null`; ein vorhandener Punkt kann älter als der letzte Uhr-Checkpoint sein. Es gibt keine Verlaufsliste.

Die Vorbereitung eines Berichts ergänzt `reportDocumentOrigin` aus `window.location.origin`. Das ist die Adresse des exportierenden Dokuments, ohne Pfad, Query oder Freigabetoken. Es ist keine rückwirkende Aufzeichnung aller zuvor geöffneten Testadressen.

Die fünf ursprünglichen Spielverzeichnisse bleiben an die bestehenden Baum-Hashes gebunden. Die Spielmechanik, Grafik, Audio, Effektrenderer, Spieluhren und die 2.500-ms-Grenze der Diagnose-Uhr bleiben unverändert. Änderungen betreffen nur die isolierte Diagnose, ihren Builder und ihre Prüfungen. Die ursprünglichen B042- und Toolbar-Kontrollversionen bleiben eingefroren.

## Grenzen und Aufwand

- Kein zusätzlicher Inspektor-Aufruf, Timer, Animationsframe, globaler Listener oder geplanter Speicherschreibvorgang. Der reale Browser-Adapter wird mit einem Host geprüft.
- Zusätzliche Primitive und JSON-Serialisierung benötigen etwas Arbeit und Speicher. Dieser Zustand gehört nicht in die vorherige unveränderte Speichervergleichsgruppe.
- Weiter höchstens zwei Läufe, 32 Kontakte/Ereignisse je Lauf und **16.384 Zeichen** in diesem lokalen Speicherwert. Das ist keine Messung von RAM. Wenn optionale Ressourcenwerte einen sonst passenden Bericht über diese Grenze schieben, werden sie für diesen Schreibvorgang weggelassen. Uhr und Kontakte behalten ihren bisherigen Vorrang.
- Die Werte decken nur ausgewählte App-Ressourcen ab. Weder nativer/GPU-Gesamtspeicher noch aktive iOS-Bildschirmaufnahme, Jetsam-Ursache oder exakter Absturzzeitpunkt werden gemessen.
- Ein Neustart kann nur den zuletzt gesicherten Punkt wiederherstellen. Der neue Dokumentstart setzt einen alten Lauf nicht fort und überschreibt dessen Ressourcenpunkt nicht.
- Ein späterer Lauf ohne Bildschirmaufnahme ist ein gezielter Vergleich. Aus einem einzelnen positiven oder negativen Ergebnis folgt noch kein Ursachennachweis.

## Prüfung

`node --test verification/boss2-stopwatch-20261029/stopwatchState.test.mjs verification/boss2-brief-report-20261030/briefState.test.mjs verification/device-resource-checkpoint-20261102/resourceCheckpoint.test.mjs`

Die zusätzlichen Regressionen prüfen die Bindung an den richtigen Lauf, ungültige und werfende Telemetrie, Schutz vor veralteten Punkten, Kopieren statt Referenzhaltung, Wiederherstellung nach neuem Dokument, identische Schreibfolge und unveränderte Uhr-/Kontaktwerte sowie den Ressourcen-Fallback nahe der bisherigen Speichergrenze. Der erste lokale Host-Test scheiterte an einem Getter, den der Test selbst zu früh auswertete; die Fixture erhält nun die ursprünglichen Property-Deskriptoren und testet den Getter erst im tatsächlichen Adapter.

Der isolierte Workflow `cryptoid-device-resource-checkpoint.yml` prüft Chromium und WebKit unter Linux: 60 Sekunden echte aktive Spielzeit plus zwei neue 10-Sekunden-Läufe, echte Pause/Fortsetzen/Waffen/Home-Aktionen und normaler Berichtsexport. Er prüft auch den tatsächlich gespeicherten Ressourcenpunkt und die Herkunftsadresse. Er simuliert weder eine iOS-Systemaufnahme noch einen nativen Smartphone-Prozessabbruch. Ergebnisse werden auch bei einem Fehlschlag gesichert. Ein grüner Lauf erlaubt die Bereitstellung dieser Diagnose; er erklärt den ursprünglichen White Screen nicht für behoben.

Aktueller Status vor Veröffentlichung: lokale Regressionen geprüft; native Workflow-Ergebnisse werden am exakten Commit separat festgehalten.
