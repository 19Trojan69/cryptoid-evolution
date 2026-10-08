# Cryptoid Evolution – zentrale Entwicklungs-TODO

Stand: 8. Oktober 2026. Pakete 1–3 und das separate Lint-Stabilitätspaket wurden im getrennten Testnet-Projekt veröffentlicht. **Paket 4 und die anschließend freigegebenen Pakete 4.1, 4.2 und 4.3 sind auf der festen Testnet-Adresse spielbar. Paket 5 ist im separaten Branch umgesetzt und automatisiert getestet; die Backend-Staging-Lösung ist vorbereitet und wartet auf ihre Live-Prüfung. Pi-Browser-/Produktionsfassung unverändert.**

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

Nachweis: [docs/lint-stability-2026-10-08.md](docs/lint-stability-2026-10-08.md). Paket 4 wird auf diesem Stand getrennt umgesetzt.

## Nächste Performancearbeit – offen, gesonderte Freigabe

- **offen: großen JavaScript-Chunk untersuchen.** Beim Frontend-Build entsteht ein Haupt-Chunk von rund 1,72 MB (minifiziert; rund 493 KB gzip). Bundle-Zusammensetzung, Ladezeit und Ausführung auf Mobilgeräten messen, bevor Änderungen vorgenommen werden.
- **offen: bedarfsgerechtes Laden prüfen.** Selten benötigte Bereiche wie Sammlung und Shop nach Möglichkeit erst beim Öffnen laden; für Spielstart und laufenden Kampf benötigten Code rechtzeitig verfügbar halten. Ladezustände und Fehlerpfade sauber behandeln.
- **offen: Wirkung und Regressionen prüfen.** Vorher/nachher Chunk-Größen, Startzeit und mobile Spielperformance vergleichen; Spielstart, Navigation, Sammlung, Shop, Wiederaufnahme und Pi-Browser prüfen. Bestehende Effekte und Funktionen erhalten. Umsetzung erst als separat freigegebene Performancearbeit.

## Paket 4 – visuelles Gameplay & HUD — erledigt / automatisiert und im Preview getestet, Geräteabnahme offen

15. **erledigt / Übergangs-Abnahme offen: Warnungen.** Verstärkung und Bosswarnung kurz in der Bildschirmmitte, ohne Box/Rahmen, mit Signalblinken und ruhiger Variante für reduzierte Bewegung. Vorhandene lokalisierte Texte bleiben erhalten; reale Block-/Bossübergänge auf Geräten noch prüfen.
16. **erledigt / Übergangs-Abnahme offen: Einheitliche Würfel.** Quadratische 3D-Flächen, gleiche Drehrichtung und 7,2 Sekunden pro Umdrehung für alle neun Würfel; Rotationen pausieren mit dem Spiel und respektieren reduzierte Bewegung. Blockabschluss im Browser und auf Geräten noch visuell prüfen.
17. **erledigt / Browser-Preview geprüft, Geräteabnahme offen: Größere Gameplay-Schiffe.** Spieler auf Mobilgeräten 104–132 px, bei geringer Höhe 94 px; reguläre Gegner und Bonusziele optisch 10 % größer. Kollisionsradien und gespeicherte Positionen unverändert; schmale/kurze Bildschirme auf Geräten nachtesten.
- **erledigt / physische Geräteabnahme offen: Doppeltippen und Bildschirmlupe.** Den bestehenden Schutz für die Spielfläche um einen frühzeitigen, positionsabhängigen Doppeltipp-Schutz ergänzt; UI-Schaltflächen und globale Seitenvergrößerung nicht gesperrt. Auf iPhone/Safari, Pi Browser und Android/Chrome prüfen, ob es Browser-Zoom oder eine Betriebssystem-Bedienungshilfe war; letzteres kann die Webseite nicht steuern. Bewegung, HUD, Menüs und Zugänglichkeit nachtesten.

Nachweis: [docs/package-4-visual-hud-touch-2026-10-08.md](docs/package-4-visual-hud-touch-2026-10-08.md). Paket 5 bleibt getrennt.

## Paket 4.1 – iPhone-Feedback: Audiohinweis und Schiffsbewegung — erledigt / automatisiert und im Preview getestet, Geräteabnahme offen

