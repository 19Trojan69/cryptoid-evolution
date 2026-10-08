# Cryptoid Evolution – zentrale Entwicklungs-TODO

Stand: 8. Oktober 2026. Pakete 1–3 wurden im getrennten Testnet-Projekt veröffentlicht. **Das separat freigegebene Stabilitätspaket für Lint ist implementiert und automatisiert getestet; Testnet-Abnahme folgt. Paket 4 wartet weiterhin auf Freigabe.**

Status: **offen** = noch nicht vollständig umgesetzt/verifiziert; **in Arbeit** = aktuelle Bearbeitung; **erledigt** = implementiert; **getestet** = dokumentierte Prüfungen bestanden (Geräte-/Live-Lücken separat ausweisen).

## Ausgangsstand und Schutzregeln

- Remote-Branches vollständig abgefragt; Git-Historie nachgeladen, da vorhandener Checkout shallow war.
- `main`: `1871557dec332161cfdb0c90bc4d29022632bda6`; `codex/level-expansion-v2`: `f16ce1c0a8b8eb41045b5dcf168480f5169681b8`.
- Arbeitsbasis: `codex/card-artwork-centering` / `749d3d525615d377a9380d05e385f21955178e16`, enthält main plus neuere Karten-/Audio-/Waffen-/Login-/Geschützleisten-Arbeit. Separater Worktree/Branch `codex/package-1-stability`.
- Vorhandene uncommittete Schiffsgrößen-/Mündungsänderungen im älteren Worktree unangetastet lassen; Paket 4 nicht vorziehen.
- Offene PRs geprüft: #3, #11, #13, #29, #34, #67. Keine ungeprüfte Übernahme; #67 ist ausdrücklich nur Sandbox.
- Testnet-Branch hat eigene Collection-Audit-Historie. Vor einer Aktualisierung Unterschiede prüfen; niemals durch Force-Push ersetzen.
- Keine neueren Funktionen entfernen/überschreiben. Funktionierende Module weiterverwenden; Änderungen modular und dauerhaft lösen.
- Stabilität > saubere Architektur > Performance > Optik > Zusatzfeatures. Mobile Performance priorisieren; Effekte nicht zur Verschleierung von Problemen reduzieren.
- Spielstände, Käufe, Shards, Benutzerwerte erhalten; Testnet/Mainnet strikt getrennt; Pi SDK, MongoDB, Payments schützen.
- Pro Paket gezielte Tests und vorhandene Build-/Lint-/Test-Schritte; Dateien, Fehler, Tests, Risiken dokumentieren.
- **Keine Produktionsaktualisierung ohne ausdrückliche Freigabe.** Testnet nur als vollständiges, stabiles Paket. Keine großen Zusatzumbauten; Nebenfehler hier dokumentieren und nur bei direkter Notwendigkeit für das freigegebene Paket beheben.

## Dauerregel: Texte und Übersetzungen

Bei jeder Mechanikänderung Spielbeschreibung, Anleitung/Help, Tooltips, Waffen-, Power-up- und Bossbeschreibungen, Shop, Rangliste, Admin, Card Collection, Warnungen, Fehlermeldungen und sonstige Erklärungen prüfen. Alle unterstützten Sprachen konsistent aktualisieren; keine widersprüchlichen Alttexte. Textlängen und abgeschnittene Labels prüfen.

## Paket 1 – kritische Spiellogik & Stabilität — erledigt / automatisiert getestet

1. **getestet (automatisch): Gegner bis zur Explosion sichtbar.** Keine Lücke zwischen sichtbarem Gegner und Explosionsbeginn; erst der Explosionsmoment entfernt das Objekt. Alle Zerstörungspfade berücksichtigen.
2. **getestet (automatisch): Audiozustand beim Start.** Gespeicherte Einstellungen, initiale UI, AudioContext, Spielstart, App-/Browserwechsel prüfen. Anzeige und tatsächliche Wiedergabe müssen zusammenpassen, auch bei blockiertem Autoplay.
3. **getestet (automatisch): Boss-Projektilschaden.** Alle 50 Bosse, Waffen und Projektilklassen prüfen: Hitbox, Kollision, Schaden, Immunität, Schild, I-Frames und Sonderlogik. Jeder gültige ungeschützte Treffer verursacht vorgesehenen Schaden; bestehende definierte Schutzmechaniken erhalten.
4. **getestet (automatisch): Gesamt-Shards im HUD.** Vorbestand plus Run-Ertrag (1.250 + 20 = 1.270), auch bei neuer Mission und Resume. Persistenz/HUD synchron; keine Doppelgutschriften oder Vermischung von Netzwerk/Account.
5. **getestet (automatisch): Übergänge.** Block → Block, Block 9 → Boss, Boss → Bonus, Bonus → nächstes Level, allgemeine Levelwechsel und Continue/Resume prüfen. Keine Freezes, Sprünge, Duplikate, Restprojektile, falschen HUD-/Text-/Gegnerzustände, Audioabbrüche, Timingfehler oder verschwundenen Spieler. Spieler, Audio, Effekte und Simulation synchron.

