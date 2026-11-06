# Kleinere interne Boss-Sockelflächen bei unveränderten Ausgabepixeln

Der Kandidat ändert ausschließlich bossWeaponRenderer.ts (Chromium-Pfad): Die zusätzliche
Canvas mit den festen Waffensockeln reserviert nicht mehr die leeren rechten
und unteren Endbereiche der vollständigen Waffenfläche. Zwei Rasterpixel
Sicherheitsrand bleiben. Ursprung (0,0), Matrix, Quellauflösung, sichtbare
Zielcanvas, Waffen-/Hitbox-/Hitze-/Rückstoß-/Blitzzustände und Zeitabläufe bleiben.
Die bestehende Freigabe und Wiederherstellung nach Konfigurations-/Größenwechsel
oder Quellenfreigabe wird weiter benutzt. Keine neue Schleife, kein Timer,
keine neue Ressource oder Bilddatei. Vercel-Autodeployment bleibt aus.

Der erste lokale Entwurf mit verschobenem Rasterursprung wurde verworfen:
Boss1/390px hatte einen um1 abweichenden Farbkanal. Der endgültige Entwurf
behält den Rasterursprung und beschneidet nur leere Endbereiche. Die Bedingung
bleibt exakte Gleichheit aller RGBA-Kanäle, ohne gelockerte Toleranz.

Vorab bestehen lokal84 Vergleiche der sechs verfügbaren Originalatlanten mit
@napi-rs/canvas0.1.100. Die vollständige CI prüft alle50 Originalatlanten mit
700 Vergleichen je CPU/Chromium/WebKit: zwei Größen, intakte/wiederholte/heiß
beschädigte/rückstoßende/gefrorene/zerstörte/neu aufgebaute Zustände. Prüft
Quellenwiederverwendung, unveränderten Kampfdatenbestand und Freigabe nach Ende.
CPU-Nullgrößenadapter ist ausdrücklich keine native Freigabemessung; tatsächliche
HTMLCanvas-Nullgrößen werden separat in beiden Browsern geprüft.

Die Bytewerte beziehen sich ausschließlich auf die logische Fläche dieses
zusätzlichen Sockel-Canvas. Katalogsummen sind kein gleichzeitiger Spielbestand.
Keine Gesamt-RAM-, GPU-, Smartphone- oder White-Screen-Fix-Behauptung. Keine
vollständige Spiel-, physische Geräte- oder Veröffentlichungsgenehmigung aus
den Pixeltests ableiten. Originale Referenz:87f5dc28d1cb5054c0e40420848068eb0a156e56.
Der Test verwendet die tatsächlichen Rendererquellen und Originalatlanten;
lediglich TypeScript-Typen und Imports werden für die kontrollierte Hostausführung
entfernt. Kein Nachbau des eigentlichen Zeichenalgorithmus.

## Nach der nativen Gegenprüfung

Der ungefilterte Entwurf b56cf78d7c4df8e47463be1017f5fec9b3888631 und die
unveränderte Diagnose49338de16e686466e1b3774a9e164ffce9058508 sind NICHT
browserübergreifend akzeptiert. CI42167025515 und42167346120 bestehen jeweils
700CPU- und700Chromium-Vergleiche; WebKit scheitert schon an Boss1/390px.
Die genauere Prüfung sieht4 abweichende Quellkanäle und2 Zielkanäle an einem
Pixel (maximale Abweichung1, einschließlich Alpha). Es liegt bereits an der
Rasterung der anders großen Quelle, nicht nur am späteren Kopierschritt.

Der endgültige Kandidat begrenzt die Quelle daher nur für ausdrücklich erkannte
Chromium-UA-Tokens. Safari/WebKit, iOS-Chrome-Tokens und unbekannte Browser
behalten die vollständige Originalfläche. Es gibt keinen neuen Test-/Readback-
Vorgang im Spiel. Die exakte RGBA-Bedingung wird nicht gelockert: für WebKit wird
zusätzlich die originale Flächengröße geprüft. Neun separate Fälle prüfen die
Browsergrenze, Wiederverwendung, fehlenden Kontext, Freigabe und Wiederaufbau.

In den50Chromium-Konfigurationen bei390px sind31.719.256Byte vorher und
16.152.520Byte nachher als Katalogsumme der zusätzlichen Sockelflächen gemessen,
49,08Prozent weniger (je Boss42,67–58,92Prozent). Diese50Flächen liegen NICHT
gleichzeitig im Spielspeicher. Die sichtbare Zielcanvas und ihre Pixelzahl sind
unverändert. WebKit erhält daraus KEINE behauptete Reduktion.

Die vorherige Integration2ac8ae21735da405e9d3248a311fa19e00369830 besteht
CI42167183693/Job127726262071: bestehende Frontend-Release-Tests, TypeScript,
Vite und abschließender vollständiger Tracked-Source-Diff. Der Rendererinhalt
ist dabei identisch mit b56cf78d; diese Integration ersetzt die ausstehende
erneute Prüfung des endgültigen Browserguards nicht.