- **erledigt / Browser-Preview getestet: Audiohinweis aus dem Spielfeld entfernt.** „Ton einschalten“ überdeckte auf dem iPhone-Preview den Blockabschluss. Die vorhandenen Musik-/Effektregler im Pausenmenü und die Musikumschaltung im Hangar bleiben bedienbar. Wiederaufnahmeversuche des AudioContext und der Musik bei Nutzergesten, nach Pause und bei Sichtbarkeitswechsel bleiben erhalten; das nur für die entfernte Schaltfläche nötige Status-Polling entfällt. Kein Audio-Overlay mehr im Kampf oder Übergang; hörbare Wiedergabe und App-Wechsel auf realen Geräten noch prüfen.
- **erledigt / Browser-Preview getestet: ruhige Spieler- und Gegnerschiffe.** Die seitliche Neigung nutzt nur eine dezente perspektivische Drehung um die Schiffslängsachse (`rotateY`); die zusätzliche Drehung in der Bildebene (`rotate`) beim Spieler und bei regulären Gegnern sowie Einflug-Bank-Berechnung sind entfernt. Gegnerflugbahnen, Triebwerksreaktion, Kollisionsradien und Hitboxen bleiben bestehen. Boss- und Bonus-Schiffe hatten diese Bildebenen-Drehung nicht. Eine echte 3D-Geometrie wurde nicht eingeführt.
- **offen: Geräteabnahme.** Auf iPhone/Safari, Android/Chrome und nach Möglichkeit Pi Browser Audio-Sperre, Spielstart, Hintergrundwechsel, Pausieren, Blockübergang und schnelle Richtungswechsel prüfen. Ausgangsbefunde: zwei iPhone-Screenshots vom 8. Oktober 2026, 17:19–17:20 Uhr, im separaten Paket-4-Preview. Frontend-Lint (0/0), 50 Spieltestdateien, i18n sowie Frontend-/Backend-Build bestanden; im neuen Testnet-Preview Spielstart, Links-/Rechtsflug, Gegnerausrichtung, Overlay-Abwesenheit und Pausenregler geprüft.

Nachweis: [docs/package-4-1-audio-ship-motion-2026-10-08.md](docs/package-4-1-audio-ship-motion-2026-10-08.md). Dieses kleine Folgepaket ist unabhängig von Score/Rangliste (Paket 5) und vom Klangdesign gegnerischer Waffen (Paket 6). Paket 5 bleibt offen.

## Paket 4.2 – Menüebenen, Audiopause und Versionsvergleich — erledigt / automatisiert und im festen Testnet geprüft, Geräteabnahme offen

- **erledigt / Browser-Preview geprüft: Schiff hinter geöffneten Menüs.** Die Regel aus Paket 2 hält das Schiff während des aktiven Spiels weiterhin vor den seitlichen Buttons. Bei Waffenmenü, Pausenmenü und anderen vollständigen Dialogen liegen die Masken darüber und das Spielerschiff wird ausgeblendet. Während des 3–2–1-Countdowns ist es wieder sichtbar; Trefferfläche, Spielstand und Bewegung bleiben unverändert.
- **erledigt / Audiologik und Pausen-UI geprüft: Musik im Menü.** Ein allgemeiner Audio-Retry lief bislang auch bei Klicks in pausierten Dialogen und konnte Musik ungewollt wieder starten. Retry nur bei aktiver Mission (beziehungsweise Game Over/Sieg) und sichtbarer Seite; Musik beim Öffnen von Waffen- oder Pausemenü sofort anhalten, beim bewussten Fortsetzen innerhalb der Nutzergeste wieder anstoßen. Vorhandene Musikquelle und Abspielposition bleiben erhalten. Hörbare iPhone-/Pi-Browser-Prüfung und App-Wechsel ausstehend.
- **geprüft / kein Datenumbau: unterschiedliche Schiffe und Größen.** Pi Browser zeigt weiter die bisherige Produktionsfassung; die größeren Spielerschiffe aus Paket 4 sind jetzt auch auf der festen Testnet-Adresse spielbar. Testnet und Pi Browser haben verschiedene Browser-Adressen/Local-Storage-Origins und Netzwerk-Spielstände. Die Screenshots zeigen verschiedene Shard-Bestände. Keine Übernahme, Überschreibung oder Vermischung von Testnet-/Mainnet-Spielständen oder Käufen. Bei einem identischen Konto/Netzwerk und derselben Version kann die Auswahl bei Geräteabnahme verglichen werden.

Nachweis: [docs/package-4-2-menu-audio-2026-10-08.md](docs/package-4-2-menu-audio-2026-10-08.md). Paket 5 wird getrennt bearbeitet.

## Paket 4.3 – Schiffskollisionen, Trefferauswertung und Wiedereinstieg — erledigt / automatisiert getestet / festes Testnet geprüft, Geräteabnahme offen

