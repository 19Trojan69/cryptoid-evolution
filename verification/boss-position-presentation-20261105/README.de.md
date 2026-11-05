# Boss-Positionierung: begrenzte Machbarkeitsprüfung

Der eingefrorene Boss-Rumpf setzt seine laufende und fallende Position über
`left` und `top`. Der vorhandene Projektilrenderer verwendet bereits unabhängiges
`translate`. Diese neue, getrennte Hypothese lautet: Dieselbe Bossposition lässt
sich ohne fortlaufende Layoutarbeit darstellen. Das ist weder eine nachgewiesene
Speicherursache noch ein White-Screen-Fix.

Nur ein virtueller, bytegenau rückführbarer Kandidat wird vorbereitet. Beide
Positionsdeklarationen werden ersetzt; Simulation, Kollisionskoordinaten, Breite,
Höhe, vorhandener `transform`, Fallanimation, Grafik, Ton und Uhren bleiben im
Quelltext unverändert. Die tatsächlichen Frontend-Dateien werden nicht editiert.

Zuerst prüft ein kleiner nativer Geometriefall in Chromium und WebKit den
Unterschied zwischen Layout-Koordinaten und Transform-Koordinaten. Die Kandidaten-
Darstellung muss in beiden Engines für sämtliche Rechteckkoordinaten des Besitzers
und seines Kindes exakt gleich sein. Vier bestehende Transformkombinationen sowie
positive, negative und gebrochene Positionen werden berücksichtigt. Der Kandidat
übernimmt ausschließlich die ursprünglichen Koordinaten. Es gibt keine selbst
festgelegte Rundung, keine Anpassung an eine interne Browser-Rastergröße und keine
nachträglich als Gleichheit ausgegebene Toleranz. Diese konservative Gleichheits-
prüfung folgt dem Benutzerauftrag, die Darstellung zu erhalten; sie ist keine
behauptete allgemeine Webstandard-Abnahmeregel.

Nur bei bestandener Geometrie wird in Chromium der native Layoutzähler für einen
synthetischen Positionswechsel verglichen. Die dazu absichtlich erzwungenen
Geometrie-Lesezugriffe gehören ausschließlich in diese kleine Diagnose, nicht ins
Spiel. Das ist kein aktiver Spielablauf, kein realer RAM-/Temperatur-/FPS-Vergleich,
kein vollständiger Grafik-/Pixelnachweis und kein physischer Handytest. Ein
Fehlschlag stoppt diesen Kandidaten vor einem weiteren Spiel-/Langtest.

Die Simulatorserie bleibt beendet. Diese Prüfung verwendet ausschließlich den
vorhandenen Linux-Browseraufbau und ändert keine Bereitstellung.

Primärquellen:
- https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion
- https://webkit.org/web-inspector/layers-tab/

Die interne LayoutUnit-Implementierung eines Browsers wird ausdrücklich nicht als
Webstandard oder Rechtfertigung für eine eigene Positionsrundung verwendet. Gemäß
Besitzeranweisung vom 05.11.2026 werden nur passende dokumentierte Empfehlungen
verwendet. Es gibt kein selbstgewähltes prozentuales RAM-Einsparziel, keine aus
Fremdgeräten abgeleitete allgemeine Speichergrenze und keinen neuen Handy-Dauertest.
