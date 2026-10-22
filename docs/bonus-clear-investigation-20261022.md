# Unterbrechung beim Bonusabschluss am 22. Oktober 2026

Der neue Bericht stammt aus der veröffentlichten Version `5d6e7cb703ef114ee4626c1fbb0e34a45b1667d8`,
Baum `7d0fa724da3840b378d8de1e5723b24bfce19a89`. Die Canvas-Korrektur greift auf
dem betroffenen Gerät. Der Whitescreen bleibt ein offener Fehler; dieser Bericht
belegt eine weitere Unterbrechung trotz aktiver Canvas-Effekte.

## Was die Aufzeichnung eingrenzt

Alle Zeiten gelten für Europe/Vienna am 22. Oktober 2026.

| Beobachtung | Uhrzeit |
| --- | --- |
| Boss 4 besiegt | 16:21:04,180 |
| Siegesmusik angefordert | 16:21:09,840 |
| Bossabschluss bereit, Herz gesammelt, Bonus begonnen | 16:21:17,478–17,480 |
| Erstes Bonusziel erzeugt | 16:21:21,395 |
| Letzte periodische Ressourcenprobe | 16:21:32,950 |
| Bonus wird als `SECTOR_CLEAR` erkannt | 16:21:33,513 |
| Letzter gespeicherter Flight Recorder | 16:21:33,536 |
| Neues Dokument beginnt | 16:21:39,859 |
| Admin-Diagnose initialisiert | 16:21:59,475 |

Zwischen letzter Speicherung und neuem Dokument liegen **6,323 Sekunden**.
Die Admin-Initialisierung liegt weitere 19,616 Sekunden nach Dokumentbeginn;
sie ist kein genauer Absturzzeitpunkt. Die Bonusrunde lief mehr als zwölf
Sekunden nach dem ersten Spawn weiter. Boss-Sieg, Wrackfreigabe und Musikwechsel
sind frühere, erfolgreich durchlaufene Stationen.

Der Code verwendet für den Bonusabschluss `SECTION_CLEAR_MS = 8500` und beginnt
den Zähler erst mit `SECTOR_CLEAR`. Bei fortlaufender Uhr wäre der reguläre
Level-41-Wechsel frühestens ungefähr um 16:21:42 fällig gewesen. Das neue
Dokument beginnt davor. Die letzte belegte Stelle liegt beim Beginn der
Abschlussphase, nicht beim regulären Start des nächsten Levels.

Der Ressourcen-Snapshot `resource-bonus-clear` steht im tatsächlichen GamePage
**vor** Belohnungsberechnung, Speicherqueue und React-Veröffentlichung. Er beweist
noch nicht, dass diese Schritte oder die Abschlussanzeige zurückgekehrt sind.
Ein Test mit dem tatsächlichen aktuellen Flight Recorder reproduziert außerdem:
Eine Phasenänderung kann `phase-complete: FORMATION` speichern und erst danach
`phase-start: SECTOR_CLEAR` im Arbeitsspeicher ergänzen. Das letzte gespeicherte
FORMATION-Ereignis beweist deshalb keinen Fehler in der Phasenberechnung.

## Was funktioniert und was ungemessen bleibt

- Registrierte Canvas-Effekte sind vorhanden. `effectPaints` steigt im erhaltenen
  Recorderfenster von 22.913 auf 23.553. Die vorherige Null-Aktivierung ist behoben.
- Die letzte Bonusprobe misst rund 59,36 RAF-Aufrufe/s, 18 ms Frame-P95 und 1 ms
  Simulations-P95. Das sind keine gemessenen Bildschirm-FPS und kein Beweis für
  einen intakten Compositor nach der letzten Probe.
- Am Bonusabschluss sind zwei Effekte registriert, vier Texturen bekannt,
  820.380 Bytes sichtbarer Canvas-Backing-Store und 17.286.907 Bytes geschätzte
  bekannte Ressourcen vorhanden. Diese Werte sind **kein Gesamtprozessspeicher**.
- Audio- und Musikuhr laufen weiter; zum letzten Übergang entsteht kein neuer
  Audio-Stall. Die drei Wiederherstellungen stammen bereits aus früheren Proben.
  Laufende Uhren sind kein Nachweis hörbaren Tons.
- Kein gespeicherter JS-Fehler oder normaler Beenden-Marker erklärt den Abbruch.
  Fehlende Ereignisse beweisen nicht, dass keine native Beendigung stattgefunden hat.
- Long Tasks werden auf diesem Host nicht unterstützt. Ihre Nullwerte schließen
  keine langen Arbeiten aus. Der gemessene maximale Diagnose-Schreibaufwand von
  6 ms bezieht sich auf abgeschlossene Schreibvorgänge.

Ein passender nativer iPhone/PiBrowser-WebContent- oder Jetsam-Bericht um
**16:21:33–16:21:40** fehlt. Der frühere Jetsam vom Vortag gehört zu einem anderen
Vorfall. Die Recherche in offiziellen WebKit-Fehlerberichten erlaubt keine
Zuordnung eines bestimmten Enginefehlers zu dieser neuen Unterbrechung.
Insbesondere werden alte WebGL-Resize-Probleme oder ein Canvas-Text-Font-Problem
nicht ohne passende API-/Versionsbelege auf diese 2D-Impact-Darstellung übertragen.

