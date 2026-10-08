# Paket 4.3 – Schiffskollisionen, Treffer und Wiedereinstieg

Stand: 8. Oktober 2026. Ausgangspunkt ist der saubere Paket-4.2-Stand (`codex/package-4-2-menu-audio`); Umsetzung im separaten Branch `codex/package-4-3-collision-hit-feedback`. Der Nutzer meldete erneut ignorierte Kontakte mit Gegnern, die von unten zurückkehren, gelegentlich nicht gewertete Gegnertreffer und den Wunsch nach kleinen Rumpfteilen beider Schiffe sowie einem kurz mehrfach blinkenden neuen Spielerschiff bei Lebensverlust.

## Ursachen und Korrekturen

| Datei | Befund und Änderung |
| --- | --- |
| `frontend/src/pages/playerCombat.ts` | Der bisherige Angriffsmerker sperrte weitere Kontakte desselben Tauchangriffs auch nach räumlicher Trennung. Ein Kontaktschloss gilt nun nur solange die Rümpfe tatsächlich zusammenliegen. Sichtbarkeit umfasst am Rand teilweise sichtbare Rümpfe und beide Enden der Bewegung. Schiffskontakt wertet die relative Bewegung von Spieler und Gegner aus und berechnet die tatsächliche Kontaktposition. Spielerprojektile prüfen den relativen Weg zum bewegten Gegner über das Frame statt nur zwei Endpositionen. Unveränderte Kontakt- und Projektilradien bewahren die Spielbalance. |
| `frontend/src/pages/GamePage.tsx` | Die bestehende Kollisionsentscheidung nutzt die getrennten Kontakte und legt die Gegnerexplosion an die berechnete Kontaktstelle, auch wenn das Schiff am Frame-Ende schon unter dem Bildschirm wäre. Ein Spielerschuss wird erst nach der Trefferprüfung am oberen Bildrand entfernt. Bei ungeschütztem Zusammenstoß führt der vorhandene Pfad weiterhin genau einen Lebensverlust, die Zerstörung des normalen Gegners, Score und Shards aus. Für beide Schiffe werden acht kleinere Rumpfteile aus den vorhandenen Schiffsassets erzeugt. Schild- und Schutzzeitpfade sowie Bossleben bleiben separat. |
| `frontend/src/index.css` | Das Spielerschiff bleibt während der ersten Hälfte der 1,35-Sekunden-Explosion verborgen und erscheint danach mit drei kurzen Blinkimpulsen. Bei reduzierter Bewegung erscheint es ohne Blinken. Die acht vorhandenen Fragmentteile bleiben bis zum Ende der Explosion sichtbar. Keine zusätzliche Animationsschleife oder neue Bilddatei. |
| `frontend/src/pages/playerCombat.test.mjs` | Regressionen für Rückflug nach Schildkontakt, Schutzzeit, Randkontakt, gleichzeitige Bewegung von Schiffen und Geschoss/Gegner sowie Tarnung und Beinahetreffer. |
| `TODO.md`, diese Datei | Status, Ursachen, Prüfungen und Geräteabnahme festgehalten. |

Es gibt keine Änderungen an Lebens-, Schild- oder Schutzzeitregeln, Spielständen, Kaufwerten, Pi SDK, MongoDB oder Backend. Anleitung, Schiffsbeschreibungen und Übersetzungen wurden auf Widersprüche zur Kollisions-/Schildmechanik geprüft; die vorhandene Aussage „Kollision kann ein Herz kosten; ein aktiver Schild schützt“ bleibt gültig. Neue sichtbare Wörter wurden nicht eingeführt.

## Prüfungen

- Gezielter Kollisions- und Projektiltest: `node --experimental-strip-types src/pages/playerCombat.test.mjs`, 12 Tests bestanden.
- Gesamte Frontend-Suite: 50 Seitentestdateien bestanden; `npm run lint` ohne Fehler und Warnungen; `npm run build` samt i18n-Test, TypeScript und Vite bestanden.
- Backend: `npm run build` bestanden, ohne Backend-Änderungen. `git diff --check` bestanden.

## Offen

- Die DOM-/Geräteprüfung der tatsächlich hörbaren und sichtbaren Kollision auf iPhone/Pi Browser und Android ist noch offen. Insbesondere einen ersten Schildkontakt, räumliche Trennung und erneuten Rückflug sowie das dreimalige Blinken nach Lebensverlust beobachten. Keine gesicherte Reproduktion der vom Nutzer gesehenen Einzelrunde oder Bildschirmaufnahme lag im Repository vor.
- Der bekannte große Frontend-JavaScript-Chunk (rund 1,72 MB minifiziert) bleibt für die separat vorgemerkte Performancearbeit. Produktionsprojekt und `main` werden nicht aktualisiert.
