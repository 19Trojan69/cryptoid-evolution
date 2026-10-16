# Gezielte Tests ohne erneutes Durchspielen

## Auftrag und Ergebnis

Der Nutzer möchte die Fehlersuche nicht durch wiederholtes Durchspielen des
gesamten Spiels selbst übernehmen. Deshalb können die automatisierten Prüfungen
jetzt direkt in die betroffenen Abschnitte einsteigen. Es wird kein echtes
Konto, Kauf, Ranglistenwert oder Spielstand benutzt oder verändert.

24 von 24 Prüfläufen bestehen: acht Szenarien mit jeweils drei vorgegebenen
Bildabständen. Ausgeführt wird die echte GamePage-Simulation mit dem vorhandenen
Node-Testhost. Darstellung, GPU, Audiohardware und Konto-APIs sind dort Stubs.
Dies ist kein Nachweis behobener Pi-Browser-Verlangsamung.

Der geprüfte GamePage-Quelltext ist bytegleich mit dem veröffentlichten Testnet-
Commit 27d174788327c3423f04ace32be61af67a2004cc. Sein SHA-256 lautet
eb628a5d73247ea64ec5443d2ff4efdab071a97228634f16f2aa915cdc832607.
Es wurden ausschließlich der neue Testtreiber und diese Ergebnisdateien ergänzt.

## Direkte Einstiege

Die Stufennummern in dieser Tabelle sind interne Sektoren, nicht die im HUD
angezeigten Levelnummern. Zum Beispiel entspricht interner Sektor 12 dem
aufgenommenen Level 2, Block 2/9.

| Szenario | Geprüfter Ablauf |
| --- | --- |
| Ende Bonusrunde von Level 1 | Bonus in Sektor 10 → normale Sektoren 11 und 12 |
| Längerer Kampf im aufgenommenen Abschnitt | Direkteinstieg Sektor 12, drei Minuten nominale Kampfzeit, anschließend 13 |
| Bosswechsel aus normalem Kampf | Sektor 39 → Boss 40 → Bonusrunde → 41 |
| Direkter Bossstart | Boss 40 → Bonusrunde → 41 |
| Last, Pause und Fortsetzen | Sektoren 25/26 mit injizierten Schüssen und Effekten |
| Späterer Bosswechsel | Sektor 249 → Boss 250 → Bonusrunde → 251 |
| Später direkter Bossstart | Boss 490 → Bonusrunde → 491 |
| Einleitung des letzten Bosses | Sektor 499 → Modell/Intro von Boss 500 |

Der letzte Fall prüft ausdrücklich nicht den kompletten Sieg über Boss 500.
Die Folge wird mit zusätzlichen Leben und kontrolliert entfernten Gegnergruppen
durchlaufen. Das prüft Übergänge und Ressourcenlebensdauer, nicht Spielbalance
oder einen vollständig durchgespielten Kampagnenlauf.

## Zeitprofile und Grenzen

- Regelmäßige Aufrufe mit 16,67 ms Abstand.
- Langsame Aufrufe mit 50 ms Abstand.
- Wiederholt 16/16/16/100 ms, um stockende Zustellung zu prüfen.

GamePage übernimmt unverändert höchstens 34 ms pro Aufruf. Damit die bestehenden
Übergangsprüfungen bei den langsamen Profilen genügend Simulationszeit bekommen,
verlängert der Testhost seine vorgegebene Wartezeit um das bekannte Verhältnis
von roher zu begrenzter Zeit. Diese Anpassung findet ausschließlich im Testhost
statt; sie repariert oder verändert weder den Spieltakt noch die Feuerrate.

Die drei langen Kämpfe bleiben nachweislich im gewählten Sektor und üben dort
tatsächliche Angriffe aus. Alle 24 Läufe prüfen zudem Hintergrundunterbrechung,
eine kontrollierte technische Pause, Speichern und zweimaliges Wiederherstellen.
Beim Wiederherstellen wird für Waffenzeit die bestehende exakte Math.round-
Serialisierung geprüft; Punkte, Shards und Leben bleiben exakt gleich.

In Summe wurden 39 normale Sektordurchläufe und 12 Bosskämpfe mit kontrolliertem
Bossende geprüft. In jedem Lauf bleiben nach dem Abbau null RAF-Aufträge, null
Host-Timer und null Diagnose-/Eingabe-Listener übrig. Das ist eine Aussage über
die erfassten Host-Ressourcen, nicht über GPU-/WebView-Speicher oder Audiohardware.

## Wiederholung und nächster Gerätetest

Aus frontend:

```sh
node scripts/verifyTargetedTransitions.cjs
```

Die vollständigen Ergebnisse liegen in targeted-transitions.json. Die einzelnen
Läufe verwenden mobile Feldabmessungen 390 × 844 und einen festen Zufallsstart.
Das Ergebnisfeld simulatedSeconds bezeichnet die injizierte Uhrzeit des Hosts;
es enthält auch Pausen und die Hintergrundunterbrechung und darf nicht als
gemessene Laufzeit oder Browser-Bildrate ausgegeben werden.

Der Nutzer braucht diese automatisierten Abläufe nicht nachzuspielen und soll
vorerst keine weitere lange Testrunde absolvieren. Für die weiterhin offene
Pi-Browser-Ursache ist später ein kurzer, vorbereiteter Geräteschritt mit echten
Frame-/Spielzeitdaten nötig. Ein solcher Browser-Direkteinstieg ist durch diesen
Node-Testtreiber noch nicht bereitgestellt. Eine erneute Veröffentlichung allein
würde keine neue Ursachenmessung liefern; Testnet und Haupt-App werden durch
diesen Testauftrag nicht neu veröffentlicht.
