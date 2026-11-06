# Kleinere interne Boss-Sockelflächen bei unveränderten Ausgabepixeln

Der Kandidat ändert ausschließlich bossWeaponRenderer.ts: Die zusätzliche
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
