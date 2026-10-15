# Cryptoid – Special Mission: isolierter Referenzstand

Stand: 15. Oktober 2026. Arbeitstitel neutral; „Insectoids“ wird nicht als sichtbarer Spielname verwendet. Namensvorschläge ZYVRANTHEX, XYRVORYNTH und VYRKANTHYX sind noch nicht festgelegt. Exakte Websuchen lieferten keine passenden Treffer; daraus folgt keine garantierte weltweite Nichtexistenz.

## Auftrag und Umfang nach den Ergänzungen

Eigenständiges Zusatzspiel in Cryptoid Evolution: 50 geplante, individuell benannte Bossmissionen mit jeweils neun Vorrunden. 20 unterschiedliche mechanische Insektengegner feuern sichtbare Viren. Special-Bosse feuern größere, giftig leuchtende Energiegeschosse. Das vorhandene Hauptspiel erhält keinen zusätzlichen Menüeintrag und wird nicht öffentlich aktualisiert.

Fertig implementiert ist **eine vollständige isolierte Testmission**, nicht eine fertige 50-Boss-Kampagne: neun Vorrunden mit allen 20 Gegnertypen, Referenzboss Viridian Harvester, zerstörbare Geschütze, danach treffbarer zentraler Reaktor, mehrstufige Explosion, einsammelbares Extra-Life, Bonusrunde und Abschlussansicht. Das Testmenü bietet außerdem direkten Bossstart sowie Testwaffen L1/L3/L5. L3 ist die voreingestellte Testwaffe. Keine echten Käufe oder dauerhaften Belohnungen.

Die 50 Namen in `insectBossSchedule` sind ein Erweiterungsplan. 49 individuelle Bossgrafiken und Begegnungen sind ausdrücklich noch nicht implementiert. Die zunächst gewünschte Ersetzung bestehender Bosse ab Level 60 wird nicht freigeschaltet. Der technische Bossreferenzcode verwendet intern weiterhin Level 60; im Zusatzspiel ist dies die erste Testmission.

## Ausgangspunkt und Sicherung

- GitHub-Repository: `19Trojan69/cryptoid-evolution`.
- Branch: `codex/insect-boss-generation-20261015`.
- Ausgangs-Commit: `e554e7ad51d20068e8efd1ad03715e918a509aac`.
- Bestätigter Quellbaum: `76002f13dd23e1455ca3770aaaeb07cdb2ba91c0`.
- GitHub-Backup-Branch: `backup/insect-boss-baseline-20261015`.
- Vollständiges lokales Git-Bundle erstellt und mit `git bundle verify` geprüft.
- GitHub-main beim Abgleich: `907d2a7363345d00f0f90c54402bf04e887b64d9`; die neueren Stabilitätskorrekturen liegen im gewählten Entwicklungszweig. Andere Featurezweige wurden nicht zusammengeführt.
- Keine Datenbankänderung. Datenbankbackup/Restore nicht Gegenstand dieser isolierten Vorschau; bestehende Freigaberegeln bleiben erhalten.

## Laufzeit und Architektur

`insectoidsEngine.ts` ist die separate, deterministische Vorschau-Simulation. `frontend/preview/InsectoidsPreview.tsx` besitzt genau eine Canvas und einen requestAnimationFrame-Owner. React erhält HUD-Aktualisierungen höchstens fünfmal pro Sekunde. Die Zeit wird mit festen 16,667-ms-Schritten nachgeführt; bei 30 FPS gehen keine regulären Simulationsschritte verloren. Pro Bild sind höchstens acht Nachführschritte vorgesehen. Bei einer Unterbrechung über 500 ms oder einem Rückstand über 250 ms wird der Lauf an derselben Stelle pausiert.

Es gibt keine Navigation und keine Fehlerbehandlung, die zum Startbildschirm wechselt. Ein Darstellungsfehler pausiert den Lauf mit einer sichtbaren Meldung. Das ist Fehlerbegrenzung, keine Behauptung, der Fehler sei behoben. Eine echte Browser-/OS-Prozessbeendigung kann damit nicht verhindert werden. Diese Testmission besitzt noch keine dauerhafte Wiederherstellung nach einem Prozessverlust.

