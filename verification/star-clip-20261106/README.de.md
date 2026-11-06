# Unsichtbaren Sternenrand begrenzen, sichtbare Pixel bewahren

Konkreter Darstellungs-Ressourcenversuch nach der passiven nativen Zuordnung. Die zwei originalen SVG-Sternenflächen sind größer als ihr sichtbarer übergeordneter Bereich. Ihre originalen Transformationen sind ausschließlich translate3d bis7/-5px beziehungsweise-11/8px. Ein zusätzlicher Clip12px außerhalb der unveränderten SVG-Layoutbox deckt daher den ganzen durch die vorhandenen Bewegungen sichtbaren Bereich mit Reserve ab. Originale Keyframes und CSS-Hash werden exakt geprüft.

Die einzige interne CSS-Variante lautet clip-path:inset(-12px) border-box an starfield-stars. Keine Änderung an Sternendaten, ViewBox, Größen, Farben, Bewegungen, Ton, Simulation oder Spielcode. Die gesamte tatsächliche CSS-Kaskade und beide tatsächlichen SVGs werden aus einer originalen pausierten9f3-Szene übernommen und anschließend in einer getrennten Fixture geprüft. Keine Bildschirmbilder werden als Dateien gespeichert.

Chromium/WebKit, vier Hoch-/Quer-/Desktopgrößen, DPR1/3, vier getrennte Endkombinationen und ein Zwischenpunkt, System-/Einstellungs-Reduced-Motion:56 Fälle pro Engine. Native Screenshots werden im Browser verlustfrei dekodiert; jede einzelne abweichende sichtbare RGBA-Komponente führt zum Fehler. Rechtecke und Transformationen müssen ebenfalls gleich bleiben. Dies ist eine reale Sternen-SVG-/Kaskadenprobe, keine vollständige Kampagnen-/Spiel-Pixelabnahme.

WebKit liefert zusätzlich die unveränderte LayerTree-Backing-Store-Schätzung für beide SVGs im repräsentativen430×825/DPR3-Fall. Diese Schätzung ist weder Prozess-PSS noch physischer Telefon-/GPU-Verbrauch und darf nicht hochgerechnet werden. Fehlt die Zuordnung beider SVGs, gilt kein Ressourcenvergleich. Auch pixelgleiche Varianten werden ohne brauchbaren Ressourcennachweis nicht als Speicherfix ausgegeben.

CSS Masking1 beschreibt die Referenzbox bei basic-shape/clip-path; tatsächliche Unterstützung wird je Engine geprüft: https://drafts.csswg.org/css-masking-1/#the-clip-path

Originale Runtime-Bäume und Vercel-Konfiguration bleiben gleich; kein neues Deployment, Merge, Aliaswechsel oder Handytest.
