# Paket 3 – Bombe, EMP und Bosskampf

Stand: 8. Oktober 2026. Basis: `codex/package-2-weapons` (`78e792e`). Getrennter Branch `codex/package-3-bomb-emp-boss`. `main` und das Produktionsprojekt werden nicht verändert.

## Befund und Umsetzung

| Bereich | Dateien | Änderung |
| --- | --- | --- |
| Mechanik | `frontend/src/pages/GamePage.tsx`, `specialPowers.ts`, `bossTurrets.ts` | Die Bombe entfernt sichtbare normale Gegner und vorhandene feindliche Geschosse. Im Bosskampf beschädigt sie jedes lebende Geschütz und schreibt dessen Bonus genau einmal gut. Beim ersten Boss zerstört eine Bombe alle Geschütze; spätere Geschütze besitzen zusätzliche Rüstung und Bombenschaden skaliert begrenzt. Nur bei völlig freigelegtem Rumpf folgt Rumpfschaden, höchstens bis 1 HP. EMP deaktiviert sieben Sekunden lediglich neue normale, Geschütz- und Reaktorschüsse; Gegnerbewegung, Bossbewegung, Verstärkung und vorhandene Projektile laufen weiter. |
| Feedback | `GamePage.tsx`, `frontend/src/index.css` | Lokaler kurzer Trefferfunke auf jedem Bossgeschütztreffer, etwas größerer Abschlussfunke samt bestehendem Punktetext beim Zerstören. Schmale bestehende grün-rote HP-Balken bleiben bis zum letzten Geschütz. Unterschiedliche Nova- und EMP-Wellen aus kompositierten CSS-Transformationen statt aus Objektpartikeln; reduzierte Bewegung wird beachtet. |
| Performance | `bossHitTarget.ts`, `GamePage.tsx` | Die Trefferprüfung für lebende Geschütze verwendet Segment-Rechteck-Schnittpunkte statt aller 2 px entlang jedes Spielerschusses gegen sämtliche Geschütze zu prüfen. Nur beim freigelegten Rumpf bleibt der genaue Rumpftest. Geschütztreffer-Effekte werden nach 340/720 ms entfernt, statt große Explosionsfragmente lange vorzuhalten. Bestehende Geschossgrenze, Canvas-Cache, begrenzte Effektlisten, RAF-Cleanup und gestaffelte mobile Paints geprüft; keine allgemeine Grafiksparstufe eingeführt. |
| Texte | `backend/src/hangarCatalog.ts`, `frontend/src/pages/powerUps.ts`, `GamePage.tsx`, `GameGuide.tsx`, `frontend/src/locales/catalog.ts`, `package3.ts` | Shop, Guide, Power-up-Hinweise und Kampfanzeige beschreiben Geschütze, Boss-Rumpf und ausschließlich deaktivierte Waffen in allen 17 unterstützten Sprachen. |
| Nachweise | `specialPowers.test.mjs`, `bossTurretDamage.test.mjs`, `TODO.md` | Regression für 50 Bosse, 120 Sekunden simulierten Kampf je Boss, Waffenunterdrückung, Erhalt von Spielobjekten und Übersetzungen. |

## Prüfungen

- Frontend-Build mit TypeScript und i18n bestanden; 51 Frontend-Testdateien bestanden.
- Backend-Build und 48 Backend-Testdateien einschließlich Checkpoint, Kauf, Payment und Netzwerkisolation bestanden (lokale HTTP-Tests mit Loopback-Freigabe).
- Lint: 14 Fehler und 16 Warnungen; exakt gleiche Anzahl wie auf Paket-2-Basis. `git diff --check` ohne Befund.
- Simulationsprüfung: alle 50 Bossbatterien, 120 Sekunden Kampfzeit je Boss; bis zu sechs zugleich aktive Bossgeschosse im gezielten Test; jedes Geschütz bleibt vom Schusspfad erreichbar. Neue Geschütztreffer- und Wellen-Effekte haben feste kurze Lebensdauer. Dieser Test misst **keine** reale Bildrate auf iPhone/Android.

## Grenzen und offene Punkte

- Lokaler Chromium-Test war in dieser Umgebung wegen fehlender Playwright-Browserdateien nicht ausführbar. Einen echten Browserlauf, darunter die optische Effektdarstellung auf Smartphone und Desktop, nach dem Preview-Build durchführen.
- Ein echter Test-Pi-Kauf und ein längerer Kampf auf physischen Geräten stehen aus. Das Produktsystem und die Netzwerktrennung wurden nicht geändert.
- Bestehende 14 Lint-Fehler/16 Warnungen und die große JS-Ausgabe sind separate Altlasten; außerhalb Paket 3.