Vor Spielstart werden nur die 20 kleinen Gegnerbilder, ein Bossrumpf, ein Waffenatlas, ein Spielerschiff und kleine Effektbilder vorbereitet. Keine komplette 50-Boss-Kampagne wird geladen. Die 20 SVG-Schiffdesigns besitzen unterschiedliche Silhouetten/Anbauten; je zwei unterscheidbare Bauformen in zehn Insektenfamilien. Sie werden einmal dekodiert und danach als Bitmaps gezeichnet. Der Referenzboss nutzt eine neue transparente Rastergrafik und die vorhandenen mechanischen Turret-Texturen.

Wiederverwendet werden insbesondere `advanceBossTurrets`, `gunMuzzle`, `gunPosition`, `damageBossTurret`, `bossHitTarget`, `advanceBossCore`, `damageSectorBoss`, `contactWithBoss`, `enemyShotHitsPlayer`, die vorhandene Spielerpositionierung sowie `drawBossWeapons` und `GameAudio`. Kein zweites paralleles Turret-System.

## Feste Grenzen

- 6 Gegnerobjekte, 36 Projektilobjekte und 96 Partikelobjekte in wiederverwendeten Pools.
- Höchstens 4 aktive gegnerische Viren in Vorrunden; höchstens 3 Bossgeschosse.
- 46 statische Sterne. Keine animierten Nebel oder großen Blur-/Filterflächen.
- 12 vorbereitete kleine Virus-Sprites, drei vorbereitete Explosions-Sprites.
- Canvas-Pixeldichte auf 1,5 begrenzt; Waffenatlas wird über die bestehende begrenzte Canvas-/Hitzeverwaltung gezeichnet und bei Ende freigegeben.
- Ereignislistener, RAF und Audio werden bei Verlassen der Testmission bereinigt. Pause/Background erzeugen keinen neuen Simulationsowner.
- Der bestehende Hauptspielpfad verwendet weiterhin seine unveränderlichen Projektilobjekte. Dort wurden keine riskanten Poolobjekte in React-Snapshots eingeführt.

## Referenzboss: Werte

| Waffe | HP | Projektil-Durchmesser | Kollisionsradius | Geschwindigkeit | Waffenpause | Zielrotation |
|---|---:|---:|---:|---:|---:|---:|
| Scythe left, Puls-Doppelfolge | 9,6 | 12 px | 4,8 px | 220 px/s | 1,8 s | max. 2,052 rad/s |
| Scythe right, Puls-Doppelfolge | 9,6 | 12 px | 4,8 px | 220 px/s | 1,8 s | max. 2,052 rad/s |
| Acid furnace, Plasma | 12,8 | 18 px | 7,2 px | 185 px/s | 2,3 s | max. 2,052 rad/s |
| Siege mandible, schwer | 16 | 26 px | 10,4 px | 160 px/s | 2,9 s | max. 1,458 rad/s |
| Geöffneter Reaktor | siehe unten | 32 px | 12,8 px | 165 px/s | 2,55 s | Ziel beim Abschuss fixiert |

Zusätzlich gelten 700 ms sichtbare Vorwarnung, mindestens 240 ms stabile Ausrichtung bei Winkelabweichung unter 0,035 rad und eine globale Waffenpause von 1,05 s zwischen abgeschlossenen Angriffen. Die Puls-Doppelfolge hat 280 ms Abstand. Keine gleichzeitige komplette Batterie. Die tatsächliche Feuerrate kann wegen Ausrichtung, Sicherheitsprüfung und Projektilbudget niedriger liegen.

Rumpf/Reaktor: 280 angezeigte HP. Der vorhandene `damageSectorBoss`-Multiplikator x2 bleibt erhalten, also 140 Standardtreffer nach Öffnung. Die vier Geschütze besitzen zusammen 48 HP. Vor ihrer Zerstörung ist der Rumpf geschützt; danach trifft nur die zentrale Reaktorzone. Kein Bomben-/EMP-/Shop-System wird für das Zusatzspiel als fertig behauptet.

