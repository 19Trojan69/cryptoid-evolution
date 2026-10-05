# Levelerweiterung erster Ausbauschritt

Stand 4. Oktober 2026. Grundlage ist das freigegebene Konzept für längere und spannendere Levels. Dieser Branch ist ein Prüfstand und noch keine Produktionsfreigabe.

## Abgleich mit dem bestehenden Spiel

Der aktuelle Produktionscode hat 500 interne Fortschrittsschritte, dargestellt als 50 sichtbare Levels. Ein sichtbares Level besteht aus neun Blöcken, einem Boss und einer Bonusrunde. Die Bosse liegen intern bei 10, 20 bis 500. Das Dokument spricht teilweise von neun Blöcken pro einzelnem normalen Level. Diese abweichende Zählung würde den Weg zum Boss vervielfachen. Der erste Einbau erhält deshalb die bestehende Struktur. Eine Änderung dieser Zählung bleibt eine ausdrückliche Produktentscheidung.

## Umsetzung

Neue Missionen verwenden Regelversion 2. Der Gruppenplan wird deterministisch vor dem Block bestimmt. Pro Block gibt es höchstens drei Gruppen; jede Gruppe hat sechs Schiffe. Verstärkungen kommen nach dem vollständigen Besiegen der vorherigen Gruppe und einer Warnung von einer Sekunde. So gibt es niemals mehr als sechs normale Gegner gleichzeitig. Ankunftsseite und Einflugweg wechseln; erst nach dem Einordnen dürfen die neuen Gegner angreifen. Gegnerleben und bestehende Grenzen von höchstens drei gleichzeitigen Angreifern werden nicht erhöht.

| Interne Fortschrittsschritte des Zyklus | Zusätzliche Gruppen über neun Blöcke |
| --- | ---: |
| 1 bis 10 | 1 |
| 11 bis 30 | 3 |
| 31 bis 50 | 4 |
| 51 bis 100 | 5 |
| 101 bis 150 | 6 |
| 151 bis 250 | 7 |
| 251 bis 350 | 8 |
| 351 bis 500 | 9 |

Blöcke 1, 3 und 5 bleiben kurz. Später erhalten die Blöcke 6, 8 und 9 dritte Gruppen. Die bestehenden Silhouetten und Farben wiederholen sich innerhalb eines Blocks auch über alle 18 möglichen Gegner nicht. Jede besiegte Gruppe vergibt einmalig 50 Punkte. Block- und Kettenbelohnungen erfolgen erst nach der letzten Gruppe. Verstärkungen erhalten die bisherigen Abschussbelohnungen und Dropregeln. Die Bonusrunde, Bossgeschütze, Käufe und Eigentumsregeln bleiben erhalten.

## Fortsetzen und Rekorde

Der Client sichert den laufenden Kampf alle zehn Sekunden und beim Pausieren, Hintergrundwechsel und Verlassen in derselben dauerhaften Warteschlange wie Belohnungsereignisse. Gegner, Trefferpunkte, Geschosse, verbleibende Gruppen, Leben, Waffenlaufzeiten, Power-ups, Kombostand, Bossgeschütze und Bonusrundenfortschritt werden mitgespeichert. Ein abrupter Abbruch kann auf den letzten bestätigten oder lokal vorgemerkten Zwischenstand zurückfallen.

Abgeschlossene Blöcke schreiben weiterhin atomar den nächsten Abschnitt. Ein verspäteter Kampfstand darf keinen bereits abgeschlossenen Block zurücksetzen. Sequenznummer, aktive Mission und atomare Versionsprüfung verhindern doppelte Shard-Gutschriften bei Wiederholungen und konkurrierenden Anfragen. Der Server prüft auch den erlaubten Gruppenplan, Waffenbesitz und verbleibende Start-Power-ups. Die bestehende Architektur bleibt ein im Browser simuliertes Spiel und kein vollständig serverseitiges Anti-Cheat-System.

Alte Spielstände starten am bisherigen bestätigten Abschnitt mit ihren bisherigen Regeln. Sie behalten Regelversion 1 bis zum Missionsende. Neue Missionen verwenden die erweiterten Levels. Kontoinventar und alte Rekorde werden nicht gelöscht. Die Bestenliste bietet getrennte Ansichten für erweiterte Levels und bisherige Rekorde. Neue Rekorde sind zusätzlich nach Testnet und Mainnet getrennt; das historische Feld bleibt erhalten.

Bei einem Wechsel der Bildschirmgröße werden die Formationsziele aus dem bestehenden Raster neu berechnet. Bossabmessungen werden an die neue Fläche angepasst. Bei der Wiederaufnahme werden absolute Zeitstempel des Boss-Schadens auf die neue Browseruhr übertragen.