- **erledigt / gezielt getestet: Rückflug von unten.** Der Kollisionsmerker gilt nur für denselben ununterbrochenen Kontakt. Nach räumlicher Trennung kann derselbe Gegner beim Rückflug erneut treffen. Der 1,5-Sekunden-Schutz nach einem Treffer und aktive Schilde bleiben wirksam; auch ein am Spielfeldrand sichtbarer Schiffsrumpf wird berücksichtigt.
- **erledigt / gezielt getestet: gegnerische Geschosse auf den Spieler.** Längliche Bossgeschosse wurden teilweise nur mit ihrem kleinen Entstehungsradius geprüft. Die Trefferprüfung folgt jetzt der sichtbaren festen Projektilspitze, ohne den Spielerradius zu vergrößern. Ungeschützter Treffer verursacht einen Lebensverlust und dieselbe Spielerexplosion mit blinkendem Wiedereinstieg wie der Schiffskontakt. Aktiver Schild, Stufen-Rumpfschutz und die kurze Schutzzeit bleiben erhalten. Schiffskontakt berücksichtigt außerdem gleichzeitige Spielerbewegung.
- **erledigt / Build geprüft: beide Schiffe zerfallen.** Bei ungeschütztem Lebensverlust durch einen normalen Gegner erscheinen für beide Schiffe acht kleinere Rumpfteile an der Kontaktstelle. Das intakte Spielerschiff bleibt während des Zerfalls zunächst unsichtbar und erscheint dann mit drei kurzen Blinkimpulsen innerhalb der vorhandenen Schutzzeit. Endgültiger Lebensverlust und Schildtreffer behalten ihre eigenen Regeln.
- **offen: physische Geräteabnahme.** Rückflug nach abgefangenem Schildtreffer, direkter Zusammenstoß ohne Schild, Treffer länglicher Boss- und normaler Gegnergeschosse auf den Spieler, Lebensanzeige, Sound und mehrere schnelle Kollisionen auf iPhone/Pi Browser und Android prüfen. Keine Spielstände oder Käufe migrieren.

Nachweis: [docs/package-4-3-collision-hit-feedback-2026-10-08.md](docs/package-4-3-collision-hit-feedback-2026-10-08.md). Paket 5 wird getrennt bearbeitet.

## Paket 5 – Score, Rangliste & Admin — implementiert / automatisiert getestet, Testnet-Ende-zu-Ende offen

18. **erledigt / getestet: Career Score.** Summe der Punkte aller seit Einführung verifiziert abgeschlossenen Konto-Runs, beim finalen Run-Abschluss einmalig und atomar gutgeschrieben. Top 100 sortiert standardmäßig danach. Lauf-ID, gültige Score-Grenzen, Abschlusszustand, versionierter Spielstand und Netzwerk werden geprüft. Vergangene unvollständige Run-Summen sind nicht rekonstruierbar und werden nicht erfunden; alte Rekordlisten bleiben erhalten.
19. **erledigt / getestet: Best Run.** Höchster einzelner abgeschlossener Run mit tatsächlich erreichtem Level separat gespeichert. Bestehende V2-Rekorde bleiben lesbar; wenn deren früheres Run-Level nicht gespeichert wurde, erscheint ausdrücklich „—“. Profilfortschritt bleibt eigenständig.
20. **erledigt / getestet: Rangliste.** Name, Rang, Career Score, Best Run, Run-Level und Profillevel; historische V2- und frühere Rekordlisten als getrennte Ansichten. Für 17 bisher unterstützte Sprachen aktualisierte Texte. Breite mobile Tabellen sind horizontal scrollbar.
21. **erledigt / getestet: Eigener Admin-Reset.** Nur verifizierter Eigentümer, eigener UID, genau das aktuell verwendete Netzwerk, eingegebener Pi-Name und zusätzliche Bestätigung. Aktiver Run blockiert den Reset. Setzt ausschließlich eigene Karriere-/Best-Run-/V2-Score-Werte zurück, nicht Spielstand, Shards, Käufe oder den alten netzwerkübergreifenden Archivwert.
- **in Arbeit: Testnet-Ende-zu-Ende.** Vorhandenen MongoDB-Preview-Zugang geprüft: elf bestehende Testnet-V2-Rekorde stimmen mit der bisherigen festen API überein. Neuer Gateway-Modus erzwingt ausschließlich im Paket-5-Preview Testnet, erhält Query-Parameter und lässt Pi-Key-Operationen beim bestehenden Zahlungsdienst. Keine Schlüsselkopie oder Datenmigration. 57 Backend-Tests erfolgreich. Neue Vorschau und Live-API vor einer Umschaltung der festen Testnet-Adresse prüfen; physische und authentifizierte Geräteabnahme bleibt offen.

Nachweis: [docs/package-5-score-leaderboard-admin-2026-10-08.md](docs/package-5-score-leaderboard-admin-2026-10-08.md).

## Paket 6 – Audio-Polish — offen

22. **offen: Gegnerwaffen.** Etwas lauter/präsenter/druckvoller/moderner, unterschiedliche Klassen (leicht/schwer/Boss massiv). Keine Übersteuerung oder Überdeckung von Musik, Spielerwaffen und Warnungen.

