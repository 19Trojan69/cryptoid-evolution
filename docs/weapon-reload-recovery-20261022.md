# Waffenwechsel nach einem automatischen Ladezyklus

Marcus meldet am 22. Oktober 2026: Nach Ablauf eines Ladezyklus mit Automatik
bleibt „Nicht bestätigt. Dieselbe Waffe erneut versuchen.“ dauerhaft im Spiel
stehen; weitere Waffen lassen sich nicht aktivieren.

Die veröffentlichten Handler lassen sich lokal in genau diesen fehlerhaften
Bestätigungszustand bringen: Eine Ladung wird serverseitig bestätigt, ihre Antwort
geht verloren und der Client behält die Vorgangsnummer. Das Menü sperrt daraufhin
andere Waffen. Ist dieselbe Waffe inzwischen als Pickup aktiv, verwirft ihr
Auswahlknopf den Wiederholungsversuch sogar als bereits ausgewählt. Ein Wechsel
auf Standard oder eine bereits laufende Ladung löscht außerdem den alten
Fehlertext nicht. Ein ausstehender alter Hinweis-Timer kann seinerseits einen
neueren manuellen Fehlertext vorzeitig entfernen.

Damit sind Fehler im Client reproduziert. Welche ursprüngliche Netzwerk- oder
Serverantwort auf dem betroffenen Gerät ausblieb, ist ohne zugehörigen technischen
Beleg nicht bekannt. Der Nachladefehler wird nicht als Ursache des Whitescreens
ausgegeben.

## Vorbereitete Korrektur

Branch `codex/weapon-reload-recovery-20261022`, Ausgangscommit
`94825bdcc78c7be27632a12340732a27088aebe2`. Automatisches Deployment ist aus;
es wurde keine neue Version veröffentlicht. Dieser Branch ist unabhängig von der
vorbereiteten Bonusabschluss-Diagnose `codex/bonus-clear-boundary-20261022`.

- Jede manuelle Waffenwahl klärt zuerst eine offene Aktivierung mit ihrer
  ursprünglichen Waffenstufe und Vorgangsnummer. Erst nach Bestätigung wird die
  neue Wahl ausgeführt. Ein bereits gewährter Vorrat wird dabei nicht überschrieben.
- Standard, laufende Ladungen und Pickups bleiben auswählbar. Für eine tatsächlich
  neu gewählte Ladung entsteht anschließend höchstens eine neue Vorgangsnummer.
- Der offene Vorgang lässt sich auch dann erneut versuchen, wenn dieselbe Waffe
  gerade als aktiv erscheint. Der vorhandene übersetzte Text „Retry“ wird verwendet.
- Erfolgreiche Auswahl löscht den alten Fehlertext. Ein neuer manueller Versuch
  beendet den älteren Hinweis-Timer, damit dieser keinen neueren Fehler verdeckt.
- Echte Verbindungsfehler behalten die ursprüngliche Vorgangsnummer. Es gibt keine
  Endlosschleife, keine erfundene Bestätigung und keinen unbestätigten Timer.

Die Kosten, Bestände, Ladedauer, Trefferregeln, Automatik-Voreinstellungen,
Kaufabwicklung und vorhandenen serverseitigen Prüfungen bleiben erhalten.
Backend, Konto- und Spielstandschema, API-Verträge, CSS, Grafik, Audio und
Spielsimulation werden nicht geändert. Es werden keine realen Konten oder
Käufe verwendet.

## Prüfung

Die neuen Tests führen die tatsächlichen GamePage-Auswahlfunktionen, die echte
Waffenabgleichsfunktion und den tatsächlichen Menü-Code aus. React-Zustandsplanung,
Uhr und Transport werden im lokalen Host ersetzt. Zwei zusätzliche Durchläufe
verwenden die unveränderten Konto-/Checkpoint-/Aktivierungs-Handler mit isolierten
Speicherkonten: Eine verlorene Bestätigung nach Ablauf einer Ladung wird mit
derselben Vorgangsnummer wiederholt; der Vorrat sinkt nur einmal pro neuer Ladung.

Kontrolliert werden außerdem Pickups während einer laufenden Anfrage, ersetzte
Missionen, mehrere Ladezyklen, doppelte Auslöser, ein bereits verbrauchter Beleg,
unbrauchbare Antworten und weitere Verbindungsfehler. Die Regressionen laufen
bei jedem Build. Ausführungsbelege und Werkzeugversionen stehen im gleichnamigen
Belegverzeichnis.

17 neue Regressionstests bestehen. Gegen den unveränderten veröffentlichten Code
fallen zwölf davon durch; fünf Kontrollen bestehen dort bereits. Insgesamt bestehen
35 fokussierte Tests, 28 vorhandene Backend-Prüfungen sowie der vollständige
Build mit Sprachenprüfung, Canvas-Tests, neuen Waffenprüfungen, TypeScript und Vite.
Die Lint-Meldungen sind gegenüber dem Ausgangsstand identisch: GamePage hat mit
dem wiederhergestellten Werkzeugstand 62 Fehler/vier Warnungen, das Waffenmenü
drei Fehler. Es gibt keine hinzugefügte Meldung und keinen Gesamt-Lint-Erfolgsanspruch.
Der Scope-Vergleich bestätigt die Bytegleichheit der restlichen GamePage,
einschließlich des automatischen Auslösers; im Menü ändern sich nur zwei Knöpfe.

Das ist lokale Funktions- und Handlerprüfung, kein Test im physischen PiBrowser.
Bei fortbestehendem Verbindungsfehler kann der Client keine bestätigte Aktivierung
erfinden. Offizielles Testnet, Mainnet und alle festen Release-/Rollback-Referenzen
bleiben unverändert.
