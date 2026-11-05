# Einzelne Hintergrundfläche: erster interner Vergleich abgeschlossen

CI https://github.com/19Trojan69/cryptoid-evolution/actions/runs/42110696282, Job 127537151741: success.
Quelle dace335f944d25734464fb68890dc07f8fa50838, Baum f50e24d0eb4c004dc5ef4d642aab4353f42066f7.
Original-Artefakt 13455310697, 49.045 Bytes, SHA256 97c336ffa3f03ed7c44149347bb5aac4eba2a61beb9745a4051d493f40d4dbe8. Alle sechs ursprünglichen Mitglieder sind unverändert im ZIP. analyze.py prüft ZIP-Hash, alle PSS-/Prozesssummen, Quellen, normalen Export und den tatsächlich berechneten Zustand der einen Fläche. Die vollständige unabhängige Nachrechnung enthält alle neun Phasen.

Getestet werden zwei frische Linux-WebKit-26.5-Prozesse auf demselben Runner, Playwright 1.62.1, identisches offizielles Container-Abbild, 430×825 CSS-Pixel/DPR 3. Kontrolle zuerst, danach absichtlich nur .game-route .milky-band ausgeblendet. Gleicher kompilierter Spielcontroller, gleiche originale Grafik-/Tondateien, gleiche Simulation; die zweite Darstellung ist bewusst unvollständig und ausschließlich zur Diagnose bestimmt. Kein verwendbarer Grafikpatch.

| Phase | Kontrolle PSS Mittel MiB | Fläche ausgeblendet PSS Mittel MiB | Differenz MiB |
|---|---:|---:|---:|
| leer | 358,244 | 346,184 | -12,060 |
| Menü | 466,597 | 452,314 | -14,283 |
| vorbereitetes Menü | 525,631 | 509,868 | -15,763 |
| Szene aufgebaut und pausiert | 883,593 | 838,136 | -45,457 |
| aktive Szene | 1162,107 | 994,339 | -167,768 |
| Home nach Testbrückenfreigabe | 1123,820 | 1065,231 | -58,589 |
| nach Navigation auf leere Seite | 1104,999 | 1047,744 | -57,254 |
| neuer Kontext nach echtem Kontextschluss | 372,671 | 373,519 | +0,848 |

Die aktive Phase umfasst je 15 gespeicherte Prozesspunkte. Bereiche 1035,136–1224,573 gegenüber 960,687–1037,284 MiB; sie überlappen gering. Das ist keine vollständige Spitzenerfassung zwischen den Messpunkten. Die native Kategorie other liegt aktiv im Mittel um rund 152,089 MiB niedriger; sie ist weiterhin eine Restgröße und kein einzelner Speicherbesitzer.

**Materielle Vergleichsgrenze:** Die erste aktive Aufnahme beginnt in der Kontrolle bei 15.536 ms aktiver Stoppuhr, im anderen Arm bei 8.129 ms. Ende bei 30.832 beziehungsweise 24.204 ms. Kernsalven steigen von 1 auf 3 beziehungsweise 1 auf 5. Somit sind die beobachteten aktiven Spielphasen und Arbeitsmengen nicht gleichgesetzt. Schon der vorbereitete Menügrundwert unterscheidet sich um 15,763 MiB, bevor die Unterdrückung eingesetzt wird. Das ist ein einzelnes instrumentiertes unseeded Paar mit fester Reihenfolge und keine replizierte kausale Speicherabnahme. Eine nachträgliche Basiswertsubtraktion oder Quotierung macht diese Unterschiede nicht zu einer gemessenen Einsparung.

Die sichtbare Fläche hat in der Kontrolle display:block, blur(11px), opacity:0.88 und ein transformiertes Rechteck von rund 1513,94×1771,80 CSS-Pixeln. In der Diagnosebedingung ist exakt die eine Fläche display:none; ihr Filterwert bleibt blur(11px). Diese Rechtecke sind keine tatsächlichen GPU-Pufferbytes. Die Prüfung benutzt keine neuen periodischen aktiven Inspektionen, Spieltimer oder Frames und keine erzwungene GC. Die ursprünglichen Collectorbedingungen sind in beiden generierten Treibern vollständig bytegleich rückgewinnbar; CI-Quellenschutz vor/nach dem unveränderten Build besteht.

Die beiden Arme beenden normal und exportieren regulär. Vollständige Journaluhr passt bei ID/Quelle/mode/elapsedMs; laufgebundener Ressourcenpunkt passt. Alle nativen und Host-Prozessdaten bleiben erhalten. Die eine nichtkritische native Druckmeldung in der Kontrolle und keine im anderen Arm sind Momentbefunde, kein Nachweis physischen Handy-Speicherdrucks.

Entscheidung: Die große weichgezeichnete Hintergrundfläche ist eine konkrete weitere Prüfspur, aber weder als alleiniger hoher Grundverbrauch noch als White-Screen-Ursache nachgewiesen. Bevor daraus ein unverändert aussehender Renderingpatch folgt, muss ein gezielter Vergleich den Start in derselben aktiven Spielphase und die Umkehr der Reihenfolge berücksichtigen. Keine pauschale Entfernung von Sternen/Planeten/Effekten und kein weiterer unveränderter Besitzer-Dauertest.

Kein neuer Lauf nach diesem abgeschlossenen Paar gestartet. Kein Deployment, Merge, Aliaswechsel oder Zugriffsabbau. Keine neue Handyversion bereitgestellt. Originale Spielquellen und vercel.json behalten ihre vollständigen Git-Objekt-IDs. Der mobile White Screen bleibt unbehoben; auch dieses positive Einzelresultat wird nicht als Fix ausgegeben.
