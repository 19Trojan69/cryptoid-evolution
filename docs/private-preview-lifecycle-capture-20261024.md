# Lokale Lifecycle-Erfassung nur fuer die geschuetzte Vorschau

24.Oktober2026. Vorbereitet und lokal geprueft; konkrete Deployment-URL/Quelle
werden erst nach dem manuellen geschuetzten Preview-Build als Receipt gesichert.
Kein nachgewiesener Fix des gemeldeten White Screens. Die korrigierte Meldung
bleibt: weiss, direkt wieder Spiel mit erneutem Einflug und schnellen Bewegungen,
kein Home dazwischen; Zustand von Punkten/Leben unbekannt, spaeter normaler Tod.

Basis160d674 auf dem bestehenden Preview-/Untersuchungsstrang, nicht main.
frontend/src Tree66f458f157bb4d52b6ebe57f92d51b52a51451b2, originale index.html,
Grafik/Audio, Backend/API-Isolation, Gastauth und SDK bleiben unveraendert.
Nur der Preview-Packer ergaenzt separate Diagnose-Dateien im privaten Build.
Production-Installation/Build brechen weiterhin ab. Auto-Deployment bleibt aus.

## Erfassung

- Hoechstens48 bereinigte lokale Ereignisse im eigenen Vorschau-Schluessel.
  Dokumentbeginn/performance.timeOrigin, vorheriger Dokumentbeginn im selben
  Tab, Navigationstyp, pagehide/pageshow und Sichtbarkeit. Neue Dokumente
  identifizieren keine Speicher-/OS-Ursache.
- Beobachtung der eingeblendeten game-shell und ihres Pausenattributs sowie
  ResizeObserver-Masse. Keine neuen Steuerschaltflaechen im HUD/Spielmenue.
- Die vorhandenen nativen RAF-Aufrufe werden durchgereicht: gleiche ID,
  Cancel-Funktion unveraendert, Empfaenger/Zeitstempel/Rueckgabe/Exceptions
  bleiben erhalten. **Kein neuer RAF, Timer, Intervall oder Zeiteingriff.**
- Abstaende strikt>250ms koennen als Hinweis aufgenommen werden, ohne eine
  Spielaktion auszuloesen. Das ist eine Beobachtungsschwelle, **nicht** der
  unveraenderte Spielwaechter strikt>2500ms mit500ms-Prueftakt. Pause/Sichtbarkeit
  rearmen nur die Beobachtung, nie das Spiel. Aktueller und vorheriger Callback-
  Aufwand sind getrennt; der Abstand weist keine blockierende Quelle zu.
- Originale technische Diagnose/Sessionmarker werden nur bereinigt gelesen,
  mit eigenem Kontextzeitpunkt. Keine Konto-, Kauf-, Token-, Score-/Shard- oder
  Spielstandschluessel, rohen Fehlermeldungen, Stacks oder Roh-URLs. Keine
  automatische Uebertragung. Neue Ereignisse bleiben lokal; reine Grenzfaelle
  duerfen sofort sichern, laute Geometrie-/Gap-Hinweise hoechstens1/s.

Das Beobachten und optionale synchrone Speichern haben Aufwand und koennen
Messwerte beeinflussen. Es wird kein pixelgenauer White-Screen-Detektor oder
Geraete-Speicherbeweis behauptet. Active bezeichnet eine sichtbare unpausierte
DOM-Szene; der gespeicherte technische Zustand kann bis zur naechsten originalen
Aktualisierung veraltet sein. Fehlende/gesperrte/defekte Daten bleiben explizit.

## Bericht ohne Spielstart

/private-preview-report.html laedt nur die eigene Lesehilfe und Berichts-UI.
Kein Spiel/SDK/API, keine Speicherung und keine Aktivierung der Erfassung auf
der Berichtsseite. Aktualisieren liest erneut; Kopieren/Download erst nach
Nutzeraktion. Bevorzugt den aktuellen Tab, sonst die letzte Origin-Kopie mit
explizitem Hinweis auf moegliche Herkunft aus einem anderen Tab. Daten des
frueheren unveraenderlichen Preview-Hostnamens koennen nicht nachtraeglich aus
einer anderen Origin gelesen werden. Es wird keine alte Geraeteaufnahme erfunden.
Vercel Authentication/Standard Protection muss auch diese Seite schuetzen.

## Tatsaechliche Pruefung

Frischer kompletter Build:151 originale Tests plus17 Isolations-/Erfassungstests
(168gesamt), Sprachgate, TypeScript/Vite bestehen. Originale1740Rumpfbilder,
95.450.326Bytes. Syntaxpruefung der neuen Skripte und diff-Pruefung bestehen.

Chromium141 und WPE26.5 bestehen jeweils drei echte Original-App-Ablaufe mit13
bytegeprueften Originalschriften und synthetischen Gasttransports: Pause/
originales3-2-1/Resume; dasselbe mit393x744/628Geometriewechsel; separater
bewusster /game-Reload. In beiden Engines werden Dokument-/Pause-/Geometrie-
Ereignisse erfasst und beim kontrollierten Reload zwei verschiedene Dokumente
mit korrekter Vorgaengeridentitaet erhalten. Danach funktioniert die separate
Berichtsseite in allen6Faellen, startet kein Spiel/Recorder und aendert beim
Aktualisieren keine Speicherbytes. Keine unerwarteten externen Anfragen,
ungefangenen JS- oder HTTP-Fehler in diesen kurzen lokalen Ablaufen.

Die aufgezeichneten Frame-Gaps umfassen den Pruef-/Screenshot-Aufwand und sind
keine natuerliche White-Screen-Reproduktion. Die vorherigen WPE-loop-stalls
und iPhone-Langzeitbefunde werden dadurch nicht ersetzt. Keine erneute lange
Eigentuemer-Kampagne, Kauefe oder Datenloeschung. Nur eine manuelle geschuetzte
Preview ist freigegeben; kein main-Merge, Production-, Testnet-/Mainnet-Release
oder Schutz-/Aliaswechsel. Offizielle Production19de3e6/AsXUruY bleibt bestehen.
