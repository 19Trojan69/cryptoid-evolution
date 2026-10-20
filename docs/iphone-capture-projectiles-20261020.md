# iPhone-Aufnahme 19:17 UTC und Schussdarstellung

Der vom Eigentümer übermittelte Bericht vom 20. Oktober 2026, 19:17:08 UTC,
enthält erstmals die gezielte Laufzeitaufnahme des aktuellen Testnet-Standes
`bdf8b0a9edda1d878c47fddb59ab3ec3b20c7e26` (Baum `b321345f44d9e03c5d6e38af8805b5cd2dfd2de0`).
Die eingebettete Aufnahme dauert etwa 56 Sekunden bis zum Unmount. Ihr Limit
von 90 Sekunden bedeutet nicht, dass ein voller 90-Sekunden-Lauf gemessen wurde.

## Was der Bericht belegt

| Phase | Gemessener RAF-Takt | Szenen-Commits pro zwei Sekunden | Simulationszeit |
|---|---:|---:|---|
| Boss mit Geschützen | etwa 59–60 Hz | etwa 55–59 | vollständig |
| Freigelegter Bossrumpf | etwa 48–55 Hz | etwa 45–54 | vollständig |
| Boss-Abschluss | überwiegend 59–60 Hz | etwa 57–61 | vollständig |
| Bonusrunde | überwiegend 58–60 Hz | etwa 57–59 | vollständig |
| Bonus-Abschluss | etwa 49–54 Hz | etwa 49 pro zwei Sekunden | vollständig |

In sämtlichen übermittelten Pacing-Samples ist `discardedMs` null;
`wallMs` und `simulatedMs` stimmen überein. Der zuvor korrigierte dauerhafte
Zeitverlust tritt hier nicht auf. Schussintervalle im aktiven Kampf bleiben
ungefähr bei 300 ms. Die einzelne sehr große Volley-Lücke von 16.918 ms
überquert den absichtlich schusslosen Boss-/Bonus-Übergang und ist kein Beleg
für eine verlangsamte aktive Waffe.

Der aufgezeichnete Ablauf durchläuft Boss, Sieg und Bonus. Nach Pause folgen
`home-intent` und acht Millisekunden später `game-monitor-stop`. Das beweist die
Ausführung des regulären Home-Handlers. Es beweist für sich allein weder eine
bewusste menschliche Berührung noch einen automatischen Fehlaufruf. Der Bericht
enthält keinen abrupten Dokumentabbruch dieses Laufes. Frühere Unterbrechungen
bleiben davon unberührt.

Der gesamte Dokumentzeitraum umfasst mehrere Admin-Testläufe desselben Boots.
Die 15.034 konfigurierten CSS-Animationen sind ein kumulativer Zähler. Am Ende
ist eine davon aktiv; das ist kein Beweis für 15.034 zurückgehaltene Animationen.
Während der offenen Bossphase steigen die laufenden Animationen auf etwa 34.
Gleichzeitig bleibt die gemessene Simulationsarbeit meist unter 1 ms und der
statische Waffen-Canvas zeichnet nicht weiter. Das lenkt den Verdacht auf
Darstellungsarbeit außerhalb der gemessenen Simulation, beweist aber keine
bestimmte GPU-/WebKit-Ursache. Long Tasks sind auf diesem Gerät nicht unterstützt;
Nullwerte dafür schließen lange Hauptthread-Aufgaben nicht aus.

## Konkrete Korrekturen

Die mobile Szene wurde schon vor dieser Änderung alle 32 ms, bei stärkerer
Belastung alle 50 ms veröffentlicht. Da Schüsse Teil ihres React-Baumes waren,
wurden auch ihre sichtbaren Positionen nur bei diesen Veröffentlichungen
aktualisiert. Die neue Projektilausgabe nutzt den vorhandenen gemeinsamen
Spiel-RAF bis maximal 60 Hz. Sie liest ausschließlich den abschließend simulierten
Zustand. Sie startet keinen zusätzlichen RAF/Timer, extrapoliert keine Bewegung
und verändert keine Kollisions-, Waffen-, Schadens- oder Speicherregeln.

