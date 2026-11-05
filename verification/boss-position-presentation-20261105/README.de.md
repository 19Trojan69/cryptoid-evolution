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

## Tatsächlich abgeschlossene kleine Prüfung

Quelle `76065b260e9fc8cdfad377c8c3d0f1d95e01ce6f`, Baum
`8727461a808f26262453712eba24c562499eb8b7`,
[CI 41992899988](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41992899988).
Beide Jobs bestehen die zwei Prüfungen des exakt reversiblen Quelltransforms.
Die eigentliche Geometrieprüfung wird in beiden Engines tatsächlich ausgeführt,
verfehlt aber ihre zuvor benannte projektspezifische exakte Gleichheit. Beide
Jobs bleiben im Original rot, keine Umwertung.

| Engine | Fälle | Exakt gleiche Rechtecke | größte native Differenz |
| --- | ---: | ---: | ---: |
| Chromium 151.0.7922.34 | 696 | 0 | 0,01557159423828125 CSS-px |
| Linux-WebKit 26.5 | 696 | 0 | 0,01556396484375 CSS-px |

Die Werte betreffen Rechtecke eines synthetischen Elements und seines Kindes.
Ein kompletter Pixel-/Grafikvergleich wurde nicht durchgeführt. Die kleine
Subpixelabweichung beweist weder einen sichtbaren Grafikfehler noch eine falsche
Standardempfehlung oder einen White-Screen-Auslöser. Der vorgesehene nachfolgende
Layoutzähler-Vergleich wurde wegen des engen Geometrie-Gates nicht ausgeführt.
Somit kein gemessener RAM-/CPU-/FPS-Vorteil. Kein ursprünglicher Spielzyklus,
keine physische Geräteabnahme, kein neuer Link, kein Deployment.

Die Idee wird nicht als Fix übernommen und nicht mit einer eigenen festen Rundung
zum Bestehen gebracht. Aktuelle verbindliche Arbeitsweise:
[Dokumentierte Entwicklerempfehlungen](../stability-cause-audit-20261105/DEVELOPER-GUIDANCE.de.md).
Die beiden Original-ZIPs, Einzeldateien, Hashquittungen und Grenzen der Auswertung
liegen unter evidence/; frühere Simulatorfehlschläge bleiben unberührt.