Vorhanden: modulare Gegner-/Spielerkollision, alle Bossgeschütze, 1.500-ms-Trefferschutz, Schiffspanzerung, Schildlogik, persistente Run-Snapshots, sofortiges Speichern von Lebensverlust, Netzwerktrennung, 9-Block/Boss/Bonus-Übergänge. Diese Logik wird gezielt korrigiert, nicht ersetzt.

## Paket 2 – Waffen & Power-ups — erledigt / lokal getestet

6. **getestet (lokal): Einklappbares Waffenmenü.** Schmaler seitlicher Tab mit lokalisiertem Waffen/Weapons; Menü fährt ins Bild, normale Überschrift, transparentere Fläche. Mobile/Desktop-Chromium geprüft.
7. **getestet (lokal): Schiff vor UI.** Spielerschiff optisch vor Waffenmenü/Buttons; transparente, weiterhin bedienbare Buttons. Grafikgröße/Hitbox unverändert.
8. **getestet (automatisch): Nicht blockierendes Nachladen.** Dialog/Spielstopp entfernt; kurzer rahmenloser lokalisierter Hinweis und passendes Geräusch. Aktivierung nutzt weiterhin Server-Idempotenz; verspätete Antworten überschreiben keine neu ausgewählte Waffe.
9. **getestet (automatisch): Automatischer Waffenwechsel.** Leere Spezialwaffe → stärkste noch laufende aktivierte Waffe beziehungsweise verfügbare stärkere Pickup-Waffe, sonst Standardschuss; ohne Spielstopp.
10. **getestet (automatisch): Power-up-Balance.** Frühe Dropchance 6,5 %, später bis 10 %; pro Level jeder freie Typ höchstens einmal, andere Typen weiterhin möglich. Die Kapitelhistorie wird gesichert und nach der Bonusrunde zurückgesetzt; ältere Spielstände bleiben lesbar.

Vorhandenes Inventar, Timer, Opt-in-Nachladen und Pi-Aktivierung werden weiterverwendet. Nachweis: [docs/package-2-weapons-2026-10-08.md](docs/package-2-weapons-2026-10-08.md). Physische Pi-/Android-/iPhone-Abnahme steht aus.

## Paket 3 – Bombe, EMP & Bosskampf — erledigt / automatisiert getestet, Browser-Abnahme offen

11. **getestet (automatisch): Bomben-/EMP-Optik.** Moderne, hochwertige, professionelle, unterscheidbare Effekte ohne relevante Performancekosten.
12. **getestet (automatisch): Mechaniken trennen.** Bombe zerstört alle betroffenen normalen Blockgegner, verursacht Boss-Schaden ohne sofortigen Bosskill. Separate Geschütz-HP; beim ersten Boss kann eine Bombe alle Geschütze zerstören, später zunehmende Haltbarkeit/skalierter Schaden, kein garantierter Gesamt-Kill. EMP zerstört nichts, deaktiviert zeitweise ausschließlich gegnerische Feuerkraft; Gegner/Geschütze bleiben bestehen.
13. **getestet (automatisch): Geschütztrefferfeedback.** Kleine sichtbare hochwertige lokale Explosionen; keine Überdeckung, performant; eigene Energie/Schadensanzeige bis zum letzten Geschütz.
14. **getestet (automatisch): Boss-Langzeitperformance.** Ursache untersuchen: Projektile, Partikel, Listener, RAF/Loops, Objektlisten, Timer, GC, Explosionen, Geschütze, Kollisionen, unnötige Re-Renders. Keine pauschale Effektreduktion; längere Kämpfe flüssig.

