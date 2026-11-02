# Native Kontaktprüfung und absichtlicher Dokumentneustart

Separater kurzer Diagnoseaufbau zur unveränderten Gerätequelle `b042c8e5`.
Die vier 30-Minuten-Messungen bleiben davon getrennt. Es wird keine Spielquelle,
Grafik, Spieluhr, Mechanik oder veröffentlichte Adresse verändert.

Der ursprüngliche Chromium-Eingabeprüfer führt seine vorhandenen nativen CDP-
Kontaktfolgen aus: Steuerung über der Waffentaste, zusätzlicher Kontakt,
Loslassen mit anschließendem neuem Tap, explizite Rückkehr, neutrale Kontakt-
Formen, Abbruch und wiederholte Kontaktwechsel sowie Fenster-/Elementfokus.
Die bestehenden temporären Kontakt-QA-Listener machen dies zu einer eigenen
Diagnosebedingung; kein unveränderter Speichervergleich und kein physischer
iOS-/Android- oder Browser-App-Gestentest wird behauptet.

Danach lädt der Test das aktiv spielende Dokument ausdrücklich per Browser neu.
Er verlangt einen neuen Dokumentzeitursprung, Navigationstyp `reload`, Menü ohne
automatische Kampfwiederaufnahme, erhaltene lokale Stoppuhr-ID und Zeit sowie
`boot-after-active-session` im regulär exportierten Bericht. Dieser absichtliche
Reload ist ein Diagnose-Kontrollfall, keine native Crash-Simulation.

## Erste Vorstufe bleibt fehlgeschlagen

CI `41509827844`, Testquelle `cd08a331`, scheitert im alten Eingabeprüfer am
Lesen von `__bossLabPauseEvents.at(-1).pauseReason`. Die Vollaufzeichnung ist
im tatsächlichen minimalen Gerätepaket absichtlich aus; der erwartete
Owner-Vollprotokolleintrag existiert dort nicht. Installation, unveränderter
Paket-Build und vorausgehende Eingaben gelangen bis zu dieser Annahme.
Der Kontroll-Reload wurde in dieser Vorstufe noch nicht erreicht.

Die Korrektur betrifft ausschließlich den externen Test: Exakt zwei solche
Telemetrie-Assertions werden durch reale Zustandsprüfungen ersetzt: pausiertes
nichttechnisches Spiel, offenes Waffenmenü, sichtbarer Waffendialog und pausierte
Stoppuhr. Jeder ursprüngliche Kontakt- und Aktionsschritt bleibt erhalten. Eine
Rücktransformation verifiziert die vollständige Bytegleichheit des ursprünglichen
Prüfers; die zwei Modulimporte werden nur auf die eingefrorene Quelle aufgelöst.
Weder Vollaufzeichnung noch ein Spielhook werden dafür eingeschaltet.

Der ursprüngliche kleine Fehlbericht ist ZIP-SHA- und integritätsgeprüft
archiviert. Er bleibt ein Fehler dieser Testvorstufe und wird nicht als
beobachteter White Screen oder bestandener Kontrollfall umetikettiert.

## Kontaktteil abgeschlossen, Reload-Vorbedingung getrennt

CI `41510735463`, Testquelle `556234af`, beendet den kompletten Kontaktteil:
vier Hauptprüfungen, neun neutrale Kontaktfälle, zwölf wiederholte Kontaktfolgen
und den Fokusprüfer. Der anschließende Reload-Teil stoppt vor seinem Neuladen:
Der Spielstatus ist schon `playing`, der asynchrone diagnostische Clock-
Checkpoint steht unmittelbar nach der Rückkehr noch auf `paused`. Die neue
Kontrollprüfung hatte hier, anders als der bestehende Soak-Prüfer, das Warten
auf den ersten frischen Clock-Checkpoint ausgelassen. Die gesamte CI bleibt
deshalb fehlgeschlagen; ihr vollständiger Teilbeleg wird nicht umklassifiziert.

Die nächste getrennte Erfassung verwendet `reload-only`: Die abgeschlossenen
Kontaktfälle werden nicht erneut abgespult. Wie im unveränderten Soak-Prüfer
wird zunächst der echte `running`-Checkpoint abgewartet; kein Resume, Uhrwert
oder Zeitkriterium wird geändert. Der reale Vorzustand wird zusätzlich festgehalten.
Erst dann folgt der bisher noch nicht erreichte absichtliche Reload-Kontrollfall.
