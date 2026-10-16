# Auswertung der Pi-Browser-Aufnahme vom 16. Oktober 2026

## Quelle und Umfang

Nutzeraufnahme: ScreenRecording_10-16-2026 21-24-48_1.mp4.
SHA-256: 5e9d89c3d774cfb3673bbe5f688ced353bfcc3f802316990d6407d439e5ff728.
79 Sekunden, H.264, 512 × 1108 Bildpunkte, 30 codierte Videobilder/s.
Die Videodatei wird nicht in das Repository kopiert.

Die Browserleiste zeigt die verkürzte Testnet-Adresse. Die Aufnahme beginnt
mit Anmeldung/Fortsetzen, zeigt die Bonusrunde von Level 1 und danach Level 2.
Der kleinere Schildring ist in den Bildern erkennbar. Die Commit-ID lässt sich
aus der Aufnahme allein nicht ablesen; zuletzt unabhängig verifiziert war
Testnet 27d174788327c3423f04ace32be61af67a2004cc.

Diese Auswertung ändert keinen Spielcode und löst keine Veröffentlichung aus.

## Beobachtung

Die Verlangsamung ist anhand der sichtbaren Geschossbewegung nachvollziehbar,
besonders zwischen etwa 70 und 75 Sekunden in Level 2, Block 2/9. Der Gegner
ist bis mindestens Sekunde 75 noch sichtbar. Der Abschluss erscheint bei 76 s.
Der Abschnitt 70–75 s ist deshalb kein bloßer Block-Intro-/Clear-Vergleich.

Bei 70, 71 und 72 s zeigt der Doppel-Zähler 5 s, bei 73 und 74 s 4 s,
bei 75 s 3 s. In diesem Fenster läuft der Kampf weiter. Diese ganzzahlige
Anzeige bestätigt eine langsamere sichtbare Zeitentwicklung, liefert jedoch
keine exakte Millisekundenmessung des verlorenen Simulationstakts.

Zwischen etwa 54 und 57 s findet dagegen der Wechsel von Block 1 zu Block 2
statt; ein dort angehaltener Bonus-Zähler ist wegen der bestehenden
transitionPaused-Regel erwartbar und wird nicht als Fehlernachweis verwendet.

## Vergleich der sichtbaren Geschossbewegung

Cyanfarbene, schmale, längliche Bildkomponenten wurden über die codierten
Videobilder verfolgt. Ausgewertet wurden nur Bahnen mit mindestens 0,3 s Dauer,
120 Bildpunkten Aufwärtsbewegung, nahezu konstantem X und begrenztem
Regressionsrest. Der Suchbereich lag bei Y=270…890, unterhalb des HUD.
131 Bahnen bestanden diese Filter.

| Videofenster | Verwendete Bahnen | Median der Aufwärtsgeschwindigkeit |
| --- | ---: | ---: |
| 16–29 s, Bonusrunde Level 1 | 34 | ca. 744 Bildpunkte/s |
| 44–54 s, Level 2 Block 1 | 37 | ca. 657 Bildpunkte/s |
| 58–66 s, Level 2 Block 2 | 25 | ca. 546 Bildpunkte/s |
| 66–70 s, Level 2 Block 2 | 18 | ca. 648 Bildpunkte/s |
| 70–75 s, Level 2 Block 2 | 12 | ca. 395 Bildpunkte/s |

Die letzten 12 Bahnen umfassen auch jeweils beide Geschosse derselben Salve;
sie sind keine 12 voneinander unabhängigen Versuche. Der späte Median liegt
ungefähr 47 Prozent unter dem frühen Vergleich. Das ist eine Näherung aus
Videobildern, kein Browser-Profilergebnis und kein gemessener RAF-/FPS-Wert.

Zwei zur Gegenprüfung identifizierte Bahnen:

- Früher Abschnitt: X ungefähr 262, 23,000–23,500 s, ca. 376 Bildpunkte
  Aufwärtsweg; Regressionsgeschwindigkeit ca. 755 Bildpunkte/s.
- Später Abschnitt: X ungefähr 344, 73,333–74,400 s, ca. 402 Bildpunkte
  Aufwärtsweg; Regressionsgeschwindigkeit ca. 390 Bildpunkte/s.

Schussabstände an einer festen horizontalen Linie wurden ebenfalls geprüft.
Da Gegner Geschosse vorher abfangen können und die Schiffshöhe sich ändert,
ist daraus keine lückenlose Zählung neu erzeugter Salven ableitbar. Die
Geschossbewegung ist hier der belastbarere visuelle Vergleich.

## Abgleich mit dem Spielcode

Im veröffentlichten Quellstand setzt advanceShot die Y-Bewegung mit konstanten
0,64 CSS-Pixeln pro übernommener Simulationsmillisekunde fort. Der Wechsel
von Einzel- zu Doppelschuss ändert diese Geschwindigkeit nicht.
makeShipVolley verändert durch Hülleneigenschaften den Schaden, nicht die
vertikale Geschossgeschwindigkeit. Deshalb erklärt das eingesammelte
Doppel-Upgrade die beobachtete langsamere Bewegung nicht.

GamePage berechnet weiterhin delta = Math.min(34, frameGap). Derselbe
begrenzte Takt treibt Geschossbewegung, Feuerzähler und den Doppel-Zähler an.
Der bereits kontrolliert nachgewiesene Zeitverlust bei RAF-Lücken über 34 ms
passt zu der Aufnahme. Das Video enthält jedoch keine tatsächlichen
RAF-Zeitstempel und beweist deshalb nicht, dass genau diese Begrenzung den
gesamten Gerätevorfall erklärt.

## Noch offen

- Die verursachende Last ist nicht gemessen: Browser/WebView, Paint/Compositing,
  React, Ressourcenaufbau und Aufnahme-Overhead sind nicht voneinander getrennt.
- Die Aufnahme eines Browsers allein beweist keinen Pi-Browser-spezifischen
  Fehler und keinen identischen oder abweichenden Safari-Verlauf.
- Die kleinere Schildfläche ist weder als Ursache noch als Behebung bewiesen.
- Wenige verbliebene Gegner reichen gegen Ende für die Verlangsamung aus;
  eine Erklärung allein durch eine hohe Gegnerzahl passt daher nicht.
- Die 30 codierten Videobilder/s sind nicht die Bildrate des Spiels.

Für den nächsten gezielten Gerätelauf sollten tatsächliche RAF-Lücken,
übernommene und abgeschnittene Simulationszeit, Salven, Bonus-Zeit und
Render-/Commit-Abstände gemeinsam erfasst werden. Eine Änderung der
Waffenbalance, ein Entfernen der 34-ms-Grenze oder eine automatische
Grafikreduktion wird durch diese Auswertung nicht vorgenommen.