## Vorbereitete Ergänzung der Owner-Diagnose

Branch: `codex/bonus-clear-boundary-20261022`, automatisches Deployment aus.
Es wurde keine neue Version veröffentlicht. Die Ergänzung liefert vier kleine
lokale technische Ereignisse pro beobachtetem Bonusabschluss:

| Ereignis | Belegt |
| --- | --- |
| `bonus-clear-rewards-complete` | Der synchrone Belohnungszweig ist zurückgekehrt; eine Konto-Speicherqueue kann noch laufen. |
| `bonus-clear-scene-requested` | Der bestehende Code erreicht die React-Zustandsanforderung. |
| `bonus-clear-scene-committed` | Die Abschlussphase erreicht den vorhandenen React-Layout-Commit. |
| `bonus-clear-frame-after-commit` | Ein folgender sichtbarer, spielender Game-RAF beginnt nach diesem Commit. |

Auch der letzte Punkt beweist keine GPU-Präsentation. Eine bereits als abgeschlossen
wiederhergestellte Bonusrunde erhält keine erfundene Bestätigung einer früheren
Belohnungsberechnung. Die Beobachtung gilt für neu durchlaufene Abschlussgrenzen.

Der Beobachter existiert ausschließlich für den serverseitig verifizierten Owner
im Testnet. Er benutzt vorhandene Setup-, Layout- und Game-Frame-Aufrufe. Es gibt
keinen neuen Timer, Listener, RAF, Netzwerkaufruf, Diagnosebildschirm oder privaten
Kontoinhalt. Die vorhandene begrenzte Reload-Spur und der bestehende Export werden
verwendet. Fehler beim Schreiben oder im Callback können das Spiel nicht anhalten.

Die Simulation, Belohnungsregeln und ihre asynchrone Speicherung, Grafik, CSS,
Audio, Spielstand und sonstigen APIs werden nicht geändert. Die komplette
GamePage ist nach Entfernen der elf genau geprüften Beobachter-Zusatzzeilen
bytegleich mit dem veröffentlichten Ausgangsstand. Der neue
`verifyBonusBoundaryScope.mjs` prüft dies gegen den festen Receipt-Ausgangscommit
`94825bdcc78c7be27632a12340732a27088aebe2` mit identischem GamePage-Inhalt.

## Prüfung und nächste Belege

Elf neue Tests prüfen die vier Grenzen getrennt, 10.000 wiederholte Frames,
Pause/Endzustände, fünfzig Bonusabschlüsse, Neustart/verspätete Commits, fehlgeschlagene
Callbacks, Datenschutz und den tatsächlichen lokalen Export. Hinzu kommen die
beschriebene Recorder-Reproduktion und der Zeitvergleich mit dem echten Bericht.
Die elf Tests werden bei jedem Build ausgeführt.

Die fokussierte Auswahl umfasst 93 bestandene Fälle. Ein alter Ganzdatei-Vergleich
aus `ownerFlightRecorder.test.mjs` benötigt nicht vorhandene historische Git-Objekte
und wurde explizit ausgeschlossen. Er wird nicht als bestanden gezählt und wurde
nicht abgeschwächt. Der neue vollständige Scope-Vergleich verwendet den tatsächlich
verfügbaren aktuellen Ausgangsstand. Vollständiger Build mit Sprachenprüfung,
Canvas-Integration, neuen Grenztests, TypeScript und Vite ist separat dokumentiert.
Der abschließende vollständige Build besteht ebenfalls nach der ausdrücklichen
Owner-und-Testnet-Einschränkung. Lint der neuen Diagnose und der beiden geänderten
Exportdateien besteht. GamePage meldet mit dem hier wiederhergestellten Werkzeugstand
bereits im Ausgangsstand 62 Fehler und vier Warnungen; der Vergleich nach Regel,
Meldungsanfang und Quellzeile findet weder neue noch entfernte Meldungen. Es wird
kein sauberer Gesamt-Lint behauptet. Details: `lint-comparison.json`.

Der durch Workspace-Wartung entfernte Checkout wurde aus dem gesicherten Git-Stand
wiederhergestellt. Das Repository verfolgt keine npm-Lockdatei; `npm ci` kann deshalb
hier nicht laufen. Die vorhandenen deklarierten Abhängigkeiten wurden ohne Änderung
der Versionsbereiche wiederhergestellt. Die tatsächlich verwendeten Versionen
werden in `validation.json` festgehalten; eine identische historische
Abhängigkeitsauflösung wird nicht behauptet.

Ein nativer Analysebericht zum angegebenen Zeitpunkt wäre der stärkste zusätzliche
Beleg für eine Prozess-/Speicherbeendigung. Nach einer gesondert freigegebenen
Veröffentlichung kann die Grenzmessung beim Fortsetzen der vorhandenen Mission
oder mit direktem Bonustest greifen. Ein neuer Komplettlauf ist dafür nicht nötig.
Die Ergänzung schließt eine Beobachtungslücke; sie ist kein behaupteter Whitescreen-Fix.
