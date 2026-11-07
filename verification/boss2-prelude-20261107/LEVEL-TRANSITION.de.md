# Prozessspeicher am Levelabschluss

7. November 2026 · Isoliertes Diagnoselabor · gepinnte Spielbasis `d9e0897a9396dd8f1f0a9c4a9a0536aa1fb7208d`

## Messwerte

Die Tabelle zeigt den PSS-Median des WebKit-Inhaltsprozesses in MiB vor und nach jedem Ereignis. Die Differenzen beziehen sich auf denselben Prozess innerhalb eines Laufs. Die Pausendifferenz reicht vom Nachher-Fenster der Freigabe bis zum Vorher-Fenster des Klicks. Die Gesamtdifferenz reicht vom Vorher-Fenster des Bonusendes bis zum Nachher-Fenster des Klicks.

| Lauf | Bonusende | Ressourcenfreigabe | Fortsetzen | Δ während der Pause | Δ über den ganzen Übergang |
| --- | ---: | ---: | ---: | ---: | ---: |
| Lokal 1 | 912,4 → 938,4 (+26,0) | 918,7 → 986,1 (+67,4) | 999,8 → 1057,6 (+57,8) | +13,7 | +145,2 |
| Lokal 2 | 976,1 → 983,7 (+7,5) | 954,4 → 1025,0 (+70,7) | 916,8 → 1034,1 (+117,4) | −108,3 | +58,0 |
| Lokal 3 | 969,1 → 993,5 (+24,4) | 965,8 → 1002,1 (+36,4) | 842,5 → 947,0 (+104,5) | −159,6 | −22,1 |
| Lokal 4 | 934,2 → 950,8 (+16,7) | 934,4 → 977,2 (+42,8) | 863,0 → 966,3 (+103,2) | −114,2 | +32,1 |
| CI A2 | 975,4 → 977,9 (+2,5) | 959,7 → 978,7 (+19,0) | 915,2 → 1015,1 (+99,9) | −63,5 | +39,7 |
| CI B1 | 992,7 → 1005,6 (+13,0) | 974,1 → 984,5 (+10,4) | 1049,8 → 1085,3 (+35,4) | +65,3 | +92,6 |
| CI B2 | 952,8 → 968,0 (+15,2) | 944,8 → 993,5 (+48,8) | 865,7 → 966,9 (+101,2) | −127,9 | +14,1 |
| CI Wiederholung | 979,5 → 971,0 (−8,5) | 959,1 → 974,3 (+15,2) | 1056,8 → 1081,7 (+24,9) | +82,5 | +102,1 |

Positive Änderungen in 7/8 Läufen am Bonusende, in 8/8 im Fenster um die Freigabe und in 8/8 bei Fortsetzen. Die Änderung bei Fortsetzen lag bei +24,9 bis +117,4 MiB. In 5/8 Läufen fiel der PSS, während die Abschlussseite offen war. Die Differenz vom Bonusende bis nach Fortsetzen war in 7/8 Läufen positiv.

Die exakten Messmarken an der Freigabe zeigen die gleichen Zähleränderungen in allen acht Läufen.

| Zähler | Vor Freigabe | Nach Freigabe |
| --- | ---: | ---: |
| Schiffsbilder im Farbcache | 19 | 13 |
| Geschätzte Bildcache-Größe | 6,57 MiB | 4,49 MiB |
| Canvas-Effektcache | 0,88 MiB | 0 MiB |
| Audio-PCM-Puffer | 6,76 MiB | 6,76 MiB |
| Aktive Effektstimmen | 0 | 0 |

## Ablauf und Gültigkeit

- Vier lokale Läufe auf Debian 13 und vier auf Ubuntu-24.04-Runnern mit dem gepinnten Container des vorigen Vergleichs. Playwright 1.62.1 mit WPE-WebKit 26.5, 430 × 825 CSS-Pixel und DPR 3.
- Der bestehende Pilot spielt den verkürzten Boss-1-Kampf und die echte Bonusrunde. Nach Fortsetzen springt der Test direkt zum Boss-2-Anflug mit dem letzten Geschütz. Der Pilot aktiviert den vorhandenen Testschutz gegen Lebensverlust. Gastbetrieb, lokaler Transport und aktuelle Testnet-Spielregeln. Die Boss-1-Geschützgrafik bleibt entsprechend dem regulären Cache-Verhalten im Cache.
- Der Test markiert Bonusende, Öffnen der Abschlussseite, Eintritt und Rückkehr der regulären Canvas-/Bildfreigabe, den Fortsetzen-Klick des Browsers und dessen Annahme. Die Abschlussseite bleibt ab der Freigabe mindestens 5,2 Sekunden offen.
- Native PSS- und RSS-Abtastung im 100-ms-Takt aus Linux `/proc`. Die Vergleichsfenster umfassen jeweils die 600 ms zwischen 700 und 100 ms vor und zwischen 100 und 700 ms nach der Marke. Die App-Zähler haben zusätzliche Schnappschüsse direkt an den Marken.
- In jedem gültigen Lauf blieben Dokumentkennung, `performance.timeOrigin`, PID und Startzeit des Inhaltsprozesses bis 20 aktive Sekunden nach dem zweiten Begleitschiff stabil. Die Fenstermediane wurden aus den Rohdaten erneut berechnet.
- CI A1 fiel aus der Vergleichstabelle, weil die alte Abfrage bei der Klickautomatisierung eine Lücke im Fenster vor Fortsetzen ließ. Der Wiederholungslauf sammelt die App-Zähler mit einem eigenen 150-ms-Takt im Dokument.

## Einordnung

Im Fenster um die Freigabe öffnet und zeichnet der Browser auch die Abschlussseite. Die App-Zähler zeigen die tatsächliche Cache-Bereinigung. Der PSS misst gleichzeitig weitere residente Browser-Ressourcen. Die Messung ordnet den PSS-Anstieg zeitlich ein, seine native Quelle bleibt offen.

Der Laborbefund betrifft Linux-WebKit und die verkürzte Teststrecke. Für das iPhone bleiben die Speichergrenze des Pi Browsers und der Auslöser des neuen Dokuments mit `navigate` offen.

Als Nächstes denselben Abschluss mehrfach automatisiert durchlaufen und dabei nur das Ziel nach Fortsetzen variieren. Der reguläre Einstieg in Level 2, Block 1 bildet die Kontrolle für den direkten Boss-2-Anflug. Die Prozessmessung beginnt wieder vor dem Klick. So lässt sich der gemeinsame Aufwand des Fortsetzens vom Aufwand des direkten Boss-2-Starts trennen.

[Ursprüngliche CI-Läufe und Rohdaten](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/42357887201) · [Wiederholung und Rohdaten](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/42358601493)