Jedes neue feindliche Geschoss besitzt Typ, Faction, Schaden, Geschwindigkeit, Lebensdauer (8 s), Rendergröße und getrennte Kollisionsgröße. Viren werden als grüne Körper mit rotierenden Fortsätzen dargestellt; ihre dekorativen Fortsätze zählen nicht zur Hitbox. Ihre Geschwindigkeit beträgt 170–194 px/s, der zentrale Kollisionsradius 4 px. Bossgeschosse verwenden Giftgrün, Säuregelb und Orange.

Schäden laufen durch die zentrale Trefferbehandlung der jeweiligen Laufzeit; das bestehende Hauptspiel nutzt weiterhin `resolvePlayerDamage`. Grenzen sind reine Positionsbegrenzungen und verursachen keinen Schaden.

## Freier Raum und Fairness

Das Spielerzentrum bleibt in der vorhandenen Zone `x=30…Breite−30`, `y=0,5×Höhe…min(0,91×Höhe,Höhe−36)`. Der Boss wird an diese unveränderte Zone angepasst. Langsames seitliches Gleiten und maximal fünf Pixel vertikale Bewegung. Keine Begleitschiffe.

Für eine laufende Boss-Salve bleibt ein voller vertikaler Fluchtkorridor erhalten. Mindestbreite 112 px als physischer Freiraum, davon 66 px mögliche Spielerzentrumspositionen plus die bestehende 46-px-Spielerhitbox. Projektil-Hitbox und ein zusätzlicher Touch-Abstand werden bei der Flugbahnprüfung berücksichtigt. Ein Korridorwechsel geschieht erst, wenn die vorherige Salve das Feld verlassen hat. Unsichere neue Schüsse werden unterdrückt und das nächste Geschütz geprüft.

Die Rohdaten in `special-mission-fairness-2026-10-15.json` verwenden den strengeren bisherigen sichtbaren oberen Rand (60–90 px). Bei 390×760 px: Boss 292,6×167,2 px, tiefster Rumpfrand 282,2 px; Spielerzentren bleiben von x=30 bis 360 und y=380 bis 691,6 frei. Nach Einrechnung des 27-px-Kontaktradius bleiben mindestens 70,8 px Abstand zur oberen Spielergrenze. Im separaten Canvas beträgt der obere Rand nur 32 px; die Abstandsregel selbst bleibt gleich.

## Prüfung

- 388 Frontend-Modul- und i18n-Tests bestanden. Die private Oberfläche liegt außerhalb der Produktionsseiten; der bestehende Lokalisierungstest bleibt unverändert aktiv.
- TypeScript-Projektprüfung und bestehender Produktionsbuild bestanden. Der Build wurde nicht veröffentlicht.
- 63 geplante Fluchtrouten: sieben Viewports × drei horizontale × drei vertikale Startpositionen. Aufgezeichnete Angriffe über 16 s, 40-ms-Schritte, 10-px-Raster, 300 ms Reaktionszeit und konservative Bewegung 0,32 px/ms (Spiel: 0,68). Tatsächliche Swept-Kollision verwendet. Alle geprüften Aufzeichnungen behalten eine erreichbare Route.
- Zusätzliche kontinuierliche Flugbahnprüfung des gesamten reservierten Boss-Korridors; alle vier Geschütze feuern und halten die drei aktiven Bossgeschosse ein.
- Tatsächliche bestehende GamePage-Simulation: Referenzboss durch Spielerprojektile besiegt, Geschütz-/Reaktorphase, Herz, Bonus sowie 30 unveränderte normale Blöcke und drei bestehende Bosszyklen. Danach 0 RAFs, Timer und Listener.
- Tatsächliche separate Mission simuliert für 320×568, 390×760 und 768×920: neun Vorrunden, alle 20 Typen, Bossgeschütze/Reaktor, Herz, Bonus und Abschluss. Feste Poolidentitäten bleiben erhalten. Der Testpilot erhält Zusatzleben; dies ist ein Ablauf-/Stabilitätstest, kein Nachweis menschlicher Fairness.
- Tatsächliche Komponenten-Effekte und Canvas-Zeichenlogik mit dekodierten 20 SVG-Sprites in einem Node-Host geprüft: Pause, Background, wiederholtes Starten/Verlassen, ein RAF-Owner, anschließend 0 Listener/RAFs. Audiohardware ist gestubbt.
- Viewports: 320×568, 375×667, 390×760, 430×820, 768×920, 1024×600, 844×360.
- Native Canvas-Rasteransichten von Gegnern, Viren, Spieler und montierten Bossgeschützen visuell geprüft.

