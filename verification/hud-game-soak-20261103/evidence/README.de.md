# Abgeschlossene synthetische Spielbelege

HUD-Kandidat: Lauf 41626481637, Testquellstand
2257a13d54f4d4b7c76f38ba0cacf8d018384fe4, beide Jobs success.
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41626481637

Chromium: 1.801.000 aktive Millisekunden im langen ersten Zyklus;
WebKit: 1.800.068 ms. Danach jeweils zwei abgeschlossene Wiedereinstiege.
Beide Engines bestehen auch die zwei vorausgehenden vollständigen Kurzabläufe.
Pause, Waffenmenü, Ausstieg, normale Berichte, tatsächliche sieben Berührungen
je Kontakt-Zyklus und der einzige behandelte HUD-Wert none sind überprüft.
Die vollständigen gelieferten fünf Dateien jedes Ablaufs sind in den Log-
Datensätzen komprimiert erhalten; verify.py prüft Fragmente und jede Dateilänge
und SHA-256 vor der Auswertung. Die sechs Abläufe enthalten insgesamt 84
verifizierte Spielfeldberührungen und 18 abgeschlossene Spielzyklen.

Das eingefrorene Original hatte im früheren Lauf 41584352581 ebenfalls beide
30-Minuten-Prüfungen bestanden. Der neue grüne Lauf belegt daher allein keinen
Stabilitätsgewinn durch die HUD-Korrektur. Ungeseedete Linux-Läufe sind kein
kausaler Vergleich des nativen Grafik-/Handyspeichers. Es sind keine physischen
Android-/iOS-Abnahmen. whiteScreenFixed und memoryReductionProven bleiben false.

Der getrennte native Original-Versuch 41625231628 endete mit failure:
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41625231628
Die konstante Kontrolle samt echtem vertrauenswürdigem Klick besteht. Nach
deren Sitzungsabbau scheitert die zweite Safari-Sitzung am Remote-Debugger-
Zugriff. Der Pilot hat keine verifizierten Spielzyklen, der Dauerlauf wurde
nicht gestartet. gameLoaded:null wird nicht zu false oder true umgedeutet.
Weder White Screen noch native Handy-Beendigungsursache sind daraus belegt.

Der gelieferte Compilerblock hat alle 1.053 Fragmente, aber seine rekonstruierte
SHA-256 weicht ab. Er wird ausdrücklich abgelehnt und nicht als Beleg genutzt.
verify.py dokumentiert diese Zurückweisung; eine Integrität des gesamten
nativen Job-/Compilerlogs wird NICHT behauptet. Alle für die obigen Aussagen
verwendeten übrigen nativen Ereignisse bestehen ihre jeweilige Fragmentprüfung.
Die Hashwerte in manifest.json beschreiben die hier erhaltenen gelieferten
Logbytes. Der Compiler selbst war bereits vor der Ausgabe auf das Ende seines
ursprünglichen Logs begrenzt; dieses Ende ersetzt nicht die volle Compilerdatei.

Nur synthetische, lokale CI-Gastdaten. Keine privaten Handyberichte, Konten,
Zugangsdaten, Simulatorbilder oder Besitzerdateien sind enthalten. Die Spiel-
quellen und veröffentlichten Versionen bleiben unverändert. Nachprüfung:

```sh
python3 verification/hud-game-soak-20261103/evidence/verify.py
```
