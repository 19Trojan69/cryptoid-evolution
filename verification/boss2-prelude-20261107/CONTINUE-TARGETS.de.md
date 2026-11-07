# Speichervergleich nach Fortsetzen

7. November 2026 · Isoliertes Diagnoselabor · gepinnte Spielbasis `d9e0897a9396dd8f1f0a9c4a9a0536aa1fb7208d`

## Messwerte

Jede Zelle enthält drei PSS-Änderungen in MiB im selben WebKit-Inhaltsprozess. Die Fenster nach dem Klick liegen bei 0,1–0,7 s, 1,8–2,4 s und 6,2–6,8 s. Referenz für alle drei ist der Median von 0,7 bis 0,1 s vor dem Klick. Die Paardifferenz zieht die Änderung auf dem regulären Pfad von der Änderung beim direkten Boss-2-Pfad ab.

| Paar | Zuerst | Level 2, Block 1 | Direkt zu Boss 2 | Boss 2 minus Block 1 |
| --- | --- | ---: | ---: | ---: |
| CI A1 | Block 1 | +38,0 / +57,6 / +61,8 | +66,9 / +129,6 / +131,1 | +28,9 / +72,0 / +69,3 |
| CI A2 | Block 1 | +17,1 / +13,9 / +9,4 | +97,0 / +146,2 / +147,6 | +79,9 / +132,3 / +138,2 |
| CI B1 | Boss 2 | +88,5 / +148,5 / +149,1 | +33,5 / +38,6 / −73,8 | −55,0 / −109,9 / −222,9 |
| CI B2 | Boss 2 | +45,8 / +49,2 / +44,6 | +31,5 / +38,6 / +41,9 | −14,3 / −10,5 / −2,7 |
| Lokal | Block 1 | +34,8 / +34,5 / +74,3 | +38,3 / +23,7 / +87,2 | +3,5 / −10,8 / +12,9 |

Die vier gepaarten CI-Läufe pro Ziel ergaben im ersten Fenster einen Median von +41,9 MiB für Block 1 und +50,2 MiB für Boss 2. Die frühen Paardifferenzen reichten von −55,0 bis +79,9 MiB. Nach 6,2–6,8 Sekunden reichten die Paardifferenzen von −222,9 bis +138,2 MiB.

## Ablauf und Gültigkeit

- Ein lokales Debian-13-Paar und vier Paare auf separaten Ubuntu-24.04-Runnern mit dem gepinnten Container des vorigen Tests. In jedem Paar liefen die Varianten nacheinander in frischen Browserprozessen. Playwright 1.62.1 mit WPE-WebKit 26.5, 430 × 825 CSS-Pixel und DPR 3.
- Dieselbe Boss-1-Vorrichtung, Bonusrunde, reguläre Ressourcenfreigabe und Gastisolierung mit aktuellen Testnet-Spielregeln. Die Kontrollvariante verwendet die originale Entscheidung `advanceAfterClear(10, "bonus")`. Die direkte Variante springt wie im vorigen Test zum Boss-2-Anflug mit einem verbleibenden Geschütz.
- Der Test klickt mindestens 5,2 Sekunden nach der Freigabe auf Fortsetzen. In den CI-Läufen betrug der Abstand 5,5 bis 6,9 Sekunden. Der Pilot erzielte dabei 4 bis 6 Bonustreffer. Der App-Zähler lief unabhängig vom Klick im 150-ms-Takt.
- PSS und RSS wurden im 100-ms-Takt aus Linux `/proc` gelesen. Boot-ID, `performance.timeOrigin`, PID und Prozessstartzeit wurden für jeden Lauf geprüft. Der tatsächlich erreichte Sektor und die Spielphase wurden an der Übergabe und in den Folgefenstern erfasst. Die Fenstermediane wurden aus den Rohdaten erneut berechnet.

## Einordnung

Der Anstieg im ersten Fenster trat in allen zehn Läufen auf. In allen vier CI-Paaren fiel der Anstieg im zweiten Lauf größer aus, bei beiden Startreihenfolgen. Vor dem Klick lag dessen Prozessspeicher 102,6 bis 224,9 MiB unter dem ersten Lauf. Im ersten Fenster nach dem Klick lag er noch 88,4 bis 171,4 MiB darunter. Ein zusätzlicher Effekt des direkten Boss-2-Anflugs bleibt offen. Die tatsächliche Wartezeit auf der Abschlussseite war in allen CI-Paaren im ersten Lauf länger.

Der gemessene Audio-PCM-Puffer blieb in beiden Varianten bei 6,76 MiB. Der Bildcache zählte vor dem Klick in allen Läufen 13 Schiffsbilder und im Fenster nach 1,8–2,4 Sekunden 19. Nach 6,2–6,8 Sekunden befanden sich die CI-Szenen überwiegend noch in der Einführung, während das lokale Paar bereits Gegner-Einflug beziehungsweise Bosskampf erreichte.

Der Laborvergleich erfasst die ersten rund 7,2 Sekunden nach dem Klick unter Linux-WebKit. Der Auslöser für den Dokumentwechsel auf dem iPhone bleibt offen.

Als Nächstes den regulären Übergang zu Block 1 verwenden und den erzwungenen Suspend/Resume-Zyklus des bestehenden Audiokontexts beim Klick separat testen. Beide Varianten erhalten denselben Spielablauf und dieselben Assets. Gemessen werden die tatsächlichen Audio-Aufrufe und der Prozessspeicher. Separate erste Läufe pro Variante vermeiden die beobachtete Vermischung mit der Laufreihenfolge.

[CI-Läufe und Rohdaten](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/42359877954)

