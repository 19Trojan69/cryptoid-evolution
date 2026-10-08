# Paket 4.3 – Schiffskollisionen, Treffer und Wiedereinstieg

Stand: 8. Oktober 2026. Ausgangspunkt ist der saubere Paket-4.2-Stand (`codex/package-4-2-menu-audio`); Umsetzung im separaten Branch `codex/package-4-3-collision-hit-feedback`. Der Nutzer meldete erneut ignorierte Kontakte mit Gegnern, die von unten zurückkehren, und präzisierte danach: Es geht um **gegnerische Geschosse auf das Spielerschiff**, die sichtbar treffen, ohne ein Leben abzuziehen. Bei Lebensverlust sollen die beteiligten Schiffe in kleine Rumpfteile zerfallen und das neue Spielerschiff kurz mehrfach blinken.

## Ursachen und Korrekturen

| Datei | Befund und Änderung |
| --- | --- |
| `frontend/src/pages/playerCombat.ts` | Der bisherige Angriffsmerker sperrte weitere Kontakte desselben Tauchangriffs auch nach räumlicher Trennung. Ein Kontaktschloss gilt nun nur solange die Rümpfe tatsächlich zusammenliegen. Sichtbarkeit umfasst am Rand teilweise sichtbare Rümpfe und beide Enden der Bewegung. Schiffskontakt wertet die relative Bewegung von Spieler und Gegner aus und berechnet die tatsächliche Kontaktposition. Unveränderte Kontaktradien bewahren die Spielbalance. |
| `frontend/src/pages/enemyFire.ts` | Die Trefferform normaler Schüsse und länglicher Bossprojektile berücksichtigt nun die tatsächlich sichtbare feste Projektilspitze statt nur den Entstehungsradius. Glühen und Schweif zählen nicht zur Hitbox. Der Spielerradius bleibt unverändert. |
| `frontend/src/pages/GamePage.tsx` | Die bestehende Kollisionsentscheidung nutzt die getrennten Kontakte und legt die Gegnerexplosion an die berechnete Kontaktstelle, auch wenn das Schiff am Frame-Ende schon unter dem Bildschirm wäre. Bei ungeschütztem Zusammenstoß führt der vorhandene Pfad weiterhin genau einen Lebensverlust, die Zerstörung des normalen Gegners, Score und Shards aus. Für beide Schiffe werden acht kleinere Rumpfteile aus den vorhandenen Schiffsassets erzeugt. Ein ungeschützter gegnerischer Projektiltreffer verwendet denselben bereits vorhandenen Pfad für Lebensverlust, Spielerexplosion und Wiedereinstieg. Schild- und Schutzzeitpfade sowie Bossleben bleiben separat. |
| `frontend/src/index.css` | Das Spielerschiff bleibt während der ersten Hälfte der 1,35-Sekunden-Explosion verborgen und erscheint danach mit drei kurzen Blinkimpulsen. Bei reduzierter Bewegung erscheint es ohne Blinken. Die acht vorhandenen Fragmentteile bleiben bis zum Ende der Explosion sichtbar. Keine zusätzliche Animationsschleife oder neue Bilddatei. |
| `frontend/src/pages/playerCombat.test.mjs`, `frontend/src/pages/enemyFire.test.mjs` | Regressionen für Rückflug nach Schildkontakt, Schutzzeit, Randkontakt, gleichzeitige Schiffsbewegung sowie sichtbare Geschossspitzen, Beinahetreffer, Lebensverlust und Schild-/Rumpfschutz. |
| `TODO.md`, diese Datei | Status, Ursachen, Prüfungen und Geräteabnahme festgehalten. |

Es gibt keine Änderungen an Lebens-, Schild- oder Schutzzeitregeln, Spielständen, Kaufwerten, Pi SDK, MongoDB oder Backend. Anleitung, Schiffsbeschreibungen und Übersetzungen wurden auf Widersprüche zur Kollisions-/Schildmechanik geprüft; die vorhandene Aussage „Kollision kann ein Herz kosten; ein aktiver Schild schützt“ bleibt gültig. Neue sichtbare Wörter wurden nicht eingeführt.

## Prüfungen

- Gezielte Kollisions- und Projektiltests: `playerCombat.test.mjs` und `enemyFire.test.mjs`, einschließlich fehlender/definierter Schutzwirkung.
- Gesamte Frontend-Suite: 50 Seitentestdateien bestanden; `npm run lint` ohne Fehler und Warnungen; `npm run build` samt i18n-Test, TypeScript und Vite bestanden.
- Backend: `npm run build` bestanden, ohne Backend-Änderungen. `git diff --check` bestanden.

## Offen

- Die DOM-/Geräteprüfung der tatsächlich hörbaren und sichtbaren Kollision auf iPhone/Pi Browser und Android ist noch offen. Insbesondere einen ungeschützten normalen und länglichen Boss-Geschosstreffer, den Lebensabzug und die Explosion mit dreimaligem Blinken beobachten; außerdem einen ersten Schildkontakt, räumliche Trennung und erneuten Rückflug prüfen. Keine gesicherte Reproduktion der vom Nutzer gesehenen Einzelrunde oder Bildschirmaufnahme lag im Repository vor.
- Der bekannte große Frontend-JavaScript-Chunk (rund 1,72 MB minifiziert) bleibt für die separat vorgemerkte Performancearbeit. Produktionsprojekt und `main` werden nicht aktualisiert.
