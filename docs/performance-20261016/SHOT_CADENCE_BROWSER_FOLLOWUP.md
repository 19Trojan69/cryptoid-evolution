# Erneut verlangsamte Schüsse nach der Testnet-Freigabe

## Meldung und Stand

Der Nutzer bestätigt am 16. Oktober 2026 nach der Veröffentlichung erneut
verlangsamte Schüsse im Testnet. Die zuvor mehrdeutige Formulierung wurde mit
der Antwort „Wieder langsamer“ geklärt. Er fragt, ob der Pi Browser beteiligt
sein kann. Öffentlich freigegeben ist weiterhin Commit
`5f025e92b6eafd9523512e7b5b048e6777bd923e`.

Diese Untersuchung ergänzt ausschließlich einen Test und dieses Protokoll.
Sie verändert keinen Spielcode und veröffentlicht keinen weiteren Build.

## Nachgewiesener Mechanismus im aktuellen Spielcode

`GamePage.tsx` berechnet pro RAF-Aufruf `delta = Math.min(34, frameGap)`.
Der Feuerzähler und `advanceShot` verwenden diese begrenzte Zeitspanne.
Bei längeren Bildpausen verstreicht deshalb weniger Spielzeit als reale Zeit.
Dies kann sowohl den realen Abstand zwischen Salven als auch den Fortschritt
der Geschosse pro realer Sekunde verlangsamen.

Die Begrenzung ist eine bestehende Schutz-/Timingentscheidung. Einfach nur
Schüsse auf eine andere Uhr umzustellen oder die Begrenzung zu entfernen,
könnte Waffenbalance, Kollisionen, Gegnermotion und Power-up-Dauern verändern.
Eine solche Gameplay-Änderung wurde hier nicht vorgenommen.

Die beobachtete Testnet-Störung ist damit noch nicht am Gerät reproduziert.
Insbesondere ist nicht gemessen, ob der aktuelle Pi-Browser-Lauf überhaupt
entsprechende RAF-Lücken hat. Die bestehenden privaten Safari-Messungen sind
kein Messprotokoll dieses neuen Vorfalls.

## Neuer gezielter Test

Aus `frontend`:

```sh
node scripts/verifyShotCadence.cjs
```

Der Test verwendet den bestehenden tatsächlichen GamePage-Simulationshost und
den unveränderten GamePage-Scheduler. Er injiziert andere RAF-Zeitstempel;
er ersetzt keine Feuer-/Bewegungsformeln durch einen nachgebauten Rechner.
Schüsse werden am tatsächlichen Laser-Aufruf nach dem Erzeugen der Salve
gezählt. Audiohardware, Darstellung, GPU und Konto-APIs bleiben gestubbt.

Nach dem Aufwärmen wird ein kontrollierter normaler Kampf mit einem langlebigen
Gegner, Grey Scout auf Stufe 1 und ohne Rapid/Overdrive gehalten. Störende
Geschosse/Pickups und ein Kampftod werden im Host ausgeschlossen. Es geht um
die Zeitsteuerung, nicht um vollständige normale Kampfszenen unter GPU-Last.
Jedes Messfenster dauert 30 Sekunden der injizierten Echtzeituhr.

| Vorgegebene RAF-Abstände | Erfasste Spielzeit | Salven | Mittlerer Abstand |
| --- | ---: | ---: | ---: |
| 16,67 ms (60 Aufrufe/s) | 30.000 ms | 93 | 319,9 ms |
| 33,33 ms (30 Aufrufe/s) | 30.000 ms | 93 | 319,9 ms |
| 40 ms (25 Aufrufe/s) | 25.500 ms | 79 | 376,4 ms |
| 50 ms (20 Aufrufe/s) | 20.400 ms | 63 | 470,2 ms |
| wiederholt 16/16/16/100 ms | 16.646 ms | 52 | 576,6 ms |

Der nominelle Feuerabstand beträgt 320 ms. Es waren höchstens 4 Spieler-
Geschosse gleichzeitig vorhanden; die Grenze von 28 erklärt diesen Effekt
im kontrollierten Test nicht.

Ein zusätzlicher ununterbrochener Lauf wechselte von 60 auf 20 und zurück auf
60 Aufrufe/s: 93, 64 und 94 Salven je 30 Sekunden. Der Feuerzähler und der
Kampf wurden zwischen diesen Fenstern nicht neu gestartet. Der Takt erholt
sich somit im Test, wenn die RAF-Zustellung sich erholt. Alle sechs Testläufe
beendeten sich mit 0 erfassten RAF-Aufträgen, Timern und Listenern.
Die vollständigen Zahlen liegen in `shot-cadence-matrix.json`.

Diese Zahlen sind ausdrücklich keine gemessenen Pi-Browser-/Safari-FPS und
kein Nachweis eines Pi-spezifischen Browserfehlers. Sie zeigen eine unter
vorgegebenen Bildpausen reproduzierbare Eigenschaft des veröffentlichten Codes.

## Nächster Test am Gerät

Dieselbe Testnet-URL auf demselben Gerät im Pi Browser und im gewöhnlichen
Browser vergleichen, mit gleichem Schiff, Waffenstufe und Rapid-Zustand.
Wichtig sind ein vergleichbarer Kampfabschnitt, Zeitpunkt des Einbruchs,
Salvenabstände gegenüber Geschossbewegung und die Erholung nach dem Abschnitt.
Ein kurzes Video der verlangsamten Stelle mit sichtbarem HUD hilft dabei,
Waffen-/Rapid-Wechsel von technischem Zeitverlust zu trennen.

Für einen späteren gezielten Diagnoselauf sollten echte Frame-Lücken,
übernommene/verlorene Simulationszeit, tatsächliche Salven, Waffenstatus und
Darstellungsverzögerung zusammen erfasst werden. Erst damit lässt sich prüfen,
ob dieser Mechanismus im Pi Browser den aktuellen Vorfall erklärt oder ob
zusätzlich eine andere Quelle beteiligt ist.

Browsergrundlage: `requestAnimationFrame` ist an die Bildausgabe gekoppelt;
die echte Ausführung am Gerät muss deshalb mitgemessen werden:
https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