Grenzen: Kein echter iPhone-/Xiaomi-/Pi-Browser-Langzeittest und kein Browser-/GPU-FPS-Nachweis. Der Browser-Steuerungsskill ist in dieser Umgebung nicht verfügbar; es wurde kein Ersatzbrowser installiert. Die Aufzeichnungstests beweisen nicht alle möglichen adaptiven Spielerwege. Sehr kurze Querformate verkleinern den Boss zum Schutz der Spielfläche deutlich; die Lesbarkeit dort braucht einen Gerätetest. Keine Garantie gegen OS-Prozessverlust. Die bestehenden gemeldeten Hauptspiel-Abstürze werden mit diesem Prototyp nicht als behoben erklärt.

## Nächster Meilenstein

Auf Smartphone und Pi Browser die vollständige Mission wiederholt spielen, insbesondere Vorrundenwechsel, letzten Turret, Reaktor, Explosion, Extra-Life, Bonus, Pause/Background und Drehung. Reale Hänger oder unerwartetes Verlassen sind Fehler. Erst danach individuelle weitere Bossmissionen entwickeln und die spätere Menü-/Fortschrittsintegration des Zusatzspiels planen. Öffentliche Testnet-/Mainnet-Produktion bleibt unverändert.

## Veränderte und neue Dateien

- `docs/special-mission-artwork-2026-10-15.md`
- `docs/special-mission-fairness-2026-10-15.json`
- `docs/special-mission-gamepage-simulation-2026-10-15.json`
- `docs/special-mission-lifecycle-2026-10-15.json`
- `docs/special-mission-reference-2026-10-15.md`
- `frontend/preview/InsectoidsPreview.tsx`
- `frontend/preview/insectoidsPreview.css`
- `frontend/public/ships/bosses/insect/viridian-harvester.webp`
- `frontend/scripts/auditInsectFairness.mjs`
- `frontend/scripts/buildInsectBossPreview.mjs`
- `frontend/scripts/buildInsectoidsPreview.mjs`
- `frontend/scripts/verifyInsectBossSimulation.cjs`
- `frontend/scripts/verifySpecialMissionLifecycle.cjs`
- `frontend/src/pages/BossHealthView.tsx`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/pages/bossCombat.ts`
- `frontend/src/pages/bossCore.ts`
- `frontend/src/pages/bossHealthLayout.ts`
- `frontend/src/pages/bossHitTarget.ts`
- `frontend/src/pages/bossSpecialWeapon.ts`
- `frontend/src/pages/bossTurrets.ts`
- `frontend/src/pages/bossWeaponRenderer.ts`
- `frontend/src/pages/enemyFire.ts`
- `frontend/src/pages/insectBoss.css`
- `frontend/src/pages/insectBoss.test.mjs`
- `frontend/src/pages/insectBoss.ts`
- `frontend/src/pages/insectHullMask.ts`
- `frontend/src/pages/insectoidRoster.ts`
- `frontend/src/pages/insectoidsEngine.test.mjs`
- `frontend/src/pages/insectoidsEngine.ts`
- `frontend/src/pages/sectorBoss.ts`
- `frontend/tsconfig.preview.json`