## Prüfung

Frontend- und Backend-Build sowie 161 Frontend- und 41 Backend-Tests erfolgreich. Die Tests enthalten alle 500 internen Schritte, endliche Gruppenpläne, eindeutige Bauformen und Farben, unveränderte Boss-/Bonuszuordnung, alte Spielstände, Waffenprüfung, doppelte und verspätete Speicheranfragen, Bonusfortsetzung und getrennte Rekorde.

`frontend/scripts/verifyLevelExpansion.cjs` prüft die echte React-Spielschleife und die tatsächlichen Backend-Handler mit einem isolierten Konto und einer Speichersimulation. Es instrumentiert ausschließlich den lokalen Vite-Prozess; im veröffentlichten Bundle gibt es keine Teststeuerung. Testfälle: interne Schritte 1, 9, 37, 99, 249 und 499 sowie Bossfortsetzung bei 10, 40 und 500. Geprüft werden Pausieren, Neuladen, Gegner-HP, Gruppenstand, Leben, Shards, einmaliger Blockabschluss und Wechsel zwischen Desktop- und Telefonformat. Pi-SDK und externe Dienste sind dabei ersetzt; diese Tests bestätigen keine echte Pi-Anmeldung oder Zahlung.

## Vor der Produktionsfreigabe offen

- Kontrollierte Vergleichsläufe mit gleicher Ausrüstung und vergleichbarer Spielweise: aktive Kampfzeit, gesamte Zeit bis zum nächsten Boss, Lebensverluste, Shards pro Minute und Power-up-Häufigkeit. Die Prozentziele im Konzept sind weiterhin Testziele, keine Messwerte.
- Framerate und Touch-Bedienung auf realem iPhone und Android, einschließlich echtem Pi Browser, Hintergrundwechsel und Netzunterbrechung.
- Mehrgeräte-Fortsetzen mit dem echten Konto und der produktionsnahen Datenbank im Testbetrieb. Die lokalen Tests nutzen eine In-Memory-Simulation.
- Bewusste Entscheidung über die vom Dokument abweichende Levelzählung. Bis dahin bleibt der vorhandene Bossrhythmus bestehen.

Optionale Aufgaben und zusätzliche Bossphasen sind gemäß Konzept spätere, getrennte Ausbauschritte. Die Produktion wird erst nach den verbleibenden Prüfungen aktualisiert.

## Ergänzende Prüfung

Die weitere Balanceprüfung und die Korrektur für Einflugwege/Einleitungsdauer alter Missionen sind in `doc/level-expansion-balance.md` dokumentiert. Automatisierte Todesläufe gelten ausdrücklich nicht als bestandene Balanceprüfung.

## Ergänzende Bonus- und Vorschauprüfung am 4. Oktober

Der neue lokale Browserfall `CRYPTOID_QA_PHASE=bonus CRYPTOID_QA_STAGES=10,500 node frontend/scripts/verifyLevelExpansion.cjs` prüft nun auch das Neuladen mitten in der Bonusrunde. Beide Fälle bestanden: bereits erzeugte Ziele mit ihrem Flugfortschritt, Trefferzahl, Leben und Shards werden exakt wiederhergestellt; die Bonusbelohnung wird einmalig verbucht. Nach Schritt 10 folgt Schritt 11; nach Schritt 500 folgt Victory und die Mission ist beendet. Rohdaten: `doc/level-expansion-bonus-results.json`. Die Wiederherstellung wird unmittelbar vor dem nächsten Animationsschritt verglichen, damit zwischenzeitlich neu erzeugte Ziele nicht als Speicherfehler gelten.

Die bereitgestellten iPhone-Screenshots bestätigen Startbildschirm und sechs Gegner im ersten Block der Safari-Vorschau. Sie belegen keine Framerate, zusätzlichen Gruppen oder Kontospeicherung. In der Cloud-Browser-Prüfung reagierten Start, Pause und Fortsetzen, jedoch wurden keine Gegner sichtbar; die Ursache ist nicht abschließend geklärt. Der Vercel-Connector verweigert weiterhin den Zugriff auf Deployment-Aliase mit 403, während die Vorschau über den Browser lädt.

Die Safari-Vorschau wurde ohne sichtbare Pi-Anmeldung gestartet. Gastmissionen bieten bereits im bisherigen Code keine gespeicherte Mission zum Fortsetzen; lokale Rekorde sind davon getrennt. Vercel-Anmeldung und Pi-Spielkonto sind unabhängig. Der Pi-OAuth-Einstieg leitet von der individuellen Vorschau zur festen Testnet-Origin weiter, daher ist der echte Kontospeichertest auf diesem Branch noch offen. Keine Authentifizierungs- oder Schutzmechanismen wurden geändert.
