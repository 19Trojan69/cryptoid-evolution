# Special Mission: organische Raumgegner und Augenreaktor

15. Oktober 2026. Ergänzung zur Referenzdokumentation; ersetzt deren frühere Angaben zu SVG-Gegnern und zum mechanischen Waffenatlas in dieser isolierten Vorschau.

Branch: `codex/insect-boss-generation-20261015`. Unveränderter Ausgangspunkt e554e7ad51d20068e8efd1ad03715e918a509aac. Zusätzliche Sicherung direkt vor diesem Grafikschritt: `backup/special-mission-before-organic-art-20261015`, GitHub 7a299816b4581bc1596a56632417a2cbc85b8fb2, lokaler äquivalenter Commit 6c26d73b12f59b820e9f7c27dfbadc6032c15d34; gleicher Baum 210da2a04ad28c272cae9a99f44ead18dca5cb5a.

## Darstellung

20 einzeln generierte, transparente realistische Raumgegner ersetzen die Code-SVGs. Keine bloßen Umfärbungen. Chitinplatten, Facettenaugen, integrierte Mandibeln, Stacheln und Waffenorgane, passende dunkle Metalloberflächen. WebP maximal 256×256, zusammen 635524 Byte, jede Datei unter 38 KB. Die Original-PNGs bleiben separat erhalten. Zuordnung und Prüfsummen: special-mission-organic-assets-2026-10-15.json.

Eine separat generierte Chitin-Stachelkanone folgt exakt den vorhandenen vier Waffenpositionen, Rotationswinkeln, Größen, Rückstößen und Zerstörungszuständen. Keine neue Ziel- oder Feuerlogik. Beschädigungen zeichnen lokale heiße Risse, zerstörte Waffen hinterlassen beschädigte Sockel. Bestehende Schadens- und Feuerwerte bleiben gleich.

Der zentrale Reaktor ist jetzt ein generiertes grünes Facettenauge. Zwei gepanzerte Augenlider öffnen sich in den ersten 900 ms nach der Zerstörung der äußeren Waffen. Erste Kernwaffenwarnung weiterhin 1800 ms. Die Pupille lädt sichtbar auf und ist die tatsächliche Abschussposition, nur für den ausdrücklich aktivierten Insektenboss. Alle alten Bossmündungen bleiben unverändert. Das Auge bleibt nach dem ersten Schuss offen. Bestehende Reaktor-Trefferzone und HP bleiben erhalten.

13 vorbereitete 144×192-Augenbilder pro aktuellem Boss, maximal 1437696 Byte RGBA. Wiederverwendung im Kampf; Freigabe auf 1×1 und Leeren der Liste beim Unmount. Acht Artenprofile (Mantis, Libelle, Wespe, Käfer, Motte, Spinnenaugen, Skorpionaugen, Hornisse) beschreiben spätere Unterschiede. Aktuell nur das Mantis-Auge in der einen spielbaren Referenzmission: keine Behauptung von 50 fertigen Augen oder Bossen.

Navy-/Champagnerfarben, metallischer kompakter HUD, Original-Spielerschiff und Erdplanet aus Cryptoid. Für die Vorschau wird der bestehende Planet separat auf 640×640 WebP vorbereitet, 124376 Byte. Original-PNG unverändert. Hintergrund inklusive 46 Sternen nur beim Resize in ein Bitmap zeichnen; pro Frame ein Hintergrund-Draw. Keine großen Blurfilter. Kanone 15512 Byte, Augenquelle 29442 Byte. Zusätzliche Dekodierung beendet, bevor Start verfügbar ist. Kein Nachladen von Gegnern im laufenden Kampf.

## Promptvorgaben

Jedes der 20 Schiffe wurde einzeln mit Imagegen erstellt: ein symmetrisches realistisches biomechanisches Insekten-Kampfraumschiff, vollständig von oben, Front nach unten, echte transparente RGBA-Freistellung, dunkle Chitin-Metallpanzerung, körperintegrierte Waffen, aggressive Energiesäume, hochwertiges 3D-Material, kein Comic, keine Schrift, keine Umgebung. Individuelle Themen in Reihenfolge der Dateinummern:

1. Acid Drone: kompakter lindgrüner Skarabäus.
2. Needle Wasp: schlanke gelbe Wespe mit Nadelstacheln.
3. Mantis Scout: smaragdgrüne Fangschrecke mit Sichelarmelementen.
4. Cyan Skimmer: cyanfarbene Libelle mit vier Flügelsegmenten.
5. Violet Weaver: violettes Spinnenraumschiff mit gegliederten Auslegern.
6. Ash Moth: orange Motte mit breiten Panzerflügeln.
7. Venom Pincer: giftgrüner Skorpion mit Zangenwaffen.
8. Ion Crawler: blauer Tausendfüßer mit mehrteiliger Panzerung.
9. Ember Hornet: rotorange Hornisse mit Stachelkanonen.
10. Obsidian Borer: dunkler Rüsselkäfer mit Magenta-Energie.
11. Caustic Sentinel: schwerer grüner Nashornkäfer.
12. Sulfur Lancet: gelbe Nadelwespe mit langer schmaler Front.
13. Razor Harvester: karminrote Fangschrecke mit gezahnten Armen.
14. Rift Darter: eiscyanfarbene Kleinlibelle.
15. Neon Recluse: magentafarbene Spinne mit Klauen.
16. Dusk Wing: violette Nachtmotte.
17. Toxic Executioner: bernsteinfarbener schwerer Kaiserskorpion.
18. Plague Conveyor: mintfarbener gepanzerter Gliederfüßer.
19. Furnace Vespid: schwere Hornisse mit glutorangefarbenem Energiekern.
20. Void Drill: amethystfarbener Bohr-Rüsselkäfer.

Kernasset: einzelnes grünes Insekten-Facettenauge als mechanisch-biologische Reaktorwaffe, ovales vertikales Gehäuse, giftgrüne hexagonale Facetten, zentrale dunkle Waffenpupille, dunkler Chitinmetallrand, vollständige Draufsicht und echte Transparenz. Lider werden unabhängig im Code animiert.

Kanonenasset: einzelnes langes biomechanisches Chitin-Stachelgeschütz als Insektenkörperteil, Basis oben, Abschussöffnung unten, dunkle realistische Metallpanzerung, grüne Energierippen, orthografische Draufsicht, keine Basisplatte oder Umgebung, echte Transparenz. Rotation wird im Spiel berechnet.

## Prüfungen und Grenzen

- 388 bestehende Frontend-/Sprach-/Spieltests bestanden; zusätzlicher Augenmündungstest bestanden (389 insgesamt).
- Produktions-Build und separater Vorschau-Typecheck erfolgreich. Vorhandene große Produktionschunks bleiben als Buildhinweis bestehen.
- Reale Komponenteneffekte im Node-Host mit nativer Canvas: alle 20 neuen Rasterbilder und alle übrigen Quellen erfolgreich dekodiert, 13 Augenframes wiederverwendet und freigegeben, Pause/Background, wiederholter Start/Stop, ein RAF-Owner und null verbleibende Listener/RAF. Spielbild und geschlossene/halboffene/offene Lider visuell geprüft.
- Simulation der neun Vorrunden, aller 20 Gegnertypen, Turrets, Kern, Explosion, Herz und Bonus auf 320×568, 390×760, 768×920 erfolgreich. Der Testpilot besitzt zusätzliche Leben; kein Nachweis menschlicher Fehlerfreiheit.
- Fairnessprüfung nach veränderter Augenmündung: 63 Szenarien auf sieben Viewports erfolgreich. 112 px Mindestkorridor einschließlich 46 px Spielerbreite. Beispiel 390×760: Körperfreier Spielerzentrum-Bereich x=30…360, y=380…691,6; maximaler Rumpfboden 282,2. Freier Raum und Trefferflächen unverändert. Aufgezeichnete Routen bei festem Ziel beweisen nicht jede adaptive menschliche Bewegung.
- Vollständige alte GamePage-Simulation: neuer Referenzkampf und anschließend 30 normale Blocks / drei alte Bosse; null RAF-, Timer- oder Listenerreste.
- Keine echten iPhone-, Android- oder Pi-Browser-Messungen, kein GPU-FPS-Nachweis. Browser-/OS-Prozessabstürze können nicht garantiert ausgeschlossen werden. Keine dauerhafte Wiederherstellung nach Prozessverlust implementiert.

Nur private Vorschau. Keine Hauptspiel-, Karten-, Kauf-, Zahlungs-, Account-, Speicherstands- oder Datenbankänderungen. Keine öffentliche Testnet-/Mainnet-Veröffentlichung oder Zusammenführung in main. 49 weitere Bossbegegnungen bleiben gesperrt bis Referenz- und reale Gerätetests abgeschlossen sind. Der endgültige neue Spielname ist weiterhin offen; Internet-Nichtexistenz kann nicht garantiert werden.
