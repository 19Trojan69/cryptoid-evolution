# Cryptoid Evolution: sieben Pakete vom 9. Oktober 2026

Ausgangsstand: `13318c0`, einschließlich aller Profil-, Avatar-, Sprach- und Menüverbesserungen gegenüber `main`. Neuer Arbeitsbranch: `codex/seven-packages-20261009`.

## Änderungen

1. **Zahlungen/CSV:** unbegrenzter gefilterter Servercursor, UTF-8/BOM und CSV-Absicherung beibehalten; dauerhaft nutzbare Speichern-/Teilen-Aktionen nach Blob-Download. Produkt, Menge, Benutzer, UTC-Kaufzeit, Wallet-Eingang und historische USD-/EUR-Kaufkurse getrennt. Kursstatus, Quelle und Zeitstempel dokumentiert. Zeitnahe Mainnet-Kursaufnahme verwendet belegte Anbieterzeitstempel (maximal 5 Minuten vor dem Kauf), direkte USD-/EUR-Angebote, keine appseitige FX-Berechnung. Alte Kurse fehlen ehrlich. Test-Pi erhält keinen Geldwert. Einmal gespeicherte Kaufkurse bleiben unverändert; auch vorhandene manuelle Wallet-Bewertungen werden nicht überschrieben. Aktuelle Zahlungsberechtigungen unverändert.
2. **Menüs:** alleinige aktive Themenmarkierung unabhängig von Fokus/Hover. Gemeinsame metallische Menüflächen, markante Überschriften, sichtbare Zurück-Navigation. Keine allgemeinen Eingriffe in Bildgröße oder Bildausschnitt.
3. **Bosse:** unbeschädigte metallische Geschütze/vollgrüne Vorschauanzeigen; echte Kampfwerte bleiben erhalten. Begrenzter Reaktorpuls folgt dem tatsächlichen Geschossfarbwert. Karten nutzen weiterhin balkenfreie Composites.
4. **Flotte:** Suchleiste/Auswahlmenü entfernt. Direkte Liste aller Shopmodelle bzw. eigener Hangarschiffe; individuelle Farbe/Stufe, Kauf/Ausrüstung und passende Shopverweise. Namensgebende Rot-/Gold-/Grünakzente bleiben beim Rumpfwechsel erhalten. Dieselbe Farblogik in den drei Stufen, im Spiel und im Kartenexport; keine Änderung gespeicherter Besitz-/Farbindizes.
5. **Karriere:** acht originale SVG-Dienstgradabzeichen, einheitlich in Rangübersicht, Profil, Kopfzeile, Karriere und Rangliste. Bestehende Rangnamen/Schwellen bleiben unverändert. Karriereinstrumente, nächster Rang, eindeutig bezeichnete Karrierestufen und tatsächliche Sammlungs-/Kettenmeilensteine. Konto-ID als untergeordnete Details.
6. **Top 100:** Career-Listen nach kumulierten abgeschlossenen Missionen, V2 nach gespeichertem Missionshöchststand einschließlich Checkpoints, Legacy nach altem `bestScore`. Nur Beschriftungen/Darstellung geändert, keine Punktwerte/Sortierfelder neu berechnet. Das alte Archiv besitzt keinen belegten Netzwerk-/Lauflevelbezug; dies wird erklärt. Eigene Einträge markiert, fehlende Angaben ehrlich dargestellt.
7. **Community:** vorhandene MongoDB-Sammlungen weiterverwendet. Alle Kategorien unterstützen beide Daumenrichtungen mit genau einem Datensatz je Nutzer/Beitrag/Netzwerk; Rücknahme speichert den neutralen Wert. Sortierung nach Nettostimmen. Vorherige Fassungen aktualisierter Sternebewertungen zusätzlich archiviert. Profilverknüpfungen, datierte Admin-Antworten und mobiler Stil ergänzt.

## Prüfung / Freigabestatus

Backendbuild, Frontendbuild, TypeScript und Übersetzungsreleasegate bestanden. Alle 19 Sprachen bleiben auswählbar; die fünf vollständigen Kataloge DE/EN/ES/ZH/VI decken die neue Oberfläche vollständig ab. Übrige bestehende Kataloge und ihr englischer Fallback bleiben erhalten.

73 Backendtests, 215 Frontendtests und 12 Sprachtests bestanden. Lint bestanden. Ein zusätzlicher echter Express-Endpointtest exportiert alle 83 passenden Zahlungen, also mehr als drei Ergebnisseiten, und prüft Statusfilter, Netzwerkfilter, UTF-8-BOM, Sonderzeichen und Downloadheader. Alle acht Abzeichen wurden gerendert und visuell kontrolliert. Die bestehende Integrations-Renderprüfung aller 50 Bosse lief erfolgreich durch; sie ersetzt keine Prüfung der Animation im Browser.

Der Cloud-Browser kann den lokalen Previewserver nicht erreichen. Praktische Prüfung von Navigation, Scrollen, Auswahl und Download auf der neuen Testnet-Version steht daher noch aus. Echte Pi-Zahlungen und angemeldeter Pi-Browser-Download sind durch die lokalen Tests nicht bewiesen.

**Veröffentlichung blockiert:** Die automatische Freigabeprüfung hat den GitHub-Push abgelehnt, da er neuen Quellcode im öffentlichen Repository veröffentlicht und dafür keine ausdrückliche Freigabe erkannt wurde. Der neue Branch ist ausschließlich lokal gespeichert. Keine neue Vercel-Veröffentlichung erstellt, kein Testnet-Alias geändert und keine Mainnet-Veröffentlichung vorgenommen. Nach ausdrücklicher Freigabe: Branch pushen, ausschließlich Testnet veröffentlichen und dort die praktischen Prüfungen durchführen.

Keine Produktivdatenmigration, kein Reset, kein Löschen und keine Neuberechnung historischer Bestwerte. Im Code vorhandene explizite Resetfunktionen wurden nicht ausgeführt. Testnet/Mainnet verwenden weiterhin bestehende Netzwerkschlüssel; das Legacy-Ranglistenarchiv bleibt als ursprüngliches gemeinsames Archiv erhalten.