React reserviert einen leeren Mount; dessen Kindknoten gehören ausschließlich
der Projektilausgabe. Pro vorhandenem Projektil bleibt ein DOM-Knoten erhalten.
Neue Schüsse erscheinen im jeweiligen Spieltakt; getroffene/entfernte Schüsse
verschwinden im selben Takt. Zwei Gruppen erhalten die bisherige Reihenfolge
Spieler vor Gegner. Die Bewegung verwendet unabhängige CSS-Translation;
bestehende Zentrierung, Rotation, Farben, Größen und Pseudoelemente bleiben in
den vorhandenen CSS-Klassen. Der Cache enthält nur aktuell lebende Projektile
und wird beim Unmount vollständig geleert. Unveränderte Pausenpositionen lösen
keine weiteren Style-Schreibvorgänge aus.

Triebwerkslängen werden bereits durch `advanceShipMotion` mit einer Antwortzeit
von 110 ms geglättet. Zusätzlich startete jede neue Höhe eine CSS-Transition von
140/160 ms. Im Live-Spielfeld entfällt diese zweite Glättung. Flammen, Farbverläufe,
Leuchteffekte und die erste Bewegungsglättung bleiben erhalten; die geringere
zusätzliche Verzögerung der sichtbaren Schubantwort ist beabsichtigt. Menü-/Home-
Vorschauen behalten ihre bisherigen Übergänge. Die Browser-Vergleichsseite misst
die erzeugten Übergänge und prüft die endgültige Grafik/Höhe.

## Prüfungen vor Veröffentlichung

- 89 gezielte Tests bestehen, einschließlich tatsächlicher GamePage bei
  60/30/20 Hz, 88-ms-Aussetzern und unregelmäßiger Framefolge.
- Bei 60-Hz-GamePage werden 60 Projektilpositionen gegenüber 30 vollständigen
  Szenen pro Sekunde ausgegeben. Positionen stimmen mit dem letzten
  Simulationsschritt überein, Unterteilungen schreiben nicht mehrfach pro Frame.
- 6.000 aufeinanderfolgende Volleys halten ausschließlich die zwei jeweils
  lebenden Testprojektile; Treffer-/Clear-/Unmount-Räumung besteht.
- Drei simulierte 30-Abschnitt-/Drei-Boss-Kampagnen: Referenz 60 Hz,
  Änderung 60 Hz und Änderung 20 Hz. Der 60-Hz-Spielverlauf ist exakt gleich:
  `4a43cdd9c602dfcd30b76edfe2ea930f5ad62d5440e585f9610d1cd9e7bc9e1b`.
  Grafik, Hardwareaudio und Konto-APIs sind dort Stubs.
- TypeScript, 12 Sprachtests und Preview-Build bestehen. Der bestehende
  Build-Hinweis auf große Chunks bleibt. Das neue Modul besteht ESLint.
  GamePage hat vor und nach der Änderung dieselben 63 bestehenden Hook-
  Compilerfehler und vier Abhängigkeitswarnungen; kein pauschal sauberer Lintlauf.
- Die zusätzliche Browser-Vergleichsseite wird ausschließlich in geschützte
  Vorschauen eingebunden. Die Veröffentlichung wird erst nach deren Prüfung
  durchgeführt und separat protokolliert.

Die automatische Freigabeprüfung blockierte den zusätzlich vorgesehenen
schreibgeschützten Mainnet-Vergleich wegen der Testnet-Beschränkung. Die
öffentliche HTTP-Prüfung wurde deshalb auf Testnet begrenzt. Mainnet wurde in
diesem Arbeitsschritt weder geprüft noch verändert.

## Fachliche Grundlage und Grenze

WebKit beschreibt Layout-/Paint-/Animationsarbeit als eigene Energiequellen;
ein Ziel von 60 Hz begrenzt nicht die Kosten jedes einzelnen Frames:
https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/

React erlaubt imperative Arbeit an DOM-Bereichen, deren Kinder React selbst
nicht aktualisiert. Dieser Mount bleibt deshalb in React leer:
https://react.dev/learn/manipulating-the-dom-with-refs

Die unabhängige CSS-Translation erhält andere Transform-Eigenschaften:
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/translate

Diese Änderung behebt die nachgewiesene gröbere Schussdarstellung und vermeidet
überflüssige Triebwerks-Transitions. Sie ist kein Beweis, dass ein physischer
iPhone-WebContent-Abbruch, Überhitzung oder jeder Whitescreen vollständig
beseitigt ist. Dafür liefert auch eine erfolgreiche entfernte Chrome-Prüfung
keine native Speicher-/GPU-/Temperaturmessung.