Vorhanden: separate Geschütz-HP, adaptive schmale grün-rote Balken, modulare Bosswaffen/Reaktor; deren Verhalten erhalten. Paket-3-Nachweis: [docs/package-3-combat-2026-10-08.md](docs/package-3-combat-2026-10-08.md). Physische iPhone-/Android-/Pi-Browser- und echter Kauf-/Langzeit-Frame-Test stehen aus.

## Separates Stabilitätspaket – Lint und React-Zustände — erledigt / automatisiert getestet

- **getestet (automatisch): 14 Fehler und 16 Warnungen bereinigt.** Lint endet ohne Befund; Regeln bleiben aktiviert. Komponenten/Hilfsfunktionen sauber getrennt, unbenutzte Parameter und Ausdrucksformen korrigiert.
- **getestet (automatisch): Laufende Spielschleife.** RAF und Startaktivierung bleiben einmalig. Gespeicherte Missionen, Audio- und Bossereignisse lesen aktuelle Handler; Treffer-/Explosionseffekte verwenden die aktuell ausgewählte Schiffsgrafik.
- **getestet (automatisch): Shop, Sammlung und Bilder.** Inventarabruf, Kartenfreischaltung, Downloads und Lazy-Porträts behalten ihre Schutzlogik bei Konto-/Auswahlwechsel; keine kurzzeitig freigelegten Silhouetten. Boss-Energiebalken bleiben zwischengespeichert.
- **offen: reale Geräte- und Pi-Abnahme.** Browser/Testnet sowie Käufe, Kontowechsel und lange Sitzungen nach Veröffentlichung prüfen. Keine Daten- oder Netzwerkschemata geändert.

Nachweis: [docs/lint-stability-2026-10-08.md](docs/lint-stability-2026-10-08.md). Paket 4 bleibt getrennt.

## Nächste Performancearbeit – offen, gesonderte Freigabe

- **offen: großen JavaScript-Chunk untersuchen.** Beim Frontend-Build entsteht ein Haupt-Chunk von rund 1,72 MB (minifiziert; rund 493 KB gzip). Bundle-Zusammensetzung, Ladezeit und Ausführung auf Mobilgeräten messen, bevor Änderungen vorgenommen werden.
- **offen: bedarfsgerechtes Laden prüfen.** Selten benötigte Bereiche wie Sammlung und Shop nach Möglichkeit erst beim Öffnen laden; für Spielstart und laufenden Kampf benötigten Code rechtzeitig verfügbar halten. Ladezustände und Fehlerpfade sauber behandeln.
- **offen: Wirkung und Regressionen prüfen.** Vorher/nachher Chunk-Größen, Startzeit und mobile Spielperformance vergleichen; Spielstart, Navigation, Sammlung, Shop, Wiederaufnahme und Pi-Browser prüfen. Bestehende Effekte und Funktionen erhalten. Umsetzung erst als separat freigegebene Performancearbeit.

## Paket 4 – visuelles Gameplay & HUD — offen

15. **offen: Warnungen.** Flotte/Verstärkung und ähnliche Hinweise kurz in Bildschirmmitte, ohne Box/Rahmen; hochwertiger Sci-Fi-Text, kurzes Blinken/Flackern, sprachabhängig, keine dauerhafte Sichtblockade.
16. **offen: Einheitliche Würfel.** Exakte gleichseitige Proportionen, identische Darstellung, Drehrichtung, Logik und Geschwindigkeit; Kopien dürfen identisch sein.
17. **offen: Größere Gameplay-Schiffe.** Vor allem Spieler, teilweise Gegner vergrößern; Grafik/Hitbox sinnvoll trennen, keine unfairen Treffer, HUD/Bewegung erhalten. Bereits vorhandenen lokalen Entwurf bei späterer Freigabe prüfen.

## Paket 5 – Score, Rangliste & Admin — offen