## Folgemessung zum Audio-Neustart

Vier CI-Paare und ein lokales Paar liefen unter Linux-WebKit auf der gleichen Spielbasis. Der vorhandene Pilot spielte die verkürzte Boss-1-Strecke und die reguläre Bonusrunde. Beide Varianten führten zu Level 2, Block 1. Die Audio-Freigabe blieb Teil des Klicks. In der Vergleichsvariante wurde nur der erzwungene Suspend/Resume-Zyklus für Effekte und Musik am Levelabschluss ausgelassen.

Jede Zelle enthält die PSS-Änderungen im selben Inhaltsprozess in den drei oben angegebenen Fenstern in MiB.

| Paar | Erste Variante | Mit Audio-Neustarts | Mit weiterlaufenden Audiokontexten |
| --- | --- | ---: | ---: |
| CI 1 | Neustart | +36,3 / +31,2 / +32,5 | +2,2 / +24,7 / +22,8 |
| CI 2 | Neustart | +35,3 / −116,9 / −45,1 | +35,5 / +22,7 / +36,2 |
| CI 3 | Weiterlauf | +89,3 / +146,4 / +144,4 | +20,2 / +41,1 / +40,7 |
| CI 4 | Weiterlauf | +34,9 / +16,1 / +33,0 | +17,1 / +32,3 / −47,5 |
| Lokal | Neustart | +101,8 / +136,2 / +139,6 | +100,8 / +110,1 / +111,4 |

Die native Aufzeichnung bestätigte am Klick zwei Paare aus Suspend und Resume im Kontrolllauf und keine dieser Operationen im Vergleich. Beide Audiokontexte liefen vor dem Klick und ihre Uhren liefen danach weiter. Auch die Position der Musik rückte nach Fortsetzen vor. Das betrifft die gemessenen Web-Audio- und Medienuhren im Labor.

Der frühe Anstieg trat in allen zehn Läufen auf. Die CI-Mediane lagen bei +35,8 MiB mit Neustarts und +18,6 MiB mit weiterlaufenden Kontexten. Drei CI-Paare zeigten ohne Neustarts einen kleineren frühen Anstieg. Im vierten Paar und lokal waren die frühen Werte nahezu gleich. In späteren Fenstern wechselte die Richtung des Paarunterschieds. Alle frühen CI-Messpunkte lagen in der Einführung ohne Gegner. Dokumentkennung, Zeitursprung, PID und Prozessstartzeit blieben pro Lauf gleich.

Als Nächstes den Wechsel von Planeten- und Sternfeldhintergrund am Levelübergang separat messen. Der Vergleich soll den höchsten absoluten Prozessspeicher vor und nach dem späteren Hintergrundwechsel erfassen. Der physische iPhone-Rücksprung bleibt offen.

[CI-Lauf und Rohdaten der Audio-Messung](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/42377262003)

## Folgemessung zum Planeten- und Sternfeldwechsel

Sechs CI-Paare und ein lokales Paar verwendeten den Labor-Build ohne Sternschnuppen und Felsasteroiden. Beide Varianten jedes Paars spielten über Boss 1 und die reguläre Bonusrunde zu Level 2, Block 1. Im Versuch hielt der ausgewählte Hintergrund den Stand aus Boss 1 für die ersten 2.000 Millisekunden der Simulation im neuen Block. Der Spielablauf verwendete sofort den neuen Block. Die DOM-Klassen bestätigen, wann die jeweiligen Hintergrundebenen tatsächlich wechselten.

Gemessen wurde das absolute Maximum des anteiligen Speichers im selben WebKit-Inhaltsprozess von 0,7 Sekunden vor bis 6,8 Sekunden nach „Fortsetzen“. Die Differenz in der letzten Spalte zieht die reguläre Spitze von der verzögerten ab.

| Ebene | Erster Lauf | Reguläre Spitze in MiB | Verzögerte Spitze in MiB | Differenz in MiB |
| --- | --- | ---: | ---: | ---: |
| Planeten | Regulär | 1.118,0 | 1.061,2 | −56,7 |
| Planeten | Verzögert | 1.087,0 | 1.125,3 | +38,3 |
| Sternfeld | Regulär | 1.118,4 | 1.076,2 | −42,1 |
| Sternfeld | Verzögert | 1.082,2 | 1.156,8 | +74,6 |
| Beide | Regulär | 1.113,5 | 1.033,4 | −80,2 |
| Beide | Verzögert | 1.089,5 | 1.109,7 | +20,2 |
| Beide, lokal | Regulär | 1.058,2 | 1.047,8 | −10,5 |

Die spätere Ebene wechselte in den CI-Läufen 2,9 bis 4,1 Sekunden nach dem Klick. Alle Fenster enthielten mindestens eine weitere Sekunde nach dem letzten Wechsel. Die gemessene Spitze war in jedem CI-Paar im zweiten Lauf niedriger. Der zweite Lauf hatte bereits vor dem Klick 34 bis 185 MiB weniger PSS. Lokal wuchs der PSS gegenüber dem jeweiligen Ausgangswert um 89,6 beziehungsweise 90,8 MiB. Eine reproduzierbare Senkung der absoluten Spitze durch den späteren Wechsel bleibt offen.

Die spielbare, geschützte Vorschau verwendet den regulären Wechsel. Der Vergleich misst die Hintergrundverzögerung unter Linux-WebKit. Die direkte Speicherwirkung der beiden entfernten Elemente und der iPhone-Rücksprung bleiben offen.

[CI-Lauf und Rohdaten der Hintergrundmessung](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/42381499896)