## Paket 7 – Sprachen & Lokalisierung — offen

23. **offen: Vereinfachtes Chinesisch und erweiterbare Sprachpakete.** Priorität: gespeicherte manuelle Wahl → Browser-/Gerätesprache → unterstützte Entsprechung → definierter Fallback. Nicht primär Standort. Jederzeit manuell änderbar und dauerhaft gespeichert. Menüs, HUD, Shop, Warnungen, Waffen, Power-ups, Bosse, Card Collection, Rangliste, Admin, Hilfe, Fehler, Beschreibungen vollständig prüfen; keine abgeschnittenen Texte.

Vorhanden: zentrale i18n-Kataloge und Sprachtests. Umfang/Erkennung vor Paket 7 erneut prüfen.

## Zusätzliche Befunde / nicht Teil der Paket-1-Freigabe

- Die historischen 55 Lint-Fehler/16 Warnungen aus Paket 1 wurden mit damaligen Abhängigkeiten gemessen. Mit den am 8. Oktober neu installierten, festgeschriebenen Yarn-Abhängigkeiten zeigten Paket 2 und 3 beide 14 Fehler/16 Warnungen. Das separate Stabilitätspaket bereinigt diese auf 0/0. Der große JS-Bundle-Chunk ist für die nächste gesonderte Performancearbeit vorgemerkt.
- Lokaler Gast-Chromium meldet `Pi is not defined` aus der vorhandenen Pi-Integration im Konsolenereignis, obwohl Spielstart und Waffenmenü bedienbar sind. Separat in einer Pi-/Browser-Abnahme untersuchen; kein Paket-2-Nebenumbau.
- Im Paket-4-Preview meldete die Pi-SDK-Datei nach längerer Sitzung Messaging-Timeouts in Chrome außerhalb des Pi Browsers. Spiel und Waffenmenü blieben bedienbar; im Pi Browser separat prüfen.
- Der Paket-4-Preview-Build ist spielbar; die feste Testnet-Adresse wurde nicht umgestellt. Vercel verweigerte die Promotion (422) und sowohl Produktions-Deployment im getrennten Testnet-Projekt als auch Alias-Zuordnung (403). Produktion bleibt auf `main`.
- Oberer Blockzähler zählt abgeschlossene Blocks, Abschnittstext den laufenden Block. Vorhandene Erklärung geprüft; eine Vereinheitlichung ist gesondert zu entscheiden.

- Die ältere `doc/cryptoid-gameplay-roadmap.md` enthält historische, teils überholte Regeln. Diese zentrale TODO bestimmt neue Arbeit; keine Gameplay-Änderung aus historischen Notizen ableiten.
- Testnet- und main-Historie sind auseinander gelaufen; neuester Arbeitsbranch enthält zusätzliche Kartenassets und bestätigte spätere Funktionen. Deployment-Basis separat abgleichen.

## Paket-1-Nachweis

Implementierung erledigt; automatisierte Prüfungen bestanden. Bericht: [docs/package-1-stability-2026-10-08.md](docs/package-1-stability-2026-10-08.md), maschinenlesbar: [docs/package-1-validation.json](docs/package-1-validation.json).

- Frontend/Backend gebaut; 219 Frontend-/Sprachtests und 47 Backend-Tests bestanden.
- Browser 390×844 und 1280×800: Explosion/Treffer/Schutz/Übergänge; echte Handler mit isoliertem Speicher: Shards, Lebensverlust und Boss-Clear-Resume; Hintergrundpause auch bei gestoppter RAF geprüft.
- Lint nicht grün: exakt wie vorher 55 Fehler / 16 Warnungen; keine zusätzlichen Meldungen.
- Offene Geräteabnahme: physischer iPhone-/Pi-Browser-/Android-Test. Testnet wurde anschließend über das getrennte Vercel-Projekt mit Commit `861f9fe` unter `cryptoid-evolution-testnet.vercel.app` veröffentlicht und im Browser angespielt. Produktion unverändert.
- Paket 2 und 3 sowie das separat freigegebene Lint-Stabilitätspaket wurden im getrennten Testnet-Projekt veröffentlicht. Paket 4 und die Folgepakete 4.1 und 4.2 wurden im Preview geprüft und mit dem getesteten Paket-4.2-Deployment auf die feste Testnet-Adresse gelegt. Paket 4.3 wurde gezielt getestet und mit dem geprüften Commit `2a39a58` auf die feste Testnet-Adresse gelegt; physische Geräteabnahme offen. Paket 5 ist im separaten Branch implementiert; Testnet-Backend-Staging ist vorbereitet; neue Vorschau und Live-API werden geprüft.
