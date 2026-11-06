# Geprüfte Verbesserung: kleinere Sockelquellen für Chromium

Konkrete Laufzeitänderung, noch nicht veröffentlicht: Commit9d044e0231d40b7df60d1090e47c7148f9be80f7, Baum500024af7dd63a04610eebfa6b1ae98951978c86, Branchcodex/socket-surface-20261106. Nur frontend/src/pages/bossWeaponRenderer.ts ändert sich im Frontend. Backend/API/Assets/private-preview/vercel.json sind gegenüber87f5dc28d1cb5054c0e40420848068eb0a156e56 SHA-identisch; die CI prüft alle übrigen Frontend-Einträge ebenfalls. Auto-Deployment bleibt abgeschaltet.

Die feste Sockelquelle reserviert unter erkanntem Chromium nur den benötigten rechten/unteren Bereich mit2Rasterpixeln Reserve. Rasterursprung, Matrix, Auflösung, sichtbare Zielcanvas und alle Waffen-/Wärme-/Rückstoß-/Blitz-/Kampfdaten bleiben gleich. Keine neue Bilddatei, Schleife, Timer oder Qualitätsreduktion. Bereits vorhandene Quellfreigabe und Wiederaufbau bleiben erhalten.

## Abgeschlossene Prüfungen des endgültigen Quellstands

- CI42167710385 /Job127727941468:9Browsergrenz-/Freigabe-/Fehler-/Wiederholungsfälle und2100exakteRGBA-Vergleiche bestehen:700CPU,700Chromium151,700WebKit26.5. Je alle50Originalatlanten, zwei Größen und sieben Waffen-/Quellzustände. Chromium muss kleinere Quellen haben, WebKit muss Originalgröße behalten. Keine Bildtoleranz gelockert und keine Screenshots gespeichert.
- CI42167710416 /Job127727941486:539bestehendeFrontend-Release-Tests mit0Fehlern, TypeScript und Vite bestehen. Der vollständige nachfolgende Tracked-Source-Diff ist leer. Keine vollständige Kampagne, kein physischer Handytest, kein Backend-Rerun oder Projekt-Lint behauptet.
- Originalartefakt13480270718 /3167Bytes /SHA25647da28ef41c8443467cbbecb7ec4c4bfa82b7788bbae4e1713c776ca56c1549b unabhängig entpackt, Integrität, Commit/Baum,3×50Ergebniszeilen und jeweilige700Fälle nachgerechnet.

## Messbare, eng begrenzte Einsparung

Bei390pxAnsichtsbreite ergeben die50Boss-Konfigurationen als Katalogsumme31.719.256Byte vorher und16.152.520Byte nachher für diese zusätzliche RGBA-Sockelquelle:49,0766Prozent weniger, je Boss42,67–58,92Prozent. Die50Bossflächen existieren nicht gleichzeitig; dies sind keine15MiB freier Spiel-RAM und kein49Prozent geringerer Gesamtbrowserverbrauch. Tatsächliche Prozess-/GPU-/Smartphone-RAM-Einsparung nicht aus diesen logischen Rastergrößen ableiten. Die sichtbare Zielcanvas wird nicht verkleinert.

WebKit/Safari und iOS-Chrome sowie unbekannte Browser behalten den bisherigen Zeichenweg. Für sie ist die gemessene Einsparung dieser Änderung0. Kein bestätigter historischer White-Screen-Fix, insbesondere kein behaupteter iPhone-Fix. Keine Veröffentlichung, kein Merge oder Aliaswechsel.

## Ausgeschlossene Vorstufen

Der lokale verschobene Rasterursprung wird verworfen: ein Farbkanal um1abweichend bei Boss1/390px. Der ungefilterte Nullursprungsentwurf b56cf78d und reine Diagnose49338de bestehen jeweils CPU/Chromium700, scheitern aber in WebKit schon im ersten Fall. Die Diagnose sieht4abweichendeQuellkanäle und2Zielkanäle (einPixel, maximal1einschließlichAlpha). Daher WebKit-Originalpfad statt Toleranzlockerung. ErsteArchive: CI42167025515/Artefakt13478924832,2842Bytes/SHA2560fb5d4839ccf9a6f29cfa620e10d485f4b86e409b05188b6426d22301b0296fd; CI42167346120/Artefakt13479511465,2926Bytes/SHA2569a013626253b54c9cf3db1aaf34c1be72be42cf22cfddd33352af9186df5ec68. Der früher erfolgreiche Build42167183693 ist nicht die Abnahme des endgültigen Browserguards.

Die CPU-Prüfung besitzt einen expliziten HTML-Nullgrößenadapter, weil @napi-rs/canvas0.1.100 den Wert0 anders behandelt. Sie ist keine native Freigabemessung; die Browserprüfungen kontrollieren echte HTMLCanvas-Nullgrößen. Das nicht verwendete Ergebnisfeld maxLiveSourceBytes in den Rohdaten ist ein Platzhalter und wird nicht als Messung ausgewertet. Ausgewertet werden allein die tatsächlich erfassten Quellflächengrößen je Boss.

Fortsetzung: Diesen getesteten Kandidaten bei weiteren Änderungen erhalten; Hauptproblem WebKit-private Bestände und iPhone-Abbruch bleibt offen. Keine neuen manuellen Handytests allein zum Nachmessen derselben bekannten Symptome anfordern. Die Kandidatenquelle ist separat reviewbar, der native Analysebranch behält seine ursprüngliche Runtime als Referenz.