18. **offen: Career Score.** Dauerhafte Summe regulärer Run-Punkte, primäres Top-100-Sortierkriterium, Schutz gegen offensichtliches Farming/Exploits.
19. **offen: Best Run.** Höchster einzelner Run plus dabei erreichtes Level; separat speichern, niemals mit Career Score überschreiben/vermischen.
20. **offen: Rangliste.** Name, Rang, Career Score, Best Run, eindeutig zugehöriges Run-Level; Profil-Level und Run-Level unterscheiden.
21. **offen: Eigener Admin-Reset.** Eigener Highscore/Test-Highscore mit Sicherheitsabfrage; keine fremden Werte; Reset nach Testnet/Mainnet trennen.

## Paket 6 – Audio-Polish — offen

22. **offen: Gegnerwaffen.** Etwas lauter/präsenter/druckvoller/moderner, unterschiedliche Klassen (leicht/schwer/Boss massiv). Keine Übersteuerung oder Überdeckung von Musik, Spielerwaffen und Warnungen.

## Paket 7 – Sprachen & Lokalisierung — offen

23. **offen: Vereinfachtes Chinesisch und erweiterbare Sprachpakete.** Priorität: gespeicherte manuelle Wahl → Browser-/Gerätesprache → unterstützte Entsprechung → definierter Fallback. Nicht primär Standort. Jederzeit manuell änderbar und dauerhaft gespeichert. Menüs, HUD, Shop, Warnungen, Waffen, Power-ups, Bosse, Card Collection, Rangliste, Admin, Hilfe, Fehler, Beschreibungen vollständig prüfen; keine abgeschnittenen Texte.

Vorhanden: zentrale i18n-Kataloge und Sprachtests. Umfang/Erkennung vor Paket 7 erneut prüfen.

## Zusätzliche Befunde / nicht Teil der Paket-1-Freigabe

- Die historischen 55 Lint-Fehler/16 Warnungen aus Paket 1 wurden mit damaligen Abhängigkeiten gemessen. Mit den am 8. Oktober neu installierten, festgeschriebenen Yarn-Abhängigkeiten zeigten Paket 2 und 3 beide 14 Fehler/16 Warnungen. Das separate Stabilitätspaket bereinigt diese auf 0/0. Der große JS-Bundle-Chunk ist für die nächste gesonderte Performancearbeit vorgemerkt.
- Lokaler Gast-Chromium meldet `Pi is not defined` aus der vorhandenen Pi-Integration im Konsolenereignis, obwohl Spielstart und Waffenmenü bedienbar sind. Separat in einer Pi-/Browser-Abnahme untersuchen; kein Paket-2-Nebenumbau.
- Oberer Blockzähler zählt abgeschlossene Blocks, Abschnittstext den laufenden Block. Vorhandene Erklärung geprüft; eine Vereinheitlichung ist gesondert zu entscheiden.

- Die ältere `doc/cryptoid-gameplay-roadmap.md` enthält historische, teils überholte Regeln. Diese zentrale TODO bestimmt neue Arbeit; keine Gameplay-Änderung aus historischen Notizen ableiten.
- Testnet- und main-Historie sind auseinander gelaufen; neuester Arbeitsbranch enthält zusätzliche Kartenassets und bestätigte spätere Funktionen. Deployment-Basis separat abgleichen.

## Paket-1-Nachweis

Implementierung erledigt; automatisierte Prüfungen bestanden. Bericht: [docs/package-1-stability-2026-10-08.md](docs/package-1-stability-2026-10-08.md), maschinenlesbar: [docs/package-1-validation.json](docs/package-1-validation.json).

- Frontend/Backend gebaut; 219 Frontend-/Sprachtests und 47 Backend-Tests bestanden.
- Browser 390×844 und 1280×800: Explosion/Treffer/Schutz/Übergänge; echte Handler mit isoliertem Speicher: Shards, Lebensverlust und Boss-Clear-Resume; Hintergrundpause auch bei gestoppter RAF geprüft.
- Lint nicht grün: exakt wie vorher 55 Fehler / 16 Warnungen; keine zusätzlichen Meldungen.
- Offene Geräteabnahme: physischer iPhone-/Pi-Browser-/Android-Test. Testnet wurde anschließend über das getrennte Vercel-Projekt mit Commit `861f9fe` unter `cryptoid-evolution-testnet.vercel.app` veröffentlicht und im Browser angespielt. Produktion unverändert.
- Paket 2 und 3 wurden im getrennten Testnet-Projekt veröffentlicht. Das separat freigegebene Lint-Stabilitätspaket ist automatisiert geprüft; Paket 4 wartet auf Freigabe.
